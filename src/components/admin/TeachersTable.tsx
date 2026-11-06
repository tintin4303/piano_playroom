'use client';

import { useState } from 'react';
import CustomDropdown from '@/components/shared/CustomDropdown';

export interface TeacherRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  lineId: string | null;
  totalClasses: number;
}

interface TeachersTableProps {
  initialTeachers: TeacherRecord[];
}

export default function TeachersTable({ initialTeachers }: TeachersTableProps) {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string>('ALL');

  const filtered = initialTeachers.filter((t) => {
    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      t.name.toLowerCase().includes(query) ||
      t.email.toLowerCase().includes(query) ||
      (t.phone && t.phone.toLowerCase().includes(query)) ||
      (t.lineId && t.lineId.toLowerCase().includes(query));

    let matchesClass = true;
    if (classFilter === 'ACTIVE') {
      matchesClass = t.totalClasses > 0;
    } else if (classFilter === 'NONE') {
      matchesClass = t.totalClasses === 0;
    }

    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-4">
      {/* Control Bar: Search and Filter with uniform 40px height */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search teacher by name or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 px-3.5 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary placeholder:text-brand-text-subtle focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="w-full sm:w-48">
          <CustomDropdown
            value={classFilter}
            onChange={(val) => setClassFilter(val)}
            options={[
              { value: 'ALL', label: 'All Instructors' },
              { value: 'ACTIVE', label: 'With Active Classes' },
              { value: 'NONE', label: 'No Classes Assigned' },
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
                <th className="w-[30%] py-3.5 px-4 font-normal">Instructor Name</th>
                <th className="w-[30%] py-3.5 px-4 font-normal">Email</th>
                <th className="w-[20%] py-3.5 px-4 font-normal">Contact</th>
                <th className="w-[20%] py-3.5 px-4 text-right font-normal">Assigned Classes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-xs text-brand-text-subtle">
                    No instructors match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-brand-canvas transition-colors">
                    <td className="py-4 px-4 font-bold text-brand-text-primary truncate">
                      {t.name}
                    </td>
                    <td className="py-4 px-4 text-brand-text-primary truncate">
                      {t.email}
                    </td>
                    <td className="py-4 px-4 text-brand-text-muted truncate">
                      <div>{t.phone || 'No phone'}</div>
                      {t.lineId && <div className="text-[11px] text-brand-text-subtle">LINE: {t.lineId}</div>}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-brand-text-primary">
                      {t.totalClasses} classes
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
