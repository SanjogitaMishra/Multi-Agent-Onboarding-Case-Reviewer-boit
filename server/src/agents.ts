import type { AgentFinding, ExecutionTraceEntry, AgentInput, RecommendationResult } from '@bank/shared'

export type AgentFunction = (input: AgentInput) => Promise<AgentFinding[]>

export const DocumentCompletenessAgent: AgentFunction = async (input) => {
  const trace: AgentFinding[] = []
  try {
    // caseId is used to fetch case in orchestrator; here assume input contains case details via fetch
    // For safety keep this agent pure: orchestrator will pass needed details via input.reviewer as encoded JSON if desired
    // We expect orchestrator to pass input.caseDetails
    // @ts-ignore
    const details = (input as any).caseDetails
    const docs = details?.documents || []
    const types = docs.map((d: any) => d.type.toLowerCase())

    if (!types.includes('passport') && !types.includes('id_card')) {
      trace.push({ type: 'missing_identity_document', detail: 'No passport or ID card provided' })
    }
    if (!types.includes('utility_bill') && !types.includes('bank_statement')) {
      trace.push({ type: 'missing_address_document', detail: 'No proof of address provided' })
    }

    return trace
  } catch (e: any) {
    throw new Error(`DocumentCompletenessAgent error: ${e?.message || String(e)}`)
  }
}

export const IdentityConsistencyAgent: AgentFunction = async (input) => {
  try {
    // @ts-ignore
    const details = (input as any).caseDetails
    const identity = details?.identity || {}
    const applicant = details?.applicantName || ''
    const full = `${identity?.firstName || ''} ${identity?.lastName || ''}`.trim()
    const findings: AgentFinding[] = []
    if (!full || !applicant) {
      findings.push({ type: 'identity_incomplete', detail: 'Name components missing' })
      return findings
    }
    if (full.toLowerCase() !== applicant.toLowerCase()) {
      findings.push({ type: 'identity_mismatch', detail: `Applicant name "${applicant}" does not match identity "${full}"` })
    }
    return findings
  } catch (e: any) {
    throw new Error(`IdentityConsistencyAgent error: ${e?.message || String(e)}`)
  }
}

export const RiskIndicatorAgent: AgentFunction = async (input) => {
  try {
    // @ts-ignore
    const details = (input as any).caseDetails
    const risks = details?.riskIndicators || []
    const findings: AgentFinding[] = []
    for (const r of risks) {
      findings.push({ type: 'risk_indicator', detail: String(r) })
    }
    return findings
  } catch (e: any) {
    throw new Error(`RiskIndicatorAgent error: ${e?.message || String(e)}`)
  }
}

export const RecommendationAgent = async (input: AgentInput & { findings: AgentFinding[]; caseDetails: any; options?: { humanApprovalRequired?: boolean; exceptionOnly?: boolean } }) => {
  const { findings, caseDetails, options } = input as any
  // Apply rules:
  // sanctions -> REJECT
  // PEP/high-risk -> REFER
  // missing docs & identity mismatch -> REFER
  // otherwise APPROVE

  const ri = (caseDetails?.riskIndicators || []).map(String)
  if (ri.includes('SANCTIONS_MATCH')) return { result: 'REJECT' as RecommendationResult, notes: 'Sanctions match detected' }
  if (ri.includes('PEP_EXCEPTION') || ri.includes('HIGH_RISK')) return { result: 'REFER' as RecommendationResult, notes: 'PEP / high risk detected' }

  const hasMissingDocs = findings.some((f: AgentFinding) => f.type === 'missing_identity_document' || f.type === 'missing_address_document')
  const hasIdMismatch = findings.some((f: AgentFinding) => f.type === 'identity_mismatch')
  if (hasMissingDocs || hasIdMismatch) return { result: 'REFER' as RecommendationResult, notes: 'Missing documents or identity mismatch' }

  if (options?.humanApprovalRequired) return { result: 'REFER' as RecommendationResult, notes: 'Human approval required' }

  return { result: 'APPROVE' as RecommendationResult, notes: 'Auto-approval rules passed' }
}

export const agentList = {
  DocumentCompletenessAgent,
  IdentityConsistencyAgent,
  RiskIndicatorAgent,
  RecommendationAgent
}
