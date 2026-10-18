import type { Metadata } from 'next';
import { absoluteUrl } from './site';
import { SERVICES } from './services';
import { CONTENT_TYPES, entryHref } from './content-types';
import { safeUrl, videoEmbedUrl, videoThumbnail } from './helpers';
import type { Entry, Profile } from './types';

const DEFAULT_IMAGE = '/og-image.png';

export function buildMetadata(opts: {
  title: string;
  /** Use the title exactly as given instead of adding " | Your Name". */
  absolute?: boolean;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
}): Metadata {
  const image = opts.image ? absoluteUrl(opts.image) : absoluteUrl(DEFAULT_IMAGE);
  return {
    title: opts.absolute ? { absolute: opts.title } : opts.title,
    description: opts.description,
    alternates: { canonical: absoluteUrl(opts.path) },
    openGraph: {
      type: opts.type ?? 'website',
      url: absoluteUrl(opts.path),
      title: opts.title,
      description: opts.description,
      images: [{ url: image, width: 1200, height: 630 }],
      ...(opts.publishedTime ? { publishedTime: opts.publishedTime } : {}),
    },
    twitter: { card: 'summary_large_image', title: opts.title, description: opts.description, images: [image] },
  };
}

export const plainText = (md: string, max = 160) =>
  md
    .replace(/[#*_`>\[\]()!-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

export function personLd(p: Profile, certifications: Entry[] = []) {
  const sameAs = p.links.map((l) => safeUrl(l.url)).filter((u) => /^https?:/.test(u));
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': absoluteUrl('/#person'),
    name: p.name,
    jobTitle: p.role,
    makesOffer: SERVICES.map((sv) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: sv.title, description: sv.summary } })),
    description: p.tagline,
    url: absoluteUrl('/'),
    image: p.avatarUrl || absoluteUrl(DEFAULT_IMAGE),
    address: p.location ? { '@type': 'PostalAddress', addressCountry: p.location } : undefined,
    knowsAbout: p.skillGroups.flatMap((g) => g.skills),
    sameAs,
    hasCredential: certifications.map((c) => ({
      '@type': 'EducationalOccupationalCredential',
      name: c.title,
      credentialCategory: 'certificate',
      recognizedBy: c.meta.issuer ? { '@type': 'Organization', name: c.meta.issuer } : undefined,
      url: safeUrl(c.meta.credentialUrl || '') || undefined,
    })),
  };
}

export function websiteLd(p: Profile) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': absoluteUrl('/#website'),
    url: absoluteUrl('/'),
    name: p.name,
    description: p.tagline,
    inLanguage: 'en',
    publisher: { '@id': absoluteUrl('/#person') },
  };
}

export function faqLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

export function entryLd(e: Entry, author: Profile) {
  const url = absoluteUrl(entryHref(e));
  const image = e.coverImage || undefined;
  const authorRef = { '@type': 'Person', name: author.name, url: absoluteUrl('/') };
  const base = { '@context': 'https://schema.org', url, name: e.title, description: e.summary || plainText(e.body), image };

  if (e.type === 'article' || e.type === 'oped' || e.type === 'press') {
    return {
      ...base,
      '@type': e.type === 'press' ? 'NewsArticle' : 'Article',
      headline: e.title,
      datePublished: e.date || e.createdAt,
      author: authorRef,
      publisher: e.meta.publication ? { '@type': 'Organization', name: e.meta.publication } : authorRef,
      keywords: e.tags.join(', ') || undefined,
      mainEntityOfPage: url,
    };
  }
  if (e.type === 'film') {
    const embed = videoEmbedUrl(e.meta.videoUrl || '');
    return {
      ...base,
      '@type': 'VideoObject',
      thumbnailUrl: image || videoThumbnail(e.meta.videoUrl || '') || undefined,
      uploadDate: e.date || e.createdAt,
      embedUrl: embed || undefined,
      creator: authorRef,
    };
  }
  if (e.type === 'speech') {
    return {
      ...base,
      '@type': 'Event',
      startDate: e.date || undefined,
      location: e.meta.location ? { '@type': 'Place', name: e.meta.location } : undefined,
      performer: authorRef,
      organizer: e.meta.event ? { '@type': 'Organization', name: e.meta.event } : undefined,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    };
  }
  return {
    ...base,
    '@type': 'CreativeWork',
    creator: authorRef,
    dateCreated: e.date || e.createdAt,
    keywords: e.tags.join(', ') || undefined,
    genre: CONTENT_TYPES[e.type].label,
  };
}

/** Tells search engines and AI assistants what you offer and where. */
export function serviceLd(p: Profile) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': absoluteUrl('/#service'),
    name: `${p.name}: ${p.role}`,
    url: absoluteUrl('/services'),
    image: absoluteUrl(DEFAULT_IMAGE),
    description: p.tagline,
    areaServed: p.location || 'Zambia',
    provider: { '@id': absoluteUrl('/#person') },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: SERVICES.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.title, description: s.summary },
      })),
    },
  };
}
