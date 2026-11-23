'use client';

import { parentStudents, type ParentInvoiceStatus, type ParentLesson } from '@/lib/parent-portal-mock';
import { dateObject } from '@/lib/teacher-schedule-mock';
import { useParentMock } from './ParentMockProvider';

export const panelClass = 'rounded-2xl border border-brand-border bg-brand-surface p-5 sm:p-6';
export const controlClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-brand-border px-3 py-2 text-sm font-semibold text-brand-text-primary hover:bg-brand-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary disabled:cursor-not-allowed disabled:opacity-50';
export const primaryClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-brand-yellow px-4 py-2 text-sm font-bold text-brand-text-primary hover:bg-brand-yellow-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary disabled:cursor-not-allowed disabled:opacity-50';
export const dialogClass = 'm-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-brand-border bg-brand-surface p-5 text-brand-text-primary shadow-xl backdrop:bg-slate-900/50 sm:p-6';
export const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export function displayDate(date: string) { return dateFormat.format(dateObject(date)); }

export function StudentSelect() {
  const { studentId, selectStudent } = useParentMock();
  return <label className="flex items-center gap-3 text-sm font-semibold">
    Student
    <select value={studentId} onChange={(event) => {
      const student = parentStudents.find((child) => child.id === event.currentTarget.value);
      if (student) selectStudent(student.id);
    }} className="min-h-10 rounded-xl border border-brand-border bg-brand-surface px-3 font-semibold">
      {parentStudents.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
    </select>
  </label>;
}

export function ParentStatusBadge({ status }: { status: ParentInvoiceStatus | ParentLesson['status'] }) {
  const colors = status === 'Paid' || status === 'Attended'
    ? 'bg-emerald-50 text-emerald-800'
    : status === 'Slip rejected' || status === 'Student absent'
      ? 'bg-red-50 text-red-800'
      : status === 'Unpaid' || status === 'Awaiting review'
        ? 'bg-amber-50 text-amber-900'
        : status === 'Cancelled'
          ? 'bg-slate-100 text-slate-700'
          : 'bg-brand-primary-light text-brand-primary';
  return <span className={'inline-flex rounded-full px-2.5 py-1 text-xs font-bold ' + colors}>{status}</span>;
}
