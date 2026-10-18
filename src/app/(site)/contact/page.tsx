import { ArrowUpRight } from 'lucide-react';
import { PageHeader } from '@/components/entries/PageHeader';
import { ContactForm } from '@/components/entries/ContactForm';
import { Reveal } from '@/components/shell/Reveal';
import { getProfile } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { safeUrl } from '@/lib/helpers';
import { iconForLink } from '@/lib/linkIcon';

export async function generateMetadata() {
  const p = await getProfile();
  return buildMetadata({ title: 'Contact', description: `Start a project with ${p.name}. Send a message or book a call.`, path: '/contact' });
}

export default async function ContactPage() {
  const profile = await getProfile();
  const links = profile.links.filter((l) => safeUrl(l.url));
  return (
    <>
      <PageHeader eyebrow="Contact" title="Tell me what you need">
        Send a message and I will reply by email. {profile.available ? 'I am taking on new projects.' : 'I am fully booked right now, but get in touch about later dates.'}
      </PageHeader>
      <div className="wrap grid gap-14 pb-28 lg:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <ContactForm />
        </Reveal>
        <Reveal delay={120}>
          <aside className="space-y-4">
            <p className="eyebrow text-text-secondary">Or reach me here</p>
            <ul className="space-y-3">
              {links.map((l) => {
                const Icon = iconForLink(l);
                return (
                  <li key={l.url + l.label}>
                    <a href={safeUrl(l.url)} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between gap-4 rounded-xl border hairline bg-bg-card/60 px-5 py-4 transition-colors hover:border-neon-blue/60">
                      <span className="flex items-center gap-3"><Icon size={18} className="text-neon-blue" /> {l.label || l.url}</span>
                      <ArrowUpRight size={16} className="text-text-secondary transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-neon-blue" />
                    </a>
                  </li>
                );
              })}
            </ul>
            {profile.location && <p className="pt-4 font-mono text-xs uppercase tracking-[0.14em] text-text-secondary">Based in {profile.location}</p>}
          </aside>
        </Reveal>
      </div>
    </>
  );
}
