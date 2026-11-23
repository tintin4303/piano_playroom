'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, List, Search, X, Clock3, MapPin, Music2, UserRound } from 'lucide-react';
import {
  bangkokToday, dateObject, formatTime, fullDate, isValidDate, shiftDate, weekStart,
  type TeacherLesson,
} from '@/lib/teacher-schedule-mock';
import { useTeacherMock } from './TeacherMockProvider';
import './teacher-schedule.css';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 9);
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const rangeFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

interface TeacherScheduleViewProps {
  initialDate: string;
  teacherName: string;
  initialStudentId?: string;
}

export default function TeacherScheduleView({ initialDate, teacherName, initialStudentId = '' }: TeacherScheduleViewProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const { lessons } = useTeacherMock();
  const [view, setView] = useState<'week' | 'day'>('week');
  const [search, setSearch] = useState('');
  const [studentId, setStudentId] = useState(initialStudentId);
  const [selectedLesson, setSelectedLesson] = useState<TeacherLesson | null>(null);
  const dateDialog = useRef<HTMLDialogElement>(null);
  const lessonDialog = useRef<HTMLDialogElement>(null);
  const dateInput = useRef<HTMLInputElement>(null);
  const calendar = useRef<HTMLDivElement>(null);
  const lastLessonButton = useRef<HTMLButtonElement | null>(null);
  const monday = weekStart(selectedDate);
  const dates = DAY_NAMES.map((_, index) => shiftDate(monday, index));
  const today = bangkokToday();
  const weekLessons = lessons.filter((lesson) => dates.includes(lesson.date));
  const filtered = weekLessons.filter((lesson) => (!studentId || lesson.studentId === studentId) && `${lesson.student} ${lesson.instrument}`.toLowerCase().includes(search.trim().toLowerCase()));
  const dayLessons = filtered.filter((lesson) => lesson.date === selectedDate).sort((a, b) => a.start - b.start);

  useEffect(() => {
    function onPopState() {
      const date = new URLSearchParams(window.location.search).get('date') || bangkokToday();
      setSelectedDate(isValidDate(date) ? date : bangkokToday());
      setStudentId(new URLSearchParams(window.location.search).get('student') || '');
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (selectedLesson) lessonDialog.current?.showModal();
  }, [selectedLesson]);

  function navigate(date: string) {
    if (!isValidDate(date)) return;
    const url = new URL(window.location.href);
    url.searchParams.set('date', date);
    window.history.pushState(null, '', url);
    setSelectedDate(date);
    if (calendar.current) calendar.current.scrollTop = 0;
  }

  function openLesson(lesson: TeacherLesson, button: HTMLButtonElement) {
    lastLessonButton.current = button;
    setSelectedLesson(lesson);
  }

  function lessonCard(lesson: TeacherLesson, compact = false) {
    return (
      <button type="button" key={lesson.id} className={`ts-lesson ts-status-${lesson.status.toLowerCase().replaceAll(' ', '-')} ${compact ? 'ts-lesson-compact' : ''}`}
        style={compact ? { top: (lesson.start / 60 - 9) * 144 + 3, height: (lesson.end - lesson.start) / 60 * 144 - 6 } : undefined}
        aria-label={`${lesson.student}, ${lesson.instrument}, ${formatTime(lesson.start)} to ${formatTime(lesson.end)}, ${lesson.status}`}
        onClick={(event) => openLesson(lesson, event.currentTarget)}>
        <span className="ts-lesson-time">{formatTime(lesson.start)} – {formatTime(lesson.end)}</span>
        <strong>{lesson.student}</strong>
        <span className="ts-lesson-instrument">{lesson.instrument} · {lesson.room}</span>
        <span className="ts-lesson-status">{lesson.status}</span>
      </button>
    );
  }

  return (
    <section className="ts-schedule" aria-label="Teacher schedule">
      <div className="ts-heading">
        <div><p className="ts-eyebrow">TEACHER PORTAL</p><h1>My Schedule</h1><p className="ts-intro">Your lessons for the week, {teacherName.split(' ')[0]}.</p></div>
        <div className="ts-view-switch" aria-label="Calendar view">
          <button type="button" aria-pressed={view === 'week'} onClick={() => setView('week')}><CalendarDays size={16} />Week Grid</button>
          <button type="button" aria-pressed={view === 'day'} onClick={() => setView('day')}><List size={16} />Day List</button>
        </div>
      </div>
      <div className="ts-toolbar-panel">
        <div className="ts-toolbar">
          <div className="ts-date-controls">
            <button type="button" className="ts-today" onClick={() => navigate(today)}>Today</button>
            <div className="ts-arrows">
              <button type="button" aria-label="Previous week" onClick={() => navigate(shiftDate(selectedDate, -7))}><ChevronLeft size={18} /></button>
              <button type="button" aria-label="Next week" onClick={() => navigate(shiftDate(selectedDate, 7))}><ChevronRight size={18} /></button>
            </div>
            <button type="button" className="ts-date-range" aria-label="Choose date" onClick={() => { if (dateInput.current) dateInput.current.value = selectedDate; dateDialog.current?.showModal(); }}>
              <CalendarDays size={16} />{rangeFormatter.formatRange(dateObject(monday), dateObject(dates[6]))}
            </button>
          </div>
          <label className="ts-search"><Search size={17} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search students" placeholder="Search students…" /></label>
        </div>
        <div className="ts-toolbar-bottom"><span>{weekLessons.length} lessons this week</span><span>Bangkok time · UTC+7</span></div>
      </div>
      {studentId && <div className="ts-student-filter" role="status"><span>Showing {lessons.find((lesson) => lesson.studentId === studentId)?.student || 'selected student'}</span><button type="button" onClick={() => { const url = new URL(window.location.href); url.searchParams.delete('student'); window.history.pushState(null, '', url); setStudentId(''); }}>Show all students</button></div>}
      {view === 'week' ? (
        <div className="ts-calendar-panel">
          <p className="ts-scroll-hint">Scroll sideways to see all seven days.</p>
          <div className="ts-calendar-scroll" ref={calendar} role="region" aria-label="Weekly lesson calendar" tabIndex={0}>
            <div className="ts-calendar-header ts-calendar-grid">
              <div className="ts-time-heading">TIME</div>
              {dates.map((date, index) => <button type="button" key={date} className={`ts-day-header ${date === today ? 'ts-is-today' : ''} ${date === selectedDate ? 'ts-is-selected' : ''}`}
                aria-label={`Show ${fullDate.format(dateObject(date))} in day list`} aria-current={date === today ? 'date' : undefined}
                onClick={() => { navigate(date); setView('day'); }}>
                <span>{DAY_NAMES[index]}</span><strong>{Number(date.slice(-2))}</strong>
              </button>)}
            </div>
            <div className="ts-calendar-grid ts-calendar-body">
              <div className="ts-time-axis" aria-hidden="true">{HOURS.map((hour) => <div key={hour}>{formatTime(hour * 60)}</div>)}</div>
              {dates.map((date, index) => <div key={date} className={`ts-day-column ${index > 4 ? 'ts-weekend' : ''} ${date === today ? 'ts-today-column' : ''}`} aria-label={fullDate.format(dateObject(date))}>
                {HOURS.map((hour) => <div className="ts-hour" key={hour} />)}
                {filtered.filter((lesson) => lesson.date === date).map((lesson) => lessonCard(lesson, true))}
              </div>)}
            </div>
          </div>
          {filtered.length === 0 && <div className="ts-empty" role="status"><CalendarDays size={24} /><strong>{weekLessons.length ? 'No matching lessons' : 'No lessons this week'}</strong><p>{weekLessons.length ? 'Try another student name or clear your search.' : 'Use the arrows or date picker to explore another week.'}</p></div>}
        </div>
      ) : (
        <div className="ts-day-panel">
          <div className="ts-day-tabs" aria-label="Choose day">{dates.map((date, index) => <button type="button" key={date} aria-pressed={selectedDate === date} aria-current={date === today ? 'date' : undefined} onClick={() => navigate(date)}><span>{DAY_NAMES[index]}</span><strong>{Number(date.slice(-2))}</strong></button>)}</div>
          <div className="ts-day-list-heading"><h2>{fullDate.format(dateObject(selectedDate))}</h2><span>{dayLessons.length} lessons</span></div>
          <div className="ts-day-lessons">{dayLessons.map((lesson) => lessonCard(lesson))}</div>
          {dayLessons.length === 0 && <div className="ts-empty" role="status"><CalendarDays size={24} /><strong>{search.trim() ? 'No matching lessons on this day' : 'No lessons on this day'}</strong><p>Select another day to see your schedule.</p></div>}
        </div>
      )}
      <div className="ts-footer"><span>Sample schedule</span><span>Select a lesson to view its details</span></div>
      <dialog ref={dateDialog} className="ts-dialog" aria-labelledby="ts-date-title">
        <form onSubmit={(event) => { event.preventDefault(); const date = dateInput.current?.value || ''; if (isValidDate(date)) { navigate(date); dateDialog.current?.close(); } }}>
          <div className="ts-dialog-heading"><h2 id="ts-date-title">Choose a date</h2><button type="button" aria-label="Close date picker" onClick={() => dateDialog.current?.close()}><X size={20} /></button></div>
          <label className="ts-date-label">Date<input ref={dateInput} type="date" required min="1900-01-01" max="9998-12-31" /></label>
          <button type="submit" className="ts-primary">Go to week</button>
        </form>
      </dialog>
      <dialog ref={lessonDialog} className="ts-dialog" aria-labelledby="ts-lesson-title" onClose={() => { setSelectedLesson(null); lastLessonButton.current?.focus(); }}>
        {selectedLesson && <>
          <div className="ts-dialog-heading"><span className="ts-eyebrow">LESSON DETAILS</span><button type="button" aria-label="Close lesson details" onClick={() => lessonDialog.current?.close()}><X size={20} /></button></div>
          <h2 id="ts-lesson-title">{selectedLesson.student}</h2>
          <p className="ts-detail-date">{fullDate.format(dateObject(selectedLesson.date))}</p>
          <dl className="ts-details">
            <div><dt><Clock3 size={17} />Time</dt><dd>{formatTime(selectedLesson.start)} – {formatTime(selectedLesson.end)}</dd></div>
            <div><dt><Music2 size={17} />Instrument</dt><dd>{selectedLesson.instrument}</dd></div>
            <div><dt>Class type</dt><dd>{selectedLesson.end - selectedLesson.start} min</dd></div>
            <div><dt><UserRound size={17} />Teacher</dt><dd>{teacherName}</dd></div>
            <div><dt><MapPin size={17} />Location</dt><dd>{selectedLesson.room}</dd></div>
            <div><dt>Status</dt><dd>{selectedLesson.status}</dd></div>
          </dl>
          <button type="button" className="ts-primary ts-close-details" onClick={() => lessonDialog.current?.close()}>Close details</button>
        </>}
      </dialog>
    </section>
  );
}
