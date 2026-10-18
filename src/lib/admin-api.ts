'use client';
// Everything the dashboard and contact form do in the browser. Row Level Security (supabase/schema-v2.sql)
// is what actually protects the data: only the admin account can write, no matter what this code does.
import { sb } from './supabase-browser';
import { mergeProfile } from './defaults';
import { fromRow, toRow, type EntryRow } from './entry-map';
import { compressImage, extensionFor } from './images';
import { slugify, uid } from './helpers';
import type { Entry, Message, Profile } from './types';

const BUCKET = 'portfolio';

/** Ask the site to refresh its cached pages so changes show up straight away. Failure is harmless. */
export async function revalidateSite(): Promise<void> {
  try {
    const { data } = await sb().auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    await fetch('/api/revalidate', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  } catch {
    /* pages refresh on their own within a minute */
  }
}

/* ── auth ── */
export async function isAdmin(): Promise<boolean> {
  const client = sb();
  const { data: s } = await client.auth.getSession();
  if (!s.session) return false;
  const { data, error } = await client.rpc('is_admin');
  return !error && data === true;
}

export async function signIn(email: string, password: string): Promise<void> {
  const client = sb();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!(await isAdmin())) {
    await client.auth.signOut();
    throw new Error('You signed in, but this email is not an admin. Add it to the admins table (README, step 3).');
  }
}

export async function signOut(): Promise<void> {
  await sb().auth.signOut();
}

export function onAuthChange(cb: (admin: boolean) => void): () => void {
  const { data } = sb().auth.onAuthStateChange(() => {
    // Defer: calling Supabase inside this callback can deadlock.
    setTimeout(() => {
      isAdmin().then(cb, () => cb(false));
    }, 0);
  });
  return () => data.subscription.unsubscribe();
}

export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await sb().auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

/* ── profile ── */
export async function loadProfile(): Promise<Profile> {
  const { data, error } = await sb().from('site_profile').select('data').eq('id', 1).maybeSingle();
  if (error) throw new Error(error.message);
  return mergeProfile(data?.data);
}

export async function saveProfile(p: Profile): Promise<void> {
  const { error } = await sb().from('site_profile').upsert({ id: 1, data: p, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  await revalidateSite();
}

/* ── entries (projects, films, articles, op-eds, press, speeches, certifications) ── */
export async function listEntries(): Promise<Entry[]> {
  const { data, error } = await sb()
    .from('entries')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as EntryRow[]).map(fromRow);
}

export async function saveEntry(entry: Entry): Promise<void> {
  const base = entry.slug.trim() || slugify(entry.title) || entry.id.slice(0, 8);
  let slug = slugify(base) || entry.id.slice(0, 8);
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await sb().from('entries').upsert(toRow({ ...entry, slug }));
    if (!error) {
      await revalidateSite();
      return;
    }
    // 23505 = duplicate slug. Add a short suffix and try again.
    if (error.code === '23505' && /slug/i.test(error.message + (error.details ?? ''))) {
      slug = `${slugify(base)}-${uid().slice(0, 4)}`;
      continue;
    }
    throw new Error(error.message);
  }
  throw new Error('Could not find a free web address for this title. Try a different title.');
}

function bucketPath(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split('?')[0]);
}

export async function deleteEntry(entry: Entry): Promise<void> {
  const { error } = await sb().from('entries').delete().eq('id', entry.id);
  if (error) throw new Error(error.message);
  const paths = [entry.coverImage, entry.fileUrl, ...entry.gallery].map(bucketPath).filter((x): x is string => !!x);
  if (paths.length) await sb().storage.from(BUCKET).remove(paths);
  await revalidateSite();
}

export async function reorderEntries(ids: string[]): Promise<void> {
  const results = await Promise.all(ids.map((id, i) => sb().from('entries').update({ sort_order: i }).eq('id', id)));
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  await revalidateSite();
}

/* ── messages ── */
export async function submitMessage(m: { name: string; email: string; message: string }): Promise<void> {
  const { error } = await sb().from('messages').insert(m);
  if (error) throw new Error(error.message);
}

export async function listMessages(): Promise<Message[]> {
  const { data, error } = await sb().from('messages').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as { id: string; name: string; email: string; message: string; read: boolean; created_at: string }[]).map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    message: r.message,
    read: r.read,
    createdAt: r.created_at,
  }));
}

export async function setMessageRead(id: string, read: boolean): Promise<void> {
  const { error } = await sb().from('messages').update({ read }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteMessage(id: string): Promise<void> {
  const { error } = await sb().from('messages').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ── uploads ── */
export async function uploadImage(file: File, folder: string): Promise<string> {
  const blob = await compressImage(file);
  const path = `${folder}/${uid()}.${extensionFor(blob)}`;
  const { error } = await sb().storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false });
  if (error) throw new Error(error.message);
  return sb().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadPdf(file: File, folder: string): Promise<string> {
  if (file.type !== 'application/pdf') throw new Error('Choose a PDF file.');
  if (file.size > 10 * 1024 * 1024) throw new Error('That PDF is over 10 MB. Compress it or link to it instead.');
  const path = `${folder}/${uid()}.pdf`;
  const { error } = await sb().storage.from(BUCKET).upload(path, file, { contentType: 'application/pdf', cacheControl: '31536000', upsert: false });
  if (error) throw new Error(error.message);
  return sb().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
