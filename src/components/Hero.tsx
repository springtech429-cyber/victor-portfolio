"use client" ;
import { motion } from 'framer-motion';
import { ArrowRight, Download, MapPin } from 'lucide-react';
import { useSiteData } from '../context/DataContext';
import { initials, safeUrl, splitName } from '../lib/helpers';
import { iconForLink } from '../lib/linkIcon';

interface HeroProps {
  setActiveSection: (section: string) => void;
}

export function Hero({ setActiveSection }: HeroProps) {
  const { profile } = useSiteData();
  const { first, rest } = splitName(profile.name);
  const links = profile.links.filter((l) => safeUrl(l.url));
  const cv = safeUrl(profile.resumeUrl);

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-blueprint opacity-20 pointer-events-none" />

      <motion.div
        className="absolute top-20 right-20 w-64 h-64 border border-neon-blue/20 rounded-full hidden md:block"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute inset-4 border border-neon-purple/20 rounded-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-[1px] bg-neon-blue/20" />
          <div className="h-full w-[1px] bg-neon-blue/20 absolute" />
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 text-center md:text-left">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 border border-neon-blue/50 rounded-sm bg-neon-blue/5 text-neon-blue font-mono text-sm tracking-wide">
              <span
                className={`w-2 h-2 rounded-full ${profile.available ? 'bg-green-400' : 'bg-text-secondary'}`}
                aria-hidden="true"
              />
              {profile.statusText || (profile.available ? 'Available for projects' : 'Currently booked')}
            </div>

            <h1 className="text-5xl md:text-7xl font-orbitron font-black text-text-primary mb-2 tracking-tight">
              <span className="glitch-wrapper" data-text={first.toUpperCase()}>
                {first.toUpperCase()}
              </span>{' '}
              {rest && (
                <span
                  className="glitch-wrapper text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple animate-pulse-glow"
                  data-text={rest.toUpperCase()}
                >
                  {rest.toUpperCase()}
                </span>
              )}
            </h1>

            <h2 className="text-xl md:text-3xl font-cinzel text-text-secondary mb-6 flex items-center justify-center md:justify-start gap-3">
              <span className="h-[1px] w-8 bg-neon-purple/50 shrink-0"></span>
              {profile.role}
            </h2>

            <p className="text-text-secondary font-mono text-lg mb-8 max-w-xl leading-relaxed">{profile.tagline}</p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <button
                onClick={() => setActiveSection('projects')}
                className="group relative px-8 py-3 bg-neon-indigo/10 border border-neon-indigo text-neon-indigo font-orbitron font-bold tracking-wider overflow-hidden hover:bg-neon-indigo/20 transition-all"
              >
                <span className="relative z-10 flex items-center gap-2">
                  VIEW WORK
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-neon-indigo/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>

              <button
                onClick={() => setActiveSection('contact')}
                className="px-8 py-3 border border-text-secondary/30 text-text-secondary font-mono hover:border-neon-purple hover:text-neon-purple transition-colors"
              >
                CONTACT ME
              </button>

              {cv && (
                <a
                  href={cv}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 text-text-secondary font-mono hover:text-neon-blue transition-colors flex items-center gap-2"
                >
                  <Download size={18} /> CV
                </a>
              )}
            </div>

            {links.length > 0 && (
              <div className="mt-12 flex items-center gap-6 justify-center md:justify-start text-text-secondary">
                {links.map((link) => {
                  const Icon = iconForLink(link);
                  return (
                    <a
                      key={link.url + link.label}
                      href={safeUrl(link.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.label || link.url}
                      title={link.label}
                      className="hover:text-neon-blue transition-colors hover:scale-110 transform duration-200"
                    >
                      <Icon size={24} />
                    </a>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        <motion.div
          className="flex-1 relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="relative w-64 h-64 md:w-96 md:h-96 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 rounded-lg transform rotate-6 border border-neon-blue/30 backdrop-blur-sm z-0" />
            <div className="absolute inset-0 bg-bg-card border border-neon-purple/50 rounded-lg shadow-2xl z-10 overflow-hidden flex items-center justify-center davinci-corners">
              <div className="absolute inset-0 bg-blueprint opacity-30" />
              <div className="text-center p-8 relative">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full border-2 border-neon-blue p-1 relative">
                  <div className="absolute inset-0 rounded-full border border-dashed border-neon-purple animate-spin-slow" />
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-bg-secondary flex items-center justify-center font-orbitron font-bold text-3xl text-neon-blue">
                      {initials(profile.name)}
                    </div>
                  )}
                </div>
                <div className="font-cinzel font-bold text-xl text-text-primary">{profile.name}</div>
                {profile.location && (
                  <div className="font-mono text-sm text-text-secondary mt-2 flex items-center justify-center gap-1">
                    <MapPin size={14} /> {profile.location}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
