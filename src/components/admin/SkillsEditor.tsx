'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { AccentColor, Profile, SkillGroup } from '@/lib/types';
import { ACCENT, uid } from '@/lib/helpers';
import { btnDanger, btnGhost, Field, inputCls } from './ui';

interface Props {
  draft: Profile;
  setDraft: (p: Profile) => void;
}

export function SkillsEditor({ draft, setDraft }: Props) {
  const groups = draft.skillGroups;
  const setGroups = (g: SkillGroup[]) => setDraft({ ...draft, skillGroups: g });
  const update = (i: number, patch: Partial<SkillGroup>) => setGroups(groups.map((g, k) => (k === i ? { ...g, ...patch } : g)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= groups.length) return;
    const next = [...groups];
    [next[i], next[j]] = [next[j], next[i]];
    setGroups(next);
  };

  return (
    <section aria-labelledby="skills-heading" className="space-y-6 max-w-3xl">
      <div>
        <h2 id="skills-heading" className="text-xl font-display font-bold">Skills and services</h2>
        <p className="text-sm text-text-secondary">Group what you offer. Each group becomes a card on the Skills page.</p>
      </div>

      {groups.map((g, i) => (
        <div key={g.id} className="p-4 bg-bg-card border border-neon-indigo/20 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Field label="Group name" htmlFor={`sg-title-${g.id}`}>
              <input id={`sg-title-${g.id}`} className={inputCls} value={g.title} onChange={(e) => update(i, { title: e.target.value })} />
            </Field>
            <Field label="Accent colour" htmlFor={`sg-color-${g.id}`}>
              <select id={`sg-color-${g.id}`} className={inputCls} value={g.color} onChange={(e) => update(i, { color: e.target.value as AccentColor })}>
                {(Object.keys(ACCENT) as AccentColor[]).map((c) => (
                  <option key={c} value={c}>{ACCENT[c].label}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Skills" htmlFor={`sg-skills-${g.id}`} hint="Separate with commas.">
            <input
              id={`sg-skills-${g.id}`}
              className={inputCls}
              value={g.skills.join(', ')}
              onChange={(e) => update(i, { skills: e.target.value.split(',').map((s) => s.trimStart()) })}
              onBlur={(e) => update(i, { skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            />
          </Field>
          <div className="flex gap-2">
            <button type="button" className={btnGhost} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move group up"><ArrowUp size={16} /></button>
            <button type="button" className={btnGhost} disabled={i === groups.length - 1} onClick={() => move(i, 1)} aria-label="Move group down"><ArrowDown size={16} /></button>
            <button type="button" className={btnDanger} onClick={() => setGroups(groups.filter((_, k) => k !== i))}><Trash2 size={16} /> Remove group</button>
          </div>
        </div>
      ))}

      <button
        type="button"
        className={btnGhost}
        onClick={() => setGroups([...groups, { id: uid(), title: '', color: (['blue', 'purple', 'pink'] as AccentColor[])[groups.length % 3], skills: [] }])}
      >
        <Plus size={16} /> Add group
      </button>
    </section>
  );
}
