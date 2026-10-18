'use client';
import { useEffect, useRef, useState } from 'react';
import { TLink } from '../shell/Transition';
import { CONTENT_TYPES, entryHref } from '@/lib/content-types';
import { videoThumbnail } from '@/lib/helpers';
import type { Entry } from '@/lib/types';

const cover = (e: Entry) => e.coverImage || (e.type === 'film' ? videoThumbnail(e.meta.videoUrl || '') : '');

/** A big typographic list of work. On desktop a preview picture follows the pointer. */
export function WorkIndex({ items }: { items: Entry[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const preview = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = preview.current;
    if (!el || !window.matchMedia('(pointer: fine)').matches) return;
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    const move = (e: PointerEvent) => { tx = e.clientX; ty = e.clientY; };
    const loop = () => {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      el.style.transform = `translate3d(${x + 28}px, ${y - 120}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener('pointermove', move, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointermove', move); };
  }, []);

  const current = hover !== null ? items[hover] : null;
  const currentImg = current ? cover(current) : '';

  return (
    <>
      <ul className="border-t hairline">
        {items.map((e, i) => {
          const cfg = CONTENT_TYPES[e.type];
          const thumb = cover(e);
          return (
            <li key={e.id} className="border-b hairline" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <TLink href={entryHref(e)} data-cursor={e.type === 'film' ? 'Play' : 'View'} className="group flex items-center gap-4 py-6 md:gap-8 md:py-9">
                <span className="w-8 shrink-0 font-mono text-xs text-text-secondary md:w-12">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex-1 font-display text-2xl font-bold leading-tight transition-all duration-500 group-hover:translate-x-3 group-hover:text-neon-blue md:text-5xl">{e.title}</span>
                <span className="hidden text-right font-mono text-xs uppercase tracking-[0.14em] text-text-secondary sm:block">
                  {cfg.label}
                  {e.meta.year ? ` · ${e.meta.year}` : ''}
                </span>
                {thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" loading="lazy" className="h-14 w-20 shrink-0 rounded-md object-cover md:hidden" />
                )}
              </TLink>
            </li>
          );
        })}
      </ul>
      <div ref={preview} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-40 hidden md:block">
        <div className={`h-60 w-80 overflow-hidden rounded-lg border border-neon-blue/60 bg-bg-card shadow-[0_0_50px_rgba(0,217,255,0.25)] transition-all duration-300 ${currentImg ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
          {currentImg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentImg} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      </div>
    </>
  );
}
