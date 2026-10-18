'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { scrollToTop } from './SmoothScroll';

type Phase = 'idle' | 'cover' | 'reveal';
const Ctx = createContext<{ go: (href: string) => void }>({ go: () => {} });
export const useTransitionNav = () => useContext(Ctx);

/** Wipes a set of neon panels across the screen while the next page loads. */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>('idle');
  const pending = useRef<string | null>(null);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const go = useCallback(
    (href: string) => {
      const target = href.split('#')[0].split('?')[0] || '/';
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (target === pathname && !href.includes('#')) {
        // Clicking the page you are already on (for example a footer link): glide back to the top.
        scrollToTop(false);
        return;
      }
      if (reduced || target === pathname || pending.current) {
        if (target !== pathname && !href.includes('#')) scrollToTop(true);
        router.push(href);
        return;
      }
      pending.current = target;
      setPhase('cover');
      later(() => {
        // The panels cover the screen now, so jumping to the top is invisible.
        if (!href.includes('#')) scrollToTop(true);
        router.push(href);
      }, 620);
      // If the page never arrives, don't leave the screen covered.
      later(() => {
        pending.current = null;
        setPhase('idle');
      }, 6000);
    },
    [pathname, router]
  );

  useEffect(() => {
    if (pending.current && pathname === pending.current) {
      pending.current = null;
      if (!window.location.hash) scrollToTop(true);
      later(() => setPhase('reveal'), 80);
      later(() => setPhase('idle'), 900);
    }
  }, [pathname]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return (
    <Ctx.Provider value={{ go }}>
      {children}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-[80] flex ${phase === 'cover' ? 'pt-cover' : phase === 'reveal' ? 'pt-reveal' : ''} ${phase === 'cover' ? '' : 'pointer-events-none'}`}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="pt-panel h-full flex-1 bg-bg-secondary" style={{ ['--i' as string]: i, boxShadow: 'inset 0 -2px 0 var(--neon-blue)' }} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

/** A normal link that plays the page transition. Falls back to a plain link for new tabs and modified clicks. */
export function TLink({ href, onClick, ...rest }: ComponentProps<typeof Link>) {
  const { go } = useTransitionNav();
  const url = typeof href === 'string' ? href : href.pathname || '/';
  return (
    <Link
      href={href}
      scroll={false}
      {...rest}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (rest.target === '_blank' || /^(https?:|mailto:|tel:)/.test(url)) return;
        e.preventDefault();
        go(url);
      }}
    />
  );
}
