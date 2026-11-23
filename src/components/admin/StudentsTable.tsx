'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomDropdown from '@/components/shared/CustomDropdown';
import {
  createStudent,
  updateStudent,
  deleteStudent,
} from '@/server/actions/studio-management';
import { Plus, X } from 'lucide-react';

export interface StudentRecord {
  id: string;
  fullName: string;
  nickname: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  totalLessons: number;
}

export interface ParentOption {
  id: string;
  name: string;
}

interface StudentsTableProps {
  initialStudents: StudentRecord[];
  parentOptions: ParentOption[];
}

export default function StudentsTable({ initialStudents, parentOptions }: StudentsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [lessonFilter, setLessonFilter] = useState<string>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields for Add
  const [addFullName, setAddFullName] = useState('');
  const [addNickname, setAddNickname] = useState('');
  const [addParentId, setAddParentId] = useState(parentOptions[0]?.id || '');
  const [addGender, setAddGender] = useState('Male');

  // Form fields for Edit
  const [editFullName, setEditFullName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editParentId, setEditParentId] = useState('');

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

  // Handle Add Student
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addFullName || !addNickname || !addParentId) {
      alert('Please fill in required fields.');
      return;
    }

    setIsSubmitting(true);
    const res = await createStudent({
      fullName: addFullName,
      nickname: addNickname,
      parentId: addParentId,
      gender: addGender,
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsAddModalOpen(false);
      setAddFullName('');
      setAddNickname('');
      router.refresh();
    } else {
      alert(res.message || 'Failed to add student');
    }
  }

  // Handle Edit Student
  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStudent) return;

    setIsSubmitting(true);
    const res = await updateStudent({
      studentId: editingStudent.id,
      fullName: editFullName,
      nickname: editNickname,
      parentId: editParentId,
    });
    setIsSubmitting(false);

    if (res.success) {
      setEditingStudent(null);
      router.refresh();
    } else {
      alert(res.message || 'Failed to update student');
    }
  }

  // Handle Delete Student
  async function handleDelete(studentId: string, name: string) {
    if (!confirm(`Are you sure you want to remove student "${name}"?`)) return;

    setIsSubmitting(true);
    const res = await deleteStudent(studentId);
    setIsSubmitting(false);

    if (res.success) {
      if (editingStudent?.id === studentId) setEditingStudent(null);
      router.refresh();
    } else {
      alert(res.message || 'Failed to delete student');
    }
  }

  function openEditModal(student: StudentRecord) {
    setEditingStudent(student);
    setEditFullName(student.fullName);
    setEditNickname(student.nickname);
    setEditParentId(student.parentId);
  }

  return (
    <div className="space-y-4">
      {/* Top Controls: Search + Filter + Add Student Button */}
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

        <div className="flex items-center gap-3">
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

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 h-10 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-yellow-text text-xs font-bold rounded-full shadow-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-fixed">
            <thead>
              <tr className="bg-brand-canvas/60 border-b border-brand-border text-brand-text-muted font-semibold text-[11px]">
                <th className="w-[30%] py-3.5 px-4 font-normal">Student Name</th>
                <th className="w-[18%] py-3.5 px-4 font-normal">Nickname</th>
                <th className="w-[28%] py-3.5 px-4 font-normal">Parent / Household</th>
                <th className="w-[12%] py-3.5 px-4 font-normal">Total Lessons</th>
                <th className="w-[12%] py-3.5 px-4 text-right font-normal">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-brand-text-subtle">
                    No students match your search criteria. Click &ldquo;Add Student&rdquo; to add one.
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
                    <td className="py-4 px-4 font-semibold text-brand-text-primary">
                      {student.totalLessons} lessons
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(student)}
                        className="text-brand-text-muted hover:text-brand-primary font-medium text-xs cursor-pointer mr-3"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(student.id, student.fullName)}
                        className="text-brand-text-subtle hover:text-brand-red font-medium text-xs cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD STUDENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface w-full max-w-md rounded-2xl border border-brand-border shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-base font-bold text-brand-text-primary">Enroll New Student</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-brand-text-subtle hover:text-brand-text-primary p-1 rounded-lg hover:bg-brand-canvas transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-brand-text-muted">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Timmy Miller"
                    value={addFullName}
                    onChange={(e) => setAddFullName(e.target.value)}
                    className="w-full h-10 px-3 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-brand-text-muted">Nickname</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Timmy"
                    value={addNickname}
                    onChange={(e) => setAddNickname(e.target.value)}
                    className="w-full h-10 px-3 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-brand-text-muted">Linked Parent Account</label>
                <CustomDropdown
                  value={addParentId}
                  onChange={(val) => setAddParentId(val)}
                  options={parentOptions.map((p) => ({ value: p.id, label: p.name }))}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-brand-text-muted">Gender</label>
                <CustomDropdown
                  value={addGender}
                  onChange={(val) => setAddGender(val)}
                  options={[
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' },
                  ]}
                />
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
                  {isSubmitting ? 'Enrolling...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface w-full max-w-md rounded-2xl border border-brand-border shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">Edit Student Profile</h3>
                <p className="text-xs text-brand-text-muted mt-0.5">{editingStudent.fullName}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="text-brand-text-subtle hover:text-brand-text-primary p-1 rounded-lg hover:bg-brand-canvas transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-brand-text-muted">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full h-10 px-3 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-brand-text-muted">Nickname</label>
                  <input
                    type="text"
                    required
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    className="w-full h-10 px-3 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-brand-text-muted">Linked Parent Account</label>
                <CustomDropdown
                  value={editParentId}
                  onChange={(val) => setEditParentId(val)}
                  options={parentOptions.map((p) => ({ value: p.id, label: p.name }))}
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => handleDelete(editingStudent.id, editingStudent.fullName)}
                  className="text-xs font-semibold text-brand-red hover:underline cursor-pointer"
                >
                  Delete Student
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
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
