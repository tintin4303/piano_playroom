import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { PrismaClient, Role } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial Piano Playroom database...');

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@pianoplayroom.com';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminPiano2026!';
  const adminName = 'Head Administrator';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let supabaseUserId: string | undefined;

  // If Supabase service role key is available, provision the admin in Supabase Auth
  if (supabaseUrl && serviceRoleKey && !supabaseUrl.includes('placeholder')) {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log(`Checking Supabase Auth for ${adminEmail}...`);
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (!listError) {
      const existingAuthUser = usersData.users.find((u) => u.email === adminEmail);
      if (existingAuthUser) {
        supabaseUserId = existingAuthUser.id;
        console.log(`Found existing Supabase Auth user: ${supabaseUserId}`);
      } else {
        const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: { role: Role.ADMIN, fullName: adminName },
        });

        if (createError) {
          console.warn('Could not auto-create in Supabase Auth:', createError.message);
        } else {
          supabaseUserId = createdUser.user.id;
          console.log(`Created Supabase Auth user: ${supabaseUserId}`);
        }
      }
    }
  }

  // Upsert the Admin record in Prisma database
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: Role.ADMIN,
      fullName: adminName,
    },
    create: {
      ...(supabaseUserId ? { id: supabaseUserId } : {}),
      email: adminEmail,
      fullName: adminName,
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
