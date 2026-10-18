'use client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isBackendConfigured = Boolean(URL_ && KEY);

let client: SupabaseClient | null = null;
export function sb(): SupabaseClient {
  if (!isBackendConfigured) throw new Error('Supabase is not connected. See the README, step 4.');
  if (!client) client = createClient(URL_, KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}
