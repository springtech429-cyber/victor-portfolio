import type { EntryType, Section } from './types';

export type FieldKind = 'text' | 'url' | 'date' | 'textarea';
export interface MetaField {
  key: string;
  label: string;
  kind: FieldKind;
  hint?: string;
  placeholder?: string;
}

export interface ContentTypeConfig {
  type: EntryType;
  /** Singular and plural labels for the dashboard and public pages. */
  label: string;
  plural: string;
  /** Public section the entry lives in. */
  section: Section;
  dateLabel: string;
  bodyLabel: string;
  bodyHint: string;
  showGallery: boolean;
  showLinks: boolean;
  showFile: boolean;
  fileLabel?: string;
  coverLabel: string;
  fields: MetaField[];
}

export const CONTENT_TYPES: Record<EntryType, ContentTypeConfig> = {
  project: {
    type: 'project',
    label: 'Web project',
    plural: 'Web projects',
    section: 'work',
    dateLabel: 'Date',
    bodyLabel: 'Full description',
    bodyHint: 'Markdown works: **bold**, lists, links, ## headings.',
    showGallery: true,
    showLinks: true,
    showFile: false,
    coverLabel: 'Cover picture',
    fields: [
      { key: 'status', label: 'Status', kind: 'text', placeholder: 'Live, In development, Prototype' },
      { key: 'client', label: 'Built for (optional)', kind: 'text', placeholder: 'Client or company' },
      { key: 'year', label: 'Year', kind: 'text', placeholder: '2026' },
    ],
  },
  film: {
    type: 'film',
    label: 'Film or video',
    plural: 'Film and video',
    section: 'work',
    dateLabel: 'Release date',
    bodyLabel: 'About this piece',
    bodyHint: 'The brief, your approach and the result. Markdown works.',
    showGallery: true,
    showLinks: true,
    showFile: false,
    coverLabel: 'Thumbnail',
    fields: [
      { key: 'videoUrl', label: 'Video link', kind: 'url', hint: 'A YouTube or Vimeo link. It plays on the page.' },
      { key: 'role', label: 'Your role', kind: 'text', placeholder: 'Director, cinematographer, editor' },
      { key: 'client', label: 'Client (optional)', kind: 'text' },
      { key: 'duration', label: 'Length', kind: 'text', placeholder: '2:30' },
    ],
  },
  article: {
    type: 'article',
    label: 'Article',
    plural: 'Articles',
    section: 'writing',
    dateLabel: 'Published on',
    bodyLabel: 'Article text',
    bodyHint: 'Paste or write the full article. Markdown works: ## headings, **bold**, lists, links.',
    showGallery: false,
    showLinks: true,
    showFile: true,
    fileLabel: 'PDF copy (optional)',
    coverLabel: 'Header picture',
    fields: [
      { key: 'publication', label: 'Published in', kind: 'text', placeholder: 'Publication or website' },
      { key: 'externalUrl', label: 'Link to the original', kind: 'url', hint: 'Where it was first published, if anywhere.' },
    ],
  },
  oped: {
    type: 'oped',
    label: 'Executive op-ed',
    plural: 'Executive op-eds',
    section: 'writing',
    dateLabel: 'Published on',
    bodyLabel: 'Op-ed text',
    bodyHint: 'The full piece. Markdown works.',
    showGallery: false,
    showLinks: true,
    showFile: true,
    fileLabel: 'PDF copy (optional)',
    coverLabel: 'Header picture',
    fields: [
      { key: 'publication', label: 'Published in', kind: 'text', placeholder: 'Newspaper or outlet' },
      { key: 'byline', label: 'Written for', kind: 'text', placeholder: 'The executive it was written for' },
      { key: 'externalUrl', label: 'Link to the original', kind: 'url' },
    ],
  },
  press: {
    type: 'press',
    label: 'Press copy',
    plural: 'Press copy',
    section: 'copy',
    dateLabel: 'Release date',
    bodyLabel: 'Press release text',
    bodyHint: 'Headline in the title, the release itself here. Markdown works.',
    showGallery: false,
    showLinks: true,
    showFile: true,
    fileLabel: 'Press release PDF (optional)',
    coverLabel: 'Header picture',
    fields: [
      { key: 'client', label: 'Written for', kind: 'text', placeholder: 'Client or organisation' },
      { key: 'outlet', label: 'Picked up by (optional)', kind: 'text', placeholder: 'Outlets that ran it' },
    ],
  },
  story: {
    type: 'story',
    label: 'Short story',
    plural: 'Short stories',
    section: 'writing',
    dateLabel: 'Written or published',
    bodyLabel: 'Story text',
    bodyHint: 'The full story. Markdown works: blank line between paragraphs, *italics*, ## headings.',
    showGallery: false,
    showLinks: true,
    showFile: true,
    fileLabel: 'PDF copy (optional)',
    coverLabel: 'Cover picture',
    fields: [
      { key: 'genre', label: 'Genre', kind: 'text', placeholder: 'Fiction, sci-fi, memoir' },
      { key: 'publication', label: 'Published in (optional)', kind: 'text', placeholder: 'Anthology or magazine' },
      { key: 'externalUrl', label: 'Link to the original', kind: 'url' },
    ],
  },
  branding: {
    type: 'branding',
    label: 'Branding copy',
    plural: 'Branding copy',
    section: 'copy',
    dateLabel: 'Date',
    bodyLabel: 'The story of the work',
    bodyHint: 'The brief, the voice you built and the result. Show the lines themselves. Markdown works.',
    showGallery: true,
    showLinks: true,
    showFile: true,
    fileLabel: 'Brand voice guide PDF (optional)',
    coverLabel: 'Cover picture',
    fields: [
      { key: 'client', label: 'Brand or client', kind: 'text' },
      { key: 'deliverables', label: 'What you wrote', kind: 'text', placeholder: 'Naming, taglines, brand voice guide' },
      { key: 'year', label: 'Year', kind: 'text', placeholder: '2026' },
      { key: 'externalUrl', label: 'Case study link', kind: 'url' },
    ],
  },
  copy: {
    type: 'copy',
    label: 'Copywriting',
    plural: 'Copywriting',
    section: 'copy',
    dateLabel: 'Date',
    bodyLabel: 'The copy and the context',
    bodyHint: 'Paste the copy, then say what it was for and how it performed. Markdown works.',
    showGallery: true,
    showLinks: true,
    showFile: true,
    fileLabel: 'Sample PDF (optional)',
    coverLabel: 'Cover picture',
    fields: [
      { key: 'client', label: 'For', kind: 'text', placeholder: 'Client or campaign' },
      { key: 'channel', label: 'Channel', kind: 'text', placeholder: 'Website, email, ads, social, print' },
      { key: 'result', label: 'Result (optional)', kind: 'text', placeholder: 'e.g. Open rate doubled' },
      { key: 'year', label: 'Year', kind: 'text', placeholder: '2026' },
    ],
  },
  speech: {
    type: 'speech',
    label: 'Speech or keynote',
    plural: 'Speeches and keynotes',
    section: 'speaking',
    dateLabel: 'Event date',
    bodyLabel: 'Summary or transcript',
    bodyHint: 'What the talk covered, or the full text. Markdown works.',
    showGallery: true,
    showLinks: true,
    showFile: true,
    fileLabel: 'Slides or script PDF (optional)',
    coverLabel: 'Cover picture',
    fields: [
      { key: 'event', label: 'Event', kind: 'text', placeholder: 'Name of the event' },
      { key: 'location', label: 'Venue or city', kind: 'text' },
      { key: 'videoUrl', label: 'Recording link', kind: 'url', hint: 'A YouTube or Vimeo link, if it was recorded.' },
      { key: 'role', label: 'Your role', kind: 'text', placeholder: 'Keynote speaker, panellist, MC' },
    ],
  },
  certification: {
    type: 'certification',
    label: 'Certification',
    plural: 'Certifications',
    section: 'about',
    dateLabel: 'Issued on',
    bodyLabel: 'Notes (optional)',
    bodyHint: 'What it covered, if you want to say.',
    showGallery: false,
    showLinks: false,
    showFile: true,
    fileLabel: 'Certificate PDF (optional)',
    coverLabel: 'Badge or certificate image',
    fields: [
      { key: 'issuer', label: 'Issued by', kind: 'text', placeholder: 'Organisation' },
      { key: 'credentialId', label: 'Credential ID (optional)', kind: 'text' },
      { key: 'credentialUrl', label: 'Verification link (optional)', kind: 'url' },
      { key: 'expires', label: 'Expires (optional)', kind: 'date' },
    ],
  },
};

export const TYPE_ORDER: EntryType[] = ['project', 'film', 'article', 'oped', 'story', 'branding', 'copy', 'press', 'speech', 'certification'];

export const SECTION_TYPES: Record<Section, EntryType[]> = {
  work: ['project', 'film'],
  writing: ['article', 'oped', 'story'],
  copy: ['branding', 'copy', 'press'],
  speaking: ['speech'],
  about: ['certification'],
};

export const SECTION_NAME: Record<Section, string> = {
  work: 'Work',
  writing: 'Writing',
  copy: 'Brand & copy',
  speaking: 'Speaking',
  about: 'About',
};

export const PROJECT_STATUSES = ['Live', 'In development', 'Completed', 'Prototype'];
export const LINK_LABEL_SUGGESTIONS = [
  'Live site',
  'Source code',
  'Case study',
  'Read the original',
  'Watch the recording',
  'Slides',
  'App Store',
  'Google Play',
];

/** Public URL of an entry, e.g. /work/my-project. Certifications have no page of their own. */
export function entryHref(e: { type: EntryType; slug: string }): string {
  const section = CONTENT_TYPES[e.type].section;
  return section === 'about' ? '/about' : `/${section}/${e.slug}`;
}
