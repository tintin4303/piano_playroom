import { getCurrentUser } from '@/server/actions/auth';
import { redirect } from 'next/navigation';
import StudentsView from '@/components/teacher/StudentsView';

export default async function TeacherStudentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'TEACHER') redirect(user.role === 'ADMIN' ? '/admin' : '/parent');
  return <StudentsView />;
}
