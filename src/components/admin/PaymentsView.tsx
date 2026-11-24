'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatTHB } from '@/lib/currency';
import CustomDropdown from '@/components/shared/CustomDropdown';
import { reviewPaymentSlip } from '@/server/actions/billing-management';
import { PaymentStatus } from '@prisma/client';
import { Check, X, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';

export interface PaymentItem {
  id: string;
  invoiceId: string;
  invoiceNo: string;
  parentName: string;
  parentEmail: string;
  incurredAmount: number; // satang
  detectedAmount: number; // satang
  method: string; // 'QR'
  refCode: string;
  slipUrl: string;
  transferDate: string;
  verificationStatus: PaymentStatus;
  rawSlipData?: any;
}

interface PaymentsViewProps {
  initialPayments: PaymentItem[];
}

export default function PaymentsView({
  initialPayments,
}: PaymentsViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = initialPayments.filter((p) => {
    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      p.refCode.toLowerCase().includes(query) ||
      p.parentName.toLowerCase().includes(query) ||
      p.parentEmail.toLowerCase().includes(query) ||
      p.invoiceNo.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'CONFIRMED' && (p.verificationStatus === 'MANUAL_APPROVED' || p.verificationStatus === 'AUTO_VERIFIED')) ||
      (statusFilter === 'PENDING' && (p.verificationStatus === 'AMOUNT_MISMATCH' || p.verificationStatus === 'AUTO_VERIFIED')) ||
      (statusFilter === 'REJECTED' && p.verificationStatus === 'REJECTED');

    return matchesSearch && matchesStatus;
  });

  async function handleConfirm(paymentId: string) {
    setIsSubmitting(true);
    const res = await reviewPaymentSlip(paymentId, 'MANUAL_APPROVED');
    setIsSubmitting(false);

    if (res.success) {
      setSelectedPayment(null);
      router.refresh();
    } else {
      alert(res.message || 'Confirmation failed');
    }
  }

  async function handleReject(paymentId: string) {
    if (!confirm('Reject this payment slip?')) return;
    setIsSubmitting(true);
    const res = await reviewPaymentSlip(paymentId, 'REJECTED');
    setIsSubmitting(false);

    if (res.success) {
      setSelectedPayment(null);
      router.refresh();
    } else {
      alert(res.message || 'Rejection failed');
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search payments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 px-3.5 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary placeholder:text-brand-text-subtle focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="w-full sm:w-44">
            <CustomDropdown
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'CONFIRMED', label: 'Confirmed' },
                { value: 'PENDING', label: 'Pending Review' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-fixed">
            <thead>
              <tr className="bg-brand-canvas/60 border-b border-brand-border text-brand-text-muted font-semibold text-[11px]">
                <th className="w-[26%] py-3.5 px-4 font-normal">Household / Parent</th>
                <th className="w-[14%] py-3.5 px-4 font-normal">Invoice #</th>
                <th className="w-[15%] py-3.5 px-4 font-normal">Amount</th>
                <th className="w-[15%] py-3.5 px-4 font-normal">Ref Code</th>
                <th className="w-[10%] py-3.5 px-4 font-normal">Slip</th>
                <th className="w-[20%] py-3.5 px-4 text-right font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-brand-text-subtle">
                    No payments found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isConfirmed = item.verificationStatus === 'MANUAL_APPROVED' || item.verificationStatus === 'AUTO_VERIFIED';
                  const isRejected = item.verificationStatus === 'REJECTED';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedPayment(item)}
                      className="hover:bg-brand-canvas transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4 font-bold text-brand-text-primary truncate">
                        <div>{item.parentName}</div>
                        <div className="text-[11px] text-brand-text-muted font-normal">{item.parentEmail}</div>
                      </td>

                      <td className="py-4 px-4 text-brand-text-primary font-medium truncate">
                        #{item.invoiceNo}
                      </td>

                      <td className="py-4 px-4 font-bold text-brand-primary truncate">
                        {formatTHB(item.detectedAmount)}
                      </td>

                      <td className="py-4 px-4 font-mono text-brand-text-muted text-[11px] truncate">
                        {item.refCode.slice(0, 10)}...
                      </td>

                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        {item.slipUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedPayment(item)}
                            className="w-8 h-10 rounded border border-brand-border bg-brand-canvas hover:border-brand-primary overflow-hidden flex items-center justify-center p-0.5 transition cursor-pointer shadow-2xs"
                            title="Inspect Slip"
                          >
                            <img
                              src={item.slipUrl}
                              alt="Bank Slip"
                              className="w-full h-full object-cover rounded-xs"
                            />
                          </button>
                        ) : (
                          <span className="text-brand-text-subtle">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        {isConfirmed ? (
                          <span className="text-[11px] font-semibold text-brand-text-primary">
                            Confirmed
                          </span>
                        ) : isRejected ? (
                          <span className="text-[11px] font-semibold text-brand-red">
                            Rejected
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPayment(item);
                            }}
                            className="px-3 py-1 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-yellow-text text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
                          >
                            Review
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Inspection Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface w-full max-w-2xl rounded-2xl border border-brand-border shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-base font-bold text-brand-text-primary">
                Verify Payment #{selectedPayment.invoiceNo}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="text-brand-text-subtle hover:text-brand-text-primary p-1 rounded-lg hover:bg-brand-canvas transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Left: Slip */}
              <div className="space-y-2">
                <div className="rounded-xl border border-brand-border bg-brand-canvas p-2 overflow-hidden flex items-center justify-center">
                  <img
                    src={selectedPayment.slipUrl}
                    alt="Bank Slip"
                    className="max-h-72 w-auto object-contain rounded-lg shadow-xs"
                  />
                </div>
                <div className="text-center">
                  <a
                    href={selectedPayment.slipUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-brand-primary font-semibold hover:underline"
                  >
                    <span>Open full slip</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Right: Data */}
              <div className="space-y-3 text-xs">
                {selectedPayment.incurredAmount === selectedPayment.detectedAmount ? (
                  <div className="p-3 rounded-xl bg-brand-canvas border border-brand-border text-brand-text-primary space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-brand-primary" />
                      <span>Amount Check Passed</span>
                    </div>
                    <p className="text-[11px] text-brand-text-muted">
                      Detected slip amount ({formatTHB(selectedPayment.detectedAmount)}) matches invoice total.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-brand-canvas border border-brand-border text-brand-red space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <AlertCircle className="w-4 h-4 text-brand-red" />
                      <span>Amount Mismatch</span>
                    </div>
                    <p className="text-[11px] text-brand-text-muted">
                      Expected {formatTHB(selectedPayment.incurredAmount)}, detected {formatTHB(selectedPayment.detectedAmount)}.
                    </p>
                  </div>
                )}

                <div className="bg-brand-canvas rounded-xl border border-brand-border p-3 space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-brand-text-muted">Sender:</span>
                    <strong className="text-brand-text-primary">{selectedPayment.parentName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-text-muted">Receiver:</span>
                    <span className="text-brand-text-primary">Piano Playroom Studio</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-text-muted">Ref Code:</span>
                    <span className="font-mono text-brand-text-primary">{selectedPayment.refCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-text-muted">Date:</span>
                    <span className="text-brand-text-primary">{new Date(selectedPayment.transferDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-brand-border/60">
                    <span className="text-brand-text-muted font-bold">Transfer Amount:</span>
                    <strong className="text-sm font-bold text-brand-primary">{formatTHB(selectedPayment.detectedAmount)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-brand-border">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleReject(selectedPayment.id)}
                className="px-4 py-2 border border-brand-border rounded-xl text-xs font-semibold text-brand-red hover:bg-brand-canvas cursor-pointer disabled:opacity-50"
              >
                Reject Slip
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="px-4 py-2 border border-brand-border rounded-xl text-xs font-semibold text-brand-text-muted hover:bg-brand-canvas cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleConfirm(selectedPayment.id)}
                  className="px-5 py-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-yellow-text rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Confirm Transfer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}