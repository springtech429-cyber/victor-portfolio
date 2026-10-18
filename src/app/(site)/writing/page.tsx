import { PageHeader, EmptyState } from '@/components/entries/PageHeader';
import { WritingBrowser } from '@/components/entries/WritingBrowser';
import { JsonLd } from '@/components/entries/JsonLd';
import { getProfile, getSection } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { absoluteUrl } from '@/lib/site';
import { entryHref } from '@/lib/content-types';

export async function generateMetadata() {
  const p = await getProfile();
  return buildMetadata({ title: 'Writing', description: `Articles, executive op-eds and short stories by ${p.name}.`, path: '/writing' });
}

export default async function WritingPage() {
  const entries = await getSection('writing', 'date');
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Writing', url: absoluteUrl('/writing'), mainEntity: { '@type': 'ItemList', itemListElement: entries.map((e, i) => ({ '@type': 'ListItem', position: i + 1, url: absoluteUrl(entryHref(e)), name: e.title })) } }} />
      <PageHeader eyebrow="Writing" title="Articles, op-eds and stories">
        Essays and stories under my own name, and op-eds written for executives.
      </PageHeader>
      <div className="wrap pb-24">{entries.length ? <WritingBrowser entries={entries} /> : <EmptyState title="Nothing here yet">Published writing will appear here.</EmptyState>}</div>
    </>
  );
}
