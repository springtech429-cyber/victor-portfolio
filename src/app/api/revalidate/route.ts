import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Called by the dashboard after a save. Only a signed-in admin can trigger it.
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!url || !key || !token) return NextResponse.json({ ok: false }, { status: 401 });

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.rpc('is_admin');
  if (error || data !== true) return NextResponse.json({ ok: false }, { status: 403 });

  revalidatePath('/', 'layout');
  revalidatePath('/sitemap.xml');
  revalidatePath('/llms.txt');
  return NextResponse.json({ ok: true, revalidated: Date.now() });
}
