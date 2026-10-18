import type { NextConfig } from 'next';

// The old Vite setup used VITE_* names. Both spellings work, so existing Vercel variables keep working.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: URL | null = null;
try {
  supabase = SUPABASE_URL ? new URL(SUPABASE_URL) : null;
} catch {
  /* a malformed value just means images from it are not optimised */
}

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  experimental: { optimizePackageImports: ['lucide-react'] },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_KEY,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: supabase
      ? [
          {
            protocol: supabase.protocol.replace(':', '') as 'http' | 'https',
            hostname: supabase.hostname,
            port: supabase.port,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
    // Allow the local mock backend used in tests; harmless in production.
    dangerouslyAllowLocalIP: supabase?.hostname === 'localhost' || supabase?.hostname === '127.0.0.1',
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    const supa = supabase ? supabase.origin : '';
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      `img-src 'self' data: blob: https://i.ytimg.com https://*.supabase.co ${supa}`.trim(),
      `media-src 'self' blob: https://*.supabase.co ${supa}`.trim(),
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      // Next.js writes small inline scripts to start the page. 'wasm-unsafe-eval' lets the Rapier physics engine
      // (WebAssembly) run; it does NOT allow eval() of strings. 'unsafe-eval' is added only in development.
      `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isProd ? '' : " 'unsafe-eval'"}`,
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co ${supa}`.trim(),
      'frame-src https://www.youtube-nocookie.com https://player.vimeo.com',
      "worker-src 'self' blob:",
      ...(process.env.VERCEL ? ['upgrade-insecure-requests'] : []),
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
      // Videos and fonts rarely change; let browsers and Vercel's CDN keep them for a week.
      { source: '/media/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }] },
      { source: '/admin', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'no-store' }] },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};

export default config;
