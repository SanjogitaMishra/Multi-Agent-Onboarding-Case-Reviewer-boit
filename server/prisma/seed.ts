import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.recommendation.deleteMany()
  await prisma.agentRun.deleteMany()
  await prisma.onboardingCase.deleteMany()

  // 1: CLEAN
  await prisma.onboardingCase.create({
    data: {
      applicantName: 'Alice Clean',
      email: 'alice.clean@example.com',
      status: 'PENDING',
      identity: {
        firstName: 'Alice',
        lastName: 'Clean',
        dob: '1990-02-15',
        ssn: '000-00-0000',
        nationality: 'Freedonia'
      },
      address: {
        street: '100 Main St',
        city: 'Central City',
        state: 'CA',
        postalCode: '90001',
        country: 'Freedonia'
      },
      employment: {
        employer: 'Acme Corp',
        position: 'Engineer',
        startDate: '2018-06-01',
        incomeMonthly: 8000
      },
      documents: [
        { type: 'passport', id: 'P-A-100', issuedAt: '2015-01-01' },
        { type: 'utility_bill', id: 'UB-100', issuedAt: '2026-01-01' }
      ],
      riskIndicators: ['CLEAN']
    }
  })

  // 2: PEP_EXCEPTION (synthetic Politically Exposed Person flag)
  await prisma.onboardingCase.create({
    data: {
      applicantName: 'Robert Politico',
      email: 'robert.politico@example.com',
      status: 'PENDING',
      identity: {
        firstName: 'Robert',
        lastName: 'Politico',
        dob: '1970-11-05',
        ssn: '111-11-1111',
        nationality: 'Freedonia'
      },
      address: {
        street: '1 Government Plaza',
        city: 'Capital City',
        state: 'DC',
        postalCode: '20001',
        country: 'Freedonia'
      },
      employment: {
        employer: 'Government of Freedonia',
        position: 'Former Minister of Trade',
        startDate: '2000-01-01',
        incomeMonthly: 15000
      },
      documents: [
        { type: 'passport', id: 'P-B-200', issuedAt: '2010-05-20' }
      ],
      riskIndicators: ['PEP_EXCEPTION']
    }
  })

  // 3: SANCTIONS_MATCH (synthetic sanctions list match)
  await prisma.onboardingCase.create({
    data: {
      applicantName: 'Carla Sancho',
      email: 'carla.sancho@example.com',
      status: 'PENDING',
      identity: {
        firstName: 'Carla',
        lastName: 'Sancho',
        dob: '1985-08-09',
        ssn: '222-22-2222',
        nationality: 'Freedonia'
      },
      address: {
        street: '55 Harbor Rd',
        city: 'Portsmouth',
        state: 'NY',
        postalCode: '10010',
        country: 'Freedonia'
      },
      employment: {
        employer: 'Maritime LLC',
        position: 'Operations Manager',
        startDate: '2012-09-01',
        incomeMonthly: 7000
      },
      documents: [
        { type: 'id_card', id: 'ID-C-300', issuedAt: '2016-03-15' }
      ],
      riskIndicators: ['SANCTIONS_MATCH']
    }
  })

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
