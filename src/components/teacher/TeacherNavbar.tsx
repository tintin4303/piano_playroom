'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './teacher-navigation.css';

interface TeacherNavbarProps {
  teacherName: string;
  logo: ReactNode;
  accountActions: ReactNode;
}

const sections = [
  { label: 'Overview', href: '/teacher/overview' },
  { label: 'Schedule', href: '/teacher/schedule' },
  { label: 'Class History', href: '/teacher/history' },
  { label: 'My Students', href: '/teacher/students' },
];

export default function TeacherNavbar({ teacherName, logo, accountActions }: TeacherNavbarProps) {
  const pathname = usePathname();
  const initials = teacherName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('');

  return (
    <header className="teacher-header">
      <div className="teacher-header-inner">
        <div className="teacher-header-brand">{logo}</div>
        <nav className="teacher-navigation" aria-label="Teacher portal">
          {sections.map((section) => (
            <Link key={section.href} href={section.href}
              aria-current={pathname === section.href ? 'page' : undefined}>
              {section.label}
            </Link>
          ))}
        </nav>
        <details className="teacher-account">
          <summary aria-label={`Account for ${teacherName}`}><span aria-hidden="true">{initials}</span></summary>
          <div className="teacher-account-menu"><strong>{teacherName}</strong><span>Teacher</span>{accountActions}</div>
        </details>
      </div>
    </header>
  );
}
