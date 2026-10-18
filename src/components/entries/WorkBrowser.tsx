'use client';
import { useMemo, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { EntryCard } from './EntryCard';
import { WorkIndex } from '../home/WorkIndex';
import { CONTENT_TYPES } from '@/lib/content-types';
import type { Entry } from '@/lib/types';

export function WorkBrowser({ entries }: { entries: Entry[] }) {
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const chips = useMemo(() => {
    const out: { id: string; label: string }[] = [{ id: 'all', label: 'All' }];
    const types = Array.from(new Set(entries.map((e) => e.type)));
    if (types.length > 1) types.forEach((t) => out.push({ id: `type:${t}`, label: CONTENT_TYPES[t].plural }));
    Array.from(new Set(entries.map((e) => e.category).filter(Boolean))).forEach((c) => out.push({ id: `cat:${c}`, label: c }));
    return out;
  }, [entries]);

  const shown = entries.filter((e) => filter === 'all' || (filter.startsWith('type:') ? `type:${e.type}` === filter : `cat:${e.category}` === filter));

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        {chips.length > 2 ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter work">
            {chips.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                aria-pressed={filter === c.id}
                className={`rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] transition-colors ${filter === c.id ? 'border-neon-blue bg-neon-blue text-bg-primary' : 'hairline text-text-secondary hover:border-neon-blue/60 hover:text-text-primary'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        ) : <span />}
        <div className="flex rounded-full border hairline p-1" role="group" aria-label="Layout">
          {([['grid', LayoutGrid, 'Grid'], ['list', List, 'List']] as const).map(([id, Icon, label]) => (
            <button key={id} onClick={() => setView(id)} aria-pressed={view === id} aria-label={`${label} view`} className={`grid h-9 w-9 place-items-center rounded-full transition-colors ${view === id ? 'bg-neon-blue text-bg-primary' : 'text-text-secondary hover:text-text-primary'}`}>
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {view === 'grid' ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((e, i) => (
            <li key={e.id}>
              <EntryCard entry={e} priority={i < 3} />
            </li>
          ))}
        </ul>
      ) : (
        <WorkIndex items={shown} />
      )}
    </div>
  );
}
