import type { AccentColor } from './types';

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

/** Add https:// when a link was typed without a scheme. */
export function normalizeUrl(input: string): string {
  const u = input.trim();
  if (!u) return '';
  if (/^(javascript|data|vbscript|file|blob|about):/i.test(u)) return '';
  if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)) return `mailto:${u}`;
  return `https://${u.replace(/^\/+/, '')}`;
}

/** Only http(s), mailto and tel links are ever rendered as hrefs. */
export function safeUrl(input: string): string {
  const u = normalizeUrl(input);
  return /^(https?:|mailto:|tel:)/i.test(u) ? u : '';
}

export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function splitName(name: string): { first: string; rest: string } {
  const parts = name.trim().split(/\s+/);
  return { first: parts[0] || '', rest: parts.slice(1).join(' ') };
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { timeZone: 'UTC', ...opts });
}

export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** Turn a YouTube or Vimeo link into an embeddable URL, or null if it is not one of those. */
export function videoEmbedUrl(url: string): string | null {
  const u = safeUrl(url);
  if (!u) return null;
  try {
    const parsed = new URL(u);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`;
    if (host.endsWith('youtube.com')) {
      const id = parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop();
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === 'vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean).pop();
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function videoThumbnail(url: string): string {
  try {
    const u = new URL(safeUrl(url));
    const host = u.hostname.replace(/^www\./, '');
    let id = '';
    if (host === 'youtu.be') id = u.pathname.slice(1);
    else if (host.endsWith('youtube.com')) id = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop() || '';
    if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  } catch {
    /* not a video link */
  }
  return '';
}

/** Full class strings so Tailwind can see them. */
export const ACCENT: Record<AccentColor, { text: string; bg: string; border: string; borderSoft: string; hoverBorder: string; label: string; css: string }> = {
  blue: { text: 'text-neon-blue', bg: 'bg-neon-blue', border: 'border-neon-blue', borderSoft: 'border-neon-blue/30', hoverBorder: 'hover:border-neon-blue', label: 'Cyan', css: 'var(--neon-blue)' },
  purple: { text: 'text-neon-purple', bg: 'bg-neon-purple', border: 'border-neon-purple', borderSoft: 'border-neon-purple/30', hoverBorder: 'hover:border-neon-purple', label: 'Purple', css: 'var(--neon-purple)' },
  pink: { text: 'text-neon-pink', bg: 'bg-neon-pink', border: 'border-neon-pink', borderSoft: 'border-neon-pink/30', hoverBorder: 'hover:border-neon-pink', label: 'Pink', css: 'var(--neon-pink)' },
};
