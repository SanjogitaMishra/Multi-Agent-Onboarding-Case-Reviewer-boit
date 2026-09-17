import { Router } from 'express'
import prisma from '../db'
import { CaseDB, ReviewRequest } from '@bank/shared'

const router = Router()

router.get('/', async (req, res) => {
  const cases = await prisma.onboardingCase.findMany({ orderBy: { createdAt: 'desc' } })
  const mapped = cases.map((c) => ({
    id: c.id,
    applicantName: c.applicantName,
    email: c.email,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    identity: c.identity,
    address: c.address,
    employment: c.employment,
    documents: c.documents,
    riskIndicators: c.riskIndicators
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

export default router
