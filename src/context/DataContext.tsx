import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { DEFAULT_PROFILE } from '../lib/defaults';
import type { Profile, Project } from '../lib/types';

interface DataContextType {
  profile: Profile;
  projects: Project[];
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  authChecked: boolean;
  mode: 'supabase' | 'local';
  reload: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const reload = useCallback(async () => {
    setError(null);
    const [p, pr] = await Promise.allSettled([api.getProfile(), api.listProjects()]);
    if (p.status === 'fulfilled') setProfile(p.value);
    if (pr.status === 'fulfilled') setProjects(pr.value);
    const failure = [p, pr].find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
    if (failure) {
      setError(failure.reason instanceof Error ? failure.reason.message : 'Could not load content.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    api.isAdmin().then(setIsAdmin, () => setIsAdmin(false)).finally(() => setAuthChecked(true));
    return api.onAuthChange(setIsAdmin);
  }, [reload]);

  useEffect(() => {
    document.title = `${profile.name} | ${profile.role}`;
  }, [profile.name, profile.role]);

  return (
    <DataContext.Provider
      value={{ profile, projects, loading, error, isAdmin, authChecked, mode: api.mode, reload }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useSiteData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useSiteData must be used within a DataProvider');
  return ctx;
}
