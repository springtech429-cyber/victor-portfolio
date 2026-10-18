import { Download } from 'lucide-react';
import Image from 'next/image';
import { PageHeader } from '@/components/entries/PageHeader';
import { Capabilities } from '@/components/home/Capabilities';
import { FaqList } from '@/components/home/Faq';
import { SectionHead } from '@/components/home/SectionHead';
import { JsonLd } from '@/components/entries/JsonLd';
import { Reveal } from '@/components/shell/Reveal';
import { Spot } from '@/components/entries/Spot';
import { getProfile, getSection } from '@/lib/data';
import { buildMetadata, breadcrumbLd, faqLd, personLd } from '@/lib/seo';
import { formatDate, initials, safeUrl, splitParagraphs } from '@/lib/helpers';

export async function generateMetadata() {
  const p = await getProfile();
  return buildMetadata({ title: 'About', description: `${p.name}: ${p.role}. ${p.tagline}`, path: '/about', image: p.avatarUrl || undefined });
}

export default async function AboutPage() {
  const [profile, certs] = await Promise.all([getProfile(), getSection('about', 'date')]);
  const resume = safeUrl(profile.resumeUrl);
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'ProfilePage', mainEntity: personLd(profile, certs) }} />
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }])} />
      {profile.faqs.length > 0 && <JsonLd data={faqLd(profile.faqs)} />}

      <PageHeader eyebrow="About" title={profile.aboutTitle || `About ${profile.name}`} />

      <section className="wrap grid gap-14 pb-24 lg:grid-cols-[22rem_1fr]">
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl border hairline bg-bg-card">
            {profile.avatarUrl ? (
              profile.avatarUrl.startsWith('data:') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                <Image src={profile.avatarUrl} alt={profile.name} fill priority sizes="(min-width: 1024px) 22rem, 100vw" className="object-cover" />
              )
            ) : (
              <div className="grid h-full place-items-center bg-[linear-gradient(135deg,rgba(0,217,255,0.14),transparent_55%,rgba(47,107,255,0.2))] font-display text-7xl font-extrabold text-neon-blue/60">{initials(profile.name)}</div>
            )}
          </div>
          {resume && (
            <a href={resume} target="_blank" rel="noopener noreferrer" className="mt-5 flex items-center justify-center gap-2 rounded-full border border-neon-blue px-6 py-4 font-mono text-xs uppercase tracking-[0.16em] text-neon-blue transition-colors hover:bg-neon-blue hover:text-bg-primary">
              <Download size={16} /> Download resume
            </a>
          )}
        </Reveal>
        <Reveal delay={100}>
          <div className="max-w-2xl space-y-6 text-lg leading-relaxed text-text-secondary md:text-xl">
            {splitParagraphs(profile.bio).map((p, i) => (
              <p key={i} className={i === 0 ? 'text-text-primary' : ''}>{p}</p>
            ))}
          </div>
          {profile.highlights.length > 0 && (
            <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-6 border-t hairline pt-8 sm:grid-cols-4">
              {profile.highlights.slice(0, 4).map((h, i) => (
                <div key={i}>
                  <dd className="font-display text-3xl font-extrabold text-neon-blue">{h.value}</dd>
                  <dt className="mt-1 font-mono text-xs uppercase tracking-[0.12em] text-text-secondary">{h.label}</dt>
                </div>
              ))}
            </dl>
          )}
        </Reveal>
      </section>

      <section className="section pt-0" aria-labelledby="skills-title">
        <div className="wrap">
          <SectionHead eyebrow="Skills and services" title={<span id="skills-title">What I can do for you</span>} />
          <Capabilities groups={profile.skillGroups} />
        </div>
      </section>

      {certs.length > 0 && (
        <section className="section pt-0" aria-labelledby="cert-title">
          <div className="wrap">
            <SectionHead eyebrow="Credentials" title={<span id="cert-title">Certifications</span>} />
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {certs.map((c, i) => {
                const file = safeUrl(c.fileUrl);
                const verify = safeUrl(c.meta.credentialUrl || '');
                return (
                  <Reveal key={c.id} delay={i * 70}>
                    <li className="list-none">
                      <Spot className="flex h-full gap-5 rounded-xl border hairline bg-bg-card/60 p-6">
                        {c.coverImage && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.coverImage} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-md object-cover" />
                        )}
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold leading-snug">{c.title}</h3>
                          <p className="mt-1 text-sm text-text-secondary">{[c.meta.issuer, c.date ? formatDate(c.date, { month: 'short', year: 'numeric' }) : ''].filter(Boolean).join(' · ')}</p>
                          {c.meta.credentialId && <p className="mt-1 font-mono text-xs text-text-secondary">ID {c.meta.credentialId}</p>}
                          <div className="mt-3 flex flex-wrap gap-4 font-mono text-xs uppercase tracking-[0.12em]">
                            {verify && <a href={verify} target="_blank" rel="noopener noreferrer" className="text-neon-blue hover:underline">Verify</a>}
                            {file && <a href={file} target="_blank" rel="noopener noreferrer" className="text-neon-blue hover:underline">Certificate</a>}
                          </div>
                        </div>
                      </Spot>
                    </li>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {profile.faqs.length > 0 && (
        <section className="section pt-0" aria-labelledby="faq-title">
          <div className="wrap grid gap-12 lg:grid-cols-[1fr_2fr]">
            <div>
              <p className="eyebrow">Good to know</p>
              <h2 id="faq-title" className="h-section mt-4">Questions, answered</h2>
            </div>
            <FaqList faqs={profile.faqs} />
          </div>
        </section>
      )}
    </>
  );
}
