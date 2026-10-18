
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Star, Layers } from 'lucide-react';
import { useSiteData } from '../context/DataContext';
import { splitName, splitParagraphs } from '../lib/helpers';

const TILE_ICONS = [Layers, MapPin, Briefcase, Star];

export function About() {
  const { profile } = useSiteData();
  const { first } = splitName(profile.name);
  const paragraphs = splitParagraphs(profile.bio);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 flex items-center justify-center">
      <div className="relative w-full bg-bg-card border border-neon-indigo/30 p-8 md:p-12 overflow-hidden">
        <div className="absolute inset-0 bg-blueprint opacity-10 pointer-events-none" />
        <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-neon-blue/50 rounded-tl-3xl" />
        <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-neon-blue/50 rounded-br-3xl" />

        <div className="absolute top-10 right-10 opacity-10 hidden md:block text-text-primary">
          <svg width="100" height="100" viewBox="0 0 100 100" className="animate-spin-slow" aria-hidden="true">
            <circle cx="50" cy="50" r="45" stroke="currentColor" fill="none" strokeWidth="1" />
            <path d="M50 5 L55 45 L95 50 L55 55 L50 95 L45 55 L5 50 L45 45 Z" fill="currentColor" />
          </svg>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-orbitron font-bold text-text-primary mb-2">
              ABOUT <span className="text-neon-blue">{first.toUpperCase()}</span>
            </h2>
            {profile.aboutTitle && (
              <h3 className="text-xl font-cinzel text-neon-purple mb-6">{profile.aboutTitle}</h3>
            )}
            <div className="space-y-4 text-text-secondary font-mono leading-relaxed">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          {profile.highlights.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {profile.highlights.slice(0, 4).map((h, i) => {
                const Icon = TILE_ICONS[i % TILE_ICONS.length];
                return (
                  <motion.div
                    key={`${h.label}-${i}`}
                    whileHover={{ scale: 1.05 }}
                    className="aspect-square flex flex-col items-center justify-center p-4 border border-text-secondary/20 hover:border-neon-indigo transition-colors bg-bg-secondary/50 text-center"
                  >
                    <Icon className="text-neon-indigo mb-2" size={24} />
                    <div className="font-orbitron font-bold text-xl text-text-primary break-words max-w-full">
                      {h.value}
                    </div>
                    <div className="font-cinzel text-xs text-text-secondary mt-1">{h.label}</div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
