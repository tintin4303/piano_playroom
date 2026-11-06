'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/server/actions/auth';
import { revalidatePath, unstable_cache } from 'next/cache';
import { SessionStatus } from '@prisma/client';

export interface ScheduleSessionDTO {
  id: string;
  timeRange: string; // "10:00 - 11:00"
  studentName: string;
  teacherName: string;
  teacherId: string;
  studentId: string;
  type: string; // "1 hr" or "30 min"
  durationMinutes: number;
  status: string; // "Attended", "Scheduled", "Cancelled", "Absent"
  statusRaw: SessionStatus;
  startTimeIso: string;
  endTimeIso: string;
  sessionDateIso: string;
}

export interface DayScheduleSummary {
  dateIso: string; // "YYYY-MM-DD"
  dayName: string; // "Mon", "Tue"
  dayNumber: number; // 5
  fullDateStr: string;
  isToday: boolean;
  sessions: ScheduleSessionDTO[];
}

export interface TeacherFilterOption {
  id: string;
  name: string;
}

export interface StudentOption {
  id: string;
  name: string;
  parentName?: string;
}

/**
 * Cached weekly data query using Next.js Data Cache
 */
const fetchCachedWeekSchedule = unstable_cache(
  async (selectedDateStr: string) => {
    // Parse target date (e.g. "2026-11-05")
    const [year, month, day] = selectedDateStr.split('-').map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    // Current real today in Bangkok timezone for accurate comparison
    const todayIsoString = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());

    // Compute Monday of this target week
    const dayOfWeek = targetDate.getUTCDay(); // 0 is Sun, 1 is Mon...
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(targetDate);
    monday.setUTCDate(targetDate.getUTCDate() - distanceToMonday);
    monday.setUTCHours(0, 0, 0, 0);

    // Sunday of this target week
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    // Query in parallel
    const [sessions, teachers, students] = await Promise.all([
      prisma.lessonSession.findMany({
        where: {
          sessionDate: {
            gte: monday,
            lte: sunday,
          },
        },
        select: {
          id: true,
          studentId: true,
          teacherId: true,
          sessionDate: true,
          startTime: true,
          endTime: true,
          status: true,
          student: {
            select: {
              fullName: true,
              nickname: true,
            },
          },
          teacher: {
            select: {
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      }),
      prisma.teacher.findMany({
        select: {
          id: true,
          user: {
            select: {
              fullName: true,
            },
          },
        },
      }),
      prisma.student.findMany({
        select: {
          id: true,
          fullName: true,
          nickname: true,
          parent: {
            select: {
              fullName: true,
            },
          },
        },
      }),
    ]);

    // Map to 7 days
    const days: DayScheduleSummary[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setUTCDate(monday.getUTCDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      const daySessions = sessions
        .filter((s) => s.sessionDate.toISOString().split('T')[0] === dateStr)
        .map((s) => {
          const start = new Date(s.startTime);
          const end = new Date(s.endTime);
          const startH = String(start.getUTCHours()).padStart(2, '0');
          const startM = String(start.getUTCMinutes()).padStart(2, '0');
          const endH = String(end.getUTCHours()).padStart(2, '0');
          const endM = String(end.getUTCMinutes()).padStart(2, '0');
          const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);

          let statusDisplay = 'Scheduled';
          if (s.status === 'COMPLETED') statusDisplay = 'Attended';
          else if (s.status.startsWith('CANCELLED')) statusDisplay = 'Cancelled';
          else if (s.status === 'TEACHER_ABSENT') statusDisplay = 'Absent';

          return {
            id: s.id,
            timeRange: `${startH}:${startM} - ${endH}:${endM}`,
            studentName: s.student.nickname || s.student.fullName,
            teacherName: s.teacher.user.fullName || 'Teacher',
            teacherId: s.teacherId,
            studentId: s.studentId,
            type: durationMin >= 55 ? '1 hr' : '30 min',
            durationMinutes: durationMin,
            status: statusDisplay,
            statusRaw: s.status,
            startTimeIso: s.startTime.toISOString(),
            endTimeIso: s.endTime.toISOString(),
            sessionDateIso: s.sessionDate.toISOString(),
          };
        });

      days.push({
        dateIso: dateStr,
        dayName: dayNames[i],
        dayNumber: d.getUTCDate(),
        fullDateStr: `${monday.getUTCDate()}-${sunday.getUTCDate()} ${monday.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })} ${monday.getUTCFullYear()}`,
        isToday: dateStr === todayIsoString,
        sessions: daySessions,
      });
    }

    const teacherOptions: TeacherFilterOption[] = teachers.map((t) => ({
      id: t.id,
      name: t.user.fullName || 'Teacher',
    }));

    const studentOptions: StudentOption[] = students.map((s) => ({
      id: s.id,
      name: s.nickname ? `${s.nickname} (${s.fullName})` : s.fullName,
      parentName: s.parent?.fullName || undefined,
    }));

    // Previous Monday and Next Monday ISO dates for week navigation
    const prevMonday = new Date(monday);
    prevMonday.setUTCDate(monday.getUTCDate() - 7);
    const nextMonday = new Date(monday);
    nextMonday.setUTCDate(monday.getUTCDate() + 7);

    return {
      days,
      currentMondayIso: monday.toISOString().split('T')[0],
      prevMondayIso: prevMonday.toISOString().split('T')[0],
      nextMondayIso: nextMonday.toISOString().split('T')[0],
      rangeLabel: `${monday.getUTCDate()}-${sunday.getUTCDate()} ${monday.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })} ${monday.getUTCFullYear()}`,
      teacherOptions,
      studentOptions,
    };
  },
  ['admin-schedule-week-cache'],
  { tags: ['schedule'], revalidate: 60 }
);

/**
 * Fetch schedule data for a specific week around a given date
 */
export async function getScheduleWeek(selectedDateStr?: string) {
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
  const dateStr = selectedDateStr || todayStr;
  return await fetchCachedWeekSchedule(dateStr);
}

/**
 * Schedule a new lesson session
 */
export async function scheduleLessonSession(data: {
  studentId: string;
  teacherId: string;
  dateStr: string; // "YYYY-MM-DD"
  startTimeStr: string; // "13:00"
  durationMinutes: number; // 30 or 60
  rateSatang?: number;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    const [h, m] = data.startTimeStr.split(':').map(Number);
    const sessionDate = new Date(`${data.dateStr}T00:00:00.000Z`);
    const startTime = new Date(`${data.dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`);
    const endTime = new Date(startTime.getTime() + data.durationMinutes * 60000);

    const session = await prisma.lessonSession.create({
      data: {
        studentId: data.studentId,
        teacherId: data.teacherId,
        sessionDate,
        startTime,
        endTime,
        rateSnapshot: data.rateSatang || 120000,
        status: SessionStatus.SCHEDULED,
      },
    });

    revalidatePath('/admin', 'layout');
    revalidatePath('/admin/schedule');
    return { success: true, sessionId: session.id };
  } catch (err: any) {
    console.error('Error scheduling session:', err);
    return { success: false, message: err.message || 'Failed to schedule lesson' };
  }
}

/**
 * Update session status (e.g. Attended, Cancelled, Scheduled)
 */
export async function updateSessionStatus(sessionId: string, newStatus: SessionStatus) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    await prisma.lessonSession.update({
      where: { id: sessionId },
      data: { status: newStatus },
    });

    revalidatePath('/admin', 'layout');
    revalidatePath('/admin/schedule');
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to update session' };
  }
}

/**
 * Delete session
 */
export async function deleteSession(sessionId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    await prisma.lessonSession.delete({
      where: { id: sessionId },
    });

    revalidatePath('/admin', 'layout');
    revalidatePath('/admin/schedule');
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to delete session' };
  }
}
