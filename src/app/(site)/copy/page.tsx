import { PageHeader, EmptyState } from '@/components/entries/PageHeader';
import { WorkBrowser } from '@/components/entries/WorkBrowser';
import { JsonLd } from '@/components/entries/JsonLd';
import { getProfile, getSection } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { absoluteUrl } from '@/lib/site';
import { entryHref } from '@/lib/content-types';

export async function generateMetadata() {
  const p = await getProfile();
  return buildMetadata({ title: 'Brand & copy', description: `Branding copy, copywriting and press copy by ${p.name}.`, path: '/copy' });
}

export default async function CopyPage() {
  const entries = await getSection('copy');
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Brand & copy', url: absoluteUrl('/copy'), mainEntity: { '@type': 'ItemList', itemListElement: entries.map((e, i) => ({ '@type': 'ListItem', position: i + 1, url: absoluteUrl(entryHref(e)), name: e.title })) } }} />
      <PageHeader eyebrow="Brand & copy" title="Words that sell and stick">
        Brand voice, campaign copy and press releases, with the thinking behind each line.
      </PageHeader>
      <div className="wrap pb-24">{entries.length ? <WorkBrowser entries={entries} /> : <EmptyState title="Nothing here yet">Branding and copywriting samples will appear here.</EmptyState>}</div>
    </>
  );
}
