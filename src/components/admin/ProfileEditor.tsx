'use client';
import { Plus, Trash2 } from 'lucide-react';
import type { Profile } from '@/lib/types';
import { btnDanger, btnGhost, Field, FileField, ImageField, inputCls, LinksEditor, Toggle, type Notify } from './ui';

interface Props {
  draft: Profile;
  setDraft: (p: Profile) => void;
  notify: Notify;
}

export function ProfileEditor({ draft, setDraft, notify }: Props) {
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setDraft({ ...draft, [key]: value });

  return (
    <section aria-labelledby="profile-heading" className="max-w-3xl space-y-8">
      <div>
        <h2 id="profile-heading" className="text-xl font-display font-bold">Profile and about</h2>
        <p className="text-sm text-text-secondary">What clients and prospects see on the home, about and contact pages, and what search engines and AI assistants read about you.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="pf-name"><input id="pf-name" className={inputCls} value={draft.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Location" htmlFor="pf-loc"><input id="pf-loc" className={inputCls} value={draft.location} onChange={(e) => set('location', e.target.value)} /></Field>
      </div>
      <Field label="Job title" htmlFor="pf-role" hint="Used in the page title and by search engines, so make it say what you do.">
        <input id="pf-role" className={inputCls} value={draft.role} onChange={(e) => set('role', e.target.value)} />
      </Field>
      <Field label="Headline" htmlFor="pf-head" hint="The big glowing line on the home page.">
        <input id="pf-head" className={inputCls} value={draft.headline} onChange={(e) => set('headline', e.target.value)} />
      </Field>
      <Field label="Intro line" htmlFor="pf-tag" hint="One or two sentences. Also the description search engines show.">
        <textarea id="pf-tag" rows={2} className={inputCls} value={draft.tagline} onChange={(e) => set('tagline', e.target.value)} />
      </Field>

      <ImageField label="Profile photo" value={draft.avatarUrl} onChange={(v) => set('avatarUrl', v)} folder="profile" notify={notify} round />
      <FileField label="Resume (PDF)" value={draft.resumeUrl} onChange={(v) => set('resumeUrl', v)} folder="resume" notify={notify} />

      <div className="space-y-3 border border-neon-indigo/20 bg-bg-card p-4">
        <Toggle checked={draft.available} onChange={(v) => set('available', v)} label="I am taking on new work" hint="Turns the status dot green." />
        <Field label="Status text" htmlFor="pf-status"><input id="pf-status" className={inputCls} value={draft.statusText} onChange={(e) => set('statusText', e.target.value)} /></Field>
      </div>

      <div className="space-y-4">
        <Field label="About heading" htmlFor="pf-about-title"><input id="pf-about-title" className={inputCls} value={draft.aboutTitle} onChange={(e) => set('aboutTitle', e.target.value)} /></Field>
        <Field label="About text" htmlFor="pf-bio" hint="Leave a blank line between paragraphs.">
          <textarea id="pf-bio" rows={8} className={inputCls} value={draft.bio} onChange={(e) => set('bio', e.target.value)} />
        </Field>
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium">Highlights (up to 4)</span>
        <p className="text-xs text-text-secondary">Short facts shown on the about page. Only add numbers you can stand behind.</p>
        {draft.highlights.map((h, i) => (
          <div key={i} className="flex gap-2">
            <input className={`${inputCls} w-32`} placeholder="Value" aria-label={`Highlight ${i + 1} value`} value={h.value} onChange={(e) => set('highlights', draft.highlights.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} />
            <input className={inputCls} placeholder="Label" aria-label={`Highlight ${i + 1} label`} value={h.label} onChange={(e) => set('highlights', draft.highlights.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
            <button type="button" className={btnDanger} aria-label={`Remove highlight ${i + 1}`} onClick={() => set('highlights', draft.highlights.filter((_, k) => k !== i))}><Trash2 size={16} /></button>
          </div>
        ))}
        {draft.highlights.length < 4 && (
          <button type="button" className={btnGhost} onClick={() => set('highlights', [...draft.highlights, { value: '', label: '' }])}><Plus size={16} /> Add highlight</button>
        )}
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium">Your links</span>
        <p className="text-xs text-text-secondary">Social profiles, WhatsApp (https://wa.me/260...), email, or a booking page. Icons are picked automatically.</p>
        <LinksEditor links={draft.links} onChange={(v) => set('links', v)} addLabel="Add a link" />
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium">Questions and answers</span>
        <p className="text-xs text-text-secondary">Shown on the home and about pages. Search engines and AI assistants use these to answer questions about you, so write them the way people ask.</p>
        {draft.faqs.map((f, i) => (
          <div key={i} className="space-y-2 border border-neon-indigo/20 bg-bg-card p-3">
            <input className={inputCls} placeholder="Question" aria-label={`Question ${i + 1}`} value={f.q} onChange={(e) => set('faqs', draft.faqs.map((x, k) => (k === i ? { ...x, q: e.target.value } : x)))} />
            <textarea rows={2} className={inputCls} placeholder="Answer" aria-label={`Answer ${i + 1}`} value={f.a} onChange={(e) => set('faqs', draft.faqs.map((x, k) => (k === i ? { ...x, a: e.target.value } : x)))} />
            <button type="button" className={btnDanger} onClick={() => set('faqs', draft.faqs.filter((_, k) => k !== i))}><Trash2 size={16} /> Remove</button>
          </div>
        ))}
        <button type="button" className={btnGhost} onClick={() => set('faqs', [...draft.faqs, { q: '', a: '' }])}><Plus size={16} /> Add a question</button>
      </div>
    </section>
  );
}
