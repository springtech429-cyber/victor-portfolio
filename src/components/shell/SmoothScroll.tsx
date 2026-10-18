'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

let instance: Lenis | null = null;

/** Jump (or glide) to the top of the page. Works with and without smooth scrolling. */
export function scrollToTop(immediate = true) {
  if (instance) instance.scrollTo(0, { immediate, force: true });
  else window.scrollTo({ top: 0, left: 0, behavior: immediate ? 'auto' : 'smooth' });
}

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    // Take over scroll restoration so a new page always opens at the top.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, autoRaf: true });
    instance = lenis;
    return () => {
      lenis.destroy();
      instance = null;
    };
  }, []);

  // Every time the address changes, land at the top. Repeated briefly because the new page's height settles after it renders.
  useEffect(() => {
    scrollToTop(true);
    const ids = [60, 200, 450].map((ms) => window.setTimeout(() => scrollToTop(true), ms));
    return () => ids.forEach(clearTimeout);
  }, [pathname]);

  return null;
}
