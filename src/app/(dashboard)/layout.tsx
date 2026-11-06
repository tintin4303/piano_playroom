import { getCurrentUser, signOutAction } from '@/server/actions/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/shared/Logo';
import AdminSidebar from '@/components/admin/AdminSidebar';

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

  return (
    <div className="min-h-screen bg-brand-canvas flex flex-col">
      {/* Universal Top Navigation Header for Teacher & Parent */}
      <header className="bg-brand-surface border-b border-brand-border sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Logo size="md" clickable={true} />

            {/* Navigation Pills */}
            <nav className="hidden md:flex items-center space-x-2">

              {role === 'TEACHER' && (
                <>
                  <Link
                    href="/teacher"
                    className="text-xs font-bold px-4 py-2 rounded-full bg-brand-yellow text-brand-yellow-text shadow-xs"
                  >
                    Schedule
                  </Link>
                  <Link
                    href="/teacher"
                    className="text-xs font-semibold px-4 py-2 rounded-full bg-brand-surface-muted text-brand-text-muted hover:text-brand-text-primary transition-colors"
                  >
                    Class History
                  </Link>
                  <Link
                    href="/teacher"
                    className="text-xs font-semibold px-4 py-2 rounded-full bg-brand-surface-muted text-brand-text-muted hover:text-brand-text-primary transition-colors"
                  >
                    My Students
                  </Link>
                </>
              )}

              {role === 'PARENT' && (
                <>
                  <Link
                    href="/parent"
                    className="text-xs font-bold px-4 py-2 rounded-full bg-brand-yellow text-brand-yellow-text shadow-xs"
                  >
                    Schedule
                  </Link>
                  <Link
                    href="/parent"
                    className="text-xs font-semibold px-4 py-2 rounded-full bg-brand-surface-muted text-brand-text-muted hover:text-brand-text-primary transition-colors"
                  >
                    Billing &amp; Payments
                  </Link>
                  <Link
                    href="/parent"
                    className="text-xs font-semibold px-4 py-2 rounded-full bg-brand-surface-muted text-brand-text-muted hover:text-brand-text-primary transition-colors"
                  >
                    Student
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-bold text-brand-text-primary leading-tight">
                {user.fullName || user.email}
              </div>
              <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-primary-light text-brand-primary border border-brand-primary-border">
                {user.role}
              </span>
            </div>

            <form action={signOutAction}>
              <button
                type="submit"
                className="text-xs font-semibold px-3 py-1.5 border border-brand-border rounded-xl hover:bg-brand-canvas text-brand-text-muted hover:text-brand-text-primary transition cursor-pointer"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
