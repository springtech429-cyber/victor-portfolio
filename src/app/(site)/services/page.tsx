import { ArrowUpRight } from 'lucide-react';
import { PageHeader } from '@/components/entries/PageHeader';
import { JsonLd } from '@/components/entries/JsonLd';
import { FaqList } from '@/components/home/Faq';
import { Reveal } from '@/components/shell/Reveal';
import { TLink } from '@/components/shell/Transition';
import { getProfile } from '@/lib/data';
import { SERVICES, SERVICE_FAQS } from '@/lib/services';
import { breadcrumbLd, buildMetadata, faqLd, serviceLd } from '@/lib/seo';

export async function generateMetadata() {
  const p = await getProfile();
  return buildMetadata({
    title: `Services: software, corporate communications and PR${p.location ? ` in ${p.location}` : ''}`,
    description: `Web and software development, corporate communications and PR, copywriting, video and audio production, and digital marketing from ${p.name}${p.location ? `, based in ${p.location}` : ''}.`,
    path: '/services',
  });
}

export default async function ServicesPage() {
  const profile = await getProfile();
  return (
    <>
      <JsonLd data={serviceLd(profile)} />
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Services', path: '/services' }])} />
      <JsonLd data={faqLd(SERVICE_FAQS)} />

      <PageHeader eyebrow="Services" title="Software and communication, handled together">
        {profile.name} is a tech lead and communication specialist{profile.location ? ` in ${profile.location}` : ''}. Here is what I can take on for you.
      </PageHeader>

      <section className="wrap pb-20">
        <ul className="border-t hairline">
          {SERVICES.map((s) => (
            <li key={s.id} id={s.id} className="grid gap-8 border-b hairline py-12 md:grid-cols-[1fr_1.4fr] md:py-16">
              <Reveal>
                <h2 className="h-section text-[clamp(1.7rem,3.6vw,3rem)]">{s.title}</h2>
              </Reveal>
              <Reveal delay={100}>
                <p className="max-w-2xl text-lg leading-relaxed text-text-secondary">{s.body}</p>
                <ul className="mt-6 grid gap-2 text-text-primary sm:grid-cols-2">
                  {s.points.map((pt) => (
                    <li key={pt} className="flex gap-3 text-base">
                      <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon-blue" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap pb-24">
        <h2 className="h-section mb-8">Questions, answered</h2>
        <FaqList faqs={SERVICE_FAQS} />
        <TLink href="/contact" className="mt-12 inline-flex items-center gap-2 rounded-full bg-neon-blue px-7 py-4 font-mono text-xs font-medium uppercase tracking-[0.16em] text-bg-primary">
          Start a project <ArrowUpRight size={16} />
        </TLink>
      </section>
    </>
  );
}
