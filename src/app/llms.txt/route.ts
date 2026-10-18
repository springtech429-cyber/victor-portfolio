import { getAllPublished, getProfile } from '@/lib/data';
import { CONTENT_TYPES, entryHref } from '@/lib/content-types';
import { absoluteUrl } from '@/lib/site';
import { SERVICES } from '@/lib/services';

export const revalidate = 3600;

// A plain-text map of the site for AI assistants (the llms.txt convention).
export async function GET() {
  const [p, entries] = await Promise.all([getProfile(), getAllPublished()]);
  const lines: string[] = [`# ${p.name}`, '', `> ${p.role}. ${p.tagline}`, ''];
  if (p.location) lines.push(`Based in ${p.location}.`, '');
  lines.push('## Pages', '', `- [Home](${absoluteUrl('/')}): overview`, `- [Services](${absoluteUrl('/services')}): what I offer and how to hire me`, `- [Work](${absoluteUrl('/work')}): web projects and film`, `- [Writing](${absoluteUrl('/writing')}): articles, executive op-eds, short stories`, `- [Brand & copy](${absoluteUrl('/copy')}): branding copy, copywriting, press copy`, `- [Speaking](${absoluteUrl('/speaking')}): speeches and keynotes`, `- [About](${absoluteUrl('/about')}): background, skills, certifications`, `- [Contact](${absoluteUrl('/contact')}): hire or get in touch`, '');
  lines.push('## Services', '', ...SERVICES.map((sv) => `- ${sv.title}: ${sv.summary}`), '');
  for (const type of ['project', 'film', 'article', 'oped', 'story', 'branding', 'copy', 'press', 'speech'] as const) {
    const list = entries.filter((e) => e.type === type);
    if (!list.length) continue;
    lines.push(`## ${CONTENT_TYPES[type].plural}`, '');
    for (const e of list) lines.push(`- [${e.title}](${absoluteUrl(entryHref(e))})${e.summary ? `: ${e.summary.replace(/\s+/g, ' ')}` : ''}`);
    lines.push('');
  }
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
