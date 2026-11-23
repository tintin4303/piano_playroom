import { getCurrentUser } from '@/server/actions/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import InvoicesTable, { InvoiceRecord, PendingPaymentRecord } from '@/components/admin/InvoicesTable';

export default async function AdminBillingPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  const [rawInvoices, rawPayments] = await Promise.all([
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
    parentId: inv.parentId,
    parentName: inv.parent.fullName || inv.parent.email,
    parentEmail: inv.parent.email,
    billingMonth: inv.billingMonth,
    totalAmount: inv.totalAmount,
    status: inv.status,
    itemsCount: inv.items.length,
  }));

  const pendingPayments: PendingPaymentRecord[] = rawPayments.map((p) => ({
    id: p.id,
    invoiceId: p.invoiceId,
    invoiceNo: p.invoice.invoiceNo,
    parentName: p.invoice.parent.fullName || p.invoice.parent.email,
    detectedAmount: p.detectedAmount,
    slipUrl: p.slipUrl,
    transferDate: p.transferDate.toISOString(),
    transactionRef: p.transactionRef,
    verificationStatus: p.verificationStatus,
  }));

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="border-b border-brand-border pb-5">
        <h1 className="text-2xl font-black text-brand-text-primary tracking-tight">Billing &amp; Payments</h1>
      </div>

      <InvoicesTable initialInvoices={invoices} pendingPayments={pendingPayments} />
    </div>
  );
}
