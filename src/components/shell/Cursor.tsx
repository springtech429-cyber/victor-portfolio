'use client';
import { useEffect, useRef } from 'react';

/** A ring that follows the pointer and shows a label (View, Play, Read) over interactive cards. Desktop only. */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ring.current;
    if (!el) return;
    if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let x = -100, y = -100, tx = -100, ty = -100, raf = 0;
    const loop = () => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      // Stop when the ring has caught up with the pointer, so an idle page does no work.
      raf = Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
      el.classList.add('on');
      const target = (e.target as Element | null)?.closest?.('[data-cursor]') as HTMLElement | null;
      const label = target?.dataset.cursor || '';
      el.classList.toggle('big', !!label);
      if (el.textContent !== label) el.textContent = label;
    };
    const leave = () => el.classList.remove('on');
    const down = () => el.classList.add('press');
    const up = () => el.classList.remove('press');
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    document.documentElement.addEventListener('mouseleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      document.documentElement.removeEventListener('mouseleave', leave);
    };
  }, []);

  return <div ref={ring} className="cursor-ring" aria-hidden="true" />;
}
