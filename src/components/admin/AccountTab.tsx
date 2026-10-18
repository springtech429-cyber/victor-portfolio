'use client';
import { useState, type FormEvent } from 'react';
import * as api from '@/lib/admin-api';
import { btnPrimary, Field, inputCls, type Notify } from './ui';

export function AccountTab({ notify }: { notify: Notify }) {
  const [pw, setPw] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 12) return notify('Use at least 12 characters.', 'error');
    if (pw !== again) return notify('The two passwords do not match.', 'error');
    setBusy(true);
    try {
      await api.changePassword(pw);
      setPw('');
      setAgain('');
      notify('Password changed.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not change the password.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="account-heading" className="max-w-md space-y-6">
      <div>
        <h2 id="account-heading" className="text-xl font-display font-bold">Account</h2>
        <p className="text-sm text-text-secondary">Change your sign-in password. Use a long, unique one, and turn on two-step sign-in in Supabase (README, security).</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Field label="New password" htmlFor="new-pw" hint="At least 12 characters."><input id="new-pw" type="password" autoComplete="new-password" className={inputCls} value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        <Field label="Repeat new password" htmlFor="new-pw2"><input id="new-pw2" type="password" autoComplete="new-password" className={inputCls} value={again} onChange={(e) => setAgain(e.target.value)} /></Field>
        <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Saving...' : 'Change password'}</button>
      </form>
    </section>
  );
}
