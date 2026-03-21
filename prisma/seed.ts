import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("Test@123", 12);

  await prisma.superAdmin.upsert({
    where: { email: "dhruval@gmail.com" },
    update: {},
    create: {
      email: "dhruval@gmail.com",
      password: hashedPassword,
      name: "Dhruval",
    },
  });

  console.log("Seed completed: Super admin created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
