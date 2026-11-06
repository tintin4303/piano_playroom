import { getCurrentUser } from '@/server/actions/auth';
import { getScheduleWeek } from '@/server/actions/schedule';
import { redirect } from 'next/navigation';
import ScheduleView from '@/components/admin/ScheduleView';

export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }
  if (user.role !== 'ADMIN') {
    redirect(user.role === 'TEACHER' ? '/teacher' : '/parent');
  }

  const resolvedParams = await searchParams;
  // If no date query param is passed, default to current local date in Asia/Bangkok
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
  const initialDateStr = resolvedParams?.date || todayStr;

  const weekData = await getScheduleWeek(initialDateStr);

  return <ScheduleView initialData={weekData} currentDateStr={initialDateStr} />;
}
