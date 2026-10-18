import Image from 'next/image';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { TLink } from '../shell/Transition';
import { Reveal } from '../shell/Reveal';
import { Markdown } from './Markdown';
import { VideoEmbed } from './VideoEmbed';
import { JsonLd } from './JsonLd';
import { ctaLinks, metaRows } from './meta';
import { CONTENT_TYPES, SECTION_NAME, entryHref } from '@/lib/content-types';
import { breadcrumbLd, entryLd } from '@/lib/seo';
import { iconForLink } from '@/lib/linkIcon';
import { readingMinutes, safeUrl } from '@/lib/helpers';
import type { Entry, Profile } from '@/lib/types';

export function EntryPage({ entry, profile, siblings }: { entry: Entry; profile: Profile; siblings: { prev: Entry | null; next: Entry | null } }) {
  const cfg = CONTENT_TYPES[entry.type];
  const section = cfg.section;
  const rows = metaRows(entry);
  const links = [...ctaLinks(entry), ...entry.links.filter((l) => safeUrl(l.url)).map((l) => ({ label: l.label, url: safeUrl(l.url) }))];
  const video = entry.meta.videoUrl || '';
  const isText = ['article', 'oped', 'story', 'press'].includes(entry.type);
  const file = safeUrl(entry.fileUrl);
  const optimisedCover = entry.coverImage && !entry.coverImage.startsWith('data:');

  return (
    <article className="pb-10 pt-28 md:pt-36">
      <JsonLd data={entryLd(entry, profile)} />
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: SECTION_NAME[section], path: `/${section}` }, { name: entry.title, path: entryHref(entry) }])} />

      <header className="wrap">
        <TLink href={`/${section}`} className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-text-secondary transition-colors hover:text-neon-blue">
          <ArrowLeft size={14} /> {SECTION_NAME[section]}
        </TLink>
        <p className="eyebrow mt-10">{cfg.label}</p>
        <h1 className={`mt-4 max-w-5xl font-extrabold leading-[1.02] ${isText ? 'text-[clamp(2rem,5.5vw,4.4rem)]' : 'h-section'}`}>{entry.title}</h1>
        {entry.summary && <p className="mt-6 max-w-3xl text-lg leading-relaxed text-text-secondary md:text-xl">{entry.summary}</p>}

        {rows.length > 0 && (
          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-5 border-y hairline py-6 md:grid-cols-4">
            {rows.map((r) => (
              <div key={r.label}>
                <dt className="eyebrow text-text-secondary">{r.label}</dt>
                <dd className="mt-1.5 text-sm font-medium">{r.value}</dd>
              </div>
            ))}
            {isText && (
              <div>
                <dt className="eyebrow text-text-secondary">Reading time</dt>
                <dd className="mt-1.5 text-sm font-medium">{readingMinutes(entry.body)} min</dd>
              </div>
            )}
          </dl>
        )}
      </header>

      {(video || entry.coverImage) && (
        <Reveal className="wrap mt-10">
          {video && safeUrl(video) ? (
            <VideoEmbed url={video} title={entry.title} />
          ) : (
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl border hairline bg-bg-secondary">
              {optimisedCover ? (
                <Image src={entry.coverImage} alt={entry.title} fill priority sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entry.coverImage} alt={entry.title} className="h-full w-full object-cover" />
              )}
            </div>
          )}
        </Reveal>
      )}

      <div className={`wrap mt-12 grid gap-12 ${isText ? 'lg:grid-cols-[1fr_minmax(0,46rem)_1fr]' : 'lg:grid-cols-[minmax(0,1fr)_20rem]'}`}>
        <div className={isText ? 'lg:col-start-2' : ''}>
          {entry.body.trim() && <Markdown>{entry.body}</Markdown>}

          {entry.gallery.length > 0 && (
            <div className="mt-14 grid gap-4 sm:grid-cols-2">
              {entry.gallery.map((src, i) => (
                <div key={src + i} className="relative aspect-[4/3] overflow-hidden rounded-lg border hairline bg-bg-secondary">
                  {src.startsWith('data:') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={`${entry.title}, picture ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <Image src={src} alt={`${entry.title}, picture ${i + 1}`} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {(links.length > 0 || file || entry.tags.length > 0) && (
          <aside className={`space-y-8 ${isText ? 'lg:col-start-2' : ''} lg:sticky lg:top-28 lg:self-start`}>
            {links.length > 0 && (
              <ul className="flex flex-col gap-3">
                {links.map((l) => {
                  const Icon = iconForLink(l);
                  return (
                    <li key={l.url + l.label}>
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between gap-3 rounded-lg border border-neon-blue/50 px-4 py-3 text-sm font-medium text-neon-blue transition-colors hover:bg-neon-blue hover:text-bg-primary">
                        <span className="flex items-center gap-2"><Icon size={16} /> {l.label || 'Open link'}</span>
                        <ExternalLink size={14} />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
            {file && (
              <a href={file} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-lg border hairline px-4 py-3 text-sm transition-colors hover:border-neon-purple">
                <span className="flex items-center gap-2"><Download size={16} /> {cfg.fileLabel?.replace(/ \(optional\)/, '') || 'Download PDF'}</span>
              </a>
            )}
            {entry.tags.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {entry.tags.map((t) => (
                  <li key={t} className="rounded-full border hairline px-3 py-1 font-mono text-xs text-text-secondary">{t}</li>
                ))}
              </ul>
            )}
          </aside>
        )}
      </div>

      {(siblings.prev || siblings.next) && (
        <nav className="wrap mt-24 grid gap-4 border-t hairline pt-10 sm:grid-cols-2" aria-label="More in this section">
          {siblings.prev ? (
            <TLink href={entryHref(siblings.prev)} className="group rounded-xl border hairline p-6 transition-colors hover:border-neon-blue/60" data-cursor="Prev">
              <span className="eyebrow text-text-secondary">Previous</span>
              <span className="mt-2 block font-display text-xl font-bold group-hover:text-neon-blue">{siblings.prev.title}</span>
            </TLink>
          ) : <span />}
          {siblings.next && (
            <TLink href={entryHref(siblings.next)} className="group rounded-xl border hairline p-6 text-right transition-colors hover:border-neon-blue/60" data-cursor="Next">
              <span className="eyebrow text-text-secondary">Next</span>
              <span className="mt-2 block font-display text-xl font-bold group-hover:text-neon-blue">{siblings.next.title}</span>
            </TLink>
          )}
        </nav>
      )}
    </article>
  );
}
