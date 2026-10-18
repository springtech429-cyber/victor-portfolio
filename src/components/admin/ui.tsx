'use client';
import { useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Loader2, Plus, Trash2, X } from 'lucide-react';
import * as api from '@/lib/admin-api';
import type { LinkItem } from '@/lib/types';

export type Notify = (message: string, kind?: 'ok' | 'error') => void;

export const inputCls =
  'w-full bg-bg-secondary border border-text-secondary/30 px-3 py-2 text-text-primary placeholder:text-text-secondary/60 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue';
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 px-4 py-2 border border-neon-blue bg-neon-blue/10 text-neon-blue font-medium hover:bg-neon-blue/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
export const btnGhost =
  'inline-flex items-center justify-center gap-2 px-3 py-2 border border-text-secondary/30 text-text-secondary hover:text-text-primary hover:border-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue disabled:opacity-40 disabled:cursor-not-allowed transition-colors';
export const btnDanger =
  'inline-flex items-center justify-center gap-2 px-3 py-2 border border-red-400/40 text-red-400 hover:bg-red-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-40 transition-colors';

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-text-primary">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-text-secondary">{hint}</p>}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-[var(--neon-blue)]"
      />
      <span>
        <span className="block text-sm font-medium text-text-primary">{label}</span>
        {hint && <span className="block text-xs text-text-secondary">{hint}</span>}
      </span>
    </label>
  );
}

/** Upload a picture from the device (resized in the browser) or paste a link to one. */
export function ImageField({
  label,
  value,
  onChange,
  folder,
  notify,
  round,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: string;
  notify: Notify;
  round?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pasting, setPasting] = useState(false);

  const pick = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      onChange(await api.uploadImage(file, folder));
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Upload failed.', 'error');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-text-primary">{label}</span>
      <div className="flex items-center gap-4">
        <div
          className={`w-24 h-24 shrink-0 bg-bg-secondary border border-text-secondary/30 overflow-hidden flex items-center justify-center text-text-secondary ${round ? 'rounded-full' : ''}`}
        >
          {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <ImagePlus size={24} />}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnGhost} disabled={busy} onClick={() => fileRef.current?.click()}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
              {busy ? 'Uploading...' : value ? 'Replace picture' : 'Upload picture'}
            </button>
            <button type="button" className={btnGhost} onClick={() => setPasting((v) => !v)}>
              <Link2 size={16} /> Use a link
            </button>
            {value && (
              <button type="button" className={btnGhost} onClick={() => onChange('')}>
                <X size={16} /> Remove
              </button>
            )}
          </div>
          {pasting && (
            <input
              className={inputCls}
              placeholder="https://example.com/picture.jpg"
              value={value.startsWith('data:') ? '' : value}
              onChange={(e) => onChange(e.target.value.trim())}
              aria-label={`${label} link`}
            />
          )}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files)} />
    </div>
  );
}

export function GalleryField({
  label,
  values,
  onChange,
  folder,
  notify,
}: {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
  folder: string;
  notify: Notify;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const added: string[] = [];
    for (const file of Array.from(files)) {
      try {
        added.push(await api.uploadImage(file, folder));
      } catch (e) {
        notify(`${file.name}: ${e instanceof Error ? e.message : 'upload failed.'}`, 'error');
      }
    }
    if (added.length) onChange([...values, ...added]);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const move = (i: number, dir: -1 | 1) => {
    const next = [...values];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-text-primary">{label}</span>
      <div className="flex flex-wrap gap-3">
        {values.map((src, i) => (
          <div key={src + i} className="w-28 border border-text-secondary/30 bg-bg-secondary">
            <img src={src} alt={`Gallery picture ${i + 1}`} className="w-full h-20 object-cover" />
            <div className="flex justify-between p-1">
              <button type="button" className="p-1 text-text-secondary hover:text-text-primary disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move earlier">
                <ArrowLeft size={14} />
              </button>
              <button type="button" className="p-1 text-red-400 hover:text-red-300" onClick={() => onChange(values.filter((_, k) => k !== i))} aria-label="Remove picture">
                <Trash2 size={14} />
              </button>
              <button type="button" className="p-1 text-text-secondary hover:text-text-primary disabled:opacity-30" disabled={i === values.length - 1} onClick={() => move(i, 1)} aria-label="Move later">
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="w-28 h-[7.25rem] border border-dashed border-text-secondary/40 text-text-secondary hover:text-neon-blue hover:border-neon-blue flex flex-col items-center justify-center gap-1 text-xs"
        >
          {busy ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
          {busy ? 'Uploading...' : 'Add pictures'}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => add(e.target.files)} />
    </div>
  );
}

export function LinksEditor({
  links,
  onChange,
  suggestions,
  addLabel = 'Add link',
}: {
  links: LinkItem[];
  onChange: (links: LinkItem[]) => void;
  suggestions?: string[];
  addLabel?: string;
}) {
  const listId = useId();
  const update = (i: number, patch: Partial<LinkItem>) =>
    onChange(links.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  return (
    <div className="space-y-2">
      {suggestions && (
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
      {links.map((l, i) => (
        <div key={i} className="flex flex-col sm:flex-row gap-2">
          <input
            className={`${inputCls} sm:w-48`}
            placeholder="Label, e.g. Live site"
            list={suggestions ? listId : undefined}
            value={l.label}
            onChange={(e) => update(i, { label: e.target.value })}
            aria-label={`Link ${i + 1} label`}
          />
          <input
            className={inputCls}
            placeholder="https://..."
            value={l.url}
            onChange={(e) => update(i, { url: e.target.value })}
            aria-label={`Link ${i + 1} address`}
          />
          <button type="button" className={btnDanger} onClick={() => onChange(links.filter((_, k) => k !== i))} aria-label={`Remove link ${i + 1}`}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button type="button" className={btnGhost} onClick={() => onChange([...links, { label: '', url: '' }])}>
        <Plus size={16} /> {addLabel}
      </button>
    </div>
  );
}

/** Upload a PDF (resume, certificate, slides). */
export function FileField({ label, value, onChange, folder, notify }: { label: string; value: string; onChange: (url: string) => void; folder: string; notify: Notify }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      onChange(await api.uploadPdf(file, folder));
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Upload failed.', 'error');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-text-primary">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btnGhost} disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {busy ? 'Uploading...' : value ? 'Replace PDF' : 'Upload PDF'}
        </button>
        {value && (
          <>
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-neon-blue underline">View current file</a>
            <button type="button" className={btnGhost} onClick={() => onChange('')}><X size={16} /> Remove</button>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => pick(e.target.files)} />
    </div>
  );
}
