'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Search, X } from 'lucide-react';
import { dateObject, formatTime, fullDate, lessonHasEnded, shiftDate } from '@/lib/teacher-schedule-mock';
import { useTeacherMock } from './TeacherMockProvider';
import LessonStatusBadge from './LessonStatusBadge';
import './teacher-schedule.css';
import './teacher-records.css';

export default function ClassHistoryView({ initialStudentId = '' }: { initialStudentId?: string }) {
  const { lessons, students, today, currentMinute, markAbsent, restoreAttendance } = useTeacherMock();
  const [query, setQuery] = useState('');
  const [studentId, setStudentId] = useState(initialStudentId);
  const [fromDate, setFromDate] = useState(shiftDate(today, -30));
  const [toDate, setToDate] = useState(today);
  const [status, setStatus] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmAbsent, setConfirmAbsent] = useState(false);
  const [lastChangedId, setLastChangedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const lastButton = useRef<HTMLButtonElement | null>(null);
  const selected = lessons.find((lesson) => lesson.id === selectedId);
  const invalidRange = Boolean(fromDate && toDate && fromDate > toDate);
  const history = lessons.filter((lesson) => lessonHasEnded(lesson, today, currentMinute));
  const filtered = history.filter((lesson) => !invalidRange && (!studentId || lesson.studentId === studentId)
    && lesson.student.toLowerCase().includes(query.trim().toLowerCase())
    && (!fromDate || lesson.date >= fromDate) && (!toDate || lesson.date <= toDate)
    && (status === 'All' || lesson.status === status))
    .sort((a, b) => b.date.localeCompare(a.date) || b.start - a.start);
  const lastChanged = lessons.find((lesson) => lesson.id === lastChangedId && lesson.status === 'Student absent');

  useEffect(() => {
    if (selectedId) dialog.current?.showModal();
  }, [selectedId]);

  function clearFilters() {
    setQuery('');
    setStudentId('');
    setFromDate('');
    setToDate(today);
    setStatus('All');
  }

  return (
    <section className="ts-schedule" aria-label="Class history">
      <div className="ts-heading"><div><p className="ts-eyebrow">TEACHER PORTAL</p><h1>Class History</h1><p className="ts-intro">Review previous lessons and correct student attendance.</p></div></div>
      <div className="teacher-record-filters">
        <label className="ts-search"><Search size={17} /><input type="search" aria-label="Search class history" placeholder="Search student name…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label>Student<select value={studentId} onChange={(event) => setStudentId(event.target.value)}><option value="">All students</option>{students.map((student) => <option key={student.id} value={student.id}>{student.fullName}</option>)}</select></label>
        <label>From<input type="date" value={fromDate} max={today} onInput={(event) => setFromDate(event.currentTarget.value)} aria-invalid={invalidRange} aria-describedby={invalidRange ? "history-date-error" : undefined} /></label>
        <label>To<input type="date" value={toDate} max={today} onInput={(event) => setToDate(event.currentTarget.value)} aria-invalid={invalidRange} aria-describedby={invalidRange ? "history-date-error" : undefined} /></label>
        <label>Attendance<select value={status} onChange={(event) => setStatus(event.target.value)}>{['All', 'Attended', 'Student absent', 'Cancelled', 'Teacher absent'].map((item) => <option key={item} value={item}>{item === 'All' ? 'All statuses' : item}</option>)}</select></label>
        <button type="button" className="teacher-text-button" onClick={clearFilters}>Clear filters</button>
        {invalidRange && <p id="history-date-error" className="teacher-filter-error" role="alert">Choose an end date on or after the start date.</p>}
      </div>
      {message && <div className="teacher-feedback" role="status"><span>{message}</span>{lastChanged && <button type="button" onClick={() => { restoreAttendance(lastChanged.id); setMessage(`Attendance restored for ${lastChanged.student}.`); setLastChangedId(null); }}>Undo</button>}</div>}
      <div className="teacher-record-panel">
        <div className="teacher-record-summary" role="status"><strong>{filtered.length} {filtered.length === 1 ? 'lesson' : 'lessons'}</strong><span>Newest first · Bangkok time</span></div>
        {filtered.length ? <table className="teacher-history-table"><thead><tr><th>Date & time</th><th>Student</th><th>Instrument</th><th>Class type</th><th>Attendance</th><th><span className="teacher-sr-only">Details</span></th></tr></thead><tbody>{filtered.map((lesson) => <tr key={lesson.id}>
          <td data-label="Date & time"><strong>{fullDate.format(dateObject(lesson.date))}</strong><span>{formatTime(lesson.start)} – {formatTime(lesson.end)}</span></td>
          <td data-label="Student">{lesson.student}</td><td data-label="Instrument">{lesson.instrument}</td><td data-label="Class type">{lesson.end - lesson.start} min</td>
          <td data-label="Attendance"><LessonStatusBadge status={lesson.status} /></td>
          <td><button type="button" className="teacher-text-button" aria-label={`View lesson for ${lesson.student} on ${lesson.date}`} onClick={(event) => { lastButton.current = event.currentTarget; setConfirmAbsent(false); setSelectedId(lesson.id); }}>View details</button></td>
        </tr>)}</tbody></table> : <div className="ts-empty"><CalendarDays size={26} /><strong>{history.length ? 'No lessons match your filters' : 'No previous lessons yet'}</strong><p>{history.length ? 'Try another student, attendance status, or date range.' : 'Finished lessons will appear here.'}</p></div>}
      </div>
      <div className="ts-footer"><span>Sample data · Attendance changes reset on reload</span></div>
      <dialog ref={dialog} className="ts-dialog" aria-labelledby="history-lesson-title" onClose={() => { setSelectedId(null); setConfirmAbsent(false); lastButton.current?.focus(); }}>
        {selected && <>
          <div className="ts-dialog-heading"><span className="ts-eyebrow">{confirmAbsent ? 'CONFIRM ATTENDANCE' : 'LESSON DETAILS'}</span><button type="button" aria-label="Close lesson details" onClick={() => dialog.current?.close()}><X size={20} /></button></div>
          <h2 id="history-lesson-title">{selected.student}</h2><p className="ts-detail-date">{fullDate.format(dateObject(selected.date))}</p>
          {confirmAbsent ? <div className="teacher-confirm"><p>Mark this student absent for the {formatTime(selected.start)} – {formatTime(selected.end)} lesson?</p><p>You can restore attendance afterward.</p><div className="teacher-dialog-actions"><button type="button" className="teacher-secondary" onClick={() => setConfirmAbsent(false)}>Keep attended</button><button type="button" className="teacher-danger" onClick={() => { markAbsent(selected.id); setConfirmAbsent(false); setLastChangedId(selected.id); setMessage(`${selected.student} marked student absent.`); }}>Confirm absent</button></div></div> : <>
            <dl className="ts-details"><div><dt>Time</dt><dd>{formatTime(selected.start)} – {formatTime(selected.end)}</dd></div><div><dt>Instrument</dt><dd>{selected.instrument}</dd></div><div><dt>Class type</dt><dd>{selected.end - selected.start} min</dd></div><div><dt>Location</dt><dd>{selected.room}</dd></div><div><dt>Attendance</dt><dd><LessonStatusBadge status={selected.status} /></dd></div></dl>
            {selected.status === 'Attended' && <button type="button" className="teacher-danger teacher-full-width" onClick={() => setConfirmAbsent(true)}>Mark student absent</button>}
            {selected.status === 'Student absent' && <button type="button" className="ts-primary teacher-full-width" onClick={() => { restoreAttendance(selected.id); setLastChangedId(null); setMessage(`Attendance restored for ${selected.student}.`); }}>Restore attended</button>}
            {['Cancelled', 'Teacher absent'].includes(selected.status) && <p className="teacher-readonly-note">This lesson’s {selected.status.toLowerCase()} status is managed by the school.</p>}
            <button type="button" className="teacher-text-button ts-close-details" onClick={() => dialog.current?.close()}>Close details</button>
          </>}
        </>}
      </dialog>
    </section>
  );
}
