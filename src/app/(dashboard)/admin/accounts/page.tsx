import { getCurrentUser } from '@/server/actions/auth';
import { getManagedUsers } from '@/server/actions/users';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import ProvisionModal from '@/components/admin/ProvisionModal';
import UserManagementTable from '@/components/admin/UserManagementTable';

// Cached count: 1ms memory lookup
const getCachedPendingSlips = unstable_cache(
  async () => {
    return await prisma.payment.count({ where: { verificationStatus: 'AMOUNT_MISMATCH' } });
  },
  ['pending-slips-count'],
  { tags: ['payments'], revalidate: 60 }
);

export default async function AdminAccountsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }
  if (user.role !== 'ADMIN') {
    redirect(user.role === 'TEACHER' ? '/teacher' : '/parent');
  }

  // Ultra-fast cached resolution (~1ms from Next.js Data Cache)
  const [managedUsers, pendingSlipsCount] = await Promise.all([
    getManagedUsers(),
    getCachedPendingSlips(),
  ]);

  // Derived instantly in memory
  const teacherCount = managedUsers.filter((u) => u.role === 'TEACHER').length;
  const parentCount = managedUsers.filter((u) => u.role === 'PARENT').length;
  const studentCount = managedUsers.reduce((sum, u) => sum + (u.students?.length || 0), 0);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Banner with Provision Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-border pb-5">
        <div>
          <h1 className="text-2xl font-black text-brand-text-primary tracking-tight">Studio Accounts</h1>
        </div>

        <div className="flex items-center gap-3">
          <ProvisionModal />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">Teachers</div>
          <div className="text-2xl sm:text-3xl font-black text-brand-text-primary mt-1.5">{teacherCount}</div>
        </div>

        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">Parents</div>
          <div className="text-2xl sm:text-3xl font-black text-brand-text-primary mt-1.5">{parentCount}</div>
        </div>

        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">Students</div>
          <div className="text-2xl sm:text-3xl font-black text-brand-text-primary mt-1.5">{studentCount}</div>
        </div>

        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">Slips To Review</div>
          <div className="text-2xl sm:text-3xl font-black text-brand-yellow-text mt-1.5">{pendingSlipsCount}</div>
        </div>
      </div>

      {/* Account Provisioning & Role Management Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-brand-text-primary">Studio Account Management</h2>
        </div>

        <UserManagementTable initialUsers={managedUsers} />
      </div>
    </div>
  );
}
