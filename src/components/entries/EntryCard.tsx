'use client';
import Image from 'next/image';
import { ArrowUpRight, Play } from 'lucide-react';
import { TLink } from '../shell/Transition';
import { Spot } from './Spot';
import { CONTENT_TYPES, entryHref } from '@/lib/content-types';
import { formatDate, videoThumbnail } from '@/lib/helpers';
import type { Entry } from '@/lib/types';

export function EntryImage({ entry, sizes, priority = false }: { entry: Entry; sizes: string; priority?: boolean }) {
  const src = entry.coverImage || (entry.type === 'film' ? videoThumbnail(entry.meta.videoUrl || '') : '');
  if (!src) {
    return (
      <div className="grid h-full w-full place-items-center bg-bg-secondary bg-[linear-gradient(135deg,rgba(0,217,255,0.12),transparent_55%,rgba(47,107,255,0.16))] font-display text-6xl font-extrabold text-neon-blue/40">
        {entry.title.charAt(0).toUpperCase()}
      </div>
    );
  }
  const optimised = !src.startsWith('data:') && !src.includes('i.ytimg.com');
  return optimised ? (
    <Image src={src} alt="" fill sizes={sizes} priority={priority} className="object-cover transition-transform duration-700 group-hover:scale-105" />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
  );
}

export function EntryCard({ entry, priority = false }: { entry: Entry; priority?: boolean }) {
  const cfg = CONTENT_TYPES[entry.type];
  const sub = [cfg.label, entry.meta.year || (entry.date ? formatDate(entry.date, { year: 'numeric' }) : '')].filter(Boolean).join(' · ');
  return (
    <Spot className="group rounded-xl border hairline bg-bg-card/60 transition-colors hover:border-neon-blue/60">
      <TLink href={entryHref(entry)} data-cursor={entry.type === 'film' ? 'Play' : 'View'} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <EntryImage entry={entry} priority={priority} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/70 via-transparent to-transparent" />
          {entry.type === 'film' && (
            <span className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-neon-blue text-bg-primary">
              <Play size={16} fill="currentColor" />
            </span>
          )}
          {entry.featured && <span className="absolute right-4 top-4 rounded-full bg-neon-purple px-3 py-1 font-mono text-[0.65rem] uppercase tracking-widest text-white">Featured</span>}
        </div>
        <div className="p-6">
          <p className="eyebrow text-text-secondary">{sub}</p>
          <h3 className="mt-3 flex items-start justify-between gap-3 text-xl font-bold leading-snug transition-colors group-hover:text-neon-blue">
            {entry.title}
            <ArrowUpRight size={20} className="mt-1 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
          </h3>
          {entry.summary && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-text-secondary">{entry.summary}</p>}
          {entry.tags.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {entry.tags.slice(0, 4).map((t) => (
                <li key={t} className="rounded-full border hairline px-3 py-1 font-mono text-[0.68rem] text-text-secondary">{t}</li>
              ))}
            </ul>
          )}
        </div>
      </TLink>
    </Spot>
  );
}
