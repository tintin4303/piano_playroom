'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronLeft, ChevronRight, Receipt, X } from 'lucide-react';
import { formatTHB } from '@/lib/currency';
import { parentStudents, type ParentLesson } from '@/lib/parent-portal-mock';
import { dateObject, formatTime, fullDate, isValidDate, shiftDate, weekStart } from '@/lib/teacher-schedule-mock';
import { useParentMock } from './ParentMockProvider';
import { ParentStatusBadge, StudentSelect } from './ParentPortalUI';

const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' });
const month = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const panel = 'rounded-2xl border border-brand-border bg-brand-surface p-5';
const control = 'inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-border px-3 text-sm font-semibold text-brand-text-primary hover:bg-brand-canvas';

function lessonTime(lesson: ParentLesson) {
  return formatTime(lesson.start) + '–' + formatTime(lesson.end);
}

export default function ParentScheduleView({ parentName }: {
  parentName: string;
}) {
  const { studentId, today, currentMinute, lessons: familyLessons, invoices } = useParentMock();
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedLesson, setSelectedLesson] = useState<ParentLesson | null>(null);
  const lessonDialog = useRef<HTMLDialogElement>(null);
  const dateDialog = useRef<HTMLDialogElement>(null);
  const dateInput = useRef<HTMLInputElement>(null);
  const student = parentStudents.find((child) => child.id === studentId) ?? parentStudents[0];
  const lessons = familyLessons.filter((lesson) => lesson.studentId === student.id);
  const latestInvoice = invoices[0];
  const monday = weekStart(selectedDate);
  const sunday = shiftDate(monday, 6);
  const currentWeek = monday === weekStart(today);
  const upcoming = lessons.filter((lesson) => lesson.status === 'Confirmed' && (
    lesson.date > today || (lesson.date === today && lesson.end > currentMinute)
  ));
  const nextLesson = upcoming.find((lesson) => lesson.date > today || lesson.start >= currentMinute);
  const todayLesson = lessons.find((lesson) => lesson.date === today);
  const weekLessons = (currentWeek ? upcoming : lessons)
    .filter((lesson) => lesson.date >= monday && lesson.date <= sunday);
  const attended = lessons.filter((lesson) => lesson.status === 'Attended' && lesson.unbilledSatang > 0);
  const fees = attended.reduce((total, lesson) => total + lesson.unbilledSatang, 0);

  function moveWeek(offset: number) {
    const date = shiftDate(selectedDate, offset);
    if (isValidDate(date)) setSelectedDate(date);
  }

  function openLesson(lesson: ParentLesson) {
    setSelectedLesson(lesson);
    lessonDialog.current?.showModal();
  }

  return (
    <section aria-label="Parent schedule" className="space-y-5 text-brand-text-primary">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Schedule</h1>
          <p className="mt-1 text-sm text-brand-text-muted">Sample family schedule</p>
        </div>
        <StudentSelect />
      </div>

      <div className="rounded-2xl bg-brand-primary p-6 text-white sm:p-8">
        <p className="text-sm text-brand-primary-light">Hello, {parentName.trim().split(/\s+/)[0] || 'Parent'}</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{student.name}’s class schedule</h2>
        {nextLesson ? (
          <>
            <p className="mt-3 text-sm">Next lesson · {fullDate.format(dateObject(nextLesson.date))} · {lessonTime(nextLesson)}</p>
            <p className="mt-1 text-sm text-brand-primary-light">{student.instrument} · {student.teacher}</p>
          </>
        ) : <p className="mt-3 text-sm">No upcoming lessons scheduled.</p>}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className={panel} aria-labelledby="parent-week-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="parent-week-title" className="text-lg font-extrabold">{currentWeek ? 'Upcoming lessons' : 'Lessons this week'}</h2>
            <span className="text-xs text-brand-text-muted">Bangkok time · UTC+7</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-brand-border pb-4">
            <button type="button" className={control} onClick={() => setSelectedDate(today)}>Today</button>
            <button type="button" className={control} aria-label="Previous week" onClick={() => moveWeek(-7)}><ChevronLeft size={16} /></button>
            <button type="button" className={control} aria-label="Next week" onClick={() => moveWeek(7)}><ChevronRight size={16} /></button>
            <button type="button" className={control + ' gap-2'} onClick={() => {
              if (dateInput.current) dateInput.current.value = selectedDate;
              dateDialog.current?.showModal();
            }}>
              <CalendarDays size={16} className="text-brand-primary" aria-hidden="true" />
              {shortDate.formatRange(dateObject(monday), dateObject(sunday))}
              <span className="sr-only">, choose date</span>
            </button>
          </div>
          {weekLessons.length ? (
            <ul className="mt-4 space-y-3">
              {weekLessons.map((lesson) => (
                <li key={lesson.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-border p-3 sm:gap-4">
                  <div className="grid w-16 shrink-0 place-items-center rounded-xl bg-brand-primary-light py-2 text-brand-primary" aria-hidden="true">
                    <span className="text-[11px] font-bold uppercase">{weekday.format(dateObject(lesson.date))}</span>
                    <strong className="text-xl">{dateObject(lesson.date).getUTCDate()}</strong>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-brand-text-muted">{shortDate.format(dateObject(lesson.date))}</p>
                    <p className="font-extrabold">{lessonTime(lesson)}</p>
                    <p className="text-sm text-brand-text-muted">{student.instrument} · {student.teacher}</p>
                    <div className="mt-1"><ParentStatusBadge status={lesson.status} /></div>
                  </div>
                  <button type="button" className={control} onClick={() => openLesson(lesson)}>View details</button>
                </li>
              ))}
            </ul>
          ) : <p className="py-8 text-center text-sm text-brand-text-muted">No {currentWeek ? 'upcoming ' : ''}lessons for {student.name} this week.</p>}
        </section>

        <aside className="space-y-4" aria-label="Lesson and billing summaries">
          <section className={panel}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-extrabold">Today</h2>
              <span className="text-xs text-brand-text-muted">{shortDate.format(dateObject(today))}</span>
            </div>
            {todayLesson ? <div className="mt-3">
              <p className="font-bold">{lessonTime(todayLesson)} · {student.instrument}</p>
              <p className="mt-1 text-sm text-brand-text-muted">{student.teacher}</p>
              <button type="button" className="mt-2 text-sm font-bold text-brand-primary hover:underline" onClick={() => openLesson(todayLesson)}>View today’s lesson</button>
            </div> : <p className="mt-3 text-sm text-brand-text-muted">No lesson today for {student.name}.</p>}
          </section>
          <section className={panel}>
            <h2 className="font-extrabold">{student.name}’s fees so far</h2>
            <p className="mt-3 text-2xl font-black">{formatTHB(fees)}</p>
            <p className="mt-1 text-sm text-brand-text-muted">{attended.length} attended {attended.length === 1 ? 'lesson' : 'lessons'} awaiting billing</p>
          </section>
          <section className={panel}>
            <h2 className="flex items-center gap-2 font-extrabold"><Receipt size={18} aria-hidden="true" className="text-brand-primary" /> Latest household invoice</h2>
            <p className="mt-2 text-sm text-brand-text-muted">{month.format(dateObject(latestInvoice.periodDate))} · Covers the family</p>
            <p className="my-2 text-lg font-extrabold">{formatTHB(latestInvoice.totalSatang)}</p>
            <ParentStatusBadge status={latestInvoice.status} />
            <Link href="/parent/billing" className="mt-3 block text-sm font-bold text-brand-primary hover:underline">View billing & payments</Link>
          </section>
        </aside>
      </div>

      <dialog ref={dateDialog} aria-labelledby="parent-date-title" className="m-auto w-[calc(100%_-_2rem)] max-w-sm rounded-2xl border border-brand-border bg-brand-surface p-5 text-brand-text-primary shadow-xl backdrop:bg-slate-900/50">
        <form onSubmit={(event) => {
          event.preventDefault();
          const date = dateInput.current?.value;
          if (date && isValidDate(date)) {
            setSelectedDate(date);
            dateDialog.current?.close();
          }
        }}>
          <div className="flex items-center justify-between gap-3">
            <h2 id="parent-date-title" className="text-lg font-extrabold">Choose a date</h2>
            <button type="button" className={control} aria-label="Close date picker" onClick={() => dateDialog.current?.close()}><X size={18} /></button>
          </div>
          <label className="my-4 grid gap-2 text-sm font-semibold">
            Date
            <input ref={dateInput} type="date" required min="1900-01-01" max="9998-12-31" className="min-h-10 w-full rounded-xl border border-brand-border px-3" />
          </label>
          <button type="submit" className="rounded-full bg-brand-yellow px-4 py-2 text-sm font-bold hover:bg-brand-yellow-hover">Go to week</button>
        </form>
      </dialog>

      <dialog ref={lessonDialog} aria-labelledby="parent-lesson-title" className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-2xl border border-brand-border bg-brand-surface p-5 text-brand-text-primary shadow-xl backdrop:bg-slate-900/50">
        <div className="flex items-center justify-between gap-3">
          <h2 id="parent-lesson-title" className="text-lg font-extrabold">Lesson details</h2>
          <button type="button" className={control} aria-label="Close lesson details" onClick={() => lessonDialog.current?.close()}><X size={18} /></button>
        </div>
        {selectedLesson && (
          <dl className="mt-4 divide-y divide-brand-border text-sm">
            {[
              ['Student', student.name],
              ['Date', fullDate.format(dateObject(selectedLesson.date))],
              ['Time', lessonTime(selectedLesson)],
              ['Instrument', student.instrument],
              ['Teacher', student.teacher],
              ['Studio', student.room],
              ['Class type', student.duration + ' min'],
              ['Status', selectedLesson.status],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-2.5">
                <dt className="text-brand-text-muted">{label}</dt>
                <dd className="text-right font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </dialog>
    </section>
  );
}
