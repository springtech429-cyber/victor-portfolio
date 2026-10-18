import type { ReactNode } from 'react';

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="wrap pb-12 pt-32 md:pb-16 md:pt-44">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="h-section mt-5 max-w-4xl text-[clamp(2.4rem,6.5vw,5.4rem)]">{title}</h1>
      {children && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary md:text-xl">{children}</p>}
    </header>
  );
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed hairline p-12 text-center">
      <p className="font-display text-xl font-bold">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-text-secondary">{children}</p>
    </div>
  );
}
