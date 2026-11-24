'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOutAction } from '@/server/actions/auth';
import {
  LayoutDashboard,
  Calendar,
  Users,
  GraduationCap,
  UserCheck,
  Receipt,
  CreditCard,
  Settings,
  LogOut,
} from 'lucide-react';

interface AdminSidebarProps {
  userEmail: string;
  userName?: string | null;
  onNavigate?: () => void;
}

const navItems = [
  { label: 'Overview', href: '/admin/overview', icon: LayoutDashboard },
  { label: 'Schedule', href: '/admin/schedule', icon: Calendar },
  { label: 'Accounts', href: '/admin/accounts', icon: Users },
  { label: 'Students', href: '/admin/students', icon: GraduationCap },
  { label: 'Teachers', href: '/admin/teachers', icon: UserCheck },
  { label: 'Billing', href: '/admin/billing', icon: Receipt },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 h-full bg-white border-r border-brand-border flex flex-col justify-between py-5 px-3">
      {/* Navigation Links */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href === '/admin/schedule' && (pathname === '/admin' || pathname === '/admin/schedule')) ||
            (item.href === '/admin/accounts' && pathname === '/admin/accounts');

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-brand-yellow text-brand-yellow-text font-bold shadow-xs'
                  : 'text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-canvas'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout button at bottom */}
      <div className="pt-4 border-t border-brand-border/60 px-2">
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 text-xs font-semibold text-brand-red hover:opacity-80 transition cursor-pointer w-full text-left"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </form>
      </div>
    </aside>
  );
}