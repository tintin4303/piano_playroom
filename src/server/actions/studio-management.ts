'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/server/actions/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

/**
 * TEACHER CRUD
 */
export async function createTeacher(data: {
  fullName: string;
  email: string;
  phone: string;
  lineId?: string;
  bio?: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.trim().toLowerCase() },
    });
    if (existing) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Piano123456!', salt);

    const newUser = await prisma.user.create({
      data: {
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        lineId: data.lineId ? data.lineId.trim() : null,
        passwordHash,
        role: 'TEACHER',
        teacher: {
          create: {
            bio: data.bio || 'Piano Instructor',
            availability: {},
          },
        },
      },
    });

    revalidatePath('/admin/teachers');
    revalidatePath('/admin/schedule');
    revalidatePath('/admin/accounts');
    return { success: true, teacherId: newUser.id };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to create teacher' };
  }
}

export async function updateTeacher(data: {
  teacherId: string;
  fullName: string;
  phone: string;
  lineId?: string;
  bio?: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: data.teacherId },
      include: { user: true },
    });
    if (!teacher) {
      return { success: false, message: 'Teacher record not found.' };
    }

    await prisma.user.update({
      where: { id: teacher.userId },
      data: {
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        lineId: data.lineId ? data.lineId.trim() : null,
      },
    });

    if (data.bio !== undefined) {
      await prisma.teacher.update({
        where: { id: data.teacherId },
        data: { bio: data.bio },
      });
    }

    revalidatePath('/admin/teachers');
    revalidatePath('/admin/schedule');
    revalidatePath('/admin/accounts');
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to update teacher' };
  }
}

export async function deleteTeacher(teacherId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) {
      return { success: false, message: 'Teacher not found.' };
    }

    // Deleting the associated user cascades to the teacher and sessions
    await prisma.user.delete({
      where: { id: teacher.userId },
    });

    revalidatePath('/admin/teachers');
    revalidatePath('/admin/schedule');
    revalidatePath('/admin/accounts');
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to delete teacher' };
  }
}

/**
 * STUDENT CRUD
 */
export async function createStudent(data: {
  fullName: string;
  nickname: string;
  parentId: string;
  gender: string;
  dateOfBirth?: string;
  notes?: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    const student = await prisma.student.create({
      data: {
        fullName: data.fullName.trim(),
        nickname: data.nickname.trim(),
        parentId: data.parentId,
        gender: data.gender || 'Any',
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : new Date('2018-01-01'),
        notes: data.notes || null,
      },
    });

    revalidatePath('/admin/students');
    revalidatePath('/admin/schedule');
    revalidatePath('/admin/accounts');
    return { success: true, studentId: student.id };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to create student' };
  }
}

export async function updateStudent(data: {
  studentId: string;
  fullName: string;
  nickname: string;
  parentId?: string;
  gender?: string;
  notes?: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    await prisma.student.update({
      where: { id: data.studentId },
      data: {
        fullName: data.fullName.trim(),
        nickname: data.nickname.trim(),
        ...(data.parentId ? { parentId: data.parentId } : {}),
        ...(data.gender ? { gender: data.gender } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
    });

    revalidatePath('/admin/students');
    revalidatePath('/admin/schedule');
    revalidatePath('/admin/accounts');
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to update student' };
  }
}

export async function deleteStudent(studentId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    await prisma.student.delete({
      where: { id: studentId },
    });

    revalidatePath('/admin/students');
    revalidatePath('/admin/schedule');
    revalidatePath('/admin/accounts');
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to delete student' };
  }
}
