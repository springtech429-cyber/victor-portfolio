import { supabase, isSupabaseConfigured } from './supabase';
import { DEFAULT_PROFILE, mergeProfile } from './defaults';
import { blobToDataUrl, compressImage, extensionFor } from './images';
import { uid } from './helpers';
import type { Entry, EntryType, LinkItem, Message, Profile } from './types';

export interface Api {
  mode: 'supabase' | 'local';
  getProfile(): Promise<Profile>;
  saveProfile(p: Profile): Promise<void>;
  listEntries(opts?: { includeDrafts?: boolean }): Promise<Entry[]>;
  saveEntry(e: Entry): Promise<void>;
  deleteEntry(e: Entry): Promise<void>;
  reorderEntries(ids: string[]): Promise<void>;
  submitMessage(m: { name: string; email: string; message: string }): Promise<void>;
  listMessages(): Promise<Message[]>;
  setMessageRead(id: string, read: boolean): Promise<void>;
  deleteMessage(id: string): Promise<void>;
  uploadImage(file: File, folder: string): Promise<string>;
  isAdmin(): Promise<boolean>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  onAuthChange(cb: (isAdmin: boolean) => void): () => void;
}

const BUCKET = 'portfolio';

/* ───────────────────────────── Supabase backend ───────────────────────────── */

interface EntryRow {
  id: string;
  type: EntryType;
  slug: string | null;
  title: string;
  summary: string | null;
  body: string | null;
  category: string | null;
  tags: string[] | null;
  cover_image: string | null;
  gallery: string[] | null;
  links: LinkItem[] | null;
  date: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  meta: Record<string, string> | null;
  file_url: string | null;
  created_at: string;
}

const fromRow = (r: EntryRow): Entry => ({
  id: r.id,
  type: r.type,
  slug: r.slug ?? '',
  title: r.title,
  summary: r.summary ?? '',
  body: r.body ?? '',
  category: r.category ?? '',
  tags: r.tags ?? [],
  coverImage: r.cover_image ?? '',
  gallery: r.gallery ?? [],
  links: r.links ?? [],
  date: r.date ?? '',
  featured: r.featured,
  published: r.published,
  sortOrder: r.sort_order,
  meta: r.meta ?? {},
  fileUrl: r.file_url ?? '',
  createdAt: r.created_at,
});

const toRow = (e: Entry) => ({
  id: e.id,
  type: e.type,
  slug: e.slug,
  title: e.title,
  summary: e.summary,
  body: e.body,
  category: e.category,
  tags: e.tags,
  cover_image: e.coverImage,
  gallery: e.gallery,
  links: e.links,
  date: e.date,
  featured: e.featured,
  published: e.published,
  sort_order: e.sortOrder,
  meta: e.meta,
  file_url: e.fileUrl,
  updated_at: new Date().toISOString(),
});

function db() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

/** Storage path of a file in our bucket, or null if the URL points somewhere else. */
function bucketPath(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split('?')[0]);
}

