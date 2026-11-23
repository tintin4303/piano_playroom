'use client';

import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { fullDate, dateObject, formatTime, weekStart, shiftDate } from '@/lib/teacher-schedule-mock';
import { useTeacherMock } from './TeacherMockProvider';
import './teacher-schedule.css';
import './teacher-overview.css';

export default function TeacherOverviewView({ teacherName, today }: { teacherName: string; today: string }) {
  const { lessons } = useTeacherMock();
  const monday = weekStart(today);
  const nextMonday = shiftDate(monday, 7);
  const week = lessons.filter((lesson) => lesson.date >= monday && lesson.date < nextMonday);
  const todaysLessons = week.filter((lesson) => lesson.date === today).sort((a, b) => a.start - b.start);
  const stats = [
    { label: "Today's lessons", value: todaysLessons.length },
    { label: 'Lessons this week', value: week.length },
    { label: 'Students this week', value: new Set(week.map((lesson) => lesson.student)).size },
  ];

  return (
    <section className="ts-schedule" aria-label="Teacher overview">
      <div className="ts-heading"><div><p className="ts-eyebrow">TEACHER PORTAL</p><h1>Overview</h1><p className="ts-intro">Welcome back, {teacherName.split(' ')[0]}.</p></div><Link className="teacher-overview-link" href="/teacher/schedule">View schedule</Link></div>
      <div className="teacher-overview-stats">{stats.map((stat) => <div key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></div>)}</div>
      <div className="ts-day-panel"><div className="ts-day-list-heading"><h2>Today’s lessons</h2><span>{fullDate.format(dateObject(today))}</span></div>
        {todaysLessons.length ? <div className="teacher-overview-lessons">{todaysLessons.map((lesson) => <Link href={`/teacher/schedule?date=${lesson.date}`} key={lesson.id}><span className="teacher-overview-time">{formatTime(lesson.start)} – {formatTime(lesson.end)}</span><div><strong>{lesson.student}</strong><span>{lesson.instrument} · {lesson.room}</span></div><span className="teacher-overview-status">{lesson.status}</span></Link>)}</div> : <div className="ts-empty"><CalendarDays size={24} /><strong>No lessons today</strong><p>Check your weekly schedule for upcoming lessons.</p></div>}
      </div>
      <div className="ts-footer"><span>Sample schedule</span></div>
    </section>
  );
}
