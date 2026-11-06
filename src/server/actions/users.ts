'use server';

import { createClient as createAdminSupabase } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getCurrentUser } from './auth';
import { revalidatePath, unstable_cache } from 'next/cache';
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
  // Authorization: Only Admin can provision accounts
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.ADMIN) {
    return { success: false, message: 'Unauthorized. Only school administrators can provision accounts.' };
  }

  const email = input.email.trim().toLowerCase();
  const { fullName, lineId, role, temporaryPassword, studentDetails } = input;
  const rawPhone = input.phone ? input.phone.trim() : '';

  // Validate phone: must be numbers/hyphens only if provided, or required
  if (!rawPhone) {
    return { success: false, message: 'Phone number is required.' };
  }
  const digitsOnly = rawPhone.replace(/\D/g, '');
  if (digitsOnly.length < 9 || digitsOnly.length > 10) {
    return { success: false, message: 'Please enter a valid 9 or 10-digit phone number (numbers only).' };
  }
  const phone = rawPhone;

  const password = temporaryPassword || 'Piano123456!';

  // Check if email already registered
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    return { success: false, message: `An account with email ${email} already exists.` };
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  let authUserId: string | undefined;

  // Supabase Auth sync (if configured)
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
    } catch {
      // Non-blocking
    }
  }

  // Create user in Prisma
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

      if (role === Role.TEACHER) {
        await tx.teacher.create({
          data: {
            userId: user.id,
            availability: [],
          },
        });
      }

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

    // Invalidate users cache instantly
    revalidatePath('/admin');
    return {
      success: true,
      message: `Successfully provisioned ${role} account for ${fullName} (${email}).`,
      userId: newUser.id,
      generatedPassword: password,
    };
  } catch (dbError: any) {
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

    // Invalidate cache immediately
    revalidatePath('/admin');
    return { success: true, message: `User role updated to ${newRole}.` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Cached Query: Served in ~1ms from Next.js Data Cache
const fetchCachedManagedUsers = unstable_cache(
  async () => {
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        lineId: true,
        role: true,
        createdAt: true,
        students: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
          },
        },
        teacher: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
  ['managed-users-query'],
  { tags: ['managed-users'], revalidate: 60 }
);

export async function getManagedUsers() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.ADMIN) {
    return [];
  }

  return await fetchCachedManagedUsers();
}
