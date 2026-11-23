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
  instrument: string; // "Piano", "Violin", etc.
  startHourFraction: number; // e.g. 10.5 for 10:30
  endHourFraction: number; // e.g. 11.5 for 11:30
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

          const startFraction = start.getUTCHours() + start.getUTCMinutes() / 60;
          const endFraction = end.getUTCHours() + end.getUTCMinutes() / 60;

          // Default instrument logic (Violin for Beethoven, Piano for others for presentation)
          const teacherName = s.teacher.user.fullName || 'Teacher';
          let instrument = 'Piano';
          if (teacherName.toLowerCase().includes('beethoven')) {
            instrument = 'Violin';
          }

          return {
            id: s.id,
            timeRange: `${startH}:${startM} - ${endH}:${endM}`,
            studentName: s.student.nickname || s.student.fullName,
            teacherName,
            teacherId: s.teacherId,
            studentId: s.studentId,
            type: durationMin >= 55 ? '1 hr' : '30 min',
            durationMinutes: durationMin,
            status: statusDisplay,
            statusRaw: s.status,
            startTimeIso: s.startTime.toISOString(),
            endTimeIso: s.endTime.toISOString(),
            sessionDateIso: s.sessionDate.toISOString(),
            instrument,
            startHourFraction: startFraction,
            endHourFraction: endFraction,
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
 * Schedule a new lesson session or recurring series
 */
export async function scheduleLessonSession(data: {
  studentId: string;
  teacherId: string;
  dateStr: string; // "YYYY-MM-DD"
  startTimeStr: string; // "13:00"
  endTimeStr?: string; // "14:00"
  durationMinutes?: number;
  rateSatang?: number;
  isRecurring?: boolean;
  recurringEndDateStr?: string; // "YYYY-MM-DD"
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    const [startH, startM] = data.startTimeStr.split(':').map(Number);
    let durationMin = data.durationMinutes || 60;

    if (data.endTimeStr) {
      const [endH, endM] = data.endTimeStr.split(':').map(Number);
      durationMin = (endH * 60 + endM) - (startH * 60 + startM);
      if (durationMin <= 0) durationMin = 60;
    }

    const sessionDate = new Date(`${data.dateStr}T00:00:00.000Z`);
    const startTime = new Date(`${data.dateStr}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00.000Z`);
    const endTime = new Date(startTime.getTime() + durationMin * 60000);

    // If recurring is enabled, expand weekly occurrences up to the recurringEndDate
    if (data.isRecurring && data.recurringEndDateStr) {
      const recurrenceEnd = new Date(`${data.recurringEndDateStr}T23:59:59.999Z`);
      let currentOccurrenceDate = new Date(sessionDate);

      // Create recurring series rule
      const dayOfWeekNum = currentOccurrenceDate.getUTCDay() === 0 ? 7 : currentOccurrenceDate.getUTCDay();
      const series = await prisma.lessonSeries.create({
        data: {
          studentId: data.studentId,
          teacherId: data.teacherId,
          dayOfWeek: dayOfWeekNum,
          startTime: data.startTimeStr,
          durationMinutes: durationMin,
          hourlyRate: data.rateSatang || 120000,
          startDate: sessionDate,
          endDate: recurrenceEnd,
          isActive: true,
        },
      });

      // Expand concrete session records
      while (currentOccurrenceDate <= recurrenceEnd) {
        const curDateStr = currentOccurrenceDate.toISOString().split('T')[0];
        const occStart = new Date(`${curDateStr}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00.000Z`);
        const occEnd = new Date(occStart.getTime() + durationMin * 60000);

        await prisma.lessonSession.create({
          data: {
            seriesId: series.id,
            studentId: data.studentId,
            teacherId: data.teacherId,
            sessionDate: new Date(`${curDateStr}T00:00:00.000Z`),
            startTime: occStart,
            endTime: occEnd,
            rateSnapshot: data.rateSatang || 120000,
            status: SessionStatus.SCHEDULED,
          },
        });

        // Advance 7 days
        currentOccurrenceDate.setUTCDate(currentOccurrenceDate.getUTCDate() + 7);
      }

      revalidatePath('/admin', 'layout');
      revalidatePath('/admin/schedule');
      return { success: true };
    }

    // Single session booking
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
