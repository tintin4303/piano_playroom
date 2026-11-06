'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DayScheduleSummary,
  TeacherFilterOption,
  StudentOption,
  ScheduleSessionDTO,
  scheduleLessonSession,
  updateSessionStatus,
  deleteSession,
} from '@/server/actions/schedule';
import { ChevronLeft, ChevronRight, Plus, ArrowRight, X } from 'lucide-react';
import CustomDropdown from '@/components/shared/CustomDropdown';

interface ScheduleViewProps {
  initialData: {
    days: DayScheduleSummary[];
    rangeLabel: string;
    currentMondayIso: string;
    prevMondayIso: string;
    nextMondayIso: string;
    teacherOptions: TeacherFilterOption[];
    studentOptions: StudentOption[];
  };
  currentDateStr: string;
}

export default function ScheduleView({ initialData, currentDateStr }: ScheduleViewProps) {
  const router = useRouter();

  // Determine index of the active day:
  // 1. If a date is explicitly provided in the URL matching a day in this week, select it.
  // 2. Otherwise, default strictly to today (isToday)
  const todayIndex = initialData.days.findIndex((d) => d.isToday);
  const matchingDateIndex = initialData.days.findIndex((d) => d.dateIso === currentDateStr);

  const initialIndex =
    todayIndex !== -1
      ? todayIndex
      : matchingDateIndex !== -1
      ? matchingDateIndex
      : 0;

  const [selectedDayIndex, setSelectedDayIndex] = useState(initialIndex);

  const [selectedTeacher, setSelectedTeacher] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ScheduleSessionDTO | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add form fields
  const [formStudentId, setFormStudentId] = useState(initialData.studentOptions[0]?.id || '');
  const [formTeacherId, setFormTeacherId] = useState(initialData.teacherOptions[0]?.id || '');
  const [formTime, setFormTime] = useState('13:00');
  const [formDuration, setFormDuration] = useState(60);

  const currentDay = initialData.days[selectedDayIndex] || initialData.days[0];

  // Filter day's sessions
  const filteredSessions = (currentDay?.sessions || []).filter((s) => {
    const matchesTeacher =
      selectedTeacher === 'ALL' ||
      s.teacherName.toLowerCase().includes(selectedTeacher.toLowerCase());
    const matchesSearch =
      !searchQuery ||
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTeacher && matchesSearch;
  });

  // Today card metrics
  const scheduledList = (currentDay?.sessions || []).filter((s) => s.status === 'Scheduled');
  const upNextSession = scheduledList[0];
  const laterTodaySessions = scheduledList.slice(1);
  const cancelledSessions = (currentDay?.sessions || []).filter((s) => s.status === 'Cancelled');

  // Week navigation
  function handleNavigateWeek(direction: 'prev' | 'next') {
    const targetDate = direction === 'prev' ? initialData.prevMondayIso : initialData.nextMondayIso;
    router.push(`/admin/schedule?date=${targetDate}`);
  }

  // Create session
  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    if (!formStudentId || !formTeacherId) {
      alert('Please select both a student and a teacher.');
      return;
    }

    setIsSubmitting(true);
    const res = await scheduleLessonSession({
      studentId: formStudentId,
      teacherId: formTeacherId,
      dateStr: currentDay.dateIso,
      startTimeStr: formTime,
      durationMinutes: Number(formDuration),
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsAddModalOpen(false);
      router.refresh();
    } else {
      alert(res.message || 'Failed to schedule lesson');
    }
  }

  // Update session status from Edit Modal
  async function handleUpdateStatus(newStatus: any) {
    if (!editingSession) return;
    setIsSubmitting(true);
    const res = await updateSessionStatus(editingSession.id, newStatus);
    setIsSubmitting(false);
    if (res.success) {
      setEditingSession(null);
      router.refresh();
    } else {
      alert(res.message || 'Failed to update session');
    }
  }

  // Delete session
  async function handleDeleteSession() {
    if (!editingSession) return;
    if (!confirm('Are you sure you want to remove this session from the schedule?')) return;
    setIsSubmitting(true);
    const res = await deleteSession(editingSession.id);
    setIsSubmitting(false);
    if (res.success) {
      setEditingSession(null);
      router.refresh();
    } else {
      alert(res.message || 'Failed to delete session');
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-brand-text-primary tracking-tight">Schedule</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-yellow-text text-xs font-bold rounded-full shadow-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Schedule Lesson</span>
        </button>
      </div>

      {/* Main Grid: Left Schedule Card + Right Sidebar Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Schedule Calendar & Table */}
        <div className="lg:col-span-8 xl:col-span-9 bg-brand-surface rounded-2xl border border-brand-border p-6 shadow-xs space-y-6">
          {/* Top Bar: Date range controls + Search + Teacher dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Week Range with Working Arrows */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-text-primary min-w-36">
                {initialData.rangeLabel}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleNavigateWeek('prev')}
                  aria-label="Previous week"
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-brand-border bg-brand-surface text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-canvas cursor-pointer transition shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigateWeek('next')}
                  aria-label="Next week"
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-brand-border bg-brand-surface text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-canvas cursor-pointer transition shadow-xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search student or teacher"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 px-3.5 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary placeholder:text-brand-text-subtle focus:outline-none focus:border-brand-primary"
              />
            </div>

            {/* Teacher Dropdown Filter */}
            <div className="w-full sm:w-48">
              <CustomDropdown
                value={selectedTeacher}
                onChange={(val) => setSelectedTeacher(val)}
                options={[
                  { value: 'ALL', label: 'All teachers' },
                  ...initialData.teacherOptions.map((t) => ({ value: t.name, label: t.name })),
                ]}
              />
            </div>
          </div>

          {/* Days of the Week Selector Row */}
          <div className="grid grid-cols-7 border-b border-brand-border pb-3">
            {initialData.days.map((d, idx) => {
              const isSelected = idx === selectedDayIndex;
              return (
                <button
                  key={d.dateIso}
                  type="button"
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`flex flex-col items-center justify-between h-[68px] py-2 px-1 rounded-xl transition cursor-pointer relative ${
                    isSelected
                      ? 'bg-brand-yellow text-brand-yellow-text shadow-xs font-bold'
                      : 'hover:bg-brand-canvas text-brand-text-muted hover:text-brand-text-primary'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold tracking-wider">
                    {d.dayName}
                  </div>
                  <div className={`text-base font-black leading-none ${isSelected ? 'text-brand-yellow-text' : 'text-brand-text-primary'}`}>
                    {d.dayNumber}
                  </div>
                  {/* Fixed indicator placeholder so button height never shifts */}
                  <div className="h-1.5 flex items-center justify-center">
                    {d.isToday && (
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-brand-yellow-text' : 'bg-brand-primary'
                        }`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Table with fixed layout proportions (columns flexible ONLY to screen size) */}
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-xs">
              <thead>
                <tr className="text-brand-text-muted font-semibold text-[11px] pb-3 border-b border-brand-border/60">
                  <th className="w-[20%] py-2.5 px-3 font-normal">Time</th>
                  <th className="w-[22%] py-2.5 px-3 font-normal">Student</th>
                  <th className="w-[20%] py-2.5 px-3 font-normal">Teacher</th>
                  <th className="w-[14%] py-2.5 px-3 font-normal">Type</th>
                  <th className="w-[14%] py-2.5 px-3 font-normal">Status</th>
                  <th className="w-[10%] py-2.5 px-3 text-right font-normal">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-brand-text-subtle">
                      No lessons scheduled for this day. Click &ldquo;Schedule Lesson&rdquo; to add one.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-brand-canvas transition-colors">
                      <td className="w-[20%] py-4 px-3 font-bold text-brand-text-primary truncate">
                        {session.timeRange}
                      </td>
                      <td className="w-[22%] py-4 px-3 font-bold text-brand-text-primary truncate">
                        {session.studentName}
                      </td>
                      <td className="w-[20%] py-4 px-3 text-brand-text-primary truncate">
                        {session.teacherName}
                      </td>
                      <td className="w-[14%] py-4 px-3 text-brand-text-muted truncate">
                        {session.type}
                      </td>
                      <td className="w-[14%] py-4 px-3 text-brand-text-primary font-medium truncate">
                        {session.status}
                      </td>
                      <td className="w-[10%] py-4 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingSession(session)}
                          className="text-brand-text-muted hover:text-brand-primary font-medium text-xs cursor-pointer"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side Cards (Today Summary + Needs Attention) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-5">
          {/* Today Card */}
          <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-sm font-bold text-brand-text-primary">Today</h3>
              <span className="text-xs text-brand-text-muted font-medium">
                {currentDay.dayName} {currentDay.dayNumber}
              </span>
            </div>

            {/* UP NEXT */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-brand-text-muted">
                UP NEXT
              </div>
              {upNextSession ? (
                <div>
                  <div className="text-3xl font-black text-brand-text-primary tracking-tight">
                    {upNextSession.timeRange.split(' - ')[0]}
                  </div>
                  <div className="text-sm font-bold text-brand-text-primary mt-1">
                    {upNextSession.studentName}
                  </div>
                  <div className="text-xs text-brand-text-muted">
                    {upNextSession.teacherName} {upNextSession.type}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-brand-text-subtle py-2">No upcoming classes</div>
              )}
            </div>

            {/* LATER TODAY */}
            <div className="pt-3 border-t border-brand-border space-y-2">
              <div className="text-[10px] uppercase font-bold tracking-wider text-brand-text-muted">
                LATER TODAY
              </div>
              {laterTodaySessions.length > 0 ? (
                laterTodaySessions.map((s) => (
                  <div key={s.id} className="flex items-start gap-4 text-xs">
                    <span className="font-bold text-brand-text-primary">{s.timeRange.split(' - ')[0]}</span>
                    <div>
                      <div className="font-bold text-brand-text-primary">{s.studentName}</div>
                      <div className="text-[11px] text-brand-text-muted">{s.teacherName} {s.type}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-brand-text-subtle">None scheduled</div>
              )}
            </div>
          </div>

          {/* Needs Attention Card */}
          <div className="bg-[#FFF9E6] border border-[#FDE68A] rounded-2xl p-5 space-y-3">
            <div className="text-[10px] uppercase font-bold tracking-wider text-brand-yellow-text">
              Needs attention
            </div>
            <div className="text-sm font-bold text-brand-yellow-text">
              {cancelledSessions.length} Cancelled Class{cancelledSessions.length === 1 ? '' : 'es'}
            </div>

            {cancelledSessions.length > 0 ? (
              cancelledSessions.map((cs) => (
                <div key={cs.id} className="flex items-start gap-4 text-xs pt-1">
                  <span className="font-bold text-brand-yellow-text">{cs.timeRange.split(' - ')[0]}</span>
                  <div>
                    <div className="font-bold text-brand-yellow-text">{cs.studentName}</div>
                    <div className="text-[11px] text-[#A17C00]">{cs.teacherName} {cs.type}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-[#A17C00]">No cancellations pending review.</div>
            )}

            <button
              type="button"
              onClick={() => {
                const cancelled = filteredSessions.find((s) => s.status === 'Cancelled');
                if (cancelled) setEditingSession(cancelled);
              }}
              className="w-full py-2.5 mt-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-yellow-text text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Check</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Lesson Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface w-full max-w-md rounded-2xl border border-brand-border shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">Schedule Piano Lesson</h3>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Date: {currentDay.dayName}, {currentDay.dayNumber} {currentDay.fullDateStr.split(' ')[1]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-brand-text-subtle hover:text-brand-text-primary p-1 rounded-lg hover:bg-brand-canvas transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-brand-text-muted">Student</label>
                <CustomDropdown
                  value={formStudentId}
                  onChange={(val) => setFormStudentId(val)}
                  options={initialData.studentOptions.map((s) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-brand-text-muted">Teacher</label>
                <CustomDropdown
                  value={formTeacherId}
                  onChange={(val) => setFormTeacherId(val)}
                  options={initialData.teacherOptions.map((t) => ({
                    value: t.id,
                    label: t.name,
                  }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-brand-text-muted">Start Time</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary min-h-[42px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-brand-text-muted">Duration</label>
                  <CustomDropdown
                    value={String(formDuration)}
                    onChange={(val) => setFormDuration(Number(val))}
                    options={[
                      { value: '30', label: '30 min' },
                      { value: '60', label: '1 hr (60 min)' },
                    ]}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-brand-border rounded-xl text-xs font-semibold text-brand-text-muted hover:bg-brand-canvas cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-yellow-text rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface w-full max-w-sm rounded-2xl border border-brand-border shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">Edit Lesson Session</h3>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  {editingSession.studentName} with {editingSession.teacherName} ({editingSession.timeRange})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="text-brand-text-subtle hover:text-brand-text-primary p-1 rounded-lg hover:bg-brand-canvas transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] uppercase font-bold text-brand-text-muted">
                Update Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('COMPLETED')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    editingSession.status === 'Attended'
                      ? 'bg-brand-yellow text-brand-yellow-text border-brand-yellow'
                      : 'border-brand-border text-brand-text-primary hover:bg-brand-canvas'
                  }`}
                >
                  Attended
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('SCHEDULED')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    editingSession.status === 'Scheduled'
                      ? 'bg-brand-yellow text-brand-yellow-text border-brand-yellow'
                      : 'border-brand-border text-brand-text-primary hover:bg-brand-canvas'
                  }`}
                >
                  Scheduled
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('CANCELLED_EXCUSED')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    editingSession.status === 'Cancelled'
                      ? 'bg-brand-yellow text-brand-yellow-text border-brand-yellow'
                      : 'border-brand-border text-brand-text-primary hover:bg-brand-canvas'
                  }`}
                >
                  Cancelled
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('TEACHER_ABSENT')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    editingSession.status === 'Absent'
                      ? 'bg-brand-yellow text-brand-yellow-text border-brand-yellow'
                      : 'border-brand-border text-brand-text-primary hover:bg-brand-canvas'
                  }`}
                >
                  Teacher Absent
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-brand-border flex items-center justify-between">
              <button
                type="button"
                onClick={handleDeleteSession}
                className="text-xs font-semibold text-brand-red hover:underline cursor-pointer"
              >
                Delete Session
              </button>
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="px-4 py-2 border border-brand-border rounded-xl text-xs font-semibold text-brand-text-muted hover:bg-brand-canvas cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
