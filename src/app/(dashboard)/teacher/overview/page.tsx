import { getCurrentUser } from '@/server/actions/auth';
import { redirect } from 'next/navigation';
import TeacherOverviewView from '@/components/teacher/OverviewView';
import { bangkokToday } from '@/lib/teacher-schedule-mock';

export default async function TeacherOverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'TEACHER') redirect(user.role === 'ADMIN' ? '/admin' : '/parent');

  return <TeacherOverviewView teacherName={user.fullName || 'Teacher'} today={bangkokToday()} />;
}
