'use client';

import { useState } from 'react';
import { updateUserRole } from '@/server/actions/users';
import { Role } from '@prisma/client';

interface ManagedUser {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  lineId: string | null;
  role: Role;
  createdAt: Date;
  students: { id: string; fullName: string; nickname: string }[];
  teacher: { id: string } | null;
}

export default function UserManagementTable({ initialUsers }: { initialUsers: ManagedUser[] }) {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [filterRole, setFilterRole] = useState<'ALL' | Role>('ALL');
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    const matchesSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.fullName && u.fullName.toLowerCase().includes(search.toLowerCase())) ||
      u.students.some((s) => s.fullName.toLowerCase().includes(search.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  async function handleRoleChange(userId: string, newRole: Role) {
    setLoadingId(userId);
    const res = await updateUserRole(userId, newRole);
    setLoadingId(null);

    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } else {
      alert(res.message || 'Failed to update role.');
    }
  }

  return (
    <div className="space-y-4">
      {/* Table Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search by name, email, or student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-brand-surface-muted rounded-xl border border-brand-border self-start sm:self-auto">
          {(['ALL', 'ADMIN', 'TEACHER', 'PARENT'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterRole === r
                  ? 'bg-brand-yellow text-brand-yellow-text shadow-xs'
                  : 'text-brand-text-muted hover:text-brand-text-primary'
              }`}
            >
              {r === 'ALL' ? 'All Roles' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-brand-canvas border-b border-brand-border text-brand-text-muted uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Linked Student / Profile</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4 text-right">Change Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border text-brand-text-body">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-brand-text-subtle">
                  No accounts found matching filter.
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="hover:bg-brand-canvas/60 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-brand-text-primary">
                      {user.fullName || 'No name'}
                    </div>
                    <div className="text-[11px] text-brand-text-muted">{user.email}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-xs font-semibold text-brand-text-primary">
                      {user.role}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    {user.role === 'PARENT' && user.students.length > 0 ? (
                      <div className="space-y-0.5">
                        {user.students.map((s) => (
                          <div key={s.id} className="text-[11px] text-brand-text-primary font-medium">
                            {s.fullName} <span className="text-brand-text-subtle">(&quot;{s.nickname}&quot;)</span>
                          </div>
                        ))}
                      </div>
                    ) : user.role === 'TEACHER' ? (
                      <span className="text-[11px] text-brand-green font-semibold">Instructor Profile Active</span>
                    ) : (
                      <span className="text-[11px] text-brand-text-subtle">—</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-[11px]">
                    <div>{user.phone || 'No phone'}</div>
                    {user.lineId && <div className="text-brand-text-subtle">LINE: {user.lineId}</div>}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <select
                      value={user.role}
                      disabled={loadingId === user.id}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                      className="px-2 py-1 bg-brand-canvas border border-brand-border rounded-lg text-xs font-semibold text-brand-text-primary focus:outline-none cursor-pointer"
                    >
                      <option value="PARENT">Parent</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
