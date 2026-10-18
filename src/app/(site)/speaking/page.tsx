import { PageHeader, EmptyState } from '@/components/entries/PageHeader';
import { EntryCard } from '@/components/entries/EntryCard';
import { JsonLd } from '@/components/entries/JsonLd';
import { getProfile, getSection } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { absoluteUrl } from '@/lib/site';
import { entryHref } from '@/lib/content-types';

export async function generateMetadata() {
  const p = await getProfile();
  return buildMetadata({ title: 'Speaking', description: `Speeches, keynotes and talks by ${p.name}.`, path: '/speaking' });
}

export default async function SpeakingPage() {
  const entries = await getSection('speaking', 'date');
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Speaking', url: absoluteUrl('/speaking'), mainEntity: { '@type': 'ItemList', itemListElement: entries.map((e, i) => ({ '@type': 'ListItem', position: i + 1, url: absoluteUrl(entryHref(e)), name: e.title })) } }} />
      <PageHeader eyebrow="Speaking" title="Speeches and keynotes">
        Talks I have given, with recordings and slides where they exist.
      </PageHeader>
      <div className="wrap pb-24">
        {entries.length ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((e) => (
              <li key={e.id}><EntryCard entry={e} /></li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Nothing here yet">Talks will appear here once they are published.</EmptyState>
        )}
      </div>
    </>
  );
}
