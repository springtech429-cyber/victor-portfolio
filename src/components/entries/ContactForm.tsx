'use client';
import { useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { submitMessage } from '@/lib/admin-api';
import { isBackendConfigured } from '@/lib/supabase-browser';

const field = 'w-full rounded-lg border hairline bg-bg-card/60 px-4 py-3.5 text-text-primary placeholder:text-text-secondary/60 transition-colors focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  const send = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    if (d.get('website')) return setStatus('done'); // hidden field: only bots fill it in
    setStatus('sending');
    setError('');
    try {
      if (!isBackendConfigured) throw new Error('The contact form is not connected yet.');
      await submitMessage({ name: String(d.get('name') || '').trim(), email: String(d.get('email') || '').trim(), message: String(d.get('message') || '').trim() });
      form.reset();
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div role="status" className="rounded-xl border border-neon-blue/40 bg-bg-card/60 p-10 text-center">
        <CheckCircle2 className="mx-auto text-neon-blue" size={44} />
        <h2 className="mt-5 font-display text-2xl font-bold">Message sent</h2>
        <p className="mt-2 text-text-secondary">Thanks for reaching out. I will reply by email soon.</p>
        <button onClick={() => setStatus('idle')} className="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-neon-blue hover:underline">Send another message</button>
      </div>
    );
  }

  return (
    <form onSubmit={send} className="space-y-5" noValidate={false}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-text-secondary">Name</label>
          <input id="name" name="name" required maxLength={120} autoComplete="name" className={field} placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-text-secondary">Email</label>
          <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" className={field} placeholder="you@example.com" />
        </div>
      </div>
      <div>
        <label htmlFor="message" className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-text-secondary">Message</label>
        <textarea id="message" name="message" rows={6} required maxLength={5000} className={`${field} resize-none`} placeholder="What do you need, and by when?" />
      </div>
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {status === 'error' && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-400/40 bg-red-400/5 p-3 text-sm text-red-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" /> Your message was not sent: {error} Please try again.
        </p>
      )}
      <button type="submit" disabled={status === 'sending'} className="inline-flex items-center gap-3 rounded-full bg-neon-blue px-8 py-4 font-mono text-xs font-medium uppercase tracking-[0.16em] text-bg-primary transition-shadow hover:shadow-[0_0_40px_rgba(0,217,255,0.45)] disabled:opacity-50">
        {status === 'sending' ? 'Sending...' : <>Send message <Send size={14} /></>}
      </button>
    </form>
  );
}
