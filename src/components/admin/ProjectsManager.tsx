import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { uid } from '../../lib/helpers';
import type { Project } from '../../lib/types';
import { btnDanger, btnGhost, btnPrimary, type Notify } from './ui';
import { ProjectForm } from './ProjectForm';

const blank = (sortOrder: number): Project => ({
  id: uid(),
  title: '',
  summary: '',
  description: '',
  category: 'Web',
  status: 'Live',
  client: '',
  year: String(new Date().getFullYear()),
  tags: [],
  coverImage: '',
  gallery: [],
  links: [{ label: 'Live site', url: '' }],
  featured: false,
  published: true,
  sortOrder,
  createdAt: new Date().toISOString(),
});

export function ProjectsManager({ notify, onChanged }: { notify: Notify; onChanged: () => void }) {
  const [list, setList] = useState<Project[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState<{ project: Project; isNew: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      setList(await api.listProjects({ includeDrafts: true }));
      setLoadError('');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load projects.');
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const afterChange = async () => {
    await load();
    onChanged();
  };

  const save = async (p: Project) => {
    await api.saveProject(p);
    notify(editing?.isNew ? 'Project added.' : 'Project saved.');
    setEditing(null);
    await afterChange();
  };

  const remove = async (p: Project) => {
    if (!window.confirm(`Delete "${p.title}"? This also removes its uploaded pictures and cannot be undone.`)) return;
    try {
      await api.deleteProject(p);
      notify('Project deleted.');
      await afterChange();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not delete.', 'error');
    }
  };

  const togglePublished = async (p: Project) => {
    try {
      await api.saveProject({ ...p, published: !p.published });
      notify(p.published ? 'Hidden from your portfolio.' : 'Now visible on your portfolio.');
      await afterChange();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not update.', 'error');
    }
  };

  const move = async (i: number, dir: -1 | 1) => {
    if (!list) return;
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
    try {
      await api.reorderProjects(next.map((p) => p.id));
      onChanged();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not reorder.', 'error');
      load();
    }
  };

  const topOrder = list && list.length ? Math.min(...list.map((p) => p.sortOrder)) - 1 : 0;

  return (
    <section aria-labelledby="projects-heading">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 id="projects-heading" className="text-xl font-orbitron font-bold">Projects</h2>
          <p className="text-sm text-text-secondary">New projects appear first. Use the arrows to change the order.</p>
        </div>
        <button className={btnPrimary} onClick={() => setEditing({ project: blank(topOrder), isNew: true })}>
          <Plus size={16} /> Add project
        </button>
      </div>

      {loadError && (
        <p className="border border-red-400/40 bg-red-400/5 text-red-400 p-4 text-sm" role="alert">
          {loadError} If you just set up Supabase, make sure you ran supabase/schema.sql.
        </p>
      )}
      {!list && !loadError && <p className="text-text-secondary">Loading projects...</p>}

      {list && list.length === 0 && (
        <div className="border border-dashed border-text-secondary/30 p-10 text-center">
          <p className="mb-4 text-text-secondary">You have not added any projects yet.</p>
          <button className={btnPrimary} onClick={() => setEditing({ project: blank(0), isNew: true })}>
            <Plus size={16} /> Add your first project
          </button>
        </div>
      )}

      <ul className="space-y-3">
        {list?.map((p, i) => (
          <li key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-bg-card border border-neon-indigo/20">
            <div className="w-full sm:w-28 h-20 shrink-0 bg-bg-secondary overflow-hidden flex items-center justify-center text-text-secondary">
              {p.coverImage ? <img src={p.coverImage} alt="" className="w-full h-full object-cover" /> : <span className="text-xs">No picture</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium truncate">{p.title}</h3>
                {!p.published && <span className="text-xs px-2 py-0.5 border border-yellow-400/50 text-yellow-400">Draft</span>}
                {p.featured && <span className="text-xs px-2 py-0.5 border border-neon-purple/50 text-neon-purple">Featured</span>}
              </div>
              <p className="text-sm text-text-secondary truncate">
                {[p.category, p.status, `${p.links.length} link${p.links.length === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className={btnGhost} onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${p.title} up`}><ArrowUp size={16} /></button>
              <button className={btnGhost} onClick={() => move(i, 1)} disabled={i === (list?.length ?? 0) - 1} aria-label={`Move ${p.title} down`}><ArrowDown size={16} /></button>
              <button className={btnGhost} onClick={() => togglePublished(p)} aria-label={p.published ? `Hide ${p.title}` : `Show ${p.title}`} title={p.published ? 'Hide from portfolio' : 'Show on portfolio'}>
                {p.published ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button className={btnGhost} onClick={() => setEditing({ project: p, isNew: false })}><Pencil size={16} /> Edit</button>
              <button className={btnDanger} onClick={() => remove(p)} aria-label={`Delete ${p.title}`}><Trash2 size={16} /></button>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <ProjectForm
          initial={editing.project}
          isNew={editing.isNew}
          categories={(list ?? []).map((p) => p.category).filter(Boolean)}
          notify={notify}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
