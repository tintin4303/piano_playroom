import { getCurrentUser } from '@/server/actions/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import StudentsTable, { StudentRecord, ParentOption } from '@/components/admin/StudentsTable';

export default async function AdminStudentsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  const [rawStudents, rawParents] = await Promise.all([
    prisma.student.findMany({
      include: {
        parent: true,
        _count: {
          select: { sessions: true },
        },
      },
      orderBy: { fullName: 'asc' },
    }),
    prisma.user.findMany({
      where: { role: 'PARENT' },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: 'asc' },
    }),
  ]);

  const students: StudentRecord[] = rawStudents.map((s) => ({
    id: s.id,
    fullName: s.fullName,
    nickname: s.nickname,
    parentId: s.parentId,
    parentName: s.parent.fullName || s.parent.email,
    parentEmail: s.parent.email,
    totalLessons: s._count.sessions,
  }));

  const parentOptions: ParentOption[] = rawParents.map((p) => ({
    id: p.id,
    name: p.fullName ? `${p.fullName} (${p.email})` : p.email,
  }));

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="border-b border-brand-border pb-5">
        <h1 className="text-2xl font-black text-brand-text-primary tracking-tight">Students</h1>
      </div>

      <StudentsTable initialStudents={students} parentOptions={parentOptions} />
    </div>
  );
}
