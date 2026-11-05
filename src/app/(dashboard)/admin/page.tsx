import { getCurrentUser } from '@/server/actions/auth';
import { getManagedUsers } from '@/server/actions/users';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ProvisionModal from '@/components/admin/ProvisionModal';
import UserManagementTable from '@/components/admin/UserManagementTable';

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/');
  }

  // Aggregate stats and fetch all provisioned accounts
  const [teacherCount, studentCount, parentCount, pendingSlipsCount, managedUsers] = await Promise.all([
    prisma.teacher.count(),
    prisma.student.count(),
    prisma.user.count({ where: { role: 'PARENT' } }),
    prisma.payment.count({ where: { verificationStatus: 'AMOUNT_MISMATCH' } }),
    getManagedUsers(),
  ]);

  return (
    <div className="space-y-8">
      {/* Top Banner with Provision Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-border pb-5">
        <div>
          <h1 className="text-2xl font-black text-brand-text-primary tracking-tight">Admin Studio</h1>
          <p className="text-xs text-brand-text-muted mt-1">
            Logged in as <strong className="text-brand-text-primary">{user.fullName || user.email}</strong> (Administrator). Manage studio accounts, roles, and school operations.
          </p>
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-text-primary">Studio Account Management</h2>
            <p className="text-xs text-brand-text-muted">
              All accounts are provisioned by administration. You can change any user&apos;s role below.
            </p>
          </div>
        </div>

        <UserManagementTable initialUsers={managedUsers} />
      </div>
    </div>
  );
}
