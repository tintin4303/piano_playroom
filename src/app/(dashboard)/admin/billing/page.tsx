import { getCurrentUser } from '@/server/actions/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { formatTHB } from '@/lib/currency';
import InvoicesTable, { InvoiceRecord } from '@/components/admin/InvoicesTable';

export default async function AdminBillingPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  const [rawInvoices, pendingPayments] = await Promise.all([
    prisma.invoice.findMany({
      include: {
        parent: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.payment.findMany({
      where: { verificationStatus: 'AMOUNT_MISMATCH' },
      include: {
        invoice: {
          include: { parent: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const invoices: InvoiceRecord[] = rawInvoices.map((inv) => ({
    id: inv.id,
    invoiceNo: inv.invoiceNo,
    parentName: inv.parent.fullName || inv.parent.email,
    parentEmail: inv.parent.email,
    billingMonth: inv.billingMonth,
    totalAmount: inv.totalAmount,
    status: inv.status,
  }));

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="border-b border-brand-border pb-5">
        <h1 className="text-2xl font-black text-brand-text-primary tracking-tight">Billing &amp; Payments</h1>
      </div>

      {/* Pending Slips Alert Section */}
      {pendingPayments.length > 0 && (
        <div className="bg-[#FFF9E6] border border-[#FDE68A] rounded-2xl p-5 space-y-3">
          <div className="text-[10px] uppercase font-bold tracking-wider text-brand-yellow-text">
            Bank Slips Requiring Review ({pendingPayments.length})
          </div>
          <div className="divide-y divide-[#FDE68A]/60">
            {pendingPayments.map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-brand-yellow-text">
                    Invoice #{p.invoice.invoiceNo} — {p.invoice.parent.fullName || p.invoice.parent.email}
                  </div>
                  <div className="text-[11px] text-[#A17C00]">
                    Slip Amount: {formatTHB(p.detectedAmount)}
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-1.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-yellow-text rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
                >
                  Inspect Slip
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice Ledger with Interactive Search & Filter */}
      <InvoicesTable initialInvoices={invoices} />
    </div>
  );
}
