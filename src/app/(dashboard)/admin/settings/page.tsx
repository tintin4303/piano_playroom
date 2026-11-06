import { getCurrentUser } from '@/server/actions/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  const settings = await prisma.schoolSettings.findUnique({
    where: { id: 'default-settings' },
  });

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between border-b border-brand-border pb-5">
        <div>
          <h1 className="text-2xl font-black text-brand-text-primary tracking-tight">Studio Settings</h1>
        </div>
      </div>

      <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xs p-6 space-y-6">
        <div>
          <h2 className="text-sm font-bold text-brand-text-primary">School Profile &amp; Banking Configuration</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-bold text-brand-text-muted">
              Studio Name
            </label>
            <input
              type="text"
              readOnly
              value={settings?.schoolName || 'Piano Playroom'}
              className="w-full px-3.5 py-2.5 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-bold text-brand-text-muted">
              Receiving Bank
            </label>
            <input
              type="text"
              readOnly
              value={settings?.bankName || 'Kasikornbank (KBANK)'}
              className="w-full px-3.5 py-2.5 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-bold text-brand-text-muted">
              Bank Account Number
            </label>
            <input
              type="text"
              readOnly
              value={settings?.bankAccountNumber || '095-2-12345-6'}
              className="w-full px-3.5 py-2.5 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-bold text-brand-text-muted">
              PromptPay ID
            </label>
            <input
              type="text"
              readOnly
              value={settings?.promptPayId || '0952123456'}
              className="w-full px-3.5 py-2.5 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-[10px] uppercase font-bold text-brand-text-muted">
              Official Account Name
            </label>
            <input
              type="text"
              readOnly
              value={settings?.bankAccountName || 'Piano Playroom Studio Co., Ltd.'}
              className="w-full px-3.5 py-2.5 bg-brand-canvas border border-brand-border rounded-xl text-xs text-brand-text-primary focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
