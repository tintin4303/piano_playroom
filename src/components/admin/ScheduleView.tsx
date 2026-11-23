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
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, List } from 'lucide-react';
import CustomDropdown from '@/components/shared/CustomDropdown';
import { getTeacherTheme, TEACHER_THEMES } from '@/lib/teacher-colors';

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

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const INSTRUMENTS = ['ALL', 'Piano', 'Violin', 'Vocal', 'Cello'];

export default function ScheduleView({ initialData, currentDateStr }: ScheduleViewProps) {
  const router = useRouter();

  // Mode: 'teams' (Weekly Multi-Column Calendar Grid) vs 'list' (Daily Table)
  const [viewMode, setViewMode] = useState<'teams' | 'list'>('teams');

  // Active day index for list mode or day highlight
  const todayIndex = initialData.days.findIndex((d) => d.isToday);
  const matchingDateIndex = initialData.days.findIndex((d) => d.dateIso === currentDateStr);
  const initialIndex = todayIndex !== -1 ? todayIndex : matchingDateIndex !== -1 ? matchingDateIndex : 0;
  const [selectedDayIndex, setSelectedDayIndex] = useState(initialIndex);

  // Filters
  const [selectedTeacher, setSelectedTeacher] = useState<string>('ALL');
  const [selectedInstrument, setSelectedInstrument] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ScheduleSessionDTO | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formStudentId, setFormStudentId] = useState(initialData.studentOptions[0]?.id || '');
  const [formTeacherId, setFormTeacherId] = useState(initialData.teacherOptions[0]?.id || '');
  const [formDate, setFormDate] = useState(initialData.days[selectedDayIndex]?.dateIso || currentDateStr);
  const [formStartTime, setFormStartTime] = useState('10:00');
  const [formEndTime, setFormEndTime] = useState('11:00');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringEndDate, setRecurringEndDate] = useState('2026-12-31');

  // Filter helper applied across both grid and list views
  function filterSession(s: ScheduleSessionDTO) {
    const matchesTeacher =
      selectedTeacher === 'ALL' ||
      s.teacherName.toLowerCase().includes(selectedTeacher.toLowerCase());
    const matchesInstrument =
      selectedInstrument === 'ALL' ||
      s.instrument.toLowerCase() === selectedInstrument.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      s.studentName.toLowerCase().includes(query) ||
      s.teacherName.toLowerCase().includes(query) ||
      s.instrument.toLowerCase().includes(query);

    return matchesTeacher && matchesInstrument && matchesSearch;
  }

  const currentDay = initialData.days[selectedDayIndex] || initialData.days[0];
  const filteredListSessions = (currentDay?.sessions || []).filter(filterSession);

  // Week navigation
  function handleNavigateWeek(direction: 'prev' | 'next') {
    const targetDate = direction === 'prev' ? initialData.prevMondayIso : initialData.nextMondayIso;
    router.push(`/admin/schedule?date=${targetDate}`);
  }

  // Quick Slot Click Booking
  function handleSlotClick(dateIso: string, hour: number) {
    setFormDate(dateIso);
    setFormStartTime(`${String(hour).padStart(2, '0')}:00`);
    setFormEndTime(`${String(hour + 1).padStart(2, '0')}:00`);
    setIsAddModalOpen(true);
  }

  // Submit new session / recurring series
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
      dateStr: formDate,
      startTimeStr: formStartTime,
      endTimeStr: formEndTime,
      isRecurring,
      recurringEndDateStr: isRecurring ? recurringEndDate : undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsAddModalOpen(false);
      router.refresh();
    } else {
      alert(res.message || 'Failed to schedule lesson');
    }
  }

  // Status update
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-text-primary tracking-tight">Schedule</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle: Teams Grid vs Daily List */}
          <div className="flex items-center bg-brand-surface border border-brand-border rounded-full p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('teams')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                viewMode === 'teams'
                  ? 'bg-brand-yellow text-brand-yellow-text shadow-xs'
                  : 'text-brand-text-muted hover:text-brand-text-primary'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Week Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-brand-yellow text-brand-yellow-text shadow-xs'
                  : 'text-brand-text-muted hover:text-brand-text-primary'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Day List</span>
            </button>
          </div>

          <button
            onClick={() => {
              setFormDate(initialData.days[selectedDayIndex]?.dateIso || currentDateStr);
              setIsAddModalOpen(true);
            }}
            className="px-5 py-2.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-yellow-text text-xs font-bold rounded-full shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Schedule Lesson</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Week Jump + Filters + Teacher Color Legend */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Week Range Navigation */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-brand-text-primary whitespace-nowrap min-w-44">
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

          {/* Filters: Search + Teacher + Instrument */}
          <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
            <div className="w-full sm:w-56">
              <input
                type="text"
                placeholder="Search student, teacher, instrument..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 px-3.5 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary placeholder:text-brand-text-subtle focus:outline-none focus:border-brand-primary"
              />
            </div>

            {/* Teacher Dropdown Filter */}
            <div className="w-full sm:w-44">
              <CustomDropdown
                value={selectedTeacher}
                onChange={(val) => setSelectedTeacher(val)}
                options={[
                  { value: 'ALL', label: 'All Teachers' },
                  ...initialData.teacherOptions.map((t) => ({ value: t.name, label: t.name })),
                ]}
              />
            </div>

            {/* Instrument Dropdown Filter */}
            <div className="w-full sm:w-36">
              <CustomDropdown
                value={selectedInstrument}
                onChange={(val) => setSelectedInstrument(val)}
                options={INSTRUMENTS.map((ins) => ({
                  value: ins,
                  label: ins === 'ALL' ? 'All Instruments' : ins,
                }))}
              />
            </div>
          </div>
        </div>

        {/* Teacher Color Palette Legend (Microsoft Teams / Outlook Style) */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-brand-border/60 text-xs">
          <span className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider">
            Instructors:
          </span>
          {initialData.teacherOptions.map((t) => {
            const theme = getTeacherTheme(t.name);
            return (
              <div key={t.id} className="flex items-center gap-1.5 font-medium text-brand-text-primary">
                <span className={`w-2.5 h-2.5 rounded-full ${theme.dot}`} />
                <span>{t.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* TEAMS STYLE WEEKLY CALENDAR GRID */}
      {viewMode === 'teams' ? (
        <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xs overflow-hidden">
          {/* Day Headers Row */}
          <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-brand-border bg-brand-canvas/50">
            <div className="p-3 border-r border-brand-border text-center text-[10px] font-bold text-brand-text-muted uppercase tracking-wider flex items-center justify-center">
              Time
            </div>
            {initialData.days.map((day, idx) => (
              <div
                key={day.dateIso}
                className={`p-3 text-center border-r border-brand-border last:border-r-0 ${
                  day.isToday ? 'bg-brand-yellow/15' : ''
                }`}
              >
                <div className="text-[10px] uppercase font-bold tracking-wider text-brand-text-muted">
                  {day.dayName}
                </div>
                <div
                  className={`text-base font-black mt-0.5 inline-block ${
                    day.isToday
                      ? 'w-7 h-7 leading-7 rounded-full bg-brand-yellow text-brand-yellow-text'
                      : 'text-brand-text-primary'
                  }`}
                >
                  {day.dayNumber}
                </div>
              </div>
            ))}
          </div>

          {/* Time Rows & Day Columns Grid */}
          <div className="relative overflow-x-auto max-h-[680px] overflow-y-auto">
            <div className="grid grid-cols-[70px_repeat(7,1fr)] min-w-[900px] relative">
              {/* Hour Grid Rows */}
              {HOURS.map((hour) => (
                <div key={hour} className="contents">
                  {/* Time Axis Column */}
                  <div className="h-24 border-b border-r border-brand-border/60 p-2 text-right text-[11px] font-bold text-brand-text-muted select-none">
                    {String(hour).padStart(2, '0')}:00
                  </div>

                  {/* 7 Day Slot Cells */}
                  {initialData.days.map((day) => (
                    <div
                      key={`${day.dateIso}-${hour}`}
                      onClick={() => handleSlotClick(day.dateIso, hour)}
                      className={`h-24 border-b border-r border-brand-border/40 last:border-r-0 relative hover:bg-brand-canvas/70 transition-colors cursor-pointer group ${
                        day.isToday ? 'bg-brand-yellow/[0.04]' : ''
                      }`}
                      title={`Click to schedule on ${day.dayName} at ${hour}:00`}
                    >
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition text-[10px] text-brand-text-muted font-bold pointer-events-none">
                        +
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Positioned Session Cards across Days */}
              {initialData.days.map((day, dayIndex) => {
                const daySessions = day.sessions.filter(filterSession);

                return daySessions.map((session) => {
                  const theme = getTeacherTheme(session.teacherName);

                  // Calculate vertical positioning based on hours (09:00 = 0px offset, each hour is 96px)
                  const startHourOffset = session.startHourFraction - 9;
                  const durationHours = session.endHourFraction - session.startHourFraction;

                  // Bound checks
                  if (startHourOffset < 0) return null;

                  const topPx = Math.max(0, startHourOffset * 96);
                  const heightPx = Math.max(38, durationHours * 96 - 4); // gap of 4px

                  // Column index in grid is dayIndex + 2 (1-based index, col 1 is time axis)
                  const colStart = dayIndex + 2;

                  return (
                    <div
                      key={session.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSession(session);
                      }}
                      style={{
                        gridColumnStart: colStart,
                        gridColumnEnd: colStart + 1,
                        top: `${topPx + 2}px`,
                        height: `${heightPx}px`,
                      }}
                      className={`absolute left-1 right-1 z-10 rounded-xl border p-2 transition shadow-xs cursor-pointer hover:shadow-md hover:scale-[1.01] flex flex-col justify-between overflow-hidden ${theme.bg} ${theme.border}`}
                    >
                      <div>
                        {/* Start and End Time (No Duration display per instructions) */}
                        <div className={`text-[10px] font-bold tracking-tight leading-none ${theme.text}`}>
                          {session.timeRange}
                        </div>

                        {/* Student Name */}
                        <div className="font-extrabold text-xs text-brand-text-primary truncate mt-1">
                          {session.studentName}
                        </div>

                        {/* Teacher & Instrument */}
                        <div className="text-[10px] text-brand-text-muted truncate mt-0.5">
                          {session.teacherName} • <span className="font-semibold">{session.instrument}</span>
                        </div>
                      </div>

                      {/* Status indicator pill if Cancelled */}
                      {session.status === 'Cancelled' && (
                        <div className="text-[9px] font-bold text-brand-red bg-white/80 rounded px-1 self-start mt-0.5">
                          Cancelled
                        </div>
                      )}
                    </div>
                  );
                });
              })}
            </div>
          </div>
        </div>
      ) : (
        /* DAILY LIST TABLE VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 xl:col-span-9 bg-brand-surface rounded-2xl border border-brand-border p-6 shadow-xs space-y-6">
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

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-left text-xs">
                <thead>
                  <tr className="text-brand-text-muted font-semibold text-[11px] pb-3 border-b border-brand-border/60">
                    <th className="w-[20%] py-2.5 px-3 font-normal">Time</th>
                    <th className="w-[22%] py-2.5 px-3 font-normal">Student</th>
                    <th className="w-[20%] py-2.5 px-3 font-normal">Teacher</th>
                    <th className="w-[14%] py-2.5 px-3 font-normal">Instrument</th>
                    <th className="w-[14%] py-2.5 px-3 font-normal">Status</th>
                    <th className="w-[10%] py-2.5 px-3 text-right font-normal">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60">
                  {filteredListSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-brand-text-subtle">
                        No lessons scheduled for this day matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredListSessions.map((session) => {
                      const theme = getTeacherTheme(session.teacherName);
                      return (
                        <tr key={session.id} className="hover:bg-brand-canvas transition-colors">
                          <td className="w-[20%] py-4 px-3 font-bold text-brand-text-primary truncate">
                            {session.timeRange}
                          </td>
                          <td className="w-[22%] py-4 px-3 font-bold text-brand-text-primary truncate">
                            {session.studentName}
                          </td>
                          <td className="w-[20%] py-4 px-3 truncate">
                            <span className="inline-flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                              <span className="text-brand-text-primary font-medium">{session.teacherName}</span>
                            </span>
                          </td>
                          <td className="w-[14%] py-4 px-3 text-brand-text-muted truncate">
                            {session.instrument}
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Summary Sidebar (Today's Next Class & Cancellations) */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-5">
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
                {filteredListSessions[0] ? (
                  <div>
                    <div className="text-3xl font-black text-brand-text-primary tracking-tight">
                      {filteredListSessions[0].timeRange.split(' - ')[0]}
                    </div>
                    <div className="text-sm font-bold text-brand-text-primary mt-1">
                      {filteredListSessions[0].studentName}
                    </div>
                    <div className="text-xs text-brand-text-muted">
                      {filteredListSessions[0].teacherName} • {filteredListSessions[0].instrument}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-brand-text-subtle py-2">No upcoming classes</div>
                )}
              </div>
            </div>

            {/* Cancelled Classes Card */}
            <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-xs space-y-3">
              <div className="text-sm font-bold text-brand-text-primary">
                {filteredListSessions.filter((s) => s.status === 'Cancelled').length} Cancelled Class
              </div>
              <button
                type="button"
                onClick={() => {
                  const cancelled = filteredListSessions.find((s) => s.status === 'Cancelled');
                  if (cancelled) setEditingSession(cancelled);
                }}
                className="w-full py-2.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-yellow-text text-xs font-bold rounded-xl transition flex items-center justify-center cursor-pointer shadow-xs"
              >
                Check
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE LESSON MODAL WITH RECURRING SUPPORT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface w-full max-w-md rounded-2xl border border-brand-border shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">Schedule Piano Lesson</h3>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Select student, teacher, and class recurrence
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
              {/* Student */}
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

              {/* Teacher */}
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

              {/* Date & Start/End Time (No explicit duration needed) */}
              <div className="grid grid-cols-3 gap-2.5 items-end">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-brand-text-muted">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-2.5 h-10 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-brand-text-muted">Start Time</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-2.5 h-10 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-brand-text-muted">End Time</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-2.5 h-10 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              {/* Recurring Class Toggle (Meeting Requirement) */}
              <div className="p-3 bg-brand-canvas rounded-xl border border-brand-border space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded border-brand-border text-brand-primary focus:ring-brand-primary w-4 h-4"
                  />
                  <span className="text-xs font-bold text-brand-text-primary">
                    Recurring Weekly Class
                  </span>
                </label>

                {isRecurring && (
                  <div className="pt-2 border-t border-brand-border/60 space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-brand-text-muted">
                      Recurrence End Date
                    </label>
                    <input
                      type="date"
                      value={recurringEndDate}
                      onChange={(e) => setRecurringEndDate(e.target.value)}
                      className="w-full px-3 h-10 bg-brand-surface border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                    />
                    <p className="text-[10px] text-brand-text-subtle">
                      This will automatically generate weekly calendar occurrences up to this date.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
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
                  {isSubmitting ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / RESCHEDULE SESSION MODAL */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface w-full max-w-sm rounded-2xl border border-brand-border shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">Edit Class Session</h3>
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
