import { ArrowDown, ArrowRight } from 'lucide-react';
import { TLink } from '../shell/Transition';
import { splitName } from '@/lib/helpers';
import type { CSSProperties } from 'react';
import type { Profile } from '@/lib/types';

function Letters({ text, offset }: { text: string; offset: number }) {
  return (
    <>
      {text.split('').map((ch, i) => (
        <span key={i} aria-hidden="true" className="char" style={{ '--i': offset + i } as CSSProperties}>
          {ch === ' ' ? '\u00a0' : ch}
        </span>
      ))}
    </>
  );
}

export function Hero({ profile }: { profile: Profile }) {
  const { first, rest } = splitName(profile.name);
  const f = first.toUpperCase();
  const r = rest.toUpperCase();
  return (
    <section className="relative flex min-h-[100svh] items-center pb-16 pt-28" aria-labelledby="hero-title">
      <div className="wrap w-full">
        <div className="reveal in inline-flex items-center gap-2.5 rounded-full border hairline bg-bg-card/50 px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] backdrop-blur">
          <span className={`h-2 w-2 rounded-full ${profile.available ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-text-secondary'}`} aria-hidden="true" />
          {profile.statusText || (profile.available ? 'Available for projects' : 'Currently booked')}
          {profile.location && <span className="text-text-secondary">· {profile.location}</span>}
        </div>

        <h1 id="hero-title" aria-label={profile.name} className="h-display mt-8 max-w-[14ch] break-words">
          <span className="block">
            <Letters text={f} offset={0} />
          </span>
          {r && (
            <span className="text-outline block">
              <Letters text={r} offset={f.length} />
            </span>
          )}
        </h1>

        <p className="mt-8 font-display text-[clamp(1.5rem,3.4vw,2.8rem)] font-bold leading-tight text-neon-blue [text-shadow:0_0_28px_rgba(0,217,255,0.55)]">{profile.role}</p>
        {profile.headline && <p className="mt-4 max-w-xl font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">{profile.headline}</p>}
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-text-secondary md:text-xl">{profile.tagline}</p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <TLink href="/work" data-cursor="Go" className="group inline-flex items-center gap-3 rounded-full bg-neon-blue px-7 py-4 font-mono text-xs font-medium uppercase tracking-[0.16em] text-bg-primary transition-shadow hover:shadow-[0_0_40px_rgba(0,217,255,0.45)]">
            See my work <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </TLink>
          <TLink href="/contact" className="rounded-full border hairline px-7 py-4 font-mono text-xs uppercase tracking-[0.16em] transition-colors hover:border-neon-blue hover:text-neon-blue">
            Start a project
          </TLink>
        </div>
      </div>

      <a href="#next" className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-text-secondary md:flex" aria-label="Scroll to the next section">
        Scroll <ArrowDown size={14} className="animate-bounce" />
      </a>
    </section>
  );
}
