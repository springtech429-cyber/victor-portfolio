import { ArrowUpRight } from 'lucide-react';
import { TLink } from '../shell/Transition';
import { CONTENT_TYPES, entryHref } from '@/lib/content-types';
import { formatDate } from '@/lib/helpers';
import type { Entry } from '@/lib/types';

export function WritingRow({ entry }: { entry: Entry }) {
  const cfg = CONTENT_TYPES[entry.type];
  const where = entry.meta.publication || entry.meta.event || entry.meta.client || '';
  return (
    <li className="border-b hairline">
      <TLink href={entryHref(entry)} data-cursor="Read" className="group grid gap-3 py-8 md:grid-cols-[9rem_1fr_auto] md:items-baseline md:gap-8">
        <time dateTime={entry.date || undefined} className="font-mono text-xs uppercase tracking-[0.14em] text-text-secondary">
          {entry.date ? formatDate(entry.date) : cfg.label}
        </time>
        <div>
          <p className="eyebrow mb-2 text-text-secondary">{cfg.label}{where ? ` · ${where}` : ''}</p>
          <h3 className="font-display text-xl font-bold leading-snug transition-colors group-hover:text-neon-blue md:text-3xl">{entry.title}</h3>
          {entry.summary && <p className="mt-3 max-w-3xl text-text-secondary">{entry.summary}</p>}
        </div>
        <ArrowUpRight className="hidden text-text-secondary transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-neon-blue md:block" />
      </TLink>
    </li>
  );
}
