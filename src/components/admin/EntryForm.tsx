'use client';
import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Entry, EntryType } from '@/lib/types';
import { CONTENT_TYPES, PROJECT_STATUSES, LINK_LABEL_SUGGESTIONS, TYPE_ORDER, entryHref } from '@/lib/content-types';
import { normalizeUrl, safeUrl, slugify } from '@/lib/helpers';
import { btnGhost, btnPrimary, Field, FileField, GalleryField, ImageField, inputCls, LinksEditor, Toggle, type Notify } from './ui';

interface Props {
  initial: Entry;
  isNew: boolean;
  categories: string[];
  notify: Notify;
  onSave: (e: Entry) => Promise<void>;
  onClose: () => void;
}

export function EntryForm({ initial, isNew, categories, notify, onSave, onClose }: Props) {
  const [e, setE] = useState<Entry>(initial);
  const [tagsText, setTagsText] = useState(initial.tags.join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const cfg = CONTENT_TYPES[e.type];
  const set = <K extends keyof Entry>(key: K, value: Entry[K]) => setE((prev) => ({ ...prev, [key]: value }));
  const setMeta = (key: string, value: string) => setE((prev) => ({ ...prev, meta: { ...prev.meta, [key]: value } }));

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setError('');
    if (!e.title.trim()) return setError('Give it a title.');

    const filled = e.links.filter((l) => l.url.trim());
    const bad = filled.find((l) => !safeUrl(l.url));
    if (bad) return setError(`The link "${bad.label || bad.url}" needs a valid web address.`);

    // Keep only this type's fields, and make sure every link field holds a safe address.
    const meta: Record<string, string> = {};
    for (const f of cfg.fields) {
      const v = (e.meta[f.key] || '').trim();
      if (!v) continue;
      if (f.kind === 'url') {
        const u = safeUrl(v);
        if (!u) return setError(`"${f.label}" needs a valid web address.`);
        meta[f.key] = normalizeUrl(v);
      } else meta[f.key] = v;
    }

    const seen = new Set<string>();
    const tags = tagsText
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()));

    setSaving(true);
    try {
      await onSave({
        ...e,
        title: e.title.trim(),
        slug: slugify(e.slug || ''),
        category: e.category.trim(),
        links: filled.map((l) => ({ label: l.label.trim(), url: normalizeUrl(l.url) })),
        gallery: cfg.showGallery ? e.gallery : [],
        fileUrl: cfg.showFile ? e.fileUrl : '',
        meta,
        tags,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/70" role="dialog" aria-modal="true" aria-label={isNew ? 'Add content' : 'Edit content'}>
      <form onSubmit={submit} className="flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-neon-indigo/30 bg-bg-card">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-text-secondary/20 bg-bg-card px-6 py-4">
          <h2 className="text-lg font-display font-bold">{isNew ? `Add ${cfg.label.toLowerCase()}` : `Edit ${cfg.label.toLowerCase()}`}</h2>
          <button type="button" onClick={onClose} className={btnGhost} aria-label="Close"><X size={16} /></button>
        </div>

        <div className="flex-1 space-y-6 p-6">
          {isNew && (
            <Field label="What kind of content is this?" htmlFor="e-type">
              <select id="e-type" className={inputCls} value={e.type} onChange={(ev) => set('type', ev.target.value as EntryType)}>
                {TYPE_ORDER.map((t) => <option key={t} value={t}>{CONTENT_TYPES[t].label}</option>)}
              </select>
            </Field>
          )}

          <Field label="Title" htmlFor="e-title"><input id="e-title" className={inputCls} value={e.title} onChange={(ev) => set('title', ev.target.value)} maxLength={200} autoFocus required /></Field>

          <Field label="Short description" htmlFor="e-summary" hint="One or two sentences. Shown on cards and in search results, so make it count.">
            <textarea id="e-summary" rows={2} className={inputCls} value={e.summary} onChange={(ev) => set('summary', ev.target.value)} maxLength={400} />
          </Field>

          <Field label={cfg.bodyLabel} htmlFor="e-body" hint={cfg.bodyHint}>
            <textarea id="e-body" rows={e.type === 'story' || e.type === 'article' || e.type === 'oped' ? 14 : 8} className={`${inputCls} font-mono text-sm`} value={e.body} onChange={(ev) => set('body', ev.target.value)} />
          </Field>

          <ImageField label={cfg.coverLabel} value={e.coverImage} onChange={(v) => set('coverImage', v)} folder={`entries/${e.type}`} notify={notify} />
          {cfg.showGallery && <GalleryField label="More pictures" values={e.gallery} onChange={(v) => set('gallery', v)} folder={`entries/${e.type}`} notify={notify} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={cfg.dateLabel} htmlFor="e-date"><input id="e-date" type="date" className={inputCls} value={e.date} onChange={(ev) => set('date', ev.target.value)} /></Field>
            <Field label="Category" htmlFor="e-cat" hint="Visitors can filter by it.">
              <input id="e-cat" list="e-cat-list" className={inputCls} value={e.category} onChange={(ev) => set('category', ev.target.value)} />
              <datalist id="e-cat-list">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
            {cfg.fields.map((f) => {
              const id = `e-meta-${f.key}`;
              const val = e.meta[f.key] || '';
              if (e.type === 'project' && f.key === 'status') {
                return (
                  <Field key={f.key} label={f.label} htmlFor={id}>
                    <select id={id} className={inputCls} value={val || PROJECT_STATUSES[0]} onChange={(ev) => setMeta(f.key, ev.target.value)}>
                      {PROJECT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                );
              }
              return (
                <Field key={f.key} label={f.label} htmlFor={id} hint={f.hint}>
                  <input id={id} type={f.kind === 'date' ? 'date' : 'text'} className={inputCls} value={val} placeholder={f.placeholder || (f.kind === 'url' ? 'https://...' : undefined)} onChange={(ev) => setMeta(f.key, ev.target.value)} />
                </Field>
              );
            })}
          </div>

          {cfg.showLinks && (
            <div>
              <span className="mb-1.5 block text-sm font-medium">Links</span>
              <LinksEditor links={e.links} onChange={(v) => set('links', v)} suggestions={LINK_LABEL_SUGGESTIONS} addLabel="Add a link" />
            </div>
          )}
          {cfg.showFile && <FileField label={cfg.fileLabel || 'PDF'} value={e.fileUrl} onChange={(v) => set('fileUrl', v)} folder={`files/${e.type}`} notify={notify} />}

          <Field label="Tags" htmlFor="e-tags" hint="Separate with commas, e.g. fintech, leadership, Zambia.">
            <input id="e-tags" className={inputCls} value={tagsText} onChange={(ev) => setTagsText(ev.target.value)} />
          </Field>

          <Field label="Web address ending (optional)" htmlFor="e-slug" hint={`Leave blank to create it from the title. It becomes ${entryHref({ type: e.type, slug: e.slug || slugify(e.title) || 'your-title' })}`}>
            <input id="e-slug" className={inputCls} value={e.slug} onChange={(ev) => set('slug', ev.target.value)} maxLength={80} placeholder={slugify(e.title) || 'your-title'} />
          </Field>

          <div className="space-y-3">
            <Toggle checked={e.published} onChange={(v) => set('published', v)} label="Show on my portfolio" hint="Turn off to keep it as a draft only you can see." />
            <Toggle checked={e.featured} onChange={(v) => set('featured', v)} label="Feature it" hint="Featured work and writing is shown first on the home page." />
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center gap-3 border-t border-text-secondary/20 bg-bg-card px-6 py-4">
          <button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Saving...' : isNew ? 'Publish' : 'Save changes'}</button>
          <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
          {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
        </div>
      </form>
    </div>
  );
}
