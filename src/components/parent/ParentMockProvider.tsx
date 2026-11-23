'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { createParentPortalMock, parentStudents, type ParentInvoice, type ParentLesson, type ParentStudent } from '@/lib/parent-portal-mock';

interface ParentMockState {
  today: string;
  currentMinute: number;
  lessons: ParentLesson[];
  invoices: ParentInvoice[];
  studentId: ParentStudent['id'];
  selectStudent: (id: ParentStudent['id']) => void;
  submitSlip: (invoiceId: string, fileName: string) => void;
}

const ParentMockContext = createContext<ParentMockState | null>(null);

export default function ParentMockProvider({ today, currentMinute, children }: {
  today: string;
  currentMinute: number;
  children: ReactNode;
}) {
  const [mock, setMock] = useState(() => createParentPortalMock(today, currentMinute));
  const [studentId, selectStudent] = useState<ParentStudent['id']>(parentStudents[0].id);

  function submitSlip(invoiceId: string, fileName: string) {
    const submittedAt = new Date().toISOString();
    setMock((current) => ({
      ...current,
      invoices: current.invoices.map((invoice): ParentInvoice => invoice.id === invoiceId && (invoice.status === 'Unpaid' || invoice.status === 'Slip rejected')
        ? { ...invoice, status: 'Awaiting review', rejectionReason: undefined, submission: { fileName, submittedAt } }
        : invoice),
    }));
  }

  return <ParentMockContext.Provider value={{ ...mock, today, currentMinute, studentId, selectStudent, submitSlip }}>{children}</ParentMockContext.Provider>;
}

export function useParentMock() {
  const context = useContext(ParentMockContext);
  if (!context) throw new Error('Parent views must be rendered inside ParentMockProvider.');
  return context;
}
