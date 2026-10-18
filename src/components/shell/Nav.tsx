'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { TLink } from './Transition';
import { initials, safeUrl } from '@/lib/helpers';

const LINKS = [
  { href: '/work', label: 'Work' },
  { href: '/services', label: 'Services' },
  { href: '/writing', label: 'Writing' },
  { href: '/copy', label: 'Brand & copy' },
  { href: '/speaking', label: 'Speaking' },
  { href: '/about', label: 'About' },
];

export function Nav({ name, resumeUrl }: { name: string; resumeUrl: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const resume = safeUrl(resumeUrl);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.documentElement.classList.toggle('lenis-stopped', open);
    return () => document.documentElement.classList.remove('lenis-stopped');
  }, [open]);

  const active = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled || open ? 'glass border-x-0 border-t-0' : 'border-b border-transparent'}`}>
      <nav className="wrap flex h-16 items-center justify-between md:h-20" aria-label="Main">
        <TLink href="/" className="group flex items-center gap-3" aria-label={`${name}, home`}>
          <span className="grid h-9 w-9 place-items-center rounded-md border border-neon-blue/60 font-display text-xs font-bold text-neon-blue transition-colors group-hover:bg-neon-blue group-hover:text-bg-primary">
            {initials(name)}
          </span>
          <span className="hidden font-display text-sm font-semibold tracking-tight sm:block">{name}</span>
        </TLink>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <TLink
                href={l.href}
                aria-current={active(l.href) ? 'page' : undefined}
                className={`relative px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] transition-colors hover:text-text-primary ${active(l.href) ? 'text-neon-blue' : 'text-text-secondary'}`}
              >
                {l.label}
                {active(l.href) && <span className="absolute inset-x-3 -bottom-0.5 h-px bg-neon-blue" />}
              </TLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          {resume && (
            <a href={resume} target="_blank" rel="noopener noreferrer" className="hidden font-mono text-xs uppercase tracking-[0.16em] text-text-secondary hover:text-text-primary lg:block">
              Resume
            </a>
          )}
          <TLink href="/contact" className="hidden items-center gap-1.5 rounded-full border border-neon-blue px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-neon-blue transition-colors hover:bg-neon-blue hover:text-bg-primary md:inline-flex">
            Let&apos;s talk <ArrowUpRight size={14} />
          </TLink>
          <button
            className="grid h-10 w-10 place-items-center rounded-md border hairline md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="h-[calc(100dvh-4rem)] overflow-y-auto md:hidden">
          <ul className="wrap flex flex-col gap-2 py-8">
            {[{ href: '/', label: 'Home' }, ...LINKS, { href: '/contact', label: 'Contact' }].map((l) => (
              <li key={l.href}>
                <TLink href={l.href} className={`block border-b hairline py-4 font-display text-3xl font-bold ${active(l.href) ? 'text-neon-blue' : ''}`}>
                  {l.label}
                </TLink>
              </li>
            ))}
            {resume && (
              <li>
                <a href={resume} target="_blank" rel="noopener noreferrer" className="block py-4 font-mono text-sm uppercase tracking-[0.16em] text-text-secondary">
                  Download resume
                </a>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
