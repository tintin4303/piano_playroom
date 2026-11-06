'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/shared/Logo';
import { signOutAction } from '@/server/actions/auth';

interface AdminSidebarProps {
  userEmail: string;
  userName?: string | null;
}

const navItems = [
  { label: 'Overview', href: '/admin/overview' },
  { label: 'Schedule', href: '/admin/schedule' },
  { label: 'Accounts', href: '/admin/accounts' },
  { label: 'Students', href: '/admin/students' },
  { label: 'Teachers', href: '/admin/teachers' },
  { label: 'Billing', href: '/admin/billing' },
  { label: 'Settings', href: '/admin/settings' },
];

export default function AdminSidebar({ userEmail, userName }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-brand-border flex flex-col justify-between min-h-screen py-6 px-4">
      <div className="space-y-8">
        {/* Logo and Brand Name */}
        <div className="px-2">
          <Logo size="md" clickable={false} />
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            // Check active state: exact or subpath (or redirect default)
            const isActive =
              pathname === item.href ||
              (item.href === '/admin/schedule' && (pathname === '/admin' || pathname === '/admin/schedule')) ||
              (item.href === '/admin/accounts' && pathname === '/admin/accounts');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-brand-yellow text-brand-yellow-text font-bold shadow-xs'
                    : 'text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-canvas'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button at bottom left */}
      <div className="pt-6 border-t border-brand-border/60 px-4">
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-xs font-semibold text-[#FF4D4F] hover:text-[#D9363E] transition cursor-pointer"
          >
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
