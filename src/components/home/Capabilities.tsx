import { Reveal } from '../shell/Reveal';
import { Spot } from '../entries/Spot';
import { ACCENT } from '@/lib/helpers';
import type { SkillGroup } from '@/lib/types';

export function Capabilities({ groups }: { groups: SkillGroup[] }) {
  const list = groups.filter((g) => g.title || g.skills.length);
  if (!list.length) return null;
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {list.map((g, i) => {
        const a = ACCENT[g.color];
        return (
          <Reveal key={g.id} delay={i * 90}>
            <Spot className="h-full rounded-xl border hairline bg-bg-card/60 p-7 transition-colors hover:border-neon-blue/50">
              <div className="mb-8 flex items-center justify-between">
                <span className={`font-mono text-xs ${a.text}`}>{String(i + 1).padStart(2, '0')}</span>
                <span className="h-1.5 w-10 rounded-full" style={{ background: a.css, boxShadow: `0 0 18px ${a.css}` }} />
              </div>
              <h3 className="text-2xl font-bold leading-tight">{g.title}</h3>
              <ul className="mt-6 flex flex-wrap gap-2">
                {g.skills.map((s) => (
                  <li key={s} className="rounded-full border hairline px-3 py-1.5 text-sm text-text-secondary">{s}</li>
                ))}
              </ul>
            </Spot>
          </Reveal>
        );
      })}
    </div>
  );
}
