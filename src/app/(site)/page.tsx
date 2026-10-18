import { Hero } from '@/components/home/Hero';
import { Marquee } from '@/components/home/Marquee';
import { FeaturedShowcase } from '@/components/home/FeaturedShowcase';
import { WorkIndex } from '@/components/home/WorkIndex';
import { Capabilities } from '@/components/home/Capabilities';
import { SectionHead } from '@/components/home/SectionHead';
import { FaqList } from '@/components/home/Faq';
import { WritingRow } from '@/components/entries/WritingRow';
import { EmptyState } from '@/components/entries/PageHeader';
import { JsonLd } from '@/components/entries/JsonLd';
import { Reveal } from '@/components/shell/Reveal';
import { getEntries, getProfile } from '@/lib/data';
import { buildMetadata, faqLd, personLd, serviceLd, websiteLd } from '@/lib/seo';
import { homeDescription, homeTitle } from '@/lib/site';

export async function generateMetadata() {
  const p = await getProfile();
  return buildMetadata({ title: homeTitle(p.name, p.role, p.location), absolute: true, description: homeDescription(p.name, p.location), path: '/' });
}

export default async function Home() {
  const [profile, work, writing, certs] = await Promise.all([
    getProfile(),
    getEntries({ types: ['project', 'film'] }),
    getEntries({ types: ['article', 'oped', 'story', 'press', 'speech'], order: 'date', limit: 4 }),
    getEntries({ types: ['certification'] }),
  ]);
  const featured = work.filter((w) => w.featured);
  const showcase = (featured.length >= 2 ? featured : work).slice(0, 7);
  const index = (featured.length ? featured : work).slice(0, 6);

  return (
    <>
      <JsonLd data={personLd(profile, certs)} />
      <JsonLd data={websiteLd(profile)} />
      <JsonLd data={serviceLd(profile)} />
      {profile.faqs.length > 0 && <JsonLd data={faqLd(profile.faqs)} />}

      <Hero profile={profile} />
      <Marquee words={profile.skillGroups.map((g) => g.title).filter(Boolean)} />
      <FeaturedShowcase entries={showcase} />

      <section className="section" aria-labelledby="work-title">
        <div className="wrap">
          <SectionHead eyebrow="Selected work" title={<span id="work-title">Things I have built and made</span>} href="/work" linkLabel="All work" />
          {index.length ? <WorkIndex items={index} /> : <EmptyState title="New work is on its way">Check back soon, or get in touch to see projects that are not listed yet.</EmptyState>}
        </div>
      </section>

      <section className="section" aria-labelledby="do-title">
        <div className="wrap">
          <SectionHead eyebrow="What I do" title={<span id="do-title">One person, the whole pipeline</span>} href="/services" linkLabel="All services">
            {profile.tagline}
          </SectionHead>
          <Capabilities groups={profile.skillGroups} />
        </div>
      </section>

      {writing.length > 0 && (
        <section className="section" aria-labelledby="writing-title">
          <div className="wrap">
            <SectionHead eyebrow="Writing and speaking" title={<span id="writing-title">Words, on the page and on stage</span>} href="/writing" linkLabel="All writing" />
            <ul className="border-t hairline">
              {writing.map((e) => (
                <WritingRow key={e.id} entry={e} />
              ))}
            </ul>
          </div>
        </section>
      )}

      {profile.faqs.length > 0 && (
        <section className="section" aria-labelledby="faq-title">
          <div className="wrap grid gap-12 lg:grid-cols-[1fr_2fr]">
            <Reveal>
              <p className="eyebrow">Good to know</p>
              <h2 id="faq-title" className="h-section mt-4">Questions, answered</h2>
            </Reveal>
            <Reveal delay={120}>
              <FaqList faqs={profile.faqs} />
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
