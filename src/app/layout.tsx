import type { Metadata, Viewport } from 'next';
import './globals.css';
import { body, display, mono } from '@/fonts';
import { SEO_KEYWORDS, siteUrl } from '@/lib/site';
import { getProfile } from '@/lib/data';

export const viewport: Viewport = { themeColor: '#030308', colorScheme: 'dark', width: 'device-width', initialScale: 1 };

export async function generateMetadata(): Promise<Metadata> {
  const p = await getProfile();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${p.name} | ${p.role}`, template: `%s | ${p.name}` },
    description: p.tagline,
    keywords: SEO_KEYWORDS,
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
      other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
    },
    applicationName: p.name,
    authors: [{ name: p.name, url: siteUrl() }],
    creator: p.name,
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: '/apple-touch-icon.png',
    },
    openGraph: { type: 'website', siteName: p.name, locale: 'en_GB' },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks that JavaScript is running so scroll reveals can start hidden. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
