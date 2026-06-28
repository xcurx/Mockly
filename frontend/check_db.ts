import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const interviews = await prisma.interview.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("Last 5 interviews:");
  for (const i of interviews) {
    console.log(`ID: ${i.id}, Has State: ${!!i.interviewState}`);
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
