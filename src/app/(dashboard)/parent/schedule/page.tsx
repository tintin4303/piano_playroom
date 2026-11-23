import { redirect } from 'next/navigation';
import ParentScheduleView from '@/components/parent/ScheduleView';
import { getCurrentUser } from '@/server/actions/auth';

export default async function ParentSchedulePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'PARENT') redirect(user.role === 'ADMIN' ? '/admin' : '/teacher');

  return <ParentScheduleView parentName={user.fullName || 'Parent'} />;
}
