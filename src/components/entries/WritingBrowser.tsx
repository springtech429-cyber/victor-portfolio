'use client';
import { useMemo, useState } from 'react';
import { WritingRow } from './WritingRow';
import { CONTENT_TYPES } from '@/lib/content-types';
import type { Entry } from '@/lib/types';

export function WritingBrowser({ entries }: { entries: Entry[] }) {
  const [filter, setFilter] = useState('all');
  const types = useMemo(() => Array.from(new Set(entries.map((e) => e.type))), [entries]);
  const shown = filter === 'all' ? entries : entries.filter((e) => e.type === filter);
  return (
    <div>
      {types.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter writing">
          {[{ id: 'all', label: 'All' }, ...types.map((t) => ({ id: t, label: CONTENT_TYPES[t].plural }))].map((c) => (
            <button key={c.id} onClick={() => setFilter(c.id)} aria-pressed={filter === c.id} className={`rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] transition-colors ${filter === c.id ? 'border-neon-blue bg-neon-blue text-bg-primary' : 'hairline text-text-secondary hover:border-neon-blue/60 hover:text-text-primary'}`}>
              {c.label}
            </button>
          ))}
        </div>
      )}
      <ul className="border-t hairline">
        {shown.map((e) => (
          <WritingRow key={e.id} entry={e} />
        ))}
      </ul>
    </div>
  );
}
