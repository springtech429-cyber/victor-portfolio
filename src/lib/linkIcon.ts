import { CalendarDays, ExternalLink, Facebook, Github, Globe, Instagram, Linkedin, Mail, MessageCircle, Smartphone, Twitter, Youtube, type LucideIcon } from 'lucide-react';
import type { LinkItem } from './types';

/** Pick an icon from the link's label and address, e.g. github.com gets the GitHub mark. */
export function iconForLink(link: LinkItem): LucideIcon {
  const s = `${link.label} ${link.url}`.toLowerCase();
  if (/github|gitlab|bitbucket|source|repo/.test(s)) return Github;
  if (/linkedin/.test(s)) return Linkedin;
  if (/twitter|x\.com/.test(s)) return Twitter;
  if (/youtube|youtu\.be|video|watch/.test(s)) return Youtube;
  if (/facebook|fb\.com/.test(s)) return Facebook;
  if (/instagram/.test(s)) return Instagram;
  if (/whatsapp|wa\.me/.test(s)) return MessageCircle;
  if (/mailto:|e-?mail/.test(s)) return Mail;
  if (/calendly|cal\.com|book|schedule/.test(s)) return CalendarDays;
  if (/play\.google|apps\.apple|app store|google play|android|ios/.test(s)) return Smartphone;
  if (/live|site|demo|visit|website|www\./.test(s)) return Globe;
  return ExternalLink;
}
