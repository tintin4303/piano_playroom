// Sample household records for the parent portal prototype.
import { shiftDate } from './teacher-schedule-mock';

export const parentStudents = [
  { id: 'timmy', name: 'Timmy', fullName: 'Timothy Chen', dateOfBirth: '2017-04-12', enrolledOn: '2025-06-02', instrument: 'Piano', teacher: 'Mr. Mozart', room: 'Studio 1', duration: 60, feeSatang: 60000 },
  { id: 'amy', name: 'Amy', fullName: 'Amy Chen', dateOfBirth: '2019-08-21', enrolledOn: '2026-02-03', instrument: 'Violin', teacher: 'Ms. Lin', room: 'Studio 2', duration: 30, feeSatang: 35000 },
] as const;

export type ParentStudent = (typeof parentStudents)[number];

export interface ParentLesson {
  id: string;
  studentId: ParentStudent['id'];
  date: string;
  start: number;
  end: number;
  status: 'Confirmed' | 'Attended' | 'Student absent' | 'Cancelled';
  unbilledSatang: number;
}

export type ParentInvoiceStatus = 'Unpaid' | 'Awaiting review' | 'Paid' | 'Slip rejected';

export interface ParentInvoiceItem {
  lessonId: string;
  studentId: ParentStudent['id'];
  date: string;
  amountSatang: number;
}

export interface ParentInvoice {
  id: string;
  number: string;
  periodDate: string;
  dueDate: string;
  status: ParentInvoiceStatus;
  items: ParentInvoiceItem[];
  totalSatang: number;
  rejectionReason?: string;
  submission?: { fileName: string; submittedAt: string };
}

function monthStart(today: string, offset: number) {
  const [year, month] = today.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1 + offset, 1)).toISOString().slice(0, 10);
}

export function createParentPortalMock(today: string, currentMinute = 0) {
  const lessons = parentStudents.flatMap((student, index) => {
    const pastDays = index === 0 ? [-8, -3] : [-4];
    const upcomingDays = index === 0 ? [0, 2, 5, 9, 12] : [1, 4, 8, 11];
    const start = index === 0 ? 14 * 60 : 16 * 60 + 30;

    return [...pastDays, ...upcomingDays].map((offset): ParentLesson => {
      const date = shiftDate(today, offset);
      const attended = offset < 0 || (offset === 0 && start + student.duration <= currentMinute);
      return {
        id: student.id + '-' + date,
        studentId: student.id,
        date,
        start,
        end: start + student.duration,
        status: attended ? 'Attended' : 'Confirmed',
        unbilledSatang: attended ? student.feeSatang : 0,
      };
    });
  });

  const invoiceStatuses: ParentInvoiceStatus[] = ['Unpaid', 'Awaiting review', 'Paid', 'Slip rejected'];
  const invoices = invoiceStatuses.map((status, index): ParentInvoice => {
    const periodDate = monthStart(today, -index - 1);
    const id = 'household-' + periodDate.slice(0, 7);
    const items = parentStudents.flatMap((student) => {
      // Every historical invoice line refers to an actual mock lesson.
      const offsets = index === 1 ? [5] : [5, 12];
      return offsets.map((offset): ParentInvoiceItem => {
        const date = shiftDate(periodDate, offset);
        const lessonId = student.id + '-' + date;
        const start = student.id === 'timmy' ? 14 * 60 : 16 * 60 + 30;
        lessons.push({ id: lessonId, studentId: student.id, date, start, end: start + student.duration, status: 'Attended', unbilledSatang: 0 });
        return { lessonId, studentId: student.id, date, amountSatang: student.feeSatang };
      });
    });
    return {
      id,
      number: 'INV-' + periodDate.slice(0, 7).replace('-', '') + '-0042',
      periodDate,
      dueDate: shiftDate(monthStart(today, -index), 6),
      status,
      items,
      totalSatang: items.reduce((sum, item) => sum + item.amountSatang, 0),
      rejectionReason: status === 'Slip rejected' ? 'The transfer amount is not readable. Please submit a clearer image of the slip.' : undefined,
      submission: status !== 'Unpaid' ? { fileName: 'sample-transfer-slip.jpg', submittedAt: shiftDate(monthStart(today, -index), 2) + 'T03:00:00.000Z' } : undefined,
    };
  });
  lessons.push({ id: 'timmy-absence', studentId: 'timmy', date: shiftDate(today, -2), start: 840, end: 900, status: 'Student absent', unbilledSatang: 0 });
  lessons.push({ id: 'amy-cancelled', studentId: 'amy', date: shiftDate(today, -2), start: 990, end: 1020, status: 'Cancelled', unbilledSatang: 0 });
  lessons.sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
  return { lessons, invoices };
}
