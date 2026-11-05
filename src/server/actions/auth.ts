'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { createSessionCookie, getSessionPayload, clearSessionCookie } from '@/lib/auth-session';
import { cache } from 'react';
import { Role } from '@prisma/client';

export interface AuthResponse {
  success: boolean;
  message?: string;
  redirectTo?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  creditBalance: number;
}

// 0ms In-Memory session extraction (Zero DB latency)
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const session = await getSessionPayload();
  if (!session || !session.userId) {
    return null;
  }

  return {
    id: session.userId,
    email: session.email,
    fullName: session.fullName || null,
    role: session.role,
    creditBalance: 0,
  };
});

// Full database record with relations (used only when deep relational properties are needed)
export const getFullDatabaseUser = cache(async () => {
  const session = await getSessionPayload();
  if (!session || !session.userId) {
    return null;
  }

  return await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      teacher: true,
      students: true,
    },
  });
});

export async function signIn(formData: FormData): Promise<AuthResponse> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, message: 'Please provide both email and password' };
  }

  // Lookup user in Prisma database
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      fullName: true,
      passwordHash: true,
      role: true,
    },
  });

  if (!user || !user.passwordHash) {
    return { success: false, message: 'Invalid email or password' };
  }

  // Compare submitted password with bcrypt passwordHash
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return { success: false, message: 'Invalid email or password' };
  }

  // Establish signed session cookie with user identity & role
  await createSessionCookie({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
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
