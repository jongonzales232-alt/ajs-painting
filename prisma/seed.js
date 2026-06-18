const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.availabilitySlot.count();
  if (existing === 0) {
    await prisma.availabilitySlot.createMany({
      data: [1, 2, 3, 4, 5].flatMap((weekday) => [
        { weekday, startTime: "09:00", endTime: "10:00" },
        { weekday, startTime: "14:00", endTime: "15:00" }
      ])
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
