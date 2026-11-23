import { getCurrentUser, signOutAction } from '@/server/actions/auth';
import { redirect } from 'next/navigation';
import Logo from '@/components/shared/Logo';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ParentNavbar from '@/components/parent/ParentNavbar';
import ParentMockProvider from '@/components/parent/ParentMockProvider';
import TeacherNavbar from '@/components/teacher/TeacherNavbar';
import TeacherMockProvider from '@/components/teacher/TeacherMockProvider';
import { bangkokMinute, bangkokToday } from '@/lib/teacher-schedule-mock';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const role = user.role;

  // Admin portal has dedicated vertical sidebar layout as designed
  if (role === 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex">
        <AdminSidebar userEmail={user.email} userName={user.fullName} />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  if (role === 'TEACHER') {
    return (
      <TeacherMockProvider today={bangkokToday()}>
        <div className="min-h-screen bg-brand-canvas flex flex-col">
          <TeacherNavbar
            teacherName={user.fullName || user.email}
            logo={<Logo size="md" clickable={true} />}
            accountActions={<form action={signOutAction}><button type="submit">Sign out</button></form>}
          />
          <main className="teacher-portal-main">{children}</main>
        </div>
      </TeacherMockProvider>
    );
  }

  return (
    <ParentMockProvider today={bangkokToday()} currentMinute={bangkokMinute()}>
    <div className="min-h-screen bg-brand-canvas flex flex-col">
      <ParentNavbar
        name={user.fullName || user.email}
        accountActions={
          <form action={signOutAction}>
            <button type="submit" className="rounded-lg border border-brand-border px-3 py-2 text-xs font-semibold hover:bg-brand-canvas">
              Sign out
            </button>
          </form>
        }
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </div>
    </ParentMockProvider>
  );
}
