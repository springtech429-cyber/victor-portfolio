import { ArrowUpRight } from 'lucide-react';
import { TLink } from './Transition';
import { iconForLink } from '@/lib/linkIcon';
import { safeUrl } from '@/lib/helpers';
import type { Profile } from '@/lib/types';

export function Footer({ profile }: { profile: Profile }) {
  const links = profile.links.filter((l) => safeUrl(l.url));
  return (
    <footer className="relative z-10 border-t hairline bg-bg-primary/80 backdrop-blur-sm">
      <div className="wrap py-16 md:py-24">
        <p className="eyebrow mb-6">Got a project?</p>
        <TLink href="/contact" data-cursor="Talk" className="group block">
          <span className="h-display block max-w-5xl transition-colors group-hover:text-neon-blue">
            Let&apos;s build something <span className="text-outline group-hover:text-neon-blue">worth sharing.</span>
          </span>
        </TLink>

        <div className="mt-16 grid gap-10 border-t hairline pt-10 md:grid-cols-4">
          <div>
            <p className="font-display text-lg font-bold">{profile.name}</p>
            <p className="mt-2 max-w-xs text-sm text-text-secondary">{profile.role}</p>
            {profile.location && <p className="mt-1 font-mono text-xs text-text-secondary">{profile.location}</p>}
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
            <span className="eyebrow mb-1 text-text-secondary">Explore</span>
            {[['/work', 'Work'], ['/services', 'Services'], ['/writing', 'Writing'], ['/copy', 'Brand & copy'], ['/speaking', 'Speaking'], ['/about', 'About'], ['/contact', 'Contact']].map(([h, l]) => (
              <TLink key={h} href={h} className="w-fit text-text-secondary transition-colors hover:text-neon-blue">{l}</TLink>
            ))}
          </nav>
          <div className="flex flex-col gap-2 text-sm md:col-span-2">
            <span className="eyebrow mb-1 text-text-secondary">Elsewhere</span>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {links.map((l) => {
                const Icon = iconForLink(l);
                return (
                  <li key={l.url + l.label}>
                    <a href={safeUrl(l.url)} target="_blank" rel="noopener noreferrer me" className="inline-flex items-center gap-2 text-text-secondary transition-colors hover:text-neon-blue">
                      <Icon size={16} /> {l.label || l.url} <ArrowUpRight size={12} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <p className="mt-14 font-mono text-xs text-text-secondary">© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
