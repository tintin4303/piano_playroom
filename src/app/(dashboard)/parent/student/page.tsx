import { redirect } from 'next/navigation';
import StudentView from '@/components/parent/StudentView';
import { getCurrentUser } from '@/server/actions/auth';

export default async function ParentStudentPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'PARENT') redirect(user.role === 'ADMIN' ? '/admin' : '/teacher');

  return <StudentView />;
}
