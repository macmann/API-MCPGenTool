import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const demoEmail = 'demo@mindbridge.local'
  const demoName = 'Demo User'
  const defaultProjectName = 'Default Project'

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: { name: demoName },
    create: {
      email: demoEmail,
      name: demoName,
      projects: {
        create: {
          name: defaultProjectName,
          description: 'Starter project for development',
        },
      },
    },
  })

  const existingProject = await prisma.project.findFirst({
    where: { userId: user.id, name: defaultProjectName },
  })

  if (!existingProject) {
    await prisma.project.create({
      data: {
        name: defaultProjectName,
        description: 'Starter project for development',
        userId: user.id,
      },
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
