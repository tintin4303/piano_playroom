'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { createSessionCookie, getSessionPayload, clearSessionCookie } from '@/lib/auth-session';

export interface AuthResponse {
  success: boolean;
  message?: string;
  redirectTo?: string;
}

export async function getCurrentUser() {
  const session = await getSessionPayload();
  if (!session || !session.userId) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      teacher: true,
      students: true,
    },
  });

  return dbUser;
}

export async function signIn(formData: FormData): Promise<AuthResponse> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, message: 'Please provide both email and password' };
  }

  // Lookup user in Prisma database
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) {
    return { success: false, message: 'Invalid email or password' };
  }

  // Compare submitted password with bcrypt passwordHash
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return { success: false, message: 'Invalid email or password' };
  }

  // Establish session cookie
  await createSessionCookie({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  let destination = '/parent';
  if (user.role === 'ADMIN') {
    destination = '/admin';
  } else if (user.role === 'TEACHER') {
    destination = '/teacher';
  }

  return { success: true, redirectTo: destination };
}

export async function signOutAction() {
  await clearSessionCookie();
  redirect('/login');
}