const remote: Api = {
  mode: 'supabase',

  async getProfile() {
    const { data, error } = await db().from('site_profile').select('data').eq('id', 1).maybeSingle();
    if (error) throw new Error(error.message);
    return mergeProfile(data?.data);
  },

  async saveProfile(p) {
    const { error } = await db()
      .from('site_profile')
      .upsert({ id: 1, data: p, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
  },

  async listEntries({ includeDrafts = false } = {}) {
    let q = db()
      .from('entries')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (!includeDrafts) q = q.eq('published', true);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data as EntryRow[]).map(fromRow);
  },

  async saveEntry(e) {
    const { error } = await db().from('entries').upsert(toRow(e));
    if (error) throw new Error(error.message);
  },

  async deleteEntry(e) {
    const { error } = await db().from('entries').delete().eq('id', e.id);
    if (error) throw new Error(error.message);
    // Best effort: clean up uploaded files so storage doesn't fill with orphans.
    const paths = [e.coverImage, ...e.gallery, e.fileUrl]
      .filter(Boolean)
      .map(bucketPath)
      .filter((x): x is string => !!x);
    if (paths.length) await db().storage.from(BUCKET).remove(paths);
  },

  async reorderEntries(ids) {
    const results = await Promise.all(
      ids.map((id, i) => db().from('entries').update({ sort_order: i }).eq('id', id))
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);
  },

  async submitMessage(m) {
    const { error } = await db().from('messages').insert(m);
    if (error) throw new Error(error.message);
  },

  async listMessages() {
    const { data, error } = await db()
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as { id: string; name: string; email: string; message: string; read: boolean; created_at: string }[]).map(
      (r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        message: r.message,
        read: r.read,
        createdAt: r.created_at,
      })
    );
  },

  async setMessageRead(id, read) {
    const { error } = await db().from('messages').update({ read }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async deleteMessage(id) {
    const { error } = await db().from('messages').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async uploadImage(file, folder) {
    const blob = await compressImage(file);
    const path = `${folder}/${uid()}.${extensionFor(blob)}`;
    const { error } = await db()
      .storage.from(BUCKET)
      .upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false });
    if (error) throw new Error(error.message);
    return db().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  },

  async isAdmin() {
    const { data: s } = await db().auth.getSession();
    if (!s.session) return false;
    const { data, error } = await db().rpc('is_admin');
    return !error && data === true;
  },

  async signIn(email, password) {
    const { error } = await db().auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!(await remote.isAdmin())) {
      await db().auth.signOut();
      throw new Error(
        'You signed in, but this email is not an admin. Add it to the admins table (see README, step 2).'
      );
    }
  },

  async signOut() {
    await db().auth.signOut();
  },

  onAuthChange(cb) {
    const { data } = db().auth.onAuthStateChange(() => {
      // Defer: calling Supabase inside this callback can deadlock.
      setTimeout(() => {
        remote.isAdmin().then(cb, () => cb(false));
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  },
};

/* ───────────────── Local demo backend (no Supabase configured) ─────────────────
   Everything is stored in this browser only. It lets you try the dashboard before
   connecting Supabase; visitors on other devices will NOT see these changes. */

const LS = {
  profile: 'portfolio:profile',
  entries: 'portfolio:entries',
  messages: 'portfolio:messages',
  session: 'portfolio:demo-session',
};

function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error("This browser's storage is full. Remove some pictures, or connect Supabase.");
  }
}

const authListeners = new Set<(v: boolean) => void>();
const sortEntries = (list: Entry[]) =>
  [...list].sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt));

const local: Api = {
  mode: 'local',

  async getProfile() {
    return mergeProfile(lsGet<unknown>(LS.profile, DEFAULT_PROFILE));
  },
  async saveProfile(p) {
    lsSet(LS.profile, p);
  },

  async listEntries({ includeDrafts = false } = {}) {
    const all = lsGet<Entry[]>(LS.entries, []);
    return sortEntries(includeDrafts ? all : all.filter((e) => e.published));
  },
  async saveEntry(e) {
    const all = lsGet<Entry[]>(LS.entries, []);
    const i = all.findIndex((x) => x.id === e.id);
    if (i === -1) all.push({ ...e, createdAt: e.createdAt || new Date().toISOString() });
    else all[i] = e;
    lsSet(LS.entries, all);
  },
  async deleteEntry(e) {
    lsSet(LS.entries, lsGet<Entry[]>(LS.entries, []).filter((x) => x.id !== e.id));
  },
  async reorderEntries(ids) {
    const all = lsGet<Entry[]>(LS.entries, []);
    lsSet(
      LS.entries,
      all.map((e) => ({ ...e, sortOrder: ids.indexOf(e.id) === -1 ? e.sortOrder : ids.indexOf(e.id) }))
    );
  },

  async submitMessage(m) {
    const all = lsGet<Message[]>(LS.messages, []);
    all.push({ id: uid(), ...m, read: false, createdAt: new Date().toISOString() });
    lsSet(LS.messages, all);
  },
  async listMessages() {
    return lsGet<Message[]>(LS.messages, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async setMessageRead(id, read) {
    lsSet(
      LS.messages,
      lsGet<Message[]>(LS.messages, []).map((m) => (m.id === id ? { ...m, read } : m))
    );
  },
  async deleteMessage(id) {
    lsSet(LS.messages, lsGet<Message[]>(LS.messages, []).filter((m) => m.id !== id));
  },

  async uploadImage(file) {
    const blob = await compressImage(file, { maxSize: 900, quality: 0.7 });
    return blobToDataUrl(blob);
  },

  async isAdmin() {
    return sessionStorage.getItem(LS.session) === '1';
  },
  async signIn() {
    sessionStorage.setItem(LS.session, '1');
    authListeners.forEach((cb) => cb(true));
  },
  async signOut() {
    sessionStorage.removeItem(LS.session);
    authListeners.forEach((cb) => cb(false));
  },
  onAuthChange(cb) {
    authListeners.add(cb);
    return () => {
      authListeners.delete(cb);
    };
  },
};

export const api: Api = isSupabaseConfigured ? remote : local;