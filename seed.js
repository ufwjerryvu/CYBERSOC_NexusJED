import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create 2 users
  const user1 = await prisma.user.create({
    data: {
      username: "jerry",
      email: "jerry@example.com",
      password: "password123",  
      isAdmin: false,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: "erik",
      email: "erik@example.com",
      password: "secure456",  
      isAdmin: true,
    },
  });

  console.log("Seeded users:", { user1, user2 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
