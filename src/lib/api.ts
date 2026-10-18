import { supabase, isSupabaseConfigured } from './supabase';
import { DEFAULT_PROFILE, mergeProfile } from './defaults';
import { blobToDataUrl, compressImage, extensionFor } from './images';
import { uid } from './helpers';
import type { Message, Profile, Project } from './types';

export interface Api {
  mode: 'supabase' | 'local';
  getProfile(): Promise<Profile>;
  saveProfile(p: Profile): Promise<void>;
  listProjects(opts?: { includeDrafts?: boolean }): Promise<Project[]>;
  saveProject(p: Project): Promise<void>;
  deleteProject(p: Project): Promise<void>;
  reorderProjects(ids: string[]): Promise<void>;
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

interface ProjectRow {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  status: string;
  client: string;
  year: string;
  tags: string[] | null;
  cover_image: string;
  gallery: string[] | null;
  links: { label: string; url: string }[] | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
}

const fromRow = (r: ProjectRow): Project => ({
  id: r.id,
  title: r.title,
  summary: r.summary ?? '',
  description: r.description ?? '',
  category: r.category ?? '',
  status: r.status ?? '',
  client: r.client ?? '',
  year: r.year ?? '',
  tags: r.tags ?? [],
  coverImage: r.cover_image ?? '',
  gallery: r.gallery ?? [],
  links: r.links ?? [],
  featured: r.featured,
  published: r.published,
  sortOrder: r.sort_order,
  createdAt: r.created_at,
});

const toRow = (p: Project) => ({
  id: p.id,
  title: p.title,
  summary: p.summary,
  description: p.description,
  category: p.category,
  status: p.status,
  client: p.client,
  year: p.year,
  tags: p.tags,
  cover_image: p.coverImage,
  gallery: p.gallery,
  links: p.links,
  featured: p.featured,
  published: p.published,
  sort_order: p.sortOrder,
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

  async listProjects({ includeDrafts = false } = {}) {
    let q = db()
      .from('projects')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (!includeDrafts) q = q.eq('published', true);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data as ProjectRow[]).map(fromRow);
  },

  async saveProject(p) {
    const { error } = await db().from('projects').upsert(toRow(p));
    if (error) throw new Error(error.message);
  },

  async deleteProject(p) {
    const { error } = await db().from('projects').delete().eq('id', p.id);
    if (error) throw new Error(error.message);
    // Best effort: clean up uploaded pictures so storage doesn't fill with orphans.
    const paths = [p.coverImage, ...p.gallery].map(bucketPath).filter((x): x is string => !!x);
    if (paths.length) await db().storage.from(BUCKET).remove(paths);
  },

  async reorderProjects(ids) {
    const results = await Promise.all(
      ids.map((id, i) => db().from('projects').update({ sort_order: i }).eq('id', id))
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
  projects: 'portfolio:projects',
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
    throw new Error('This browser\'s storage is full. Remove some pictures, or connect Supabase.');
  }
}

const authListeners = new Set<(v: boolean) => void>();
const sortProjects = (list: Project[]) =>
  [...list].sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt));

const local: Api = {
  mode: 'local',

  async getProfile() {
    return mergeProfile(lsGet<unknown>(LS.profile, DEFAULT_PROFILE));
  },
  async saveProfile(p) {
    lsSet(LS.profile, p);
  },

  async listProjects({ includeDrafts = false } = {}) {
    const all = lsGet<Project[]>(LS.projects, []);
    return sortProjects(includeDrafts ? all : all.filter((p) => p.published));
  },
  async saveProject(p) {
    const all = lsGet<Project[]>(LS.projects, []);
    const i = all.findIndex((x) => x.id === p.id);
    if (i === -1) all.push({ ...p, createdAt: p.createdAt || new Date().toISOString() });
    else all[i] = p;
    lsSet(LS.projects, all);
  },
  async deleteProject(p) {
    lsSet(LS.projects, lsGet<Project[]>(LS.projects, []).filter((x) => x.id !== p.id));
  },
  async reorderProjects(ids) {
    const all = lsGet<Project[]>(LS.projects, []);
    lsSet(
      LS.projects,
      all.map((p) => ({ ...p, sortOrder: ids.indexOf(p.id) === -1 ? p.sortOrder : ids.indexOf(p.id) }))
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
