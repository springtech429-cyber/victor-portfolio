export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VITE_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
    'http://localhost:3000';
  return raw.replace(/\/+$/, '');
}

export const absoluteUrl = (path = '/'): string => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
};

/** Words people actually search for. Used in page titles, descriptions and structured data. */
export const SEO_KEYWORDS = [
  'tech lead Zambia',
  'communication specialist Zambia',
  'corporate communications Zambia',
  'web developer Zambia',
  'software developer Lusaka',
  'public relations Zambia',
  'speechwriter Zambia',
  'executive op-ed writer',
  'copywriter Zambia',
  'video editor Zambia',
  'audio engineer Zambia',
];

export const homeTitle = (name: string, role: string, location: string) => `${name} | ${role}${location ? ` in ${location}` : ''}`;
export const homeDescription = (name: string, location: string) =>
  `${name} is a tech lead and communication specialist${location ? ` in ${location}` : ''}. Web and software development, corporate communications and PR, executive op-eds, speechwriting, copywriting, and video and audio production.`;
