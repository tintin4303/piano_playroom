'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export interface AuthResponse {
  success: boolean;
  message?: string;
  redirectTo?: string;
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  // Lookup user role in Prisma
  const dbUser = await prisma.user.findUnique({
    where: { email },
  });

  let destination = '/parent';
  if (dbUser?.role === 'ADMIN') {
    destination = '/admin';
  } else if (dbUser?.role === 'TEACHER') {
    destination = '/teacher';
  }

  return { success: true, redirectTo: destination };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
