import type { AgentFinding, AgentInput, ExecutionTraceEntry, RecommendationResult, AutonomyMode } from '@bank/shared'
import prisma from './db'
import { DocumentCompletenessAgent, IdentityConsistencyAgent, RiskIndicatorAgent, RecommendationAgent } from './agents'

type OrchestratorOptions = {
  humanApprovalRequired?: boolean
  exceptionOnly?: boolean
}

export async function runOrchestration(caseId: string, inputMode: AutonomyMode, options: OrchestratorOptions = {}) {
  const caseRecord = await prisma.onboardingCase.findUnique({ where: { id: caseId } })
  if (!caseRecord) throw new Error('case not found')

  // Prepare caseDetails object by parsing stored JSON strings
  const caseDetails: any = {
    id: caseRecord.id,
    applicantName: caseRecord.applicantName,
    email: caseRecord.email,
    status: caseRecord.status,
    createdAt: caseRecord.createdAt,
    identity: caseRecord.identity ? JSON.parse(caseRecord.identity) : {},
    address: caseRecord.address ? JSON.parse(caseRecord.address) : {},
    employment: caseRecord.employment ? JSON.parse(caseRecord.employment) : undefined,
    documents: caseRecord.documents ? JSON.parse(caseRecord.documents) : [],
    riskIndicators: caseRecord.riskIndicators ? JSON.parse(caseRecord.riskIndicators) : []
  }

  const trace: ExecutionTraceEntry[] = []
  const allFindings: AgentFinding[] = []

  // Helper to run agent with one retry
  async function runAgentWithRetry(name: string, fn: (input: any) => Promise<AgentFinding[]>) {
    try {
      trace.push({ ts: new Date().toISOString(), message: `Running agent ${name}` })
      const result = await fn({ caseId, mode: inputMode, caseDetails })
      trace.push({ ts: new Date().toISOString(), message: `Agent ${name} completed`, step: name })
      return result
    } catch (err) {
      trace.push({ ts: new Date().toISOString(), message: `Agent ${name} failed, retrying once: ${String(err)}`, step: name })
      try {
        const result = await fn({ caseId, mode: inputMode, caseDetails })
        trace.push({ ts: new Date().toISOString(), message: `Agent ${name} succeeded on retry`, step: name })
        return result
      } catch (err2) {
        trace.push({ ts: new Date().toISOString(), message: `Agent ${name} failed after retry: ${String(err2)}`, step: name })
        // degrade safely: record an agent_error finding and continue
        return [{ type: 'agent_error', detail: `${name} failed: ${String(err2)}` }]
      }
    }
  }

  // Run first three agents sequentially
  const docFindings = await runAgentWithRetry('DocumentCompleteness', DocumentCompletenessAgent)
  allFindings.push(...docFindings)

  const idFindings = await runAgentWithRetry('IdentityConsistency', IdentityConsistencyAgent)
  allFindings.push(...idFindings)

  const riskFindings = await runAgentWithRetry('RiskIndicator', RiskIndicatorAgent)
  allFindings.push(...riskFindings)

  // Run recommendation agent with aggregated findings
  trace.push({ ts: new Date().toISOString(), message: 'Running Recommendation agent' })
  const recommendation = await RecommendationAgent({ caseId, mode: inputMode, findings: allFindings, caseDetails, options })
  trace.push({ ts: new Date().toISOString(), message: `Recommendation: ${recommendation.result}` })

  // Persist AgentRun and Recommendation
  const agentRun = await prisma.agentRun.create({
    data: {
      caseId,
      mode: inputMode,
      input: JSON.stringify({ caseId, mode: inputMode, options }),
      findings: JSON.stringify(allFindings),
      trace: JSON.stringify(trace)
    }
  })

  await prisma.recommendation.create({
    data: {
      agentRunId: agentRun.id,
      result: recommendation.result,
      notes: recommendation.notes
    }
  })

  return { recommendation, trace, findings: allFindings }
}
