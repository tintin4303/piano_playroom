import { getCurrentUser } from '@/server/actions/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { formatTHB } from '@/lib/currency';
import Link from 'next/link';
import { ArrowRight, Calendar, Users, GraduationCap, DollarSign } from 'lucide-react';

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  // Fast parallel queries for studio metrics
  const [teachersCount, studentsCount, parentsCount, pendingSlipsCount, nextLessons] = await Promise.all([
    prisma.teacher.count(),
    prisma.student.count(),
    prisma.user.count({ where: { role: 'PARENT' } }),
    prisma.payment.count({ where: { verificationStatus: 'AMOUNT_MISMATCH' } }),
    prisma.lessonSession.findMany({
      where: {
        sessionDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      include: {
        student: true,
        teacher: { include: { user: true } },
      },
      orderBy: { startTime: 'asc' },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page Header */}
      <div className="border-b border-brand-border pb-5">
        <h1 className="text-2xl font-black text-brand-text-primary tracking-tight">Studio Overview</h1>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-xs">
          <div className="flex items-center justify-between text-brand-text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Teachers</span>
            <Users className="w-4 h-4 text-brand-text-subtle" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-brand-text-primary mt-2">{teachersCount}</div>
        </div>

        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-xs">
          <div className="flex items-center justify-between text-brand-text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Students</span>
            <GraduationCap className="w-4 h-4 text-brand-text-subtle" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-brand-text-primary mt-2">{studentsCount}</div>
        </div>

        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-xs">
          <div className="flex items-center justify-between text-brand-text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Parents</span>
            <Users className="w-4 h-4 text-brand-text-subtle" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-brand-text-primary mt-2">{parentsCount}</div>
        </div>

        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-xs">
          <div className="flex items-center justify-between text-brand-yellow-text">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Slips</span>
            <DollarSign className="w-4 h-4 text-brand-yellow-text" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-brand-yellow-text mt-2">{pendingSlipsCount}</div>
        </div>
      </div>

      {/* Quick Launch & Upcoming Schedule Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming Classes */}
        <div className="lg:col-span-2 bg-brand-surface rounded-2xl border border-brand-border p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <h2 className="text-sm font-bold text-brand-text-primary">Upcoming Lessons Today</h2>
            <Link
              href="/admin/schedule"
              className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
            >
              <span>Full Timetable</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-brand-border/60">
            {nextLessons.length === 0 ? (
              <div className="py-8 text-center text-xs text-brand-text-subtle">
                No classes scheduled for today.
              </div>
            ) : (
              nextLessons.map((lesson) => {
                const start = new Date(lesson.startTime);
                const end = new Date(lesson.endTime);
                const timeStr = `${String(start.getUTCHours()).padStart(2, '0')}:${String(start.getUTCMinutes()).padStart(2, '0')} - ${String(end.getUTCHours()).padStart(2, '0')}:${String(end.getUTCMinutes()).padStart(2, '0')}`;
                return (
                  <div key={lesson.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-brand-text-primary">{lesson.student.nickname || lesson.student.fullName}</div>
                      <div className="text-brand-text-muted text-[11px]">Teacher: {lesson.teacher.user.fullName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-brand-text-primary">{timeStr}</div>
                      <span className="text-[11px] text-brand-text-muted">{lesson.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Links */}
        <div className="space-y-4">
          <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-brand-text-primary">Studio Actions</h3>
            <div className="space-y-2">
              <Link
                href="/admin/schedule"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-brand-border hover:bg-brand-canvas transition text-xs font-semibold text-brand-text-primary"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-brand-text-muted" />
                  <span>Manage Schedule</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-brand-text-subtle" />
              </Link>

              <Link
                href="/admin/accounts"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-brand-border hover:bg-brand-canvas transition text-xs font-semibold text-brand-text-primary"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-brand-text-muted" />
                  <span>Provision Accounts</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-brand-text-subtle" />
              </Link>

              <Link
                href="/admin/billing"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-brand-border hover:bg-brand-canvas transition text-xs font-semibold text-brand-text-primary"
              >
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-brand-text-muted" />
                  <span>Review Bank Slips</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-brand-text-subtle" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
