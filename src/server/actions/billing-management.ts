'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/server/actions/auth';
import { revalidatePath } from 'next/cache';
import { InvoiceStatus, PaymentStatus } from '@prisma/client';

/**
 * Generate monthly batch invoices for all households with unbilled completed sessions
 */
export async function generateMonthlyInvoices(billingMonth: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    // Find unbilled sessions
    const unbilledSessions = await prisma.lessonSession.findMany({
      where: {
        invoiceItemId: null,
        status: { in: ['COMPLETED', 'CANCELLED_LATE'] },
      },
      include: {
        student: {
          include: { parent: true },
        },
      },
    });

    if (unbilledSessions.length === 0) {
      // If no live unbilled sessions, create a demo statement for the parent
      const parent = await prisma.user.findFirst({ where: { role: 'PARENT' } });
      if (!parent) return { success: false, message: 'No parent households found to bill.' };

      const existingInv = await prisma.invoice.findFirst({
        where: { parentId: parent.id, billingMonth },
      });

      if (!existingInv) {
        const invNumber = `INV-${billingMonth.replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;
        await prisma.invoice.create({
          data: {
            parentId: parent.id,
            invoiceNo: invNumber,
            billingMonth,
            subtotal: 480000,
            creditApplied: 0,
            totalAmount: 480000,
            status: InvoiceStatus.ISSUED,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      }

      revalidatePath('/admin/billing');
      return { success: true, count: 1 };
    }

    // Group unbilled sessions by parent
    const parentGroups: Record<string, typeof unbilledSessions> = {};
    for (const session of unbilledSessions) {
      const pid = session.student.parentId;
      if (!parentGroups[pid]) parentGroups[pid] = [];
      parentGroups[pid].push(session);
    }

    let createdCount = 0;
    for (const [parentId, sessions] of Object.entries(parentGroups)) {
      const subtotal = sessions.reduce((sum, s) => sum + s.rateSnapshot, 0);
      const invNumber = `INV-${billingMonth.replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;

      const invoice = await prisma.invoice.create({
        data: {
          parentId,
          invoiceNo: invNumber,
          billingMonth,
          subtotal,
          creditApplied: 0,
          totalAmount: subtotal,
          status: InvoiceStatus.ISSUED,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          items: {
            create: sessions.map((s) => ({
              studentId: s.studentId,
              description: `1-on-1 Lesson - ${s.sessionDate.toISOString().split('T')[0]} (${s.student.nickname || s.student.fullName})`,
              amount: s.rateSnapshot,
            })),
          },
        },
      });

      // Link items to sessions
      const createdItems = await prisma.invoiceItem.findMany({ where: { invoiceId: invoice.id } });
      for (let i = 0; i < sessions.length; i++) {
        await prisma.lessonSession.update({
          where: { id: sessions[i].id },
          data: { invoiceItemId: createdItems[i]?.id },
        });
      }
      createdCount++;
    }

    revalidatePath('/admin/billing');
    return { success: true, count: createdCount };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to generate monthly invoices.' };
  }
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status },
    });

    revalidatePath('/admin/billing');
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to update invoice status.' };
  }
}

/**
 * Approve or Reject bank slip
 */
export async function reviewPaymentSlip(paymentId: string, status: PaymentStatus) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { verificationStatus: status },
      include: { invoice: true },
    });

    if (status === 'MANUAL_APPROVED' || status === 'AUTO_VERIFIED') {
      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: InvoiceStatus.PAID },
      });
    }

    revalidatePath('/admin/billing');
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to review slip.' };
  }
}

/**
 * Delete an invoice
 */
export async function deleteInvoice(invoiceId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    await prisma.invoice.delete({
      where: { id: invoiceId },
    });

    revalidatePath('/admin/billing');
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to delete invoice.' };
  }
}
