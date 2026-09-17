import assert from 'assert'
import prisma from '../src/db'
import { runOrchestration } from '../src/orchestrator'

async function main() {
  try {
    // find the seeded CLEAN case (Alice Clean)
    const c = await prisma.onboardingCase.findFirst({ where: { applicantName: 'Alice Clean' } })
    if (!c) {
      console.error('Seeded test case not found')
      process.exit(2)
    }

    const res = await runOrchestration(c.id, 'AUTONOMOUS')
    console.log('Orchestrator result:', res.recommendation)
    assert(res.recommendation && res.recommendation.result === 'APPROVE', 'Expected APPROVE recommendation for CLEAN case')
    console.log('Test passed')
    process.exit(0)
  } catch (err: any) {
    console.error('Test failed:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
