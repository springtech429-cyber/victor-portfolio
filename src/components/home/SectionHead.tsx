import type { ReactNode } from 'react';
import { Reveal } from '../shell/Reveal';
import { TLink } from '../shell/Transition';
import { ArrowUpRight } from 'lucide-react';

export function SectionHead({ eyebrow, title, href, linkLabel, children }: { eyebrow: string; title: ReactNode; href?: string; linkLabel?: string; children?: ReactNode }) {
  return (
    <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="h-section mt-4 max-w-3xl">{title}</h2>
        {children && <p className="mt-5 max-w-2xl text-lg text-text-secondary">{children}</p>}
      </div>
      {href && (
        <TLink href={href} className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-neon-blue">
          {linkLabel || 'See all'} <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </TLink>
      )}
    </Reveal>
  );
}
