import { notFound } from 'next/navigation';
import { EntryPage } from '@/components/entries/EntryPage';
import { getEntryBySlug, getProfile, getSection } from '@/lib/data';
import { buildMetadata, plainText } from '@/lib/seo';
import { entryHref } from '@/lib/content-types';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const all = await getSection('writing');
  return all.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const entry = await getEntryBySlug('writing', slug);
  if (!entry) return { title: 'Not found', robots: { index: false } };
  return buildMetadata({
    title: entry.title,
    description: entry.summary || plainText(entry.body) || entry.title,
    path: entryHref(entry),
    image: entry.coverImage || undefined,
    type: ['article', 'oped', 'story', 'press'].includes(entry.type) ? 'article' : 'website',
    publishedTime: entry.date || undefined,
  });
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const [entry, profile, all] = await Promise.all([getEntryBySlug('writing', slug), getProfile(), getSection('writing', 'date')]);
  if (!entry) notFound();
  const i = all.findIndex((e) => e.id === entry.id);
  return <EntryPage entry={entry} profile={profile} siblings={{ prev: i > 0 ? all[i - 1] : null, next: i >= 0 && i < all.length - 1 ? all[i + 1] : null }} />;
}
