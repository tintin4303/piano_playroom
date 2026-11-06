import { getCurrentUser } from '@/server/actions/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import TeachersTable, { TeacherRecord } from '@/components/admin/TeachersTable';

export default async function AdminTeachersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  const rawTeachers = await prisma.teacher.findMany({
    include: {
      user: true,
      _count: {
        select: { sessions: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const teachers: TeacherRecord[] = rawTeachers.map((t) => ({
    id: t.id,
    name: t.user.fullName || 'Instructor',
    email: t.user.email,
    phone: t.user.phone,
    lineId: t.user.lineId,
    totalClasses: t._count.sessions,
  }));

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="border-b border-brand-border pb-5">
        <h1 className="text-2xl font-black text-brand-text-primary tracking-tight">Teachers</h1>
      </div>

      <TeachersTable initialTeachers={teachers} />
    </div>
  );
}
