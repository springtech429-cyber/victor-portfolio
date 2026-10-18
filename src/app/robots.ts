import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

// Search engines AND AI assistants are welcome: being quoted by them is the point.
export default function robots(): MetadataRoute.Robots {
  const ai = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bytespider', 'cohere-ai'];
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
      { userAgent: ai, allow: '/', disallow: ['/admin', '/api/'] },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
