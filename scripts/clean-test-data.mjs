import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const testEmails = [
  "test@example.com",
  "estimate@example.com",
  "critical@example.com",
  "photo@example.com",
  "medium@example.com",
  "high@example.com",
  "slot@example.com",
  "valid@example.com"
];

const testLeadNames = [
  "Test Customer",
  "Private Photo",
  "Medium Test",
  "Valid Name",
  "Bad Email"
];

try {
  const deletedAppointments = await prisma.appointment.deleteMany({
    where: {
      OR: [
        { email: { in: testEmails } },
        { fullName: { contains: "Test" } },
        { fullName: { contains: "Arbitrary Slot" } }
      ]
    }
  });

  const deletedLeads = await prisma.lead.deleteMany({
    where: {
      OR: [
        { email: { in: testEmails } },
        { fullName: { in: testLeadNames } },
        { description: { contains: "test" } }
      ]
    }
  });

  const deletedRateLimits = await prisma.rateLimitBucket.deleteMany({});

  console.log(`Deleted ${deletedAppointments.count} test appointments.`);
  console.log(`Deleted ${deletedLeads.count} test leads.`);
  console.log(`Deleted ${deletedRateLimits.count} rate-limit buckets.`);
} finally {
  await prisma.$disconnect();
}
