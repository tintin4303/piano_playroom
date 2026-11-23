import { getCurrentUser } from '@/server/actions/auth';
import { redirect } from 'next/navigation';
import ClassHistoryView from '@/components/teacher/ClassHistoryView';

export default async function TeacherHistoryPage({ searchParams }: { searchParams: Promise<{ student?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'TEACHER') redirect(user.role === 'ADMIN' ? '/admin' : '/parent');
  const { student } = await searchParams;
  return <ClassHistoryView key={student || 'all'} initialStudentId={student} />;
}
