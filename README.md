# Victor Mwewa: portfolio (Next.js)

An immersive neon-blue-on-black portfolio with a built-in admin dashboard. You publish web projects,
film, articles, executive op-eds, short stories, branding copy, copywriting, press copy, speeches and
certifications from the browser. Nothing is edited in the codebase.

**Stack:** Next.js (server-rendered, so Google and AI assistants read every page), React, Tailwind,
three.js + react-three-fiber (only for the work ring), Lenis smooth scroll, Supabase (database, login, file storage).

## The background: speech video and TV studio

- **Speech video** at the top of the home page: put your clip at `public/media/speech.mp4` (and, optionally,
  `public/media/speech.webm`). It plays muted and looping, is tinted blue to match the site, and fades out as you
  scroll. If the file is missing the site simply shows the studio. Keep it short (10 to 20 seconds), 1280x720 and
  under about 5 MB. With ffmpeg installed:
  `ffmpeg -i input.mp4 -t 15 -vf scale=1280:-2 -an -c:v libx264 -crf 28 -preset slow -movflags +faststart public/media/speech.mp4`
  and `ffmpeg -i input.mp4 -t 15 -vf scale=1280:-2 -an -c:v libvpx-vp9 -crf 38 -b:v 0 public/media/speech.webm`.
  Use footage you own or have a licence for (Pexels, Coverr and Mixkit have free speech and conference clips).
- **TV studio**: as you scroll, the camera moves forward through a neon-blue studio (glass partitions, ceiling light
  bars, monitor walls, studio cameras, an ON AIR sign and a news desk). It is one lightweight 2D canvas that only
  redraws while you scroll. Edit the props in `src/components/shell/StudioBackdrop.tsx`.

## What is left of the 3D

- **Work ring** (GLSL): your featured projects on a scroll-driven 3D carousel, with a ripple and
  colour-split hover. Cards open on click.
- The ring is downloaded only when you scroll close to it. Reduced-motion and data-saver visitors get no video
  and no 3D. Text always paints first.

## Setup

