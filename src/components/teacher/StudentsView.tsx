'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Search, UsersRound, X } from 'lucide-react';
import { dateObject, formatTime, fullDate, lessonHasEnded, type TeacherLesson } from '@/lib/teacher-schedule-mock';
import { useTeacherMock } from './TeacherMockProvider';
import LessonStatusBadge from './LessonStatusBadge';
import './teacher-schedule.css';
import './teacher-records.css';

export default function StudentsView() {
  const { lessons, students, today, currentMinute } = useTeacherMock();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const lastButton = useRef<HTMLButtonElement | null>(null);
  const selected = students.find((student) => student.id === selectedId);
  const filtered = students.filter((student) => `${student.fullName} ${student.nickname}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  function upcoming(studentId: string) {
    return lessons.filter((lesson) => lesson.studentId === studentId && lesson.status === 'Scheduled'
      && (lesson.date > today || (lesson.date === today && lesson.start >= currentMinute)))
      .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
  }

  const nextLessons = selected ? upcoming(selected.id) : [];
  const recentLessons = selected ? lessons.filter((lesson) => lesson.studentId === selected.id && lessonHasEnded(lesson, today, currentMinute))
    .sort((a, b) => b.date.localeCompare(a.date) || b.start - a.start).slice(0, 3) : [];

  useEffect(() => {
    if (selectedId) dialog.current?.showModal();
  }, [selectedId]);

  function lessonSummary(lesson: TeacherLesson) {
    return <li key={lesson.id}><div><strong>{fullDate.format(dateObject(lesson.date))}</strong><span>{formatTime(lesson.start)} – {formatTime(lesson.end)} · {lesson.end - lesson.start} min</span></div><LessonStatusBadge status={lesson.status} /></li>;
  }

  return (
    <section className="ts-schedule" aria-label="My students">
      <div className="ts-heading"><div><p className="ts-eyebrow">TEACHER PORTAL</p><h1>My Students</h1><p className="ts-intro">Your students, upcoming lessons, and recent class history.</p></div></div>
      <div className="teacher-record-filters teacher-student-toolbar"><label className="ts-search"><Search size={17} /><input type="search" aria-label="Search my students" placeholder="Search name or nickname…" value={query} onChange={(event) => setQuery(event.target.value)} /></label><span role="status">{filtered.length} {filtered.length === 1 ? 'student' : 'students'}</span></div>
      <div className="teacher-student-grid">{filtered.map((student) => {
        const next = upcoming(student.id)[0];
        return <article className="teacher-student-card" key={student.id}><div className="teacher-student-heading"><span className="teacher-student-initials" aria-hidden="true">{student.fullName.split(' ').map((part) => part[0]).join('')}</span><div><h2>{student.fullName}</h2><p>{student.nickname}</p></div></div><dl><div><dt>Instrument</dt><dd>{student.instrument}</dd></div><div><dt>Class type</dt><dd>{student.classTypes.map((type) => `${type} min`).join(' / ')}</dd></div></dl><div className="teacher-next-lesson"><span><CalendarDays size={15} />Next lesson</span>{next ? <><strong>{fullDate.format(dateObject(next.date))}</strong><p>{formatTime(next.start)} – {formatTime(next.end)}</p></> : <p>No upcoming lesson scheduled</p>}</div><button type="button" className="teacher-secondary teacher-full-width" aria-label={`View student ${student.fullName}`} onClick={(event) => { lastButton.current = event.currentTarget; setSelectedId(student.id); }}>View student</button></article>;
      })}</div>
      {filtered.length === 0 && <div className="teacher-record-panel ts-empty"><UsersRound size={26} /><strong>{students.length ? 'No students match your search' : 'No assigned students yet'}</strong><p>{students.length ? 'Try a full name or nickname.' : 'Students will appear after the school assigns your lessons.'}</p></div>}
      <div className="ts-footer"><span>Sample student profiles</span></div>
      <dialog ref={dialog} className="ts-dialog teacher-student-dialog" aria-labelledby="teacher-student-title" onClose={() => { setSelectedId(null); lastButton.current?.focus(); }}>
        {selected && <>
          <div className="ts-dialog-heading"><span className="ts-eyebrow">STUDENT PROFILE</span><button type="button" aria-label="Close student profile" onClick={() => dialog.current?.close()}><X size={20} /></button></div>
          <h2 id="teacher-student-title">{selected.fullName}</h2><p className="ts-detail-date">{selected.nickname} · {selected.instrument} · {selected.classTypes.map((type) => `${type} min`).join(' / ')}</p>
          <div className="teacher-profile-section"><h3>Upcoming lessons</h3>{nextLessons.length ? <ul className="teacher-profile-lessons">{nextLessons.slice(0, 3).map(lessonSummary)}</ul> : <p>No upcoming lessons scheduled.</p>}</div>
          <div className="teacher-profile-section"><h3>Recent class history</h3>{recentLessons.length ? <ul className="teacher-profile-lessons">{recentLessons.map(lessonSummary)}</ul> : <p>No previous lessons yet.</p>}</div>
          <div className="teacher-dialog-actions"><Link className="teacher-secondary" href={`/teacher/history?student=${selected.id}`}>View class history</Link><Link className="ts-primary" href={`/teacher/schedule?student=${selected.id}&date=${nextLessons[0]?.date || today}`}>View schedule</Link></div>
        </>}
      </dialog>
    </section>
  );
}
