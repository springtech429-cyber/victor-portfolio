'use client';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { TLink } from '../shell/Transition';
import { detectTier } from '@/lib/quality';
import { CONTENT_TYPES, entryHref } from '@/lib/content-types';
import { videoThumbnail } from '@/lib/helpers';
import type { Entry } from '@/lib/types';
import type { GalleryItem } from '../three/Gallery3D';

const Gallery3D = lazy(() => import('../three/Gallery3D'));

/**
 * A scroll-driven 3D carousel of your featured work. It only appears on devices that can run it well;
 * everyone else (and every search engine) gets the plain work list that follows it.
 */
export function FeaturedShowcase({ entries }: { entries: Entry[] }) {
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(0);
  // The 3D ring is only downloaded when the section is about to scroll into view, and it stops drawing when it is far away.
  const [near, setNear] = useState(false);
  const [everNear, setEverNear] = useState(false);
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);

  useEffect(() => {
    setEnabled(detectTier() === 'high' && entries.length >= 2);
  }, [entries.length]);

  useEffect(() => {
    if (!enabled || !section.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setNear(e.isIntersecting);
        if (e.isIntersecting) setEverNear(true);
      },
      { rootMargin: '100% 0px' }
    );
    io.observe(section.current);
    return () => io.disconnect();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const update = () => {
      const el = section.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const range = Math.max(1, r.height - window.innerHeight);
      progress.current = Math.min(1, Math.max(0, -r.top / range));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [enabled]);

  if (!enabled) return null;
  const items: GalleryItem[] = entries.map((e) => ({
    title: e.title,
    href: entryHref(e),
    image: e.coverImage || (e.type === 'film' ? videoThumbnail(e.meta.videoUrl || '') : ''),
    label: CONTENT_TYPES[e.type].label,
  }));
  const current = items[Math.min(active, items.length - 1)];

  return (
    <section ref={section} className="relative z-10" style={{ height: `${entries.length * 55 + 100}vh` }} aria-label="Selected work, 3D gallery">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="wrap pointer-events-none absolute inset-x-0 top-24 z-10 flex items-start justify-between">
          <div>
            <p className="eyebrow">Selected work</p>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">Scroll to turn the ring · click a card to open it</p>
          </div>
          <p className="font-mono text-xs text-text-secondary">
            {String(Math.min(active, items.length - 1) + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
          </p>
        </div>
        <div className="absolute inset-0">
          {everNear && (
            <Suspense fallback={null}>
              <Gallery3D items={items} progress={progress} onActive={setActive} active={near} />
            </Suspense>
          )}
        </div>
        <div className="wrap absolute inset-x-0 bottom-10 z-10 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-text-secondary">{current.label}</p>
            <p className="mt-2 max-w-xl font-display text-2xl font-bold md:text-4xl">{current.title}</p>
          </div>
          <TLink href={current.href} className="inline-flex items-center gap-2 rounded-full border border-neon-blue px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-neon-blue transition-colors hover:bg-neon-blue hover:text-bg-primary">
            Open <ArrowUpRight size={14} />
          </TLink>
        </div>
      </div>
    </section>
  );
}
