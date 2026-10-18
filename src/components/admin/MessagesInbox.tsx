'use client';
import { useCallback, useEffect, useState } from 'react';
import { Mail, MailOpen, RefreshCw, Reply, Trash2 } from 'lucide-react';
import * as api from '@/lib/admin-api';
import { formatDate } from '@/lib/helpers';
import type { Message } from '@/lib/types';
import { btnDanger, btnGhost, type Notify } from './ui';

export function MessagesInbox({ notify, onUnreadChange }: { notify: Notify; onUnreadChange: (n: number) => void }) {
  const [list, setList] = useState<Message[] | null>(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const msgs = await api.listMessages();
      setList(msgs);
      setError('');
      onUnreadChange(msgs.filter((m) => !m.read).length);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load messages.');
    }
  }, [onUnreadChange]);
  useEffect(() => {
    load();
  }, [load]);

  const setRead = async (m: Message, read: boolean) => {
    try {
      await api.setMessageRead(m.id, read);
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not update.', 'error');
    }
  };

  const open = (m: Message) => {
    setOpenId(openId === m.id ? null : m.id);
    if (!m.read) setRead(m, true);
  };

  const remove = async (m: Message) => {
    if (!window.confirm(`Delete the message from ${m.name}?`)) return;
    try {
      await api.deleteMessage(m.id);
      notify('Message deleted.');
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not delete.', 'error');
    }
  };

  return (
    <section aria-labelledby="messages-heading">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 id="messages-heading" className="text-xl font-display font-bold">Messages</h2>
          <p className="text-sm text-text-secondary">Sent from the contact form on your portfolio.</p>
        </div>
        <button className={btnGhost} onClick={load}><RefreshCw size={16} /> Refresh</button>
      </div>

      {error && <p className="border border-red-400/40 bg-red-400/5 text-red-400 p-4 text-sm" role="alert">{error}</p>}
      {!list && !error && <p className="text-text-secondary">Loading messages...</p>}
      {list?.length === 0 && <p className="border border-dashed border-text-secondary/30 p-10 text-center text-text-secondary">No messages yet. When someone uses your contact form, it will appear here.</p>}

      <ul className="space-y-3">
        {list?.map((m) => (
          <li key={m.id} className={`bg-bg-card border ${m.read ? 'border-neon-indigo/20' : 'border-neon-blue/60'}`}>
            <button className="w-full text-left p-4 flex items-start gap-3" onClick={() => open(m)} aria-expanded={openId === m.id}>
              {m.read ? <MailOpen size={18} className="mt-0.5 text-text-secondary shrink-0" /> : <Mail size={18} className="mt-0.5 text-neon-blue shrink-0" />}
              <span className="flex-1 min-w-0">
                <span className={`block truncate ${m.read ? '' : 'font-bold'}`}>{m.name} <span className="font-normal text-text-secondary">· {m.email}</span></span>
                <span className="block text-sm text-text-secondary truncate">{m.message}</span>
              </span>
              <span className="text-xs text-text-secondary shrink-0">{formatDate(m.createdAt)}</span>
            </button>
            {openId === m.id && (
              <div className="px-4 pb-4 border-t border-text-secondary/10">
                <p className="whitespace-pre-wrap py-4">{m.message}</p>
                <div className="flex flex-wrap gap-2">
                  <a className={btnGhost} href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message')}`}><Reply size={16} /> Reply by email</a>
                  <button className={btnGhost} onClick={() => setRead(m, false)}>Mark as unread</button>
                  <button className={btnDanger} onClick={() => remove(m)}><Trash2 size={16} /> Delete</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
