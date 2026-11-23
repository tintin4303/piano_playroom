'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { bangkokMinute, createMockLessons, lessonHasEnded, MOCK_STUDENTS, type TeacherLesson } from '@/lib/teacher-schedule-mock';

interface TeacherMockState {
  lessons: TeacherLesson[];
  students: typeof MOCK_STUDENTS;
  today: string;
  currentMinute: number;
  markAbsent: (id: string) => void;
  restoreAttendance: (id: string) => void;
}

const TeacherMockContext = createContext<TeacherMockState | null>(null);

export default function TeacherMockProvider({ today, children }: { today: string; children: ReactNode }) {
  const [currentMinute] = useState(bangkokMinute);
  const [lessons, setLessons] = useState(() => createMockLessons(today).map((lesson) => ({
    ...lesson,
    status: lesson.status === 'Scheduled' && lessonHasEnded(lesson, today, currentMinute) ? 'Attended' as const : lesson.status,
  })));

  function markAbsent(id: string) {
    setLessons((current) => current.map((lesson) => lesson.id === id && lesson.status === 'Attended'
      && lessonHasEnded(lesson, today, currentMinute) ? { ...lesson, status: 'Student absent' } : lesson));
  }

  function restoreAttendance(id: string) {
    setLessons((current) => current.map((lesson) => lesson.id === id && lesson.status === 'Student absent'
      ? { ...lesson, status: 'Attended' } : lesson));
  }

  return <TeacherMockContext.Provider value={{ lessons, students: MOCK_STUDENTS, today, currentMinute, markAbsent, restoreAttendance }}>{children}</TeacherMockContext.Provider>;
}

export function useTeacherMock() {
  const context = useContext(TeacherMockContext);
  if (!context) throw new Error('Teacher views must be rendered inside TeacherMockProvider.');
  return context;
}
