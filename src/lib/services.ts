export interface Service {
  id: string;
  title: string;
  /** One sentence, used in structured data and the llms.txt summary. */
  summary: string;
  body: string;
  points: string[];
}

/** The services page and the structured data both read from this list. Edit the wording here. */
export const SERVICES: Service[] = [
  {
    id: 'web-software',
    title: 'Web and software development',
    summary: 'Websites, web apps, dashboards and platforms built with React, Next.js, TypeScript, Node.js and Supabase.',
    body: 'I plan, build and launch software end to end: business websites, web applications, dashboards, CRMs and marketplaces. Everything is built to load quickly, to be found in search, and to be managed by you from a browser instead of the codebase.',
    points: ['Business websites and portfolios', 'Web applications, dashboards and internal tools', 'E-commerce, marketplace and CRM platforms', 'Technical SEO, speed and accessibility', 'Technical leadership from first scope to launch'],
  },
  {
    id: 'corporate-communications',
    title: 'Corporate communications and PR',
    summary: 'Executive op-eds, speeches and keynotes, press copy and messaging for organisations and their leaders.',
    body: 'I help organisations say the right thing, clearly, in the right place. That means executive op-eds, speeches and keynote narratives, press releases, media-ready copy and the messaging that holds a communication plan together.',
    points: ['Executive op-eds and thought-leadership articles', 'Speeches and keynote narratives', 'Press releases and media-ready copy', 'Messaging and communication planning', 'Public relations support for brands and leaders'],
  },
  {
    id: 'copywriting-brand-voice',
    title: 'Copywriting and brand voice',
    summary: 'Website copy, campaign copy and a consistent brand voice.',
    body: 'Clear writing that sounds like your organisation and moves people to act: website copy, campaign and social copy, product descriptions and brand voice guidelines your team can reuse.',
    points: ['Website and landing page copy', 'Campaign, social and email copy', 'Brand voice and tone guidelines', 'Product and service descriptions'],
  },
  {
    id: 'video-audio',
    title: 'Video and audio production',
    summary: 'Video editing and audio engineering, shaped by a background in radio broadcasting.',
    body: 'Before software I worked in radio as a broadcaster, reporter and audio engineer. I bring that discipline to video editing, speech and interview recording, audio clean-up and radio-style production.',
    points: ['Video editing and finishing', 'Audio engineering, recording and clean-up', 'Speech, interview and podcast production', 'Radio-style spots and voice-over'],
  },
  {
    id: 'digital-marketing',
    title: 'Digital marketing',
    summary: 'Content-led digital marketing that pairs strong writing with a website that converts.',
    body: 'Marketing works best when the message, the website and the content agree with each other. I plan and produce content-led campaigns and make sure the site behind them is fast, searchable and measurable.',
    points: ['Content and social media planning', 'Search-friendly content and landing pages', 'Campaign copy and creative', 'Website performance that supports campaigns'],
  },
];

export const SERVICE_FAQS = [
  { q: 'Do you work with organisations outside Zambia?', a: 'Yes. I am based in Zambia and also work with clients remotely.' },
  { q: 'Can you handle both the website and the writing?', a: 'Yes. Building the software and writing the content together keeps the message, the design and the search visibility consistent.' },
  { q: 'How do I start a project?', a: 'Send a message through the contact page or book a 30-minute call. I reply by email.' },
];
