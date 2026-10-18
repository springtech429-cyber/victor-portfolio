import { PageHeader, EmptyState } from '@/components/entries/PageHeader';
import { WorkBrowser } from '@/components/entries/WorkBrowser';
import { JsonLd } from '@/components/entries/JsonLd';
import { getProfile, getSection } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { absoluteUrl } from '@/lib/site';
import { entryHref } from '@/lib/content-types';

export async function generateMetadata() {
  const p = await getProfile();
  return buildMetadata({ title: 'Work', description: `Web projects and film by ${p.name}. ${p.tagline}`, path: '/work' });
}

export default async function WorkPage() {
  const entries = await getSection('work');
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Work', url: absoluteUrl('/work'), mainEntity: { '@type': 'ItemList', itemListElement: entries.map((e, i) => ({ '@type': 'ListItem', position: i + 1, url: absoluteUrl(entryHref(e)), name: e.title })) } }} />
      <PageHeader eyebrow="Work" title="Projects, products and films">
        Websites and software I have shipped, and video I have shot and edited. Open any piece for the full story.
      </PageHeader>
      <div className="wrap pb-24">{entries.length ? <WorkBrowser entries={entries} /> : <EmptyState title="Nothing here yet">New work will appear here as soon as it is published.</EmptyState>}</div>
    </>
  );
}
