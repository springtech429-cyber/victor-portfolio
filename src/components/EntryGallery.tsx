import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useSiteData } from '../context/DataContext';
import type { Entry, EntryType } from '../lib/types';
import { safeUrl } from '../lib/helpers';
import { iconForLink } from '../lib/linkIcon';
import { EntryModal } from './EntryModal';

type Props = {
  /** Only show these entry types. Omit to show everything. */
  types?: EntryType[];
  /** Heading is rendered as: {title} <accent>{accent}</accent> */
  title?: string;
  accent?: string;
  emptyText?: string;
};

export function EntryGallery({
  types,
  title = 'MY',
  accent = 'WORK',
  emptyText = 'New work is on its way.',
}: Props) {
  const { entries, loading, error, isAdmin, reload } = useSiteData();
  const [filter, setFilter] = useState('All');
  const [open, setOpen] = useState<Entry | null>(null);

  const items = useMemo(
    () =>
      entries
        .filter((e) => e.published && (!types || types.includes(e.type)))
        .sort((a, b) => Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder),
    [entries, types]
  );

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(items.map((e) => e.category).filter(Boolean)))],
    [items]
  );
  const activeFilter = categories.includes(filter) ? filter : 'All';
  const visible = activeFilter === 'All' ? items : items.filter((e) => e.category === activeFilter);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 w-full">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-orbitron font-bold text-text-primary mb-4">
          {title} <span className="text-neon-blue">{accent}</span>
        </h2>
        <div className="h-1 w-24 bg-neon-purple mx-auto rounded-full mb-8" />

        {categories.length > 2 && (
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                aria-pressed={activeFilter === cat}
                className={`px-4 py-2 font-mono text-sm border transition-all duration-300 ${activeFilter === cat ? 'border-neon-blue bg-neon-blue/10 text-neon-blue shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'border-text-secondary/30 text-text-secondary hover:border-neon-purple hover:text-neon-purple'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" aria-busy="true" aria-label="Loading">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-80 bg-bg-card border border-neon-indigo/20 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="max-w-xl mx-auto text-center border border-red-400/40 bg-red-400/5 p-6 font-mono" role="alert">
          <p className="text-red-400 mb-4">Could not be loaded. {error}</p>
          <button onClick={() => reload()} className="inline-flex items-center gap-2 px-4 py-2 border border-neon-blue text-neon-blue hover:bg-neon-blue/10">
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="max-w-xl mx-auto text-center border border-dashed border-text-secondary/30 p-10 font-mono text-text-secondary">
          <p className="mb-2 text-text-primary">{emptyText}</p>
          <p>Check back soon, or get in touch to see work that is not listed yet.</p>
          {isAdmin && (
            <a href="#/admin" className="inline-block mt-6 px-4 py-2 border border-neon-blue text-neon-blue hover:bg-neon-blue/10">
              Add your first entry
            </a>
          )}
        </div>
      )}

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {!loading &&
            visible.map((entry) => {
              const links = entry.links.filter((l) => safeUrl(l.url)).slice(0, 2);
              const year = entry.date ? entry.date.slice(0, 4) : '';
              return (
                <motion.article
                  layout
                  key={entry.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="group relative flex flex-col bg-bg-card border border-neon-indigo/20 overflow-hidden hover:border-neon-blue transition-colors duration-300"
                >
                  <button onClick={() => setOpen(entry)} className="text-left flex-1 flex flex-col" aria-label={`View details for ${entry.title}`}>
                    <div className="relative h-48 overflow-hidden bg-bg-secondary shrink-0">
                      {entry.coverImage ? (
                        <img
                          src={entry.coverImage}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-blueprint flex items-center justify-center font-orbitron font-black text-6xl text-neon-indigo/40">
                          {entry.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {entry.category && (
                        <div className="absolute top-2 right-2 bg-bg-primary/90 px-2 py-1 text-xs font-mono text-neon-blue border border-neon-blue/30">
                          {entry.category}
                        </div>
                      )}
                      {entry.featured && (
                        <div className="absolute top-2 left-2 bg-neon-purple text-white px-2 py-1 text-xs font-mono">Featured</div>
                      )}
                    </div>

                    <div className="p-6 flex-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-xl font-orbitron font-bold text-text-primary group-hover:text-neon-blue transition-colors">
                          {entry.title}
                        </h3>
                        <span className="shrink-0 text-xs font-mono text-text-secondary border border-text-secondary/30 px-2 py-0.5">
                          {year || entry.type}
                        </span>
                      </div>
                      <p className="text-text-secondary text-sm mb-4 font-mono leading-relaxed">{entry.summary}</p>
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.slice(0, 5).map((tag) => (
                          <span key={tag} className="text-xs font-mono px-2 py-1 bg-bg-secondary text-neon-purple rounded-sm">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-text-secondary/10">
                    <div className="flex items-center gap-4">
                      {links.map((l) => {
                        const Icon = iconForLink(l);
                        return (
                          <a
                            key={l.url + l.label}
                            href={safeUrl(l.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm font-mono text-text-secondary hover:text-neon-blue transition-colors"
                          >
                            <Icon size={16} /> {l.label || 'Link'}
                          </a>
                        );
                      })}
                    </div>
                    <button onClick={() => setOpen(entry)} className="text-sm font-mono text-neon-blue hover:underline">
                      Details
                    </button>
                  </div>
                </motion.article>
              );
            })}
        </AnimatePresence>
      </motion.div>

      {open && <EntryModal entry={open} onClose={() => setOpen(null)} />}
    </div>
  );
}