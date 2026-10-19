import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle, AlertCircle, ExternalLink, Info, LogOut, Save } from 'lucide-react';
import { api } from '../lib/api';
import { useSiteData } from '../context/DataContext';
import { AdminLogin } from '../components/admin/AdminLogin';
import { EntriesManager } from '../components/admin/EntriesManager';
import { ProfileEditor } from '../components/admin/ProfileEditor';
import { SkillsEditor } from '../components/admin/SkillsEditor';
import { MessagesInbox } from '../components/admin/MessagesInbox';
import { btnGhost, btnPrimary, type Notify } from '../components/admin/ui';
import { normalizeUrl, safeUrl } from '../lib/helpers';
import type { Profile } from '../lib/types';

type Tab = 'entries' | 'profile' | 'skills' | 'messages';
const TABS: { id: Tab; label: string }[] = [
  { id: 'entries', label: 'Content' },
  { id: 'profile', label: 'Profile & about' },
  { id: 'skills', label: 'Skills' },
  { id: 'messages', label: 'Messages' },
];

function cleanProfile(p: Profile): { profile?: Profile; error?: string } {
  const links = p.links.filter((l) => l.url.trim());
  const bad = links.find((l) => !safeUrl(l.url));
  if (bad) return { error: `The link "${bad.label || bad.url || 'untitled'}" needs a valid web address.` };
  if (p.resumeUrl.trim() && !safeUrl(p.resumeUrl)) return { error: 'The resume link needs a valid web address.' };
  return {
    profile: {
      ...p,
      name: p.name.trim() || 'Your name',
      links: links.map((l) => ({ label: l.label.trim(), url: normalizeUrl(l.url) })),
      resumeUrl: p.resumeUrl.trim() ? normalizeUrl(p.resumeUrl) : '',
      highlights: p.highlights.filter((h) => h.value.trim() || h.label.trim()),
      skillGroups: p.skillGroups
        .map((g) => ({ ...g, skills: g.skills.map((s) => s.trim()).filter(Boolean) }))
        .filter((g) => g.title.trim() || g.skills.length),
    },
  };
}

export function AdminPage() {
  const { isAdmin, authChecked, profile, loading, reload, mode } = useSiteData();
  const [tab, setTab] = useState<Tab>('entries');
  const [draft, setDraft] = useState<Profile>(profile);
  const [saving, setSaving] = useState(false);
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState<{ message: string; kind: 'ok' | 'error' } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const seeded = useRef(false);

  // Fill the editor once the saved profile has loaded; later reloads (e.g. after adding an entry) must not wipe edits.
  useEffect(() => {
    if (!loading && !seeded.current) {
      setDraft(profile);
      seeded.current = true;
    }
  }, [loading, profile]);

  const notify: Notify = useCallback((message, kind = 'ok') => {
    setToast({ message, kind });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 4500);
  }, []);

  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const saveProfile = async () => {
    const { profile: cleaned, error } = cleanProfile(draft);
    if (!cleaned) return notify(error || 'Check the form.', 'error');
    setSaving(true);
    try {
      await api.saveProfile(cleaned);
      await reload();
      setDraft(cleaned);
      notify('Profile saved. It is live on your portfolio.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!authChecked) {
    return <div className="min-h-screen bg-bg-primary text-text-secondary flex items-center justify-center">Checking sign in...</div>;
  }
  if (!isAdmin) return <AdminLogin />;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans">
      <header className="sticky top-0 z-40 bg-bg-primary/90 backdrop-blur-md border-b border-neon-indigo/20">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <h1 className="font-orbitron font-bold tracking-wide">Dashboard</h1>
          <div className="flex items-center gap-2">
            <a href="#/" className={`${btnGhost} whitespace-nowrap`} aria-label="View site"><ExternalLink size={16} /> <span className="hidden sm:inline">View site</span></a>
            <button className={`${btnGhost} whitespace-nowrap`} onClick={() => api.signOut()} aria-label="Sign out"><LogOut size={16} /> <span className="hidden sm:inline">Sign out</span></button>
          </div>
        </div>
        <nav className="max-w-5xl mx-auto px-6 flex gap-1 overflow-x-auto" aria-label="Dashboard sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`px-4 py-2 text-sm border-b-2 whitespace-nowrap ${tab === t.id ? 'border-neon-blue text-neon-blue' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
            >
              {t.label}
              {t.id === 'messages' && unread > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-neon-blue text-bg-primary rounded-full">{unread}</span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 pb-28">
        {mode === 'local' && (
          <div className="flex gap-2 text-sm border border-neon-purple/40 bg-neon-purple/10 p-3 mb-6">
            <Info size={18} className="shrink-0 mt-0.5 text-neon-purple" />
            <p>Demo mode: Supabase is not connected, so changes stay in this browser only. See the README to go live.</p>
          </div>
        )}
       {tab === 'entries' && <EntriesManager notify={notify} />}
        {tab === 'profile' && <ProfileEditor draft={draft} setDraft={setDraft} notify={notify} />}
        {tab === 'skills' && <SkillsEditor draft={draft} setDraft={setDraft} />}
        {tab === 'messages' && <MessagesInbox notify={notify} onUnreadChange={setUnread} />}
      </main>

      {(tab === 'profile' || tab === 'skills') && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-bg-card border-t border-neon-indigo/30">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <span className="text-sm text-text-secondary">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</span>
            <div className="flex gap-2">
              {dirty && <button className={btnGhost} onClick={() => setDraft(profile)}>Discard</button>}
              <button className={btnPrimary} disabled={!dirty || saving} onClick={saveProfile}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-20 right-6 z-[110] flex items-center gap-2 px-4 py-3 border bg-bg-card shadow-xl ${toast.kind === 'ok' ? 'border-neon-blue text-neon-blue' : 'border-red-400 text-red-400'}`}
        >
          {toast.kind === 'ok' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}