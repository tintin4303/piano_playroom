'use client';

import Link from 'next/link';
import { BookOpen, CalendarDays, Clock3, GraduationCap, MapPin, Receipt, UserRound } from 'lucide-react';
import { formatTHB } from '@/lib/currency';
import { parentStudents } from '@/lib/parent-portal-mock';
import { dateObject, formatTime, fullDate } from '@/lib/teacher-schedule-mock';
import { useParentMock } from './ParentMockProvider';
import { controlClass, displayDate, panelClass, ParentStatusBadge, primaryClass, StudentSelect } from './ParentPortalUI';

function ageOn(dateOfBirth: string, today: string) {
  return Number(today.slice(0, 4)) - Number(dateOfBirth.slice(0, 4)) - (today.slice(5) < dateOfBirth.slice(5) ? 1 : 0);
}

export default function StudentView() {
  const { studentId, lessons, today, currentMinute } = useParentMock();
  const student = parentStudents.find((child) => child.id === studentId) ?? parentStudents[0];
  const studentLessons = lessons.filter((lesson) => lesson.studentId === student.id);
  const nextLesson = studentLessons.find((lesson) => lesson.status === 'Confirmed' && (lesson.date > today || (lesson.date === today && lesson.start >= currentMinute)));
  const history = studentLessons.filter((lesson) => lesson.date < today || (lesson.date === today && lesson.end <= currentMinute))
    .sort((a, b) => b.date.localeCompare(a.date) || b.start - a.start).slice(0, 6);
  const fees = studentLessons.reduce((sum, lesson) => sum + lesson.unbilledSatang, 0);
  const unbilledCount = studentLessons.filter((lesson) => lesson.unbilledSatang > 0).length;

  return <section aria-label="Student information" className="space-y-5 text-brand-text-primary">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-black tracking-tight">Student</h1><p className="mt-1 text-sm text-brand-text-muted">Your child’s profile, lessons, and recent attendance.</p></div>
      <StudentSelect />
    </div>

    <div className="flex flex-wrap items-center gap-5 rounded-2xl bg-brand-primary p-6 text-white sm:p-8">
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl font-black" aria-hidden="true">{student.name[0]}</div>
      <div className="min-w-0 flex-1"><p className="text-sm text-brand-primary-light">Student profile</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">{student.fullName}</h2><p className="mt-2 text-sm text-brand-primary-light">{student.name} · {ageOn(student.dateOfBirth, today)} years old · {student.instrument}</p></div>
      <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">Enrolled student</span>
    </div>

    <p className="text-sm text-brand-text-muted">Sample student information · Profiles are read-only in this design preview.</p>

    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-5">
        <section className={panelClass} aria-labelledby="student-profile-heading">
          <h2 id="student-profile-heading" className="flex items-center gap-2 text-lg font-extrabold"><UserRound size={19} className="text-brand-primary" aria-hidden="true" />Personal information</h2>
          <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {[
              ['Full name', student.fullName], ['Nickname', student.name],
              ['Date of birth', displayDate(student.dateOfBirth)], ['Age', ageOn(student.dateOfBirth, today) + ' years old'],
              ['Enrolled since', displayDate(student.enrolledOn)], ['Student status', 'Enrolled'],
            ].map(([label, value]) => <div key={label}><dt className="text-xs font-bold text-brand-text-muted">{label}</dt><dd className="mt-1.5 text-sm font-semibold">{value}</dd></div>)}
          </dl>
        </section>

        <section className={panelClass} aria-labelledby="student-lessons-heading">
          <h2 id="student-lessons-heading" className="flex items-center gap-2 text-lg font-extrabold"><BookOpen size={19} className="text-brand-primary" aria-hidden="true" />Current lesson information</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              { icon: GraduationCap, label: 'Instrument', value: student.instrument },
              { icon: UserRound, label: 'Teacher', value: student.teacher },
              { icon: Clock3, label: 'Class type', value: student.duration + '-minute class' },
              { icon: MapPin, label: 'Studio', value: student.room },
            ].map(({ icon: Icon, label, value }) => <div key={label} className="flex items-center gap-3 rounded-xl bg-brand-canvas p-4"><Icon size={19} className="shrink-0 text-brand-primary" aria-hidden="true" /><div><p className="text-xs font-bold text-brand-text-muted">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div></div>)}
          </div>
        </section>

        <section className={panelClass} aria-labelledby="student-history-heading">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="student-history-heading" className="text-lg font-extrabold">Recent lesson history</h2><span className="text-xs text-brand-text-muted">Latest six lessons · Bangkok time</span></div>
          {history.length ? <ul className="mt-3 divide-y divide-brand-border">
            {history.map((lesson) => <li key={lesson.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div><p className="text-sm font-bold">{displayDate(lesson.date)}</p><p className="mt-1 text-sm text-brand-text-muted">{formatTime(lesson.start)}–{formatTime(lesson.end)} · {student.instrument}</p><p className="mt-1 text-xs text-brand-text-muted">{student.teacher}</p></div>
              <ParentStatusBadge status={lesson.status} />
            </li>)}
          </ul> : <p className="py-10 text-center text-sm text-brand-text-muted">No past lessons for {student.name} yet.</p>}
        </section>
      </div>

      <aside className="space-y-5" aria-label="Student schedule and fees">
        <section className={panelClass}>
          <h2 className="flex items-center gap-2 font-extrabold"><CalendarDays size={19} className="text-brand-primary" aria-hidden="true" />Next lesson</h2>
          {nextLesson ? <div className="mt-4 space-y-2"><p className="text-sm font-semibold">{fullDate.format(dateObject(nextLesson.date))}</p><p className="text-xl font-black">{formatTime(nextLesson.start)}–{formatTime(nextLesson.end)}</p><p className="text-sm text-brand-text-muted">{student.instrument} · {student.teacher}</p><p className="text-sm text-brand-text-muted">{student.room} · Bangkok time</p><ParentStatusBadge status={nextLesson.status} /></div> : <p className="mt-4 text-sm text-brand-text-muted">No upcoming lesson scheduled for {student.name}.</p>}
          <Link href="/parent/schedule" className={primaryClass + ' mt-5 w-full'}>View {student.name}’s schedule</Link>
        </section>

        <section className={panelClass}>
          <h2 className="flex items-center gap-2 font-extrabold"><Receipt size={19} className="text-brand-primary" aria-hidden="true" />Fees awaiting billing</h2>
          <p className="mt-4 text-2xl font-black">{formatTHB(fees)}</p>
          <p className="mt-2 text-sm text-brand-text-muted">{unbilledCount} attended {unbilledCount === 1 ? 'lesson' : 'lessons'} for {student.name}, not yet included in an invoice.</p>
          <Link href="/parent/billing" className={controlClass + ' mt-5 w-full'}>View household billing</Link>
        </section>
      </aside>
    </div>
  </section>;
}
