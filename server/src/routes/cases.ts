import { Router } from 'express'
import prisma from '../db'
import { CaseDB, ReviewRequest } from '@bank/shared'
import { runOrchestration } from '../orchestrator'

const router = Router()

router.get('/', async (req, res) => {
  const cases = await prisma.onboardingCase.findMany({ orderBy: { createdAt: 'desc' } })
  const mapped = cases.map((c) => ({
    id: c.id,
    applicantName: c.applicantName,
    email: c.email,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    identity: typeof c.identity === 'string' ? JSON.parse(c.identity) : c.identity,
    address: typeof c.address === 'string' ? JSON.parse(c.address) : c.address,
    employment: c.employment ? (typeof c.employment === 'string' ? JSON.parse(c.employment) : c.employment) : undefined,
    documents: c.documents ? (typeof c.documents === 'string' ? JSON.parse(c.documents) : c.documents) : undefined,
    riskIndicators: c.riskIndicators ? (typeof c.riskIndicators === 'string' ? JSON.parse(c.riskIndicators) : c.riskIndicators) : undefined
  }))
  res.json(mapped as CaseDB[])
})

router.post('/:id/review', async (req, res) => {
  const id = req.params.id
  const body = req.body as ReviewRequest
  if (!body || !body.action) return res.status(400).json({ error: 'missing action' })

  const status = body.action === 'APPROVE' ? 'APPROVED' : 'REJECTED'

  const updated = await prisma.onboardingCase.update({ where: { id }, data: { status } })
  res.json({ id: updated.id, status: updated.status })
})

router.post('/:id/orchestrate', async (req, res) => {
  const id = req.params.id
  const body = req.body || {}
  try {
    const mode = body.mode || 'AUTONOMOUS'
    const options = {
      humanApprovalRequired: Boolean(body.humanApprovalRequired),
      exceptionOnly: Boolean(body.exceptionOnly)
    }
    const result = await runOrchestration(id, mode, options)
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
