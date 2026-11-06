'use client';

import { useState } from 'react';
import CustomDropdown from '@/components/shared/CustomDropdown';

export interface StudentRecord {
  id: string;
  fullName: string;
  nickname: string;
  parentName: string;
  parentEmail: string;
  totalLessons: number;
}

interface StudentsTableProps {
  initialStudents: StudentRecord[];
}

export default function StudentsTable({ initialStudents }: StudentsTableProps) {
  const [search, setSearch] = useState('');
  const [lessonFilter, setLessonFilter] = useState<string>('ALL');

  const filtered = initialStudents.filter((s) => {
    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      s.fullName.toLowerCase().includes(query) ||
      s.nickname.toLowerCase().includes(query) ||
      s.parentName.toLowerCase().includes(query) ||
      s.parentEmail.toLowerCase().includes(query);

    let matchesLesson = true;
    if (lessonFilter === 'ACTIVE') {
      matchesLesson = s.totalLessons > 0;
    } else if (lessonFilter === 'NONE') {
      matchesLesson = s.totalLessons === 0;
    }

    return matchesSearch && matchesLesson;
  });

  return (
    <div className="space-y-4">
      {/* Control Bar: Search and Filter with uniform 40px height */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search student or parent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 px-3.5 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary placeholder:text-brand-text-subtle focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="w-full sm:w-48">
          <CustomDropdown
            value={lessonFilter}
            onChange={(val) => setLessonFilter(val)}
            options={[
              { value: 'ALL', label: 'All Students' },
              { value: 'ACTIVE', label: 'With Lessons (>0)' },
              { value: 'NONE', label: 'No Lessons (0)' },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-fixed">
            <thead>
              <tr className="bg-brand-canvas/60 border-b border-brand-border text-brand-text-muted font-semibold text-[11px]">
                <th className="w-[30%] py-3.5 px-4 font-normal">Student Name</th>
                <th className="w-[20%] py-3.5 px-4 font-normal">Nickname</th>
                <th className="w-[30%] py-3.5 px-4 font-normal">Parent / Household</th>
                <th className="w-[20%] py-3.5 px-4 text-right font-normal">Total Lessons</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-xs text-brand-text-subtle">
                    No students match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-brand-canvas transition-colors">
                    <td className="py-4 px-4 font-bold text-brand-text-primary truncate">
                      {student.fullName}
                    </td>
                    <td className="py-4 px-4 text-brand-text-muted truncate">
                      {student.nickname}
                    </td>
                    <td className="py-4 px-4 text-brand-text-primary truncate">
                      <div>{student.parentName}</div>
                      <div className="text-[11px] text-brand-text-subtle">{student.parentEmail}</div>
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-brand-text-primary">
                      {student.totalLessons} lessons
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
