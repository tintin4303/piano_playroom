import { redirect } from 'next/navigation';
import BillingPaymentsView from '@/components/parent/BillingPaymentsView';
import { getCurrentUser } from '@/server/actions/auth';

export default async function ParentBillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'PARENT') redirect(user.role === 'ADMIN' ? '/admin' : '/teacher');

  return <BillingPaymentsView />;
}
