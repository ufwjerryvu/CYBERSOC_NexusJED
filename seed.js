// prisma/seed.js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const password1 = await bcrypt.hash('password123', 10)
  const password2 = await bcrypt.hash('securepass456', 10)

  await prisma.user.createMany({
    data: [
      {
        username: 'Jerry Vu',
        email: 'Jerry@example.com',
        password: password1,
        isAdmin: false,
      },
      {
        username: 'Erik Hai',
        email: 'erik@example.com',
        password: password2,
        isAdmin: true,
      },
    ],
  })

  console.log('✅ Seed data created.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
