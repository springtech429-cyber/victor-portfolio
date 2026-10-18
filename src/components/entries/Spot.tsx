'use client';
import type { CSSProperties, ReactNode } from 'react';

/** Adds a soft light that follows the pointer across a card. */
export function Spot({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`card-spot ${className}`}
      style={style}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}
