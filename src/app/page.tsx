import { getCurrentUser, signOutAction } from '@/server/actions/auth';
import Link from 'next/link';
import Logo from '@/components/shared/Logo';

export default async function HomePage() {
  const user = await getCurrentUser();

  // Root landing page / is accessible to all without automatic redirection
  const portalHref =
    user?.role === 'ADMIN'
      ? '/admin'
      : user?.role === 'TEACHER'
      ? '/teacher'
      : '/parent';

  const portalLabel =
    user?.role === 'ADMIN'
      ? 'Admin Studio'
      : user?.role === 'TEACHER'
      ? 'Teacher Portal'
      : 'Parent Portal';

  return (
    <div className="min-h-screen bg-brand-canvas text-brand-text-primary flex flex-col justify-between">
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <Logo size="md" clickable={false} />
        <div>
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href={portalHref}
                className="text-xs font-bold px-4 py-2 bg-brand-yellow text-brand-yellow-text rounded-full hover:bg-brand-yellow-hover transition shadow-xs"
              >
                Go to {portalLabel}
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="text-xs font-semibold px-3 py-1.5 border border-brand-border rounded-full hover:bg-brand-surface text-brand-text-muted hover:text-brand-text-primary transition cursor-pointer"
                >
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-bold px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-full transition shadow-xs"
            >
              Studio Sign In
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary-light text-brand-primary rounded-full text-xs font-bold uppercase tracking-wider border border-brand-primary-border">
          <span className="w-2 h-2 rounded-full bg-brand-primary" />
          Senior Project 2 • Piano Playroom Management
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-brand-text-primary">
          Smart Timetables, 1-Tap Attendance &amp; Bank Slip Verification
        </h1>

        <p className="text-base sm:text-lg text-brand-text-muted max-w-2xl mx-auto leading-relaxed">
          The unified studio platform built for multi-teacher scheduling, post-paid invoicing, instant PromptPay slip validation, and bi-annual recital showcases.
        </p>

        <div className="flex items-center justify-center pt-4">
          {user ? (
            <Link
              href={portalHref}
              className="px-8 py-3.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-full shadow-sm transition tracking-wider text-xs uppercase"
            >
              Go to {portalLabel}
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-8 py-3.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-full shadow-sm transition tracking-wider text-xs uppercase"
            >
              Access Studio Portal
            </Link>
          )}
        </div>
      </main>

      <footer className="max-w-7xl mx-auto w-full px-6 py-6 text-center text-xs text-brand-text-muted border-t border-brand-border">
        Piano Playroom Management System • Accounts provisioned by school administration
      </footer>
    </div>
  );
}
