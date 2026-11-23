import { getCurrentUser } from '@/server/actions/auth';
import { redirect } from 'next/navigation';
import TeacherScheduleView from '@/components/teacher/ScheduleView';
import { bangkokToday, isValidDate } from '@/lib/teacher-schedule-mock';

export default async function TeacherSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; student?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'TEACHER') redirect(user.role === 'ADMIN' ? '/admin' : '/parent');

  const { date, student } = await searchParams;
  const initialDate = date && isValidDate(date) ? date : bangkokToday();

  return (
    <TeacherScheduleView
      key={`${initialDate}-${student || 'all'}`}
      initialDate={initialDate}
      initialStudentId={student}
      teacherName={user.fullName || 'Teacher'}
    />
  );
}
