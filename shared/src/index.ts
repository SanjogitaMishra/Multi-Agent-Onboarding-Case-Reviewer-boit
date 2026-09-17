export type CaseStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface CaseRecord {
  id: string
  applicantName: string
  email?: string
  status: CaseStatus
  createdAt: string
}

export interface ReviewRequest {
  reviewer: string
  action: 'APPROVE' | 'REJECT'
  notes?: string
}

export type RecommendationResult = 'APPROVE' | 'REJECT' | 'REFER'

export type AutonomyMode = 'AUTONOMOUS' | 'ASSISTIVE' | 'MANUAL'

export interface AgentInput {
  caseId: string
  mode: AutonomyMode
  reviewer?: string
}

export interface AgentFinding {
  type: string
  detail: string
  confidence?: number
}

export interface ExecutionTraceEntry {
  ts: string
  message: string
  step?: string
}

export interface CaseDB {
  id: string
  applicantName: string
  email?: string
  status: CaseStatus
  createdAt: string
  identity: {
    firstName?: string
    lastName?: string
    dob?: string
    ssn?: string
    nationality?: string
  }
  address: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  employment?: {
    employer?: string
    position?: string
    startDate?: string
    incomeMonthly?: number
  }
  documents?: Array<{ type: string; id: string; issuedAt?: string }>
  riskIndicators?: string[]
}
