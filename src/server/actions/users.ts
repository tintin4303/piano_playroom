'use server';

import { createClient as createAdminSupabase } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('placeholder') || !serviceRoleKey.trim()) {
    return null;
  }

  return createAdminSupabase(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface ProvisionUserInput {
  email: string;
  fullName: string;
  phone?: string;
  lineId?: string;
  temporaryPassword?: string;
  role: Role;
  studentDetails?: {
    fullName: string;
    nickname: string;
    dateOfBirth: string;
    gender: string;
    notes?: string;
  };
}

export async function provisionAccount(input: ProvisionUserInput) {
  // 1. Authorization: Only existing Admin can provision accounts
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.ADMIN) {
    return { success: false, message: 'Unauthorized. Only school administrators can provision accounts.' };
  }

  const email = input.email.trim().toLowerCase();
  const { fullName, phone, lineId, role, temporaryPassword, studentDetails } = input;
  const password = temporaryPassword || 'Piano123456!';

  // 2. Check if email already registered in Prisma
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    return { success: false, message: `An account with email ${email} already exists.` };
  }

  // 3. Hash temporary password with bcrypt
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  let authUserId: string | undefined;

  // 4. Optional Supabase Auth sync if service role key configured
  const supabaseAdmin = getSupabaseAdmin();
  if (supabaseAdmin) {
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role, fullName, phone },
      });
      if (!authError && authData?.user) {
        authUserId = authData.user.id;
      }
    } catch (err) {
      // Non-blocking if service key is invalid
    }
  }

  // 5. Create user and related profile records in Prisma
  try {
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          ...(authUserId ? { id: authUserId } : {}),
          email,
          fullName,
          passwordHash,
          phone,
          lineId,
          role,
        },
      });

      // If provisioned as Teacher, create Teacher profile
      if (role === Role.TEACHER) {
        await tx.teacher.create({
          data: {
            userId: user.id,
            availability: [],
          },
        });
      }

      // If provisioned as Parent with student details, create the Student record
      if (role === Role.PARENT && studentDetails && studentDetails.fullName) {
        await tx.student.create({
          data: {
            parentId: user.id,
            fullName: studentDetails.fullName,
            nickname: studentDetails.nickname || studentDetails.fullName,
            dateOfBirth: new Date(studentDetails.dateOfBirth || '2018-01-01'),
            gender: studentDetails.gender || 'Not specified',
            notes: studentDetails.notes,
          },
        });
      }

      return user;
    });

    revalidatePath('/admin');
    return {
      success: true,
      message: `Successfully provisioned ${role} account for ${fullName} (${email}).`,
      userId: newUser.id,
      generatedPassword: password,
    };
  } catch (dbError: any) {
    console.error('Database provisioning error:', dbError);
    return { success: false, message: `Database error: ${dbError.message}` };
  }
}

export async function updateUserRole(targetUserId: string, newRole: Role) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.ADMIN) {
    return { success: false, message: 'Unauthorized. Only administrators can change roles.' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetUserId },
        data: { role: newRole },
      });

      if (newRole === Role.TEACHER) {
        await tx.teacher.upsert({
          where: { userId: targetUserId },
          update: {},
          create: {
            userId: targetUserId,
            availability: [],
          },
        });
      }
    });

    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin) {
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        user_metadata: { role: newRole },
      });
    }

    revalidatePath('/admin');
    return { success: true, message: `User role updated to ${newRole}.` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getManagedUsers() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.ADMIN) {
    return [];
  }

  return await prisma.user.findMany({
    include: {
      students: true,
      teacher: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}
