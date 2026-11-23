'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomDropdown from '@/components/shared/CustomDropdown';
import {
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from '@/server/actions/studio-management';
import { Plus, X } from 'lucide-react';
import { getTeacherTheme } from '@/lib/teacher-colors';

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
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields for Add
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addLineId, setAddLineId] = useState('');

  // Form fields for Edit
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLineId, setEditLineId] = useState('');

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

  // Handle Add Teacher
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addName || !addEmail || !addPhone) {
      alert('Please fill in required fields.');
      return;
    }

    setIsSubmitting(true);
    const res = await createTeacher({
      fullName: addName,
      email: addEmail,
      phone: addPhone,
      lineId: addLineId,
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsAddModalOpen(false);
      setAddName('');
      setAddEmail('');
      setAddPhone('');
      setAddLineId('');
      router.refresh();
    } else {
      alert(res.message || 'Failed to add teacher');
    }
  }

  // Handle Edit Teacher
  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTeacher) return;

    setIsSubmitting(true);
    const res = await updateTeacher({
      teacherId: editingTeacher.id,
      fullName: editName,
      phone: editPhone,
      lineId: editLineId,
    });
    setIsSubmitting(false);

    if (res.success) {
      setEditingTeacher(null);
      router.refresh();
    } else {
      alert(res.message || 'Failed to update teacher');
    }
  }

  // Handle Delete Teacher
  async function handleDelete(teacherId: string, name: string) {
    if (!confirm(`Are you sure you want to remove ${name}? This will remove associated instructor sessions.`)) return;

    setIsSubmitting(true);
    const res = await deleteTeacher(teacherId);
    setIsSubmitting(false);

    if (res.success) {
      if (editingTeacher?.id === teacherId) setEditingTeacher(null);
      router.refresh();
    } else {
      alert(res.message || 'Failed to delete teacher');
    }
  }

  function openEditModal(teacher: TeacherRecord) {
    setEditingTeacher(teacher);
    setEditName(teacher.name);
    setEditPhone(teacher.phone || '');
    setEditLineId(teacher.lineId || '');
  }

  return (
    <div className="space-y-4">
      {/* Top Controls: Search + Filter + Add Teacher Button */}
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

        <div className="flex items-center gap-3">
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

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 h-10 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-yellow-text text-xs font-bold rounded-full shadow-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Teacher</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-fixed">
            <thead>
              <tr className="bg-brand-canvas/60 border-b border-brand-border text-brand-text-muted font-semibold text-[11px]">
                <th className="w-[30%] py-3.5 px-4 font-normal">Instructor Name</th>
                <th className="w-[28%] py-3.5 px-4 font-normal">Email</th>
                <th className="w-[18%] py-3.5 px-4 font-normal">Contact</th>
                <th className="w-[12%] py-3.5 px-4 font-normal">Assigned Classes</th>
                <th className="w-[12%] py-3.5 px-4 text-right font-normal">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-brand-text-subtle">
                    No instructors match your search criteria. Click &ldquo;Add Teacher&rdquo; to add one.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const theme = getTeacherTheme(t.name);
                  return (
                    <tr key={t.id} className="hover:bg-brand-canvas transition-colors">
                      <td className="py-4 px-4 font-bold text-brand-text-primary truncate">
                        <span className="inline-flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${theme.dot}`} />
                          <span>{t.name}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-brand-text-primary truncate">
                        {t.email}
                      </td>
                      <td className="py-4 px-4 text-brand-text-muted truncate">
                        <div>{t.phone || '—'}</div>
                        {t.lineId && <div className="text-[11px] text-brand-text-subtle">LINE: {t.lineId}</div>}
                      </td>
                      <td className="py-4 px-4 font-semibold text-brand-text-primary">
                        {t.totalClasses} classes
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEditModal(t)}
                          className="text-brand-text-muted hover:text-brand-primary font-medium text-xs cursor-pointer mr-3"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id, t.name)}
                          className="text-brand-text-subtle hover:text-brand-red font-medium text-xs cursor-pointer"
                        >
                          Delete
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

      {/* ADD TEACHER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface w-full max-w-md rounded-2xl border border-brand-border shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-base font-bold text-brand-text-primary">Add New Teacher</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-brand-text-subtle hover:text-brand-text-primary p-1 rounded-lg hover:bg-brand-canvas transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-brand-text-muted">Instructor Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clara Schumann"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full h-10 px-3 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-brand-text-muted">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="clara@pianoplayroom.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full h-10 px-3 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-brand-text-muted">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="081-xxx-xxxx"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value.replace(/[^0-9\-]/g, ''))}
                    className="w-full h-10 px-3 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-brand-text-muted">LINE ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="clara_line"
                    value={addLineId}
                    onChange={(e) => setAddLineId(e.target.value)}
                    className="w-full h-10 px-3 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
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
                  {isSubmitting ? 'Creating...' : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEACHER MODAL */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface w-full max-w-md rounded-2xl border border-brand-border shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">Edit Teacher Profile</h3>
                <p className="text-xs text-brand-text-muted mt-0.5">{editingTeacher.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="text-brand-text-subtle hover:text-brand-text-primary p-1 rounded-lg hover:bg-brand-canvas transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-brand-text-muted">Instructor Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-10 px-3 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-brand-text-muted">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/[^0-9\-]/g, ''))}
                    className="w-full h-10 px-3 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-brand-text-muted">LINE ID (Optional)</label>
                  <input
                    type="text"
                    value={editLineId}
                    onChange={(e) => setEditLineId(e.target.value)}
                    className="w-full h-10 px-3 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => handleDelete(editingTeacher.id, editingTeacher.name)}
                  className="text-xs font-semibold text-brand-red hover:underline cursor-pointer"
                >
                  Delete Teacher
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTeacher(null)}
                    className="px-4 py-2 border border-brand-border rounded-xl text-xs font-semibold text-brand-text-muted hover:bg-brand-canvas cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-yellow-text rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
