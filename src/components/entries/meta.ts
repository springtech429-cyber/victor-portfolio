import { CONTENT_TYPES } from '@/lib/content-types';
import { formatDate, safeUrl } from '@/lib/helpers';
import type { Entry } from '@/lib/types';

export interface MetaRow {
  label: string;
  value: string;
  href?: string;
}

/** The facts shown under a title, built from the fields of this type of content. */
export function metaRows(e: Entry): MetaRow[] {
  const cfg = CONTENT_TYPES[e.type];
  const rows: MetaRow[] = [];
  if (e.date) rows.push({ label: cfg.dateLabel, value: formatDate(e.date) });
  for (const f of cfg.fields) {
    const v = (e.meta[f.key] || '').trim();
    if (!v) continue;
    if (f.kind === 'url') continue; // shown as buttons instead
    rows.push({ label: f.label.replace(/ \(optional\)/, ''), value: f.kind === 'date' ? formatDate(v) : v });
  }
  if (e.category) rows.unshift({ label: 'Category', value: e.category });
  return rows;
}

export const ctaLinks = (e: Entry) =>
  CONTENT_TYPES[e.type].fields
    .filter((f) => f.kind === 'url' && safeUrl(e.meta[f.key] || ''))
    .map((f) => ({ label: f.key === 'externalUrl' ? 'Read the original' : f.key === 'credentialUrl' ? 'Verify' : f.label, url: safeUrl(e.meta[f.key])}));
