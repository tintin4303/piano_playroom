import type { LessonStatus } from '@/lib/teacher-schedule-mock';

export default function LessonStatusBadge({ status }: { status: LessonStatus }) {
  return <span className={`teacher-status teacher-status-${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>;
}
