import { getCurrentUser } from '@/server/actions/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function TeacherDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }
  if (user.role !== 'TEACHER') {
    redirect(user.role === 'ADMIN' ? '/admin' : '/parent');
  }

  // Find teacher record
  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    include: {
      sessions: {
        where: {
          sessionDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        include: {
          student: true,
          attendance: true,
        },
        orderBy: { startTime: 'asc' },
        take: 10,
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Teacher Portal</h1>
        <p className="text-sm text-slate-600 mt-1">
          Hello {user.fullName || 'Instructor'}. View your upcoming classes and execute 1-tap lesson check-ins.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Upcoming Assigned Lessons</h2>
        
        {(!teacher?.sessions || teacher.sessions.length === 0) ? (
          <div className="text-sm text-slate-500 py-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
            No upcoming lessons scheduled. Contact the school administrator to assign recurring lesson slots.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {teacher.sessions.map((session) => (
              <div key={session.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{session.student.fullName} ({session.student.nickname})</div>
                  <div className="text-xs text-slate-500">
                    {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-brand-text-primary">
                    {session.status}
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