1. `npm install`
2. Create a free project at [supabase.com](https://supabase.com) (or use your existing one).
3. **SQL Editor:** paste `supabase/schema.sql` and run it. If the editor shows "error fetching API" (a network or
   dashboard hiccup, not a mistake in the SQL), run `supabase/step-1-entries-table.sql` first, then `schema.sql` again. It is safe to run on a project that already
   runs the older version: your existing projects are *copied* into the new `entries` table and nothing
   is deleted. **New projects only:** uncomment the `insert into public.admins` line first and put your
   email in it.
4. **Authentication > Users > Add user:** your email and a strong password, "Auto Confirm User" ticked.
   Then **Authentication > Sign In / Providers > Email:** turn **off** "Allow new users to sign up".
5. Copy `.env.example` to `.env.local` and fill in the two Supabase values (Project Settings > API).
6. `npm run dev`, open `http://localhost:3000/admin`, sign in.

## Deploying to Vercel (moving from the old Vite version)

1. Push this code to your GitHub repo (`bash push-to-github.sh` does it, keeping history).
2. In Vercel: **Project > Settings > Build and Deployment**
   - **Framework Preset:** Next.js (it was Vite before)
   - Turn **off** any override for Build Command, Output Directory and Install Command.
3. **Settings > Environment Variables:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   The old `VITE_SUPABASE_*` names also work, so nothing breaks if you leave them.
4. Redeploy. Your admin is at `https://your-site/admin`.

When you save in the dashboard the public pages refresh immediately; otherwise they refresh within a minute.

## Search and AI visibility (SEO and GEO)

Built in: server-rendered HTML for every page, one clear heading per page, a sitemap that updates as you
publish, `robots.txt` that welcomes search and AI crawlers (and blocks `/admin`), `llms.txt` (a plain-text
map of your site for AI assistants), canonical links, Open Graph and Twitter cards, and structured data
(Person, WebSite, FAQPage, Article, NewsArticle, VideoObject, Event, CreativeWork, BreadcrumbList).

Nobody can promise a number one ranking, but these are the things that move it. Do them:

1. Add the site in **Google Search Console** and **Bing Webmaster Tools** and submit `/sitemap.xml`.
2. Fill in **Profile > Questions and answers** the way people actually search ("Who is the best
   keynote speechwriter in Zambia?"). Answers are marked up for search and AI answers.
3. Publish real content with a **short description and tags** every time. Titles and descriptions are
   what search results and AI summaries quote.
4. Get linked: LinkedIn, GitHub, publications that ran your op-eds ("Link to the original"), event pages.
   Put those same links in **Profile > Your links** so search engines connect them to you.
5. Keep your name, job title and location identical everywhere.

## Security

Checked and in place:

- **Database:** Row Level Security on every table. Visitors can only read published content and send a
  contact message; only your admin account can write. Verified with `is_admin()` server-side, never in
  the browser.
- **Contact form:** hidden honeypot, length limits, email format check, and a database throttle
  (5 per sender and 40 total per 10 minutes).
- **Uploads:** admin only, images and PDFs only, 10 MB max, random file names, SVG refused.
- **Content:** Markdown is rendered with raw HTML disabled, links are limited to http(s)/mailto/tel,
  and video embeds are limited to YouTube (no-cookie) and Vimeo. Hostile test content (script tags,
  `javascript:` links, event handlers, iframes) was tested and does not run.
- **Headers:** Content-Security-Policy (no `eval`, no plugins, no framing by other sites, embeds limited
  to YouTube/Vimeo, connections limited to Supabase), HSTS, no-sniff, strict referrer policy,
  permissions policy, cross-origin opener policy. `/admin` is `noindex` and never cached.
- **Dashboard refresh endpoint** `/api/revalidate` verifies your login before doing anything.
- **Dependencies:** `npm audit` reports 0 vulnerabilities in production packages. No secrets in the code;
  `.env*` files are git-ignored; the browser only ever holds the public (anon) key.

Do these in Supabase (they cannot be done from code):

1. **Authentication > Providers > Email:** sign-ups off (step 4 above).
2. **Authentication > Multi-Factor:** turn on TOTP and enrol your authenticator app, so a stolen
   password is not enough.
3. **Authentication > Rate Limits:** keep the defaults or tighten them.
4. Use a unique password of 12+ characters (Dashboard > Account changes it).
5. Re-run `npm audit` and `npm update` now and then.

Honest limit: the Content-Security-Policy allows inline scripts because Next.js needs them to start a
page. The protection against injected scripts comes from never rendering raw HTML (above), not from the
policy alone.

## Where things live

- `src/lib/content-types.ts`: the kinds of content and their fields. Add a type here (and in the SQL
  `check` list) and the dashboard form appears automatically.
- `src/lib/shaders.ts`: all GLSL.
- `src/components/three/`: the 3D scene, the Rapier playground and the work ring.
- `src/lib/quality.ts`: which devices get 3D. Tune particle counts in `BackgroundScene.tsx`.
- `src/lib/defaults.ts`: what the site shows before you save a profile.

## Speed

`npm run dev` compiles each page the first time you open it and ships development-only code, so it always feels slower
than the live site. To feel the real speed locally run `npm run build` and then `npm start`.
Production speed work in this version: the heavy WebGL/physics background was replaced by a canvas that only draws while
scrolling, the 3D work ring loads only near the viewport, the film-grain overlay is gone, and the cursor loop stops when idle.

## Services and search

`/services` (edit the copy in `src/lib/services.ts`) gives Google and AI assistants a clear page for the searches you want
to be found for: tech lead, communication specialist, corporate communications, web developer, PR, speechwriting.
Add `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` / `NEXT_PUBLIC_BING_SITE_VERIFICATION` to verify the site in Search Console.
