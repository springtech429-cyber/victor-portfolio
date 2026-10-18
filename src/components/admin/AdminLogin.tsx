'use client';
import { useState, type FormEvent } from 'react';
import { Info, Lock } from 'lucide-react';
import * as api from '@/lib/admin-api';
import { isBackendConfigured } from '@/lib/supabase-browser';
import { btnPrimary, Field, inputCls } from './ui';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-6 font-sans text-text-primary">
      <div className="w-full max-w-md border border-neon-indigo/30 bg-bg-card p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="border border-neon-blue/50 bg-neon-blue/10 p-2 text-neon-blue"><Lock size={20} /></div>
          <h1 className="text-xl font-display font-bold">Admin sign in</h1>
        </div>
        {!isBackendConfigured ? (
          <div className="flex gap-2 border border-neon-blue/40 bg-neon-blue/10 p-3 text-sm">
            <Info size={18} className="mt-0.5 shrink-0 text-neon-blue" />
            <p>Supabase is not connected. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your host&apos;s environment settings, then redeploy (README, step 4).</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field label="Email" htmlFor="admin-email"><input id="admin-email" type="email" required autoComplete="username" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Password" htmlFor="admin-password"><input id="admin-password" type="password" required autoComplete="current-password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
            {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
            <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>{busy ? 'Signing in...' : 'Sign in'}</button>
          </form>
        )}
        <a href="/" className="mt-4 block text-center text-sm text-text-secondary hover:text-neon-blue">Back to the portfolio</a>
      </div>
    </div>
  );
}
