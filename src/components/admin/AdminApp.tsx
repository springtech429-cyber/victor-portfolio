'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, ExternalLink, LogOut, Save } from 'lucide-react';
import * as api from '@/lib/admin-api';
import { isBackendConfigured } from '@/lib/supabase-browser';
import { normalizeUrl, safeUrl } from '@/lib/helpers';
import { DEFAULT_PROFILE } from '@/lib/defaults';
import type { Profile } from '@/lib/types';
import { AdminLogin } from './AdminLogin';
import { EntriesManager } from './EntriesManager';
import { ProfileEditor } from './ProfileEditor';
import { SkillsEditor } from './SkillsEditor';
import { MessagesInbox } from './MessagesInbox';
import { AccountTab } from './AccountTab';
import { btnGhost, btnPrimary, type Notify } from './ui';

type Tab = 'content' | 'profile' | 'skills' | 'messages' | 'account';
const TABS: { id: Tab; label: string }[] = [
  { id: 'content', label: 'Content' },
  { id: 'profile', label: 'Profile & about' },
  { id: 'skills', label: 'Skills' },
  { id: 'messages', label: 'Messages' },
  { id: 'account', label: 'Account' },
];

function cleanProfile(p: Profile): { profile?: Profile; error?: string } {
  const links = p.links.filter((l) => l.url.trim());
  const bad = links.find((l) => !safeUrl(l.url));
  if (bad) return { error: `The link "${bad.label || bad.url}" needs a valid web address.` };
  return {
    profile: {
      ...p,
      name: p.name.trim() || 'Your name',
      links: links.map((l) => ({ label: l.label.trim(), url: normalizeUrl(l.url) })),
      highlights: p.highlights.filter((h) => h.value.trim() || h.label.trim()),
      faqs: p.faqs.filter((f) => f.q.trim() && f.a.trim()),
      skillGroups: p.skillGroups
        .map((g) => ({ ...g, skills: g.skills.map((s) => s.trim()).filter(Boolean) }))
        .filter((g) => g.title.trim() || g.skills.length),
    },
  };
}

export function AdminApp() {
  const [auth, setAuth] = useState<'checking' | 'out' | 'in'>('checking');
  const [tab, setTab] = useState<Tab>('content');
  const [saved, setSaved] = useState<Profile>(DEFAULT_PROFILE);
  const [draft, setDraft] = useState<Profile>(DEFAULT_PROFILE);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState<{ message: string; kind: 'ok' | 'error' } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const notify: Notify = useCallback((message, kind = 'ok') => {
    setToast({ message, kind });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(() => {
    if (!isBackendConfigured) {
      setAuth('out');
      return;
    }
    api.isAdmin().then((ok) => setAuth(ok ? 'in' : 'out'), () => setAuth('out'));
    return api.onAuthChange((ok) => setAuth(ok ? 'in' : 'out'));
  }, []);

  useEffect(() => {
    if (auth !== 'in' || profileLoaded) return;
    api.loadProfile().then(
      (p) => { setSaved(p); setDraft(p); setProfileLoaded(true); },
      (e) => notify(e instanceof Error ? e.message : 'Could not load your profile.', 'error')
    );
  }, [auth, profileLoaded, notify]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const saveProfile = async () => {
    const { profile, error } = cleanProfile(draft);
    if (!profile) return notify(error || 'Check the form.', 'error');
    setSaving(true);
    try {
      await api.saveProfile(profile);
      setSaved(profile);
      setDraft(profile);
      notify('Profile saved. It is live on your site.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (auth === 'checking') return <div className="flex min-h-screen items-center justify-center bg-bg-primary text-text-secondary">Checking sign in…</div>;
  if (auth === 'out') return <AdminLogin />;

  return (
    <div className="min-h-screen bg-bg-primary font-sans text-text-primary">
      <header className="sticky top-0 z-40 border-b border-neon-indigo/20 bg-bg-primary/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <h1 className="font-display font-bold tracking-wide">Dashboard</h1>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer" className={`${btnGhost} whitespace-nowrap`} aria-label="View site"><ExternalLink size={16} /> <span className="hidden sm:inline">View site</span></a>
            <button className={`${btnGhost} whitespace-nowrap`} onClick={() => api.signOut()} aria-label="Sign out"><LogOut size={16} /> <span className="hidden sm:inline">Sign out</span></button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-6" aria-label="Dashboard sections">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined} className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm ${tab === t.id ? 'border-neon-blue text-neon-blue' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
              {t.label}
              {t.id === 'messages' && unread > 0 && <span className="ml-2 rounded-full bg-neon-blue px-1.5 py-0.5 text-xs text-bg-primary">{unread}</span>}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 pb-28">
        {tab === 'content' && <EntriesManager notify={notify} />}
        {tab === 'profile' && <ProfileEditor draft={draft} setDraft={setDraft} notify={notify} />}
        {tab === 'skills' && <SkillsEditor draft={draft} setDraft={setDraft} />}
        {tab === 'messages' && <MessagesInbox notify={notify} onUnreadChange={setUnread} />}
        {tab === 'account' && <AccountTab notify={notify} />}
      </main>

      {(tab === 'profile' || tab === 'skills') && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neon-indigo/30 bg-bg-card">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
            <span className="text-sm text-text-secondary">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</span>
            <div className="flex gap-2">
              {dirty && <button className={btnGhost} onClick={() => setDraft(saved)}>Discard</button>}
              <button className={btnPrimary} disabled={!dirty || saving || !profileLoaded} onClick={saveProfile}><Save size={16} /> {saving ? 'Saving…' : 'Save changes'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className={`fixed bottom-20 right-6 z-[110] flex items-center gap-2 border bg-bg-card px-4 py-3 shadow-xl ${toast.kind === 'ok' ? 'border-neon-blue text-neon-blue' : 'border-red-400 text-red-400'}`}>
          {toast.kind === 'ok' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
