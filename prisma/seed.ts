import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@finanztool.de";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";

  // Single-tenant: ensure exactly one user exists and matches env.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: { email, passwordHash, name: "Admin" },
    });
    console.log(`[seed] created admin user ${email}`);
  } else {
    console.log(`[seed] admin user ${email} already exists`);
  }

  // Ensure one BusinessSettings row exists.
  const settings = await prisma.businessSettings.findFirst();
  if (!settings) {
    await prisma.businessSettings.create({
      data: { businessName: "Mein Unternehmen" },
    });
    console.log("[seed] created default business settings");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
