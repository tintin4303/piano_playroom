'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/shared/Logo';

const tabClass = 'flex min-h-10 flex-1 items-center justify-center rounded-xl px-3 py-2 text-center text-xs font-bold';
const sections = [
  { label: 'Schedule', href: '/parent/schedule' },
  { label: 'Billing & Payments', href: '/parent/billing' },
  { label: 'Student', href: '/parent/student' },
];

export default function ParentNavbar({ name, accountActions }: { name: string; accountActions: ReactNode }) {
  const pathname = usePathname().replace(/\/+$/, '') || '/parent/schedule';
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-brand-border bg-brand-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 md:flex-nowrap md:gap-8 lg:px-8">
        <Link href="/parent/schedule" className="shrink-0">
          <Logo size="md" clickable={false} />
        </Link>
        <nav aria-label="Parent portal" className="order-last flex w-full min-w-0 gap-2 md:order-none md:max-w-2xl">
          {sections.map(({ label, href }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return <Link key={href} href={href} aria-current={active ? 'page' : undefined}
              className={tabClass + (active ? ' bg-brand-yellow text-brand-text-primary hover:bg-brand-yellow-hover' : ' text-brand-text-muted hover:bg-brand-canvas')}>
              {label}
            </Link>;
          })}
        </nav>
        <details className="relative shrink-0">
          <summary aria-label={'Account for ' + name} className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full bg-brand-primary-light text-xs font-extrabold text-brand-primary [&::-webkit-details-marker]:hidden">
            <span aria-hidden="true">{initials}</span>
          </summary>
          <div className="absolute right-0 top-12 grid w-56 gap-2 rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-lg">
            <strong className="break-all text-sm text-brand-text-primary">{name}</strong>
            <span className="text-xs text-brand-text-muted">Parent</span>
            {accountActions}
          </div>
        </details>
      </div>
    </header>
  );
}
