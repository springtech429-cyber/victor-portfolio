import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Project } from '../lib/types';
import { safeUrl, splitParagraphs } from '../lib/helpers';
import { iconForLink } from '../lib/linkIcon';

export function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const images = [project.coverImage, ...project.gallery].filter(Boolean);
  const [active, setActive] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const links = project.links.filter((l) => safeUrl(l.url));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const meta = [project.category, project.client && `For ${project.client}`, project.year].filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
    >
      <div
        className="relative w-full max-w-3xl my-8 bg-bg-card border border-neon-blue/40 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 bg-bg-primary/90 border border-text-secondary/30 text-text-primary hover:border-neon-blue hover:text-neon-blue transition-colors"
          aria-label="Close project details"
        >
          <X size={18} />
        </button>

        {images.length > 0 && (
          <div>
            <img src={images[active]} alt={`${project.title} screenshot ${active + 1}`} className="w-full max-h-[60vh] object-cover bg-bg-secondary" />
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto border-b border-text-secondary/10">
                {images.map((src, i) => (
                  <button
                    key={src + i}
                    onClick={() => setActive(i)}
                    aria-label={`Show image ${i + 1}`}
                    aria-current={i === active}
                    className={`shrink-0 w-20 h-14 border-2 ${i === active ? 'border-neon-blue' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3 mb-2 text-sm font-mono text-text-secondary">
            {project.status && (
              <span className="px-2 py-0.5 border border-neon-blue/40 text-neon-blue">{project.status}</span>
            )}
            {meta.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
          <h3 className="text-3xl font-orbitron font-bold text-text-primary mb-4">{project.title}</h3>

          <div className="space-y-4 text-text-secondary font-mono leading-relaxed">
            {splitParagraphs(project.description || project.summary).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {project.tags.map((t) => (
                <span key={t} className="text-xs font-mono px-2 py-1 bg-bg-secondary text-neon-purple rounded-sm">#{t}</span>
              ))}
            </div>
          )}

          {links.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-text-secondary/10">
              {links.map((l) => {
                const Icon = iconForLink(l);
                return (
                  <a
                    key={l.url + l.label}
                    href={safeUrl(l.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 border border-neon-blue text-neon-blue font-mono text-sm hover:bg-neon-blue/10 transition-colors"
                  >
                    <Icon size={16} /> {l.label || 'Open link'}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
