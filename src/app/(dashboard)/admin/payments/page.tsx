import { getCurrentUser } from '@/server/actions/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PaymentsView, { PaymentItem } from '@/components/admin/PaymentsView';

export default async function AdminPaymentsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  const rawPayments = await prisma.payment.findMany({
    include: {
      invoice: {
        include: {
          parent: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const paymentItems: PaymentItem[] = rawPayments.map((p) => ({
    id: p.id,
    invoiceId: p.invoiceId,
    invoiceNo: p.invoice.invoiceNo,
    parentName: p.invoice.parent.fullName || p.invoice.parent.email,
    parentEmail: p.invoice.parent.email,
    incurredAmount: p.invoice.totalAmount,
    detectedAmount: p.detectedAmount,
    method: 'QR',
    refCode: p.transactionRef,
    slipUrl: p.slipUrl,
    transferDate: p.transferDate.toISOString(),
    verificationStatus: p.verificationStatus,
    rawSlipData: p.rawSlipData,
  }));

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="border-b border-brand-border pb-5">
        <h1 className="text-2xl font-black text-brand-text-primary tracking-tight">Payments</h1>
      </div>

      <PaymentsView initialPayments={paymentItems} />
    </div>
  );
}
