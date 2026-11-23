export type LessonStatus = 'Scheduled' | 'Attended' | 'Student absent' | 'Cancelled' | 'Teacher absent';

export interface TeacherLesson {
  id: string;
  date: string;
  student: string;
  studentId: string;
  instrument: string;
  start: number;
  end: number;
  status: LessonStatus;
  room: string;
}

export interface TeacherStudent {
  id: string;
  fullName: string;
  nickname: string;
  instrument: string;
  classTypes: (30 | 60)[];
}

export const MOCK_STUDENTS: TeacherStudent[] = [
  { id: 'milo', fullName: 'Milo Chen', nickname: 'Milo', instrument: 'Piano', classTypes: [60] },
  { id: 'hana', fullName: 'Hana Park', nickname: 'Hana', instrument: 'Piano', classTypes: [30, 60] },
  { id: 'theo', fullName: 'Theo Tan', nickname: 'Theo', instrument: 'Piano', classTypes: [60] },
  { id: 'nora', fullName: 'Nora Lee', nickname: 'Nora', instrument: 'Piano', classTypes: [60] },
  { id: 'june', fullName: 'June Lim', nickname: 'June', instrument: 'Piano', classTypes: [60] },
  { id: 'kai', fullName: 'Kai Wong', nickname: 'Kai', instrument: 'Piano', classTypes: [60] },
  { id: 'ivy', fullName: 'Ivy Lin', nickname: 'Ivy', instrument: 'Piano', classTypes: [30] },
  { id: 'sam', fullName: 'Sam Arun', nickname: 'Sam', instrument: 'Piano', classTypes: [60] },
  { id: 'elle', fullName: 'Elle Sen', nickname: 'Elle', instrument: 'Piano', classTypes: [60] },
  { id: 'ari', fullName: 'Ari Chen', nickname: 'Ari', instrument: 'Piano', classTypes: [60] },
  { id: 'rowan', fullName: 'Rowan Tan', nickname: 'Rowan', instrument: 'Piano', classTypes: [60] },
  { id: 'lily', fullName: 'Lily Xu', nickname: 'Lily', instrument: 'Piano', classTypes: [30] },
];

export function bangkokMinute() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  return Number(parts.find((part) => part.type === 'hour')?.value) * 60
    + Number(parts.find((part) => part.type === 'minute')?.value);
}

export function lessonHasEnded(lesson: TeacherLesson, today: string, minute: number) {
  return lesson.date < today || (lesson.date === today && lesson.end <= minute);
}

export function bangkokToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
}

export function dateObject(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

export function isValidDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= '1900-01-01' && date <= '9998-12-31'
    && !Number.isNaN(dateObject(date).getTime()) && dateObject(date).toISOString().slice(0, 10) === date;
}

export function shiftDate(date: string, days: number) {
  const result = dateObject(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function weekStart(date: string) {
  return shiftDate(date, -((dateObject(date).getUTCDay() + 6) % 7));
}

export function formatTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export const fullDate = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
});

export function createMockLessons(anchor: string): TeacherLesson[] {
  const monday = weekStart(anchor);
  const fixtures: Omit<TeacherLesson, 'id' | 'date' | 'studentId'>[] = [
    { student: 'Milo Chen', instrument: 'Piano', start: 570, end: 630, status: 'Attended', room: 'Studio 1' },
    { student: 'Hana Park', instrument: 'Piano', start: 840, end: 870, status: 'Scheduled', room: 'Studio 2' },
    { student: 'Theo Tan', instrument: 'Piano', start: 660, end: 720, status: 'Scheduled', room: 'Studio 1' },
    { student: 'Nora Lee', instrument: 'Piano', start: 930, end: 990, status: 'Scheduled', room: 'Studio 1' },
    { student: 'June Lim', instrument: 'Piano', start: 600, end: 660, status: 'Cancelled', room: 'Studio 2' },
    { student: 'Kai Wong', instrument: 'Piano', start: 870, end: 930, status: 'Scheduled', room: 'Studio 1' },
    { student: 'Ivy Lin', instrument: 'Piano', start: 990, end: 1020, status: 'Scheduled', room: 'Studio 2' },
    { student: 'Sam Arun', instrument: 'Piano', start: 630, end: 690, status: 'Teacher absent', room: 'Studio 1' },
    { student: 'Elle Sen', instrument: 'Piano', start: 900, end: 960, status: 'Scheduled', room: 'Studio 2' },
    { student: 'Ari Chen', instrument: 'Piano', start: 540, end: 600, status: 'Scheduled', room: 'Studio 1' },
    { student: 'Rowan Tan', instrument: 'Piano', start: 660, end: 720, status: 'Scheduled', room: 'Studio 1' },
    { student: 'Hana Park', instrument: 'Piano', start: 750, end: 810, status: 'Scheduled', room: 'Studio 2' },
  ];
  const days = [0, 0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 5];
  return [-1, 0, 1].flatMap((week) => fixtures.map((lesson, index) => ({
    ...lesson,
    id: `sample-${week}-${index}`,
    studentId: MOCK_STUDENTS.find((student) => student.fullName === lesson.student)!.id,
    date: shiftDate(monday, week * 7 + days[index]),
    status: week === -1 && lesson.status === 'Scheduled' ? 'Attended'
      : week === 1 && lesson.status === 'Attended' ? 'Scheduled' : lesson.status,
  })));
}
