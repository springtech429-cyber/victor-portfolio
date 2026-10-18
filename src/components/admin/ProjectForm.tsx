import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Project } from '../../lib/types';
import { DEFAULT_CATEGORIES, LINK_LABEL_SUGGESTIONS, PROJECT_STATUSES } from '../../lib/types';
import { normalizeUrl, safeUrl } from '../../lib/helpers';
import { btnGhost, btnPrimary, Field, GalleryField, ImageField, inputCls, LinksEditor, Toggle, type Notify } from './ui';

interface Props {
  initial: Project;
  isNew: boolean;
  categories: string[];
  notify: Notify;
  onSave: (p: Project) => Promise<void>;
  onClose: () => void;
}

export function ProjectForm({ initial, isNew, categories, notify, onSave, onClose }: Props) {
  const [p, setP] = useState<Project>(initial);
  const [tagsText, setTagsText] = useState(initial.tags.join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof Project>(key: K, value: Project[K]) => setP((prev) => ({ ...prev, [key]: value }));
  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...categories]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!p.title.trim()) return setError('Give the project a title.');

    // Rows with no address are dropped (the form pre-fills a "Live site" label you may not need).
    const filled = p.links.filter((l) => l.url.trim());
    const bad = filled.find((l) => !safeUrl(l.url));
    if (bad) return setError(`The link "${bad.label || bad.url || 'untitled'}" needs a valid web address.`);
    const links = filled.map((l) => ({ label: l.label.trim(), url: normalizeUrl(l.url) }));

    const seen = new Set<string>();
    const tags = tagsText
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()));
    setSaving(true);
    try {
      await onSave({ ...p, title: p.title.trim(), category: p.category.trim(), links, tags });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the project.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex justify-end" role="dialog" aria-modal="true" aria-label={isNew ? 'Add project' : 'Edit project'}>
      <form onSubmit={submit} className="w-full max-w-2xl h-full overflow-y-auto bg-bg-card border-l border-neon-indigo/30 flex flex-col">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-bg-card border-b border-text-secondary/20">
          <h2 className="text-lg font-orbitron font-bold">{isNew ? 'Add project' : 'Edit project'}</h2>
          <button type="button" onClick={onClose} className={btnGhost} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          <Field label="Title" htmlFor="p-title">
            <input id="p-title" className={inputCls} value={p.title} onChange={(e) => set('title', e.target.value)} maxLength={200} autoFocus required />
          </Field>

          <Field label="Short description" htmlFor="p-summary" hint="One or two sentences. Shown on the project card.">
            <textarea id="p-summary" rows={2} className={inputCls} value={p.summary} onChange={(e) => set('summary', e.target.value)} />
          </Field>

          <Field label="Full description" htmlFor="p-desc" hint="Shown when someone opens the project. Leave a blank line between paragraphs.">
            <textarea id="p-desc" rows={6} className={inputCls} value={p.description} onChange={(e) => set('description', e.target.value)} />
          </Field>

          <ImageField label="Cover picture" value={p.coverImage} onChange={(v) => set('coverImage', v)} folder="projects" notify={notify} />
          <GalleryField label="More pictures" values={p.gallery} onChange={(v) => set('gallery', v)} folder="projects" notify={notify} />

          <div>
            <span className="block text-sm font-medium mb-1.5">Links</span>
            <LinksEditor links={p.links} onChange={(v) => set('links', v)} suggestions={LINK_LABEL_SUGGESTIONS} addLabel="Add a link to this project" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Category" htmlFor="p-cat" hint="Pick one or type a new one. Visitors can filter by it.">
              <input id="p-cat" list="p-cat-list" className={inputCls} value={p.category} onChange={(e) => set('category', e.target.value)} />
              <datalist id="p-cat-list">
                {allCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Status" htmlFor="p-status">
              <select id="p-status" className={inputCls} value={p.status} onChange={(e) => set('status', e.target.value)}>
                {PROJECT_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Built for (optional)" htmlFor="p-client">
              <input id="p-client" className={inputCls} value={p.client} onChange={(e) => set('client', e.target.value)} placeholder="Client or company" />
            </Field>
            <Field label="Year (optional)" htmlFor="p-year">
              <input id="p-year" className={inputCls} value={p.year} onChange={(e) => set('year', e.target.value)} maxLength={9} placeholder="2026" />
            </Field>
          </div>

          <Field label="Tags" htmlFor="p-tags" hint="Separate with commas, e.g. React, Supabase, Tailwind.">
            <input id="p-tags" className={inputCls} value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
          </Field>

          <div className="space-y-3">
            <Toggle checked={p.published} onChange={(v) => set('published', v)} label="Show on my portfolio" hint="Turn off to keep it as a draft only you can see." />
            <Toggle checked={p.featured} onChange={(v) => set('featured', v)} label="Mark as featured" hint="Adds a Featured badge to the card." />
          </div>
        </div>

        <div className="sticky bottom-0 px-6 py-4 bg-bg-card border-t border-text-secondary/20 flex items-center gap-3">
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? 'Saving...' : isNew ? 'Add project' : 'Save changes'}
          </button>
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancel
          </button>
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
