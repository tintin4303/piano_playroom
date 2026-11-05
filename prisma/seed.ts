import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial Piano Playroom database with bcrypt hashed passwords...');

  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@pianoplayroom.com').trim().toLowerCase();
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminPiano2026!';
  const adminName = 'Head Administrator';

  // Generate bcrypt salt and hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  // Upsert Admin User in Prisma with passwordHash
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: Role.ADMIN,
      fullName: adminName,
      passwordHash: passwordHash,
    },
    create: {
      email: adminEmail,
      fullName: adminName,
      passwordHash: passwordHash,
      role: Role.ADMIN,
      phone: '080-000-0000',
    },
  });

  console.log(`Initial Admin User provisioned: ${adminUser.email} [ROLE: ${adminUser.role}]`);

  // Initialize Default School Settings
  const settings = await prisma.schoolSettings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      schoolName: 'Piano Playroom',
      bankName: 'Kasikornbank (KBANK)',
      bankAccountNumber: '095-2-12345-6',
      bankAccountName: 'Piano Playroom Studio Co., Ltd.',
      promptPayId: '0952123456',
      cancellationHours: 24,
    },
  });

  console.log(`School settings initialized for: ${settings.schoolName}`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
