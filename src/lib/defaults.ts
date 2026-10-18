import type { AccentColor, Faq, Highlight, LinkItem, Profile, SkillGroup } from './types';

const COLORS: AccentColor[] = ['blue', 'purple', 'pink'];

/** Shown until you save your own details in the dashboard. Edit them there, not here. */
export const DEFAULT_PROFILE: Profile = {
  name: 'Victor Mwewa',
  role: 'Tech Lead & Communication Specialist',
  headline: 'Software, media and communication under one roof.',
  tagline: 'I build software products and write the words around them: executive op-eds, keynote speeches, press copy and brand voice for organisations in Zambia and beyond.',
  location: 'Zambia',
  available: true,
  statusText: 'Open to new projects',
  avatarUrl: '',
  resumeUrl: '',
  aboutTitle: 'Software, media and communication under one roof',
  bio: [
    'I am a solo developer and freelancer based in Zambia. I design, build and launch my own software products, and I take on client work across web and software engineering, video and audio engineering, marketing, copywriting and PR.',
    'Before moving into software I worked in radio as a broadcaster, reporter and audio engineer. That background shapes how I work: clear messages, tight deadlines and an ear for how real people take in information.',
  ].join('\n\n'),
  highlights: [
    { value: '5', label: 'Service areas' },
    { value: 'Zambia', label: 'Based in' },
  ],
  links: [
    { label: 'GitHub', url: 'https://github.com/springtech429-cyber' },
    { label: 'Book a 30-minute call', url: 'https://calendly.com/springtech429/30min' },
  ],
  skillGroups: [
    { id: 'web', title: 'Web & Software', color: 'blue', skills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'Supabase', 'Tailwind CSS'] },
    { id: 'media', title: 'Video & Audio', color: 'purple', skills: ['Video editing', 'Audio engineering', 'Radio broadcasting'] },
    { id: 'comms', title: 'Marketing & Communication', color: 'pink', skills: ['Digital marketing', 'Copywriting', 'Public relations'] },
  ],
  faqs: [
    {
      q: 'What services does Victor Mwewa offer?',
      a: 'Web and software engineering, video and audio engineering, marketing, copywriting and public relations, for businesses and brands.',
    },
    { q: 'Where is Victor Mwewa based?', a: 'Zambia. He works with clients in Zambia and remotely.' },
    { q: 'How can I hire Victor?', a: 'Send a message through the contact page or book a 30-minute call. He replies by email.' },
  ],
};

const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback);

function cleanLinks(v: unknown, fallback: LinkItem[]): LinkItem[] {
  if (!Array.isArray(v)) return fallback;
  return v.filter((l): l is LinkItem => !!l && typeof l.url === 'string').map((l) => ({ label: str(l.label, ''), url: l.url }));
}
function cleanHighlights(v: unknown, fallback: Highlight[]): Highlight[] {
  if (!Array.isArray(v)) return fallback;
  return v.filter((h): h is Highlight => !!h && typeof h.value === 'string').map((h) => ({ value: h.value, label: str(h.label, '') }));
}
function cleanFaqs(v: unknown, fallback: Faq[]): Faq[] {
  if (!Array.isArray(v)) return fallback;
  return v.filter((f): f is Faq => !!f && typeof f.q === 'string' && typeof f.a === 'string');
}
function cleanGroups(v: unknown, fallback: SkillGroup[]): SkillGroup[] {
  if (!Array.isArray(v)) return fallback;
  return v
    .filter((g) => !!g && typeof g.title === 'string')
    .map((g, i) => ({
      id: str(g.id, `group-${i}`),
      title: g.title,
      color: COLORS.includes(g.color) ? g.color : COLORS[i % COLORS.length],
      skills: Array.isArray(g.skills) ? g.skills.filter((s: unknown) => typeof s === 'string') : [],
    }));
}

/** Combine whatever is stored with the defaults so a partly filled profile never breaks a page. */
export function mergeProfile(stored: unknown): Profile {
  const d = DEFAULT_PROFILE;
  if (!stored || typeof stored !== 'object') return d;
  const s = stored as Record<string, unknown>;
  return {
    name: str(s.name, d.name),
    // Profiles saved before the title change still say "Creative Developer & Writer"; show the new title.
    role: s.role === 'Creative Developer & Writer' ? d.role : str(s.role, d.role),
    headline: s.headline === 'Ideas with afterglow.' ? d.headline : str(s.headline, d.headline),
    tagline: str(s.tagline, d.tagline),
    location: str(s.location, d.location),
    available: typeof s.available === 'boolean' ? s.available : d.available,
    statusText: str(s.statusText, d.statusText),
    avatarUrl: str(s.avatarUrl, d.avatarUrl),
    // The Vite version called this cvUrl.
    resumeUrl: str(s.resumeUrl, str(s.cvUrl, d.resumeUrl)),
    aboutTitle: str(s.aboutTitle, d.aboutTitle),
    bio: str(s.bio, d.bio),
    highlights: cleanHighlights(s.highlights, d.highlights),
    links: cleanLinks(s.links, d.links),
    skillGroups: cleanGroups(s.skillGroups, d.skillGroups),
    faqs: cleanFaqs(s.faqs, d.faqs),
  };
}
