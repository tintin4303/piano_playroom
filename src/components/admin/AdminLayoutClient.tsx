'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import Logo from '@/components/shared/Logo';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface AdminLayoutClientProps {
  children: React.ReactNode;
  userEmail: string;
  userName?: string | null;
}

export default function AdminLayoutClient({
  children,
  userEmail,
  userName,
}: AdminLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auto-close on smaller mobile screens by default
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-brand-canvas flex flex-col">
      {/* Top Header Bar with Burger Menu on Top-Left */}
      <header className="h-14 bg-brand-surface border-b border-brand-border sticky top-0 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Burger Menu Button */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? 'Retract sidebar' : 'Expand sidebar'}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-brand-border bg-brand-surface hover:bg-brand-canvas text-brand-text-primary transition cursor-pointer shadow-2xs"
            title={isSidebarOpen ? 'Retract sidebar' : 'Expand sidebar'}
          >
            <Menu className="w-4.5 h-4.5" />
          </button>

          {/* School Brand Logo */}
          <div className="flex items-center">
            <Logo size="sm" clickable={true} />
          </div>
        </div>

        {/* Right Admin Badge & User Identity */}
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold text-brand-text-primary hidden sm:inline">
            {userName || userEmail}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-yellow/30 text-brand-yellow-text border border-brand-yellow/50">
            Admin
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex relative">
        {/* Retractable Sidebar (Desktop & Tablet) */}
        <div
          className={`shrink-0 transition-all duration-300 ease-in-out border-r border-brand-border bg-brand-surface z-30 ${
            isSidebarOpen
              ? 'w-56 translate-x-0'
              : 'w-0 -translate-x-full overflow-hidden opacity-0 pointer-events-none'
          } fixed md:sticky top-14 h-[calc(100vh-3.5rem)]`}
        >
          <div className="w-56 h-full">
            <AdminSidebar
              userEmail={userEmail}
              userName={userName}
              onNavigate={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setIsSidebarOpen(false);
                }
              }}
            />
          </div>
        </div>

        {/* Backdrop for Mobile (< 1024px) */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 top-14 bg-black/25 z-20 md:hidden backdrop-blur-2xs transition-opacity"
          />
        )}

        {/* Content View Area - Expands when sidebar retracts */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto min-w-0 transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}