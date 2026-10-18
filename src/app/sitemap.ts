import type { MetadataRoute } from 'next';
import { getAllPublished } from '@/lib/data';
import { entryHref } from '@/lib/content-types';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getAllPublished();
  const now = new Date();
  const fixed = ['/', '/services', '/work', '/writing', '/copy', '/speaking', '/about', '/contact'].map((p) => ({
    url: absoluteUrl(p),
    lastModified: now,
    changeFrequency: (p === '/' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
    priority: p === '/' ? 1 : p === '/services' ? 0.9 : p === '/contact' ? 0.6 : 0.8,
  }));
  const pages = entries
    .filter((e) => e.type !== 'certification')
    .map((e) => ({
      url: absoluteUrl(entryHref(e)),
      lastModified: new Date(e.date || e.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  return [...fixed, ...pages];
}
