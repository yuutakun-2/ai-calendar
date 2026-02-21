require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  const email = "demo@example.com";
  const password = "password";

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password },
  });

  const today = new Date();

  const baseExams = [
    {
      code: "CS101",
      subject: "Data Structures",
      examType: "Mid Term",
      category: "Regular",
      semester: 2,
      date: addDays(today, 1),
      startTime: "09:00",
      endTime: "12:00",
      completed: false,
      userId: user.id,
    },
    {
      code: "MA201",
      subject: "Discrete Mathematics",
      examType: "End Term",
      category: "Backlog",
      semester: 3,
      date: addDays(today, 8),
      startTime: "13:00",
      endTime: "16:00",
      completed: false,
      userId: user.id,
    },
    {
      code: "EC150",
      subject: "Digital Logic",
      examType: "Lab",
      category: "Backlog",
      semester: 1,
      date: addDays(today, 15),
      startTime: "10:30",
      endTime: "12:30",
      completed: false,
      userId: user.id,
    },
  ];

  await prisma.exam.createMany({ data: baseExams });

  await prisma.exam.create({
    data: {
      ...baseExams[0],
      date: addDays(baseExams[0].date, 2),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
