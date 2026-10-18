// Server-side reads. Pages are rendered on the server so search engines and AI crawlers receive
// real HTML. Content is cached for 60 seconds and refreshed immediately when you save in the dashboard.
import { cache } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_PROFILE, mergeProfile } from './defaults';
import { fromRow, type EntryRow } from './entry-map';
import { CONTENT_TYPES, SECTION_TYPES } from './content-types';
import type { Entry, EntryType, Profile } from './types';

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const hasBackend = Boolean(URL_ && KEY);

const logged = new Set<string>();
/** Supabase errors are plain objects, so printing them directly shows {}. This prints the useful parts, once. */
function logDbError(where: string, e: unknown) {
  const err = (e && typeof e === 'object' ? e : {}) as { message?: string; code?: string; hint?: string; details?: string };
  const key = `${where}:${err.code ?? err.message ?? ''}`;
  if (logged.has(key)) return;
  logged.add(key);
  if (err.code === 'PGRST205' || err.code === '42P01') {
    console.error(`[${where}] A table is missing in Supabase (${err.message}). Run the SQL in supabase/schema.sql (README step 3), then reload.`);
    return;
  }
  console.error(`[${where}] ${err.message ?? String(e)}${err.code ? ` (code ${err.code})` : ''}${err.hint ? ` Hint: ${err.hint}` : ''}`);
}

let cached: SupabaseClient | null = null;
function db(): SupabaseClient | null {
  if (!hasBackend) return null;
  if (!cached) {
    cached = createClient(URL_, KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 60 } }) },
    });
  }
  return cached;
}

export const getProfile = cache(async (): Promise<Profile> => {
  const sb = db();
  if (!sb) return DEFAULT_PROFILE;
  try {
    const { data, error } = await sb.from('site_profile').select('data').eq('id', 1).maybeSingle();
    if (error) throw error;
    return mergeProfile(data?.data);
  } catch (e) {
    logDbError('getProfile', e);
    return DEFAULT_PROFILE;
  }
});

interface ListOptions {
  types?: EntryType[];
  featured?: boolean;
  limit?: number;
  /** "manual" follows the order you set in the dashboard; "date" is newest first. */
  order?: 'manual' | 'date';
}

export const getEntries = cache(async (opts: ListOptions = {}): Promise<Entry[]> => {
  const sb = db();
  if (!sb) return [];
  try {
    let q = sb.from('entries').select('*').eq('published', true);
    if (opts.types?.length) q = q.in('type', opts.types);
    if (opts.featured) q = q.eq('featured', true);
    q =
      opts.order === 'date'
        ? q.order('entry_date', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
        : q.order('sort_order', { ascending: true }).order('created_at', { ascending: false });
    if (opts.limit) q = q.limit(opts.limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data as EntryRow[]).map(fromRow);
  } catch (e) {
    logDbError('getEntries', e);
    return [];
  }
});

export const getSection = (section: keyof typeof SECTION_TYPES, order: 'manual' | 'date' = 'manual') =>
  getEntries({ types: SECTION_TYPES[section], order });

export const getEntryBySlug = cache(async (section: keyof typeof SECTION_TYPES, slug: string): Promise<Entry | null> => {
  const sb = db();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('entries')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .in('type', SECTION_TYPES[section])
      .maybeSingle();
    if (error) throw error;
    return data ? fromRow(data as EntryRow) : null;
  } catch (e) {
    logDbError('getEntryBySlug', e);
    return null;
  }
});

export async function getAllPublished(): Promise<Entry[]> {
  return getEntries({ order: 'date' });
}

export const typeLabel = (t: EntryType) => CONTENT_TYPES[t].label;