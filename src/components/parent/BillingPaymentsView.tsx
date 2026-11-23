'use client';

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import Image from 'next/image';
import { CheckCircle2, Clock3, CreditCard, Receipt, Upload, X } from 'lucide-react';
import { formatTHB } from '@/lib/currency';
import { parentStudents, type ParentInvoiceStatus } from '@/lib/parent-portal-mock';
import { dateObject, formatTime } from '@/lib/teacher-schedule-mock';
import { useParentMock } from './ParentMockProvider';
import { controlClass, dialogClass, displayDate, monthFormat, panelClass, ParentStatusBadge, primaryClass } from './ParentPortalUI';

const statuses: ParentInvoiceStatus[] = ['Unpaid', 'Awaiting review', 'Paid', 'Slip rejected'];
const submissionDate = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' });

export default function BillingPaymentsView() {
  const { invoices, lessons, today, submitSlip } = useParentMock();
  const [period, setPeriod] = useState('all');
  const [status, setStatus] = useState('all');
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [slip, setSlip] = useState<{ fileName: string; preview: string } | null>(null);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const [notice, setNotice] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const reader = useRef<FileReader | null>(null);
  const selectedInvoice = invoices.find((invoice) => invoice.id === invoiceId);
  const payable = selectedInvoice?.status === 'Unpaid' || selectedInvoice?.status === 'Slip rejected';
  const amountDue = invoices.filter((invoice) => invoice.status === 'Unpaid' || invoice.status === 'Slip rejected').reduce((sum, invoice) => sum + invoice.totalSatang, 0);
  const awaitingReview = invoices.filter((invoice) => invoice.status === 'Awaiting review').reduce((sum, invoice) => sum + invoice.totalSatang, 0);
  const unbilled = lessons.reduce((sum, lesson) => sum + lesson.unbilledSatang, 0);
  const filtered = invoices.filter((invoice) => (period === 'all' || invoice.periodDate === period) && (status === 'all' || invoice.status === status));

  function resetSlip() {
    reader.current?.abort();
    reader.current = null;
    setSlip(null);
    setError('');
    setReading(false);
  }

  function openInvoice(id: string) {
    resetSlip();
    setInvoiceId(id);
    setPaymentOpen(false);
    setNotice('');
    dialog.current?.showModal();
  }

  function selectSlip(event: ChangeEvent<HTMLInputElement>) {
    resetSlip();
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
      event.currentTarget.value = '';
      return;
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setError('Choose a non-empty image no larger than 5 MB.');
      event.currentTarget.value = '';
      return;
    }
    const fileReader = new FileReader();
    reader.current = fileReader;
    setReading(true);
    fileReader.onload = () => {
      if (reader.current !== fileReader) return;
      setReading(false);
      if (typeof fileReader.result === 'string') setSlip({ fileName: file.name, preview: fileReader.result });
    };
    fileReader.onerror = () => {
      if (reader.current !== fileReader) return;
      setReading(false);
      setError('This image could not be opened. Please choose another file.');
    };
    fileReader.readAsDataURL(file);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedInvoice || !payable || !slip || reading) return;
    submitSlip(selectedInvoice.id, slip.fileName);
    setNotice('Sample slip submitted. The invoice is awaiting admin review.');
    setPaymentOpen(false);
    resetSlip();
  }

  return <section aria-label="Billing and payments" className="space-y-5 text-brand-text-primary">
    <div>
      <h1 className="text-2xl font-black tracking-tight">Billing & Payments</h1>
      <p className="mt-1 text-sm text-brand-text-muted">Your family’s invoices and payment updates, together.</p>
    </div>

    <div className="rounded-2xl bg-brand-primary p-6 text-white sm:p-8">
      <p className="text-sm text-brand-primary-light">Household billing</p>
      <h2 className="mt-2 text-2xl font-black sm:text-3xl">One family. One clear statement.</h2>
      <p className="mt-3 max-w-2xl text-sm text-brand-primary-light">Review lesson charges for each child and follow the status of your payment.</p>
    </div>

    <p className="rounded-xl border border-brand-border bg-brand-primary-light px-4 py-3 text-sm text-brand-primary">Design preview · All amounts and bank details are samples. Slip selection stays on your device and resets on reload.</p>

    <div className="grid gap-4 sm:grid-cols-3">
      {[
        { label: 'Amount due', value: amountDue, note: 'Unpaid invoices, including slips to resubmit', icon: CreditCard },
        { label: 'Awaiting payment review', value: awaitingReview, note: 'Submitted slips waiting for confirmation', icon: Clock3 },
        { label: 'Fees awaiting billing', value: unbilled, note: 'Attended lessons not yet on an invoice', icon: Receipt },
      ].map(({ label, value, note, icon: Icon }) => <div key={label} className={panelClass}>
        <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-bold text-brand-text-muted">{label}</h2><Icon size={18} className="text-brand-primary" aria-hidden="true" /></div>
        <p className="mt-3 text-2xl font-black">{formatTHB(value)}</p>
        <p className="mt-2 text-xs text-brand-text-muted">{note}</p>
      </div>)}
    </div>

    <section className={panelClass} aria-labelledby="invoices-heading">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h2 id="invoices-heading" className="text-lg font-extrabold">Household invoices</h2><p className="mt-1 text-sm text-brand-text-muted">Each statement includes all children in your family.</p></div>
        <div className="flex flex-wrap gap-3">
          <label className="grid gap-1 text-xs font-bold text-brand-text-muted">Billing month
            <select value={period} onChange={(event) => setPeriod(event.target.value)} className={controlClass + ' bg-brand-surface'}>
              <option value="all">All months</option>
              {invoices.map((invoice) => <option key={invoice.id} value={invoice.periodDate}>{monthFormat.format(dateObject(invoice.periodDate))}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold text-brand-text-muted">Status
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={controlClass + ' bg-brand-surface'}>
              <option value="all">All statuses</option>
              {statuses.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </div>
      {filtered.length ? <ul className="mt-5 divide-y divide-brand-border">
        {filtered.map((invoice) => <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-primary-light text-brand-primary"><Receipt size={20} aria-hidden="true" /></div>
            <div><h3 className="font-extrabold">{monthFormat.format(dateObject(invoice.periodDate))}</h3><p className="mt-1 text-xs text-brand-text-muted">{invoice.number}</p><p className="mt-1 text-xs text-brand-text-muted">Due {displayDate(invoice.dueDate)}{invoice.dueDate < today && (invoice.status === 'Unpaid' || invoice.status === 'Slip rejected') ? ' · Overdue' : ''}</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="space-y-1.5"><p className="font-extrabold">{formatTHB(invoice.totalSatang)}</p><ParentStatusBadge status={invoice.status} /></div>
            <button type="button" className={controlClass} aria-label={'View invoice ' + invoice.number} onClick={() => openInvoice(invoice.id)}>View invoice</button>
          </div>
        </li>)}
      </ul> : <div className="py-12 text-center"><p className="font-bold">No matching invoices</p><p className="mt-1 text-sm text-brand-text-muted">Try another month or status.</p><button type="button" className={controlClass + ' mt-4'} onClick={() => { setPeriod('all'); setStatus('all'); }}>Clear filters</button></div>}
    </section>

    <dialog ref={dialog} className={dialogClass} aria-labelledby="invoice-dialog-title" onClose={() => { resetSlip(); setPaymentOpen(false); }}>
      <div className="flex items-start justify-between gap-4">
        <div><h2 id="invoice-dialog-title" className="text-xl font-black">Invoice details</h2><p className="mt-1 text-sm text-brand-text-muted">{selectedInvoice?.number}</p></div>
        <button type="button" className={controlClass} aria-label="Close invoice details" onClick={() => dialog.current?.close()}><X size={18} /></button>
      </div>
      {selectedInvoice && <div className="mt-5 space-y-5">
        <div className="flex flex-wrap justify-between gap-3 rounded-xl bg-brand-canvas p-4">
          <div><p className="font-bold">{monthFormat.format(dateObject(selectedInvoice.periodDate))}</p><p className="mt-1 text-sm text-brand-text-muted">Due {displayDate(selectedInvoice.dueDate)} · Household invoice</p></div>
          <div><ParentStatusBadge status={selectedInvoice.status} /></div>
        </div>
        {parentStudents.map((student) => {
          const items = selectedInvoice.items.filter((item) => item.studentId === student.id);
          if (!items.length) return null;
          return <section key={student.id} aria-label={student.name + ' charges'}>
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-extrabold">{student.name} · {student.instrument}</h3><span className="text-sm font-bold">{formatTHB(items.reduce((sum, item) => sum + item.amountSatang, 0))}</span></div>
            <ul className="mt-2 divide-y divide-brand-border">
              {items.map((item) => {
                const lesson = lessons.find((entry) => entry.id === item.lessonId);
                return <li key={item.lessonId} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div><p className="font-semibold">{displayDate(item.date)} · {student.duration} min</p><p className="mt-1 text-xs text-brand-text-muted">{student.teacher}{lesson ? ' · ' + formatTime(lesson.start) + '–' + formatTime(lesson.end) : ''}</p></div>
                  <span className="shrink-0 font-semibold">{formatTHB(item.amountSatang)}</span>
                </li>;
              })}
            </ul>
          </section>;
        })}
        <div className="flex items-center justify-between border-t border-brand-border pt-4 font-black"><span>Invoice total</span><span className="text-xl">{formatTHB(selectedInvoice.totalSatang)}</span></div>
        {selectedInvoice.rejectionReason && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800"><p className="font-bold">Please resubmit your slip</p><p className="mt-1">{selectedInvoice.rejectionReason}</p></div>}
        {selectedInvoice.submission && <div className="rounded-xl bg-brand-canvas p-4 text-sm"><p className="font-bold">{selectedInvoice.status === 'Paid' ? 'Payment confirmed' : 'Latest slip submission'}</p><p className="mt-1 break-all text-brand-text-muted">{selectedInvoice.submission.fileName}</p><p className="mt-1 text-xs text-brand-text-muted">Submitted {submissionDate.format(new Date(selectedInvoice.submission.submittedAt))} · Bangkok time</p></div>}
        {selectedInvoice.status === 'Awaiting review' && <p className="text-sm text-brand-text-muted">Your slip is awaiting admin review. No further submission is needed while it is being reviewed.</p>}
        {notice && <p role="status" className="flex items-start gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={18} className="shrink-0" aria-hidden="true" />{notice}</p>}
        {payable && !paymentOpen && <button type="button" className={primaryClass + ' w-full'} onClick={() => setPaymentOpen(true)}><Upload size={16} aria-hidden="true" />{selectedInvoice.status === 'Slip rejected' ? 'Resubmit payment slip' : 'Submit payment slip'}</button>}
        {payable && paymentOpen && <form onSubmit={submit} className="space-y-4 border-t border-brand-border pt-5">
          <h3 className="text-lg font-extrabold">Submit payment slip</h3>
          <div className="rounded-xl border border-brand-border bg-brand-canvas p-4 text-sm">
            <p className="font-bold">Sample bank details · Do not transfer money</p>
            <dl className="mt-3 space-y-2">
              {[['Bank', 'Example Bank'], ['Account name', 'Piano Playroom (sample)'], ['Account number', '000-0-00000-0'], ['Invoice amount', formatTHB(selectedInvoice.totalSatang)]].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-2"><dt className="text-brand-text-muted">{label}</dt><dd className="font-semibold">{value}</dd></div>)}
            </dl>
          </div>
          <label className="grid gap-2 text-sm font-bold">Slip image
            <input key={selectedInvoice.id} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectSlip} aria-describedby="slip-file-help slip-file-error" className="w-full rounded-xl border border-brand-border p-3 text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-brand-primary-light file:px-3 file:py-2 file:font-semibold file:text-brand-primary" />
          </label>
          <p id="slip-file-help" className="text-xs text-brand-text-muted">JPG, PNG, or WebP · Up to 5 MB. This preview does not upload your file.</p>
          <p id="slip-file-error" role="alert" className="text-sm text-red-800">{error}</p>
          {reading && <p role="status" className="text-sm text-brand-text-muted">Opening image…</p>}
          {slip && <div className="rounded-xl border border-brand-border p-3"><Image src={slip.preview} alt="Selected payment slip preview" width={600} height={400} unoptimized onError={() => { setSlip(null); setError('This image could not be displayed. Choose another file.'); }} className="mx-auto max-h-64 w-auto max-w-full rounded-lg object-contain" /><p className="mt-2 break-all text-xs text-brand-text-muted">{slip.fileName}</p></div>}
          <p className="text-sm text-brand-text-muted">Confirm this slip belongs to {selectedInvoice.number}. Submission moves the invoice to Awaiting review; payment is confirmed by the admin.</p>
          <div className="flex flex-wrap justify-end gap-2"><button type="button" className={controlClass} onClick={() => { resetSlip(); setPaymentOpen(false); }}>Cancel</button><button type="submit" className={primaryClass} disabled={!slip || reading}>Confirm sample submission</button></div>
        </form>}
      </div>}
    </dialog>
  </section>;
}
