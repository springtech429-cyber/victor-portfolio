import type { Entry, EntryType } from './types';

export interface EntryRow {
  id: string;
  type: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string | null;
  category: string | null;
  tags: string[] | null;
  cover_image: string | null;
  gallery: string[] | null;
  links: { label: string; url: string }[] | null;
  entry_date: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  meta: Record<string, string> | null;
  file_url: string | null;
  created_at: string;
}

export const fromRow = (r: EntryRow): Entry => ({
  id: r.id,
  type: r.type as EntryType,
  slug: r.slug,
  title: r.title,
  summary: r.summary ?? '',
  body: r.body ?? '',
  category: r.category ?? '',
  tags: r.tags ?? [],
  coverImage: r.cover_image ?? '',
  gallery: r.gallery ?? [],
  links: r.links ?? [],
  date: r.entry_date ?? '',
  featured: r.featured,
  published: r.published,
  sortOrder: r.sort_order,
  meta: r.meta ?? {},
  fileUrl: r.file_url ?? '',
  createdAt: r.created_at,
});

export const toRow = (e: Entry) => ({
  id: e.id,
  type: e.type,
  slug: e.slug,
  title: e.title,
  summary: e.summary,
  body: e.body,
  category: e.category,
  tags: e.tags,
  cover_image: e.coverImage,
  gallery: e.gallery,
  links: e.links,
  entry_date: e.date || null,
  featured: e.featured,
  published: e.published,
  sort_order: e.sortOrder,
  meta: e.meta,
  file_url: e.fileUrl,
  updated_at: new Date().toISOString(),
});
