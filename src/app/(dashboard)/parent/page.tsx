import { getCurrentUser } from '@/server/actions/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { formatTHB } from '@/lib/currency';

export default async function ParentDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'PARENT') {
    redirect('/');
  }

  // Fetch parent's registered children and invoices
  const [students, unbilledSessions, invoices] = await Promise.all([
    prisma.student.findMany({
      where: { parentId: user.id },
      include: {
        series: {
          include: { teacher: { include: { user: true } } },
        },
      },
    }),
    prisma.lessonSession.findMany({
      where: {
        student: { parentId: user.id },
        status: { in: ['COMPLETED', 'CANCELLED_LATE'] },
        invoiceItemId: null,
      },
    }),
    prisma.invoice.findMany({
      where: { parentId: user.id },
      include: { items: true, payment: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const totalUnbilledSatang = unbilledSessions.reduce(
    (acc, session) => acc + session.rateSnapshot,
    0
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Parent Portal</h1>
        <p className="text-sm text-slate-600 mt-1">
          Welcome {user.fullName || 'Parent'}. Track your child&apos;s music lessons, accumulated fees, and invoices.
        </p>
      </div>

      {/* Unbilled Real-time Summary Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider font-bold text-slate-400">
            Current Unbilled Accrued Balance
          </div>
          <div className="text-3xl font-black mt-1">
            {formatTHB(totalUnbilledSatang)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Based on {unbilledSessions.length} completed/billable lessons attended this cycle.
          </p>
        </div>

        {user.creditBalance > 0 && (
          <div className="bg-slate-700/50 px-4 py-3 rounded-xl border border-slate-600">
            <div className="text-xs font-semibold text-slate-300">Carried Over Credit</div>
            <div className="text-lg font-bold text-emerald-400">
              +{formatTHB(user.creditBalance)}
            </div>
          </div>
        )}
      </div>

      {/* Registered Children */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Enrolled Children</h2>
          <span className="text-xs font-semibold text-slate-500">
            {students.length} {students.length === 1 ? 'Student' : 'Students'}
          </span>
        </div>

        {students.length === 0 ? (
          <div className="text-sm text-slate-500 py-6 text-center border-2 border-dashed border-slate-200 rounded-lg">
            No children registered yet. Contact the school administrator to enroll your child.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((student) => (
              <div key={student.id} className="p-4 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{student.fullName}</span>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">
                    &quot;{student.nickname}&quot;
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Gender: {student.gender} • DOB: {new Date(student.dateOfBirth).toLocaleDateString()}
                </div>
                <div className="text-xs font-semibold text-slate-700 pt-1">
                  Active Recurring Lessons: {student.series.length}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Invoices & Slip Uploads */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Monthly Invoices & Slips</h2>
        
        {invoices.length === 0 ? (
          <div className="text-sm text-slate-500 py-6 text-center border-2 border-dashed border-slate-200 rounded-lg">
            No issued invoices yet. Invoices are compiled at the end of each monthly cycle.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <div key={inv.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{inv.invoiceNo}</div>
                  <div className="text-xs text-slate-500">Billing Period: {inv.billingMonth}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{formatTHB(inv.totalAmount)}</div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
