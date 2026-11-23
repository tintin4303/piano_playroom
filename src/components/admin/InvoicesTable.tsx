'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatTHB } from '@/lib/currency';
import CustomDropdown from '@/components/shared/CustomDropdown';
import {
  generateMonthlyInvoices,
  updateInvoiceStatus,
  reviewPaymentSlip,
  deleteInvoice,
} from '@/server/actions/billing-management';
import { InvoiceStatus, PaymentStatus } from '@prisma/client';
import { Check, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

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

export interface PendingPaymentRecord {
  id: string;
  invoiceId: string;
  invoiceNo: string;
  parentName: string;
  detectedAmount: number;
  slipUrl: string;
  transferDate: string;
  transactionRef: string;
  verificationStatus: PaymentStatus;
}

interface InvoicesTableProps {
  initialInvoices: InvoiceRecord[];
  pendingPayments: PendingPaymentRecord[];
}

export default function InvoicesTable({ initialInvoices, pendingPayments }: InvoicesTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals state
  const [selectedSlip, setSelectedSlip] = useState<PendingPaymentRecord | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceRecord | null>(null);

  // Auto-send notification simulation state
  const [autoSendNotification, setAutoSendNotification] = useState(true);

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

  // Generate monthly invoices batch action
  async function handleGenerateBatch() {
    setIsGenerating(true);
    const res = await generateMonthlyInvoices('2026-11');
    setIsGenerating(false);

    if (res.success) {
      alert(`Successfully generated invoices for ${res.count} household(s). ${autoSendNotification ? 'Dispatch notifications sent to parents.' : ''}`);
      router.refresh();
    } else {
      alert(res.message || 'Generation failed.');
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

  // Slip approval / rejection
  async function handleReviewSlip(paymentId: string, decision: PaymentStatus) {
    setIsSubmitting(true);
    const res = await reviewPaymentSlip(paymentId, decision);
    setIsSubmitting(false);

    if (res.success) {
      setSelectedSlip(null);
      router.refresh();
    } else {
      alert(res.message || 'Review failed.');
    }
  }

  return (
    <div className="space-y-6">
      {/* PENDING SLIP REVIEW SECTION */}
      {pendingPayments.length > 0 && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase font-bold tracking-wider text-brand-yellow-text">
              Bank Slips Requiring Approval ({pendingPayments.length})
            </div>
            <span className="text-[11px] text-brand-text-muted">Thai QR / SlipOK Verification</span>
          </div>

          <div className="divide-y divide-brand-border/60">
            {pendingPayments.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-brand-text-primary">
                    Invoice #{p.invoiceNo} — {p.parentName}
                  </div>
                  <div className="text-brand-text-muted text-[11px] mt-0.5">
                    Detected Slip Amount: <strong className="text-brand-text-primary">{formatTHB(p.detectedAmount)}</strong> • Ref: {p.transactionRef.slice(0, 10)}...
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSlip(p)}
                    className="px-3.5 h-8.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-yellow-text rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
                  >
                    Inspect Slip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP CONTROLS & BATCH ACTIONS */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search invoice # or parent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 px-3.5 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary placeholder:text-brand-text-subtle focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-44">
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
              disabled={isGenerating}
              onClick={handleGenerateBatch}
              className="px-4 h-10 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-yellow-text text-xs font-bold rounded-full shadow-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Generating...' : 'Generate Monthly Invoices'}</span>
            </button>
          </div>
        </div>

        {/* Optional Automatic Parent Notification Checkbox (Meeting Brief Feature) */}
        <div className="pt-3 border-t border-brand-border/60 flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSendNotification}
              onChange={(e) => setAutoSendNotification(e.target.checked)}
              className="rounded border-brand-border text-brand-primary focus:ring-brand-primary w-4 h-4"
            />
            <span className="font-semibold text-brand-text-primary">
              Automatically dispatch billing statements to parents upon invoice creation (LINE / Email)
            </span>
          </label>
          <span className="text-[11px] text-brand-text-muted hidden md:inline">Studio Automation</span>
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
                    No invoices match your search criteria. Click &ldquo;Generate Monthly Invoices&rdquo; to create statements.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-brand-canvas transition-colors">
                    <td className="py-4 px-4 font-bold text-brand-text-primary truncate">
                      {inv.invoiceNo}
                    </td>
                    <td className="py-4 px-4 font-medium text-brand-text-primary truncate">
                      <div>{inv.parentName}</div>
                      <div className="text-[11px] text-brand-text-subtle">{inv.parentEmail}</div>
                    </td>
                    <td className="py-4 px-4 text-brand-text-muted truncate">
                      {inv.billingMonth}
                    </td>
                    <td className="py-4 px-4 font-bold text-brand-text-primary truncate">
                      {formatTHB(inv.totalAmount)}
                    </td>
                    <td className="py-4 px-4 text-brand-text-primary font-medium truncate">
                      {inv.status}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingInvoice(inv)}
                        className="text-brand-text-muted hover:text-brand-primary font-medium text-xs cursor-pointer mr-3"
                      >
                        Manage
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

      {/* INSPECT SLIP MODAL */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface w-full max-w-lg rounded-2xl border border-brand-border shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">Bank Slip Verification Studio</h3>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Invoice #{selectedSlip.invoiceNo} — {selectedSlip.parentName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlip(null)}
                className="text-brand-text-subtle hover:text-brand-text-primary p-1 rounded-lg hover:bg-brand-canvas transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Slip OCR Inspector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-brand-canvas rounded-xl border border-brand-border p-3 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-full h-44 bg-brand-surface border border-dashed border-brand-border rounded-lg flex flex-col items-center justify-center text-xs text-brand-text-muted p-2">
                  <span className="font-bold text-brand-text-primary">KBANK Transfer Slip</span>
                  <span className="text-[10px] text-brand-text-subtle mt-1">Mock Slip Payload Uploaded</span>
                  <span className="text-[11px] font-bold text-brand-primary mt-3">{formatTHB(selectedSlip.detectedAmount)}</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-brand-canvas rounded-xl border border-brand-border space-y-1.5">
                  <div className="text-[10px] font-bold uppercase text-brand-text-muted">SlipOK OCR Status</div>
                  <div className="font-bold text-brand-yellow-text flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-brand-yellow-text" />
                    <span>Amount Check Pending</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div><span className="text-brand-text-muted">Detected Amount:</span> <strong>{formatTHB(selectedSlip.detectedAmount)}</strong></div>
                  <div><span className="text-brand-text-muted">Transaction Ref:</span> <strong>{selectedSlip.transactionRef}</strong></div>
                  <div><span className="text-brand-text-muted">Transfer Time:</span> <strong>{new Date(selectedSlip.transferDate).toLocaleString()}</strong></div>
                </div>
              </div>
            </div>

            {/* Decision Actions */}
            <div className="pt-3 border-t border-brand-border flex items-center justify-between">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleReviewSlip(selectedSlip.id, 'REJECTED')}
                className="px-4 py-2 border border-brand-border rounded-xl text-xs font-semibold text-brand-red hover:bg-brand-canvas cursor-pointer disabled:opacity-50"
              >
                Reject Slip
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSlip(null)}
                  className="px-4 py-2 border border-brand-border rounded-xl text-xs font-semibold text-brand-text-muted hover:bg-brand-canvas cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleReviewSlip(selectedSlip.id, 'MANUAL_APPROVED')}
                  className="px-5 py-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-yellow-text rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve Payment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE INVOICE MODAL */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface w-full max-w-sm rounded-2xl border border-brand-border shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">Manage Invoice</h3>
                <p className="text-xs text-brand-text-muted mt-0.5">#{editingInvoice.invoiceNo} • {editingInvoice.parentName}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingInvoice(null)}
                className="text-brand-text-subtle hover:text-brand-text-primary p-1 rounded-lg hover:bg-brand-canvas transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] uppercase font-bold text-brand-text-muted">
                Update Statement Status
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
                Delete Statement
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
