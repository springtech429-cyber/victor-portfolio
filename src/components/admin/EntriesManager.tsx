'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import * as api from '@/lib/admin-api';
import { uid } from '@/lib/helpers';
import { CONTENT_TYPES, TYPE_ORDER, entryHref } from '@/lib/content-types';
import type { Entry, EntryType } from '@/lib/types';
import { btnDanger, btnGhost, inputCls, type Notify } from './ui';
import { EntryForm } from './EntryForm';

const blank = (type: EntryType, sortOrder: number): Entry => ({
  id: uid(),
  type,
  slug: '',
  title: '',
  summary: '',
  body: '',
  category: '',
  tags: [],
  coverImage: '',
  gallery: [],
  links: CONTENT_TYPES[type].showLinks ? [{ label: type === 'project' ? 'Live site' : '', url: '' }] : [],
  date: new Date().toISOString().slice(0, 10),
  featured: false,
  published: true,
  sortOrder,
  meta: type === 'project' ? { status: 'Live', year: String(new Date().getFullYear()) } : {},
  fileUrl: '',
  createdAt: new Date().toISOString(),
});

export function EntriesManager({ notify }: { notify: Notify }) {
  const [list, setList] = useState<Entry[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState<'all' | EntryType>('all');
  const [editing, setEditing] = useState<{ entry: Entry; isNew: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      setList(await api.listEntries());
      setLoadError('');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load your content.');
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c: Partial<Record<EntryType, number>> = {};
    (list ?? []).forEach((e) => { c[e.type] = (c[e.type] ?? 0) + 1; });
    return c;
  }, [list]);
  const shown = (list ?? []).filter((e) => filter === 'all' || e.type === filter);
  const topOrder = list && list.length ? Math.min(...list.map((e) => e.sortOrder)) - 1 : 0;
  const categories = Array.from(new Set((list ?? []).map((e) => e.category).filter(Boolean)));

  const save = async (entry: Entry) => {
    const isNew = editing?.isNew;
    await api.saveEntry(entry);
    notify(isNew ? 'Published. It is live on your site.' : 'Saved. It is live on your site.');
    setEditing(null);
    await load();
  };

  const remove = async (e: Entry) => {
    if (!window.confirm(`Delete "${e.title}"? This also removes its uploaded files and cannot be undone.`)) return;
    try {
      await api.deleteEntry(e);
      notify('Deleted.');
      await load();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not delete.', 'error');
    }
  };

  const toggle = async (e: Entry) => {
    try {
      await api.saveEntry({ ...e, published: !e.published });
      notify(e.published ? 'Hidden from your site.' : 'Now visible on your site.');
      await load();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update.', 'error');
    }
  };

  const move = async (e: Entry, dir: -1 | 1) => {
    if (!list) return;
    const idx = shown.findIndex((x) => x.id === e.id);
    const other = shown[idx + dir];
    if (!other) return;
    const next = [...list];
    const a = next.findIndex((x) => x.id === e.id);
    const b = next.findIndex((x) => x.id === other.id);
    [next[a], next[b]] = [next[b], next[a]];
    setList(next);
    try {
      await api.reorderEntries(next.map((x) => x.id));
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not reorder.', 'error');
      load();
    }
  };

  return (
    <section aria-labelledby="content-heading">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="content-heading" className="text-xl font-display font-bold">Content</h2>
          <p className="text-sm text-text-secondary">Web projects, films, articles, op-eds, short stories, branding copy, copywriting, press copy, speeches and certifications. New items appear first.</p>
        </div>
        <label className="text-sm">
          <span className="sr-only">Add new content</span>
          <select
            className={`${inputCls} min-w-52 border-neon-blue/60 text-neon-blue`}
            value=""
            onChange={(ev) => ev.target.value && setEditing({ entry: blank(ev.target.value as EntryType, topOrder), isNew: true })}
          >
            <option value="">+ Add new…</option>
            {TYPE_ORDER.map((t) => <option key={t} value={t}>{CONTENT_TYPES[t].label}</option>)}
          </select>
        </label>
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter content">
        {([['all', `All (${list?.length ?? 0})`] as const, ...TYPE_ORDER.filter((t) => counts[t]).map((t) => [t, `${CONTENT_TYPES[t].plural} (${counts[t]})`] as const)]).map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id as 'all' | EntryType)} aria-pressed={filter === id} className={`border px-3 py-1.5 text-sm ${filter === id ? 'border-neon-blue bg-neon-blue/10 text-neon-blue' : 'border-text-secondary/30 text-text-secondary hover:text-text-primary'}`}>
            {label}
          </button>
        ))}
      </div>

      {loadError && <p className="border border-red-400/40 bg-red-400/5 p-4 text-sm text-red-400" role="alert">{loadError} If you just set up Supabase, make sure you ran supabase/schema.sql.</p>}
      {!list && !loadError && <p className="text-text-secondary">Loading…</p>}
      {list && shown.length === 0 && (
        <div className="border border-dashed border-text-secondary/30 p-10 text-center text-text-secondary">
          Nothing here yet. Use “+ Add new…” above to publish your first piece.
        </div>
      )}

      <ul className="space-y-3">
        {shown.map((e, i) => (
          <li key={e.id} className="flex flex-col gap-4 border border-neon-indigo/20 bg-bg-card p-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-full shrink-0 items-center justify-center overflow-hidden bg-bg-secondary text-xs text-text-secondary sm:w-28">
              {e.coverImage ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={e.coverImage} alt="" className="h-full w-full object-cover" /> : CONTENT_TYPES[e.type].label}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-medium">{e.title}</h3>
                <span className="border border-neon-blue/40 px-2 py-0.5 text-xs text-neon-blue">{CONTENT_TYPES[e.type].label}</span>
                {!e.published && <span className="border border-yellow-400/50 px-2 py-0.5 text-xs text-yellow-400">Draft</span>}
                {e.featured && <span className="border border-neon-purple/50 px-2 py-0.5 text-xs text-neon-purple">Featured</span>}
              </div>
              <p className="truncate text-sm text-text-secondary">{[e.category, e.date].filter(Boolean).join(' · ')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className={btnGhost} onClick={() => move(e, -1)} disabled={i === 0} aria-label={`Move ${e.title} up`}><ArrowUp size={16} /></button>
              <button className={btnGhost} onClick={() => move(e, 1)} disabled={i === shown.length - 1} aria-label={`Move ${e.title} down`}><ArrowDown size={16} /></button>
              <button className={btnGhost} onClick={() => toggle(e)} aria-label={e.published ? `Hide ${e.title}` : `Show ${e.title}`} title={e.published ? 'Hide from site' : 'Show on site'}>{e.published ? <Eye size={16} /> : <EyeOff size={16} />}</button>
              {e.published && e.type !== 'certification' && <a className={btnGhost} href={entryHref(e)} target="_blank" rel="noopener noreferrer" aria-label={`View ${e.title} on the site`}><ExternalLink size={16} /></a>}
              <button className={btnGhost} onClick={() => setEditing({ entry: e, isNew: false })}><Pencil size={16} /> Edit</button>
              <button className={btnDanger} onClick={() => remove(e)} aria-label={`Delete ${e.title}`}><Trash2 size={16} /></button>
            </div>
          </li>
        ))}
      </ul>

      {editing && <EntryForm key={editing.entry.id} initial={editing.entry} isNew={editing.isNew} categories={categories} notify={notify} onSave={save} onClose={() => setEditing(null)} />}
    </section>
  );
}
