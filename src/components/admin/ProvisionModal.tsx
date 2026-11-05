'use client';

import { useState } from 'react';
import { provisionAccount } from '@/server/actions/users';
import { Role } from '@prisma/client';

export default function ProvisionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<Role>('PARENT');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [lineId, setLineId] = useState('');
  const [password, setPassword] = useState('Piano123456!');

  // Student states (for Parent role)
  const [studentName, setStudentName] = useState('');
  const [studentNickname, setStudentNickname] = useState('');
  const [studentDob, setStudentDob] = useState('2019-01-01');
  const [studentGender, setStudentGender] = useState('Male');

  async function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const res = await provisionAccount({
      fullName,
      email,
      phone,
      lineId,
      role,
      temporaryPassword: password,
      studentDetails:
        role === 'PARENT' && studentName
          ? {
              fullName: studentName,
              nickname: studentNickname || studentName,
              dateOfBirth: studentDob,
              gender: studentGender,
            }
          : undefined,
    });

    setLoading(false);
    if (!res.success) {
      setStatusMessage({ type: 'error', text: res.message || 'Provisioning failed.' });
    } else {
      setStatusMessage({
        type: 'success',
        text: `Provisioned successfully! Login: ${email} | Temporary Password: ${password}`,
      });
      // Reset form
      setFullName('');
      setEmail('');
      setPhone('');
      setLineId('');
      setStudentName('');
      setStudentNickname('');
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setStatusMessage(null);
          setIsOpen(true);
        }}
        className="px-4 py-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-yellow-text text-xs font-bold rounded-full shadow-xs transition flex items-center gap-2 cursor-pointer"
      >
        <span>+ Provision Account</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface w-full max-w-lg rounded-2xl border border-brand-border shadow-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <h3 className="text-lg font-bold text-brand-text-primary">Provision New Studio Account</h3>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Directly provision accounts for parents, teachers, and administrators.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-brand-text-subtle hover:text-brand-text-primary p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border ${
                  statusMessage.type === 'success'
                    ? 'bg-brand-green-light border-brand-green-border text-brand-green'
                    : 'bg-brand-red-light border-brand-red-border text-brand-red'
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            <form onSubmit={handleProvision} className="space-y-4">
              {/* Role Selector with Uniform Yellow Brand Theme */}
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-text-muted">
                  Account Role
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-brand-surface-muted rounded-xl border border-brand-border">
                  {(['PARENT', 'TEACHER', 'ADMIN'] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        role === r
                          ? 'bg-brand-yellow text-brand-yellow-text shadow-xs'
                          : 'text-brand-text-muted hover:text-brand-text-primary'
                      }`}
                    >
                      {r === 'PARENT' ? 'Parent' : r === 'TEACHER' ? 'Teacher' : 'Admin'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-text-muted">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sarah Miller"
                    className="w-full px-3 py-2 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-text-muted">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@example.com"
                    className="w-full px-3 py-2 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-text-muted">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081-xxx-xxxx"
                    className="w-full px-3 py-2 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-text-muted">
                    LINE ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={lineId}
                    onChange={(e) => setLineId(e.target.value)}
                    placeholder="line_user"
                    className="w-full px-3 py-2 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-text-muted">
                  Temporary Password
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              {/* Child / Student Registration Section for Parents */}
              {role === 'PARENT' && (
                <div className="pt-2 border-t border-brand-border space-y-3">
                  <div className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">
                    Linked Child (Student) Information
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      placeholder="Student Full Name (e.g. Timmy Miller)"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-3 py-2 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                    />
                    <input
                      type="text"
                      placeholder="Nickname (e.g. Timmy)"
                      value={studentNickname}
                      onChange={(e) => setStudentNickname(e.target.value)}
                      className="w-full px-3 py-2 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="date"
                      value={studentDob}
                      onChange={(e) => setStudentDob(e.target.value)}
                      className="w-full px-3 py-2 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                    />
                    <select
                      value={studentGender}
                      onChange={(e) => setStudentGender(e.target.value)}
                      className="w-full px-3 py-2 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-brand-border rounded-xl text-xs font-semibold text-brand-text-muted hover:bg-brand-canvas transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-brand-yellow hover:bg-brand-yellow-hover disabled:opacity-50 text-brand-yellow-text rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {loading ? 'Provisioning...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
