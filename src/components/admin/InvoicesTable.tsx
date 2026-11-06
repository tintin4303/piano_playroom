'use client';

import { useState } from 'react';
import { formatTHB } from '@/lib/currency';
import CustomDropdown from '@/components/shared/CustomDropdown';

export interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  parentName: string;
  parentEmail: string;
  billingMonth: string;
  totalAmount: number;
  status: string;
}

interface InvoicesTableProps {
  initialInvoices: InvoiceRecord[];
}

export default function InvoicesTable({ initialInvoices }: InvoicesTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

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

  return (
    <div className="space-y-4">
      {/* Control Bar: Search and Filter with uniform 40px height */}
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
      </div>

      {/* Table */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-fixed">
            <thead>
              <tr className="bg-brand-canvas/60 border-b border-brand-border text-brand-text-muted font-semibold text-[11px]">
                <th className="w-[20%] py-3 px-4 font-normal">Invoice #</th>
                <th className="w-[25%] py-3 px-4 font-normal">Household / Parent</th>
                <th className="w-[15%] py-3 px-4 font-normal">Month</th>
                <th className="w-[20%] py-3 px-4 font-normal">Total Amount</th>
                <th className="w-[20%] py-3 px-4 text-right font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-brand-text-subtle">
                    No invoices match your search criteria.
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
                    <td className="py-4 px-4 text-right font-semibold text-brand-text-primary">
                      {inv.status}
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
