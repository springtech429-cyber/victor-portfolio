export type AccentColor = 'blue' | 'purple' | 'pink';

export interface LinkItem {
  label: string;
  url: string;
}
export interface SkillGroup {
  id: string;
  title: string;
  color: AccentColor;
  skills: string[];
}
export interface Highlight {
  value: string;
  label: string;
}
export interface Faq {
  q: string;
  a: string;
}

export interface Profile {
  name: string;
  role: string;
  /** Big line under the name on the home page. */
  headline: string;
  tagline: string;
  location: string;
  available: boolean;
  statusText: string;
  avatarUrl: string;
  resumeUrl: string;
  aboutTitle: string;
  /** Paragraphs separated by a blank line. */
  bio: string;
  highlights: Highlight[];
  links: LinkItem[];
  skillGroups: SkillGroup[];
  faqs: Faq[];
}

export type EntryType =
  | 'project'
  | 'film'
  | 'article'
  | 'oped'
  | 'story'
  | 'branding'
  | 'copy'
  | 'press'
  | 'speech'
  | 'certification';

export type Section = 'work' | 'writing' | 'copy' | 'speaking' | 'about';

export interface Entry {
  id: string;
  type: EntryType;
  slug: string;
  title: string;
  summary: string;
  /** Markdown. */
  body: string;
  category: string;
  tags: string[];
  coverImage: string;
  gallery: string[];
  links: LinkItem[];
  /** ISO date (YYYY-MM-DD) shown on the page, e.g. publication or event date. */
  date: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  /** Type specific details, e.g. { publication, videoUrl, issuer }. See content-types.ts. */
  meta: Record<string, string>;
  fileUrl: string;
  createdAt: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: string;
}
