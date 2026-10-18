import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useSiteData } from '../context/DataContext';
import { safeUrl } from '../lib/helpers';
import { iconForLink } from '../lib/linkIcon';

const inputCls =
  'w-full bg-bg-secondary border border-text-secondary/30 p-3 text-text-primary focus:border-neon-pink focus:outline-none focus:shadow-[0_0_10px_rgba(240,171,252,0.3)] transition-all font-mono';
const labelCls = 'text-sm font-mono text-neon-pink';

export function Contact() {
  const { profile } = useSiteData();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const links = profile.links.filter((l) => safeUrl(l.url));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    // Hidden field that real people never fill in; bots do.
    if (data.get('website')) {
      setStatus('success');
      return;
    }
    setStatus('submitting');
    setError('');
    try {
      await api.submitMessage({
        name: String(data.get('name') || '').trim(),
        email: String(data.get('email') || '').trim(),
        message: String(data.get('message') || '').trim(),
      });
      form.reset();
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-orbitron font-bold text-text-primary mb-4">
          GET IN <span className="text-neon-pink">TOUCH</span>
        </h2>
        <p className="text-text-secondary font-mono">
          Have a project in mind? Tell me what you need and I will reply by email.
        </p>
      </div>

      <div className="bg-bg-card border border-neon-pink/30 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-pink/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-12 text-center relative z-10" role="status">
            <CheckCircle size={64} className="text-neon-blue mb-4" />
            <h3 className="text-2xl font-orbitron text-text-primary mb-2">MESSAGE SENT</h3>
            <p className="text-text-secondary font-mono">Thanks for reaching out. I will get back to you soon.</p>
            <button onClick={() => setStatus('idle')} className="mt-8 text-neon-blue hover:underline font-mono">
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className={labelCls}>Name</label>
                <input type="text" id="name" name="name" required maxLength={120} autoComplete="name" className={inputCls} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className={labelCls}>Email</label>
                <input type="email" id="email" name="email" required maxLength={254} autoComplete="email" className={inputCls} placeholder="you@example.com" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className={labelCls}>Message</label>
              <textarea id="message" name="message" rows={5} required maxLength={5000} className={`${inputCls} resize-none`} placeholder="What do you need built, and by when?" />
            </div>

            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label htmlFor="website">Leave this empty</label>
              <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            {status === 'error' && (
              <div className="flex items-start gap-2 text-sm font-mono text-red-400 border border-red-400/40 bg-red-400/5 p-3" role="alert">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>Your message was not sent: {error} Please try again.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full py-4 bg-neon-pink/10 border border-neon-pink text-neon-pink font-orbitron font-bold tracking-widest hover:bg-neon-pink/20 hover:shadow-[0_0_15px_rgba(240,171,252,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? 'SENDING...' : (<>SEND MESSAGE <Send size={18} /></>)}
            </button>
          </form>
        )}
      </div>

      {links.length > 0 && (
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {links.map((link) => {
            const Icon = iconForLink(link);
            return (
              <a
                key={link.url + link.label}
                href={safeUrl(link.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border border-text-secondary/30 text-text-secondary font-mono text-sm hover:border-neon-pink hover:text-neon-pink transition-colors"
              >
                <Icon size={16} /> {link.label || link.url}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
