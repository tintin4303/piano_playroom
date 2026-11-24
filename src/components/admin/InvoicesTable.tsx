'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatTHB } from '@/lib/currency';
import CustomDropdown from '@/components/shared/CustomDropdown';
import {
  generateMonthlyInvoices,
  createStudentInvoice,
  updateInvoiceStatus,
  deleteInvoice,
} from '@/server/actions/billing-management';
import { InvoiceStatus } from '@prisma/client';
import { X, FileText, Check, Calendar, Mail, User as UserIcon, CheckSquare, Square } from 'lucide-react';

export interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  billingMonth: string;
  totalAmount: number;
  status: InvoiceStatus;
  itemsCount: number;
}

export interface SessionBillingItem {
  id: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  teacherName: string;
  description: string;
  status: string;
  amount: number;
  isBilled: boolean;
}

export interface StudentBillingOption {
  id: string;
  fullName: string;
  nickname: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  sessions: SessionBillingItem[];
}

interface InvoicesTableProps {
  initialInvoices: InvoiceRecord[];
  students?: StudentBillingOption[];
}

export default function InvoicesTable({ initialInvoices, students = [] }: InvoicesTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals state
  const [editingInvoice, setEditingInvoice] = useState<InvoiceRecord | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // Generate Modal Form State
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [periodStart, setPeriodStart] = useState('2026-11-01');
  const [periodEnd, setPeriodEnd] = useState('2026-11-30');
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);

  // Find currently selected student
  const currentStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || students[0] || null;
  }, [students, selectedStudentId]);

  // Filter student sessions falling within selected period
  const periodSessions = useMemo(() => {
    if (!currentStudent) return [];
    return currentStudent.sessions.filter((sess) => {
      return sess.sessionDate >= periodStart && sess.sessionDate <= periodEnd;
    });
  }, [currentStudent, periodStart, periodEnd]);

  // Sync selected session IDs when student or period changes
  useEffect(() => {
    if (periodSessions.length > 0) {
      setSelectedSessionIds(periodSessions.filter((s) => !s.isBilled).map((s) => s.id));
    } else {
      setSelectedSessionIds([]);
    }
  }, [periodSessions]);

  // Toggle individual session selection
  function toggleSession(sessionId: string) {
    setSelectedSessionIds((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId]
    );
  }

  // Toggle all available sessions
  function toggleSelectAll() {
    const unbilledInPeriod = periodSessions.filter((s) => !s.isBilled).map((s) => s.id);
    if (selectedSessionIds.length === unbilledInPeriod.length) {
      setSelectedSessionIds([]);
    } else {
      setSelectedSessionIds(unbilledInPeriod);
    }
  }

  // Calculate bill total from selected classes
  const selectedTotalSatang = useMemo(() => {
    return periodSessions
      .filter((s) => selectedSessionIds.includes(s.id))
      .reduce((sum, s) => sum + s.amount, 0);
  }, [periodSessions, selectedSessionIds]);

  const filtered = initialInvoices.filter((inv) => {
    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      inv.invoiceNo.toLowerCase().includes(query) ||
      inv.parentName.toLowerCase().includes(query) ||
      inv.parentEmail.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle issuing custom student statement
  async function handleIssueStudentInvoice() {
    if (!currentStudent) {
      alert('Please select a student.');
      return;
    }
    if (selectedSessionIds.length === 0) {
      alert('Please select at least one class to include in this invoice.');
      return;
    }

    const selectedItems = periodSessions
      .filter((s) => selectedSessionIds.includes(s.id))
      .map((s) => ({
        sessionId: s.id.startsWith('demo-') ? undefined : s.id,
        description: `${s.description} • ${s.sessionDate}`,
        amount: s.amount,
      }));

    setIsSubmitting(true);
    const billingMonth = periodStart.slice(0, 7);
    const res = await createStudentInvoice({
      studentId: currentStudent.id,
      parentId: currentStudent.parentId,
      billingMonth,
      items: selectedItems,
    });
    setIsSubmitting(false);

    if (res.success) {
      alert(
        `Invoice ${res.invoiceNo} issued for ${formatTHB(res.totalAmount || 0)}.`
      );
      setIsGenerateModalOpen(false);
      router.refresh();
    } else {
      alert(res.message || 'Failed to issue bill.');
    }
  }

  // Update status action
  async function handleStatusChange(invoiceId: string, nextStatus: InvoiceStatus) {
    setIsSubmitting(true);
    const res = await updateInvoiceStatus(invoiceId, nextStatus);
    setIsSubmitting(false);

    if (res.success) {
      setEditingInvoice(null);
      router.refresh();
    } else {
      alert(res.message || 'Failed to update status.');
    }
  }

  // Delete invoice
  async function handleDelete(invoiceId: string, invoiceNo: string) {
    if (!confirm(`Are you sure you want to delete invoice ${invoiceNo}?`)) return;

    setIsSubmitting(true);
    const res = await deleteInvoice(invoiceId);
    setIsSubmitting(false);

    if (res.success) {
      setEditingInvoice(null);
      router.refresh();
    } else {
      alert(res.message || 'Failed to delete invoice.');
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Controls: Search + Filter + Action Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search invoice or parent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 px-3.5 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary placeholder:text-brand-text-subtle focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="w-full sm:w-48">
            <CustomDropdown
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'ISSUED', label: 'Issued' },
                { value: 'PENDING_REVIEW', label: 'Pending Review' },
                { value: 'PAID', label: 'Paid' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'VOID', label: 'Void' },
              ]}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsGenerateModalOpen(true)}
            className="px-4 h-10 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-yellow-text text-xs font-bold rounded-full shadow-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Summarise Bill</span>
          </button>
        </div>
      </div>

      {/* INVOICES TABLE */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-fixed">
            <thead>
              <tr className="bg-brand-canvas/60 border-b border-brand-border text-brand-text-muted font-semibold text-[11px]">
                <th className="w-[18%] py-3.5 px-4 font-normal">Invoice #</th>
                <th className="w-[26%] py-3.5 px-4 font-normal">Household / Parent</th>
                <th className="w-[14%] py-3.5 px-4 font-normal">Billing Month</th>
                <th className="w-[16%] py-3.5 px-4 font-normal">Total Amount</th>
                <th className="w-[14%] py-3.5 px-4 font-normal">Status</th>
                <th className="w-[12%] py-3.5 px-4 text-right font-normal">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-brand-text-subtle">
                    No invoices match your search criteria. Click &ldquo;Summarise Bill&rdquo; to create statements.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-brand-canvas transition-colors">
                    <td className="py-4 px-4 font-bold text-brand-text-primary truncate">
                      #{inv.invoiceNo}
                    </td>
                    <td className="py-4 px-4 truncate">
                      <div className="font-bold text-brand-text-primary truncate">{inv.parentName}</div>
                      <div className="text-[11px] text-brand-text-subtle truncate">{inv.parentEmail}</div>
                    </td>
                    <td className="py-4 px-4 text-brand-text-primary">
                      {inv.billingMonth}
                    </td>
                    <td className="py-4 px-4 font-bold text-brand-primary">
                      {formatTHB(inv.totalAmount)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-semibold text-brand-text-primary">
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingInvoice(inv)}
                        className="text-brand-text-muted hover:text-brand-primary font-medium text-xs cursor-pointer mr-3"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(inv.id, inv.invoiceNo)}
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

      {/* SUMMARISE BILL MODAL */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface w-full max-w-2xl rounded-2xl border border-brand-border shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-base font-bold text-brand-text-primary">Summarise Bill</h3>
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-brand-text-subtle hover:text-brand-text-primary p-1 rounded-lg hover:bg-brand-canvas transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student & Parent */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase">Student &amp; Parent</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full h-10 px-3 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary cursor-pointer font-medium"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.nickname})
                    </option>
                  ))}
                </select>

                <div className="w-full h-10 px-3 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-muted flex items-center truncate">
                  <span className="truncate">
                    Parent: <strong className="text-brand-text-primary font-semibold">{currentStudent?.parentName}</strong> ({currentStudent?.parentEmail})
                  </span>
                </div>
              </div>
            </div>

            {/* Period */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-brand-text-muted uppercase">Period</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPeriodStart('2026-11-01');
                      setPeriodEnd('2026-11-30');
                    }}
                    className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-brand-border hover:bg-brand-canvas text-brand-text-muted cursor-pointer"
                  >
                    Nov 2026
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPeriodStart('2026-10-01');
                      setPeriodEnd('2026-10-31');
                    }}
                    className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-brand-border hover:bg-brand-canvas text-brand-text-muted cursor-pointer"
                  >
                    Oct 2026
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPeriodStart('2026-09-01');
                      setPeriodEnd('2026-12-31');
                    }}
                    className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-brand-border hover:bg-brand-canvas text-brand-text-muted cursor-pointer"
                  >
                    Term
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full h-10 px-3 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                />
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full h-10 px-3 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            {/* Classes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-brand-text-muted uppercase">
                  Classes ({periodSessions.length})
                </label>
                {periodSessions.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs text-brand-primary font-bold hover:underline cursor-pointer"
                  >
                    {selectedSessionIds.length === periodSessions.filter((s) => !s.isBilled).length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                )}
              </div>

              <div className="border border-brand-border rounded-xl overflow-hidden bg-brand-canvas/30 max-h-52 overflow-y-auto">
                {periodSessions.length === 0 ? (
                  <div className="py-6 text-center text-xs text-brand-text-subtle">
                    No classes found in selected period.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs table-fixed">
                    <thead>
                      <tr className="bg-brand-canvas border-b border-brand-border text-brand-text-muted font-semibold text-[10px] uppercase">
                        <th className="w-10 py-2.5 px-3 text-center"></th>
                        <th className="w-[28%] py-2.5 px-3 font-normal">Date &amp; Time</th>
                        <th className="w-[34%] py-2.5 px-3 font-normal">Class</th>
                        <th className="w-[20%] py-2.5 px-3 font-normal">Teacher</th>
                        <th className="w-[18%] py-2.5 px-3 text-right font-normal">Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/60">
                      {periodSessions.map((sess) => {
                        const isSelected = selectedSessionIds.includes(sess.id);
                        return (
                          <tr
                            key={sess.id}
                            onClick={() => !sess.isBilled && toggleSession(sess.id)}
                            className={`transition-colors cursor-pointer ${
                              sess.isBilled
                                ? 'opacity-40 bg-brand-canvas/40 cursor-not-allowed'
                                : isSelected
                                ? 'bg-brand-yellow/10 hover:bg-brand-yellow/20'
                                : 'hover:bg-brand-canvas'
                            }`}
                          >
                            <td className="py-2 px-3 text-center">
                              <input
                                type="checkbox"
                                disabled={sess.isBilled}
                                checked={isSelected}
                                onChange={() => toggleSession(sess.id)}
                                className="w-4 h-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary cursor-pointer"
                              />
                            </td>
                            <td className="py-2 px-3 font-medium text-brand-text-primary whitespace-nowrap">
                              <div>{sess.sessionDate}</div>
                              <div className="text-[10px] text-brand-text-muted">{sess.startTime} - {sess.endTime}</div>
                            </td>
                            <td className="py-2 px-3 truncate text-brand-text-primary font-medium">
                              <div>{sess.description}</div>
                              {sess.isBilled && (
                                <span className="text-[10px] text-brand-text-muted font-normal">(Billed)</span>
                              )}
                            </td>
                            <td className="py-2 px-3 truncate text-brand-text-muted">
                              {sess.teacherName}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-brand-primary">
                              {formatTHB(sess.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-brand-border flex items-center justify-between">
              <div className="text-xs">
                <span className="text-brand-text-muted mr-1.5">{selectedSessionIds.length} classes:</span>
                <span className="font-bold text-brand-text-primary text-base">{formatTHB(selectedTotalSatang)}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 border border-brand-border rounded-xl text-xs font-semibold text-brand-text-muted hover:bg-brand-canvas cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || selectedSessionIds.length === 0}
                  onClick={handleIssueStudentInvoice}
                  className="px-5 py-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-yellow-text rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Issuing...' : 'Issue Bill'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE INVOICE MODAL */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface w-full max-w-sm rounded-2xl border border-brand-border shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-base font-bold text-brand-text-primary">Manage #{editingInvoice.invoiceNo}</h3>
              <button
                type="button"
                onClick={() => setEditingInvoice(null)}
                className="text-brand-text-subtle hover:text-brand-text-primary p-1 rounded-lg hover:bg-brand-canvas transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-bold text-brand-text-muted">
                Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['ISSUED', 'PAID', 'PENDING_REVIEW', 'VOID'] as InvoiceStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(editingInvoice.id, st)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer ${
                      editingInvoice.status === st
                        ? 'bg-brand-yellow text-brand-yellow-text border-brand-yellow'
                        : 'border-brand-border text-brand-text-primary hover:bg-brand-canvas'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-brand-border">
              <button
                type="button"
                onClick={() => handleDelete(editingInvoice.id, editingInvoice.invoiceNo)}
                className="text-xs font-semibold text-brand-red hover:underline cursor-pointer"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setEditingInvoice(null)}
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