import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Share-preview crawlers (WhatsApp, LinkedIn, X) need absolute URLs for og:image.
// Netlify exposes the site address as `URL` at build time; Vercel as VERCEL_PROJECT_PRODUCTION_URL.
// Set VITE_SITE_URL yourself if you use a custom domain on another host.
function siteUrlPlugin(siteUrl: string): Plugin {
  return {
    name: 'site-url',
    transformIndexHtml: (html) => html.replace(/__SITE_URL__/g, siteUrl),
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const raw =
    env.VITE_SITE_URL ||
    process.env.URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : '')
  const siteUrl = raw.replace(/\/+$/, '')
  return {
    plugins: [react(), siteUrlPlugin(siteUrl)],
  }
})
