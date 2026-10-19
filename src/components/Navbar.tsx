"use client" ;
import { useTheme } from '../context/ThemeContext';
import { useSiteData } from '../context/DataContext';
import { splitName } from '../lib/helpers';
import { Sun, Moon, Terminal, Code2, User, Mail, Cpu, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavbarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const navItems = [
  { id: 'hero', label: 'Home', icon: Terminal },
  { id: 'projects', label: 'Projects', icon: Code2 },
  { id: 'skills', label: 'Skills', icon: Cpu },
  { id: 'about', label: 'About', icon: User },
  { id: 'contact', label: 'Contact', icon: Mail },
];

export function Navbar({ activeSection, setActiveSection }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { profile, isAdmin } = useSiteData();
  const { first, rest } = splitName(profile.name);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-bg-primary/80 backdrop-blur-md border-b border-neon-indigo/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
          onClick={() => setActiveSection('hero')}
          aria-label={`${profile.name} home`}
        >
          <div className="w-8 h-8 border border-neon-blue flex items-center justify-center rounded-sm bg-neon-blue/10">
            <span className="font-orbitron font-bold text-neon-blue">{first.charAt(0).toUpperCase()}</span>
          </div>
          <span className="font-orbitron font-bold text-lg tracking-wider text-text-primary hidden sm:block">
            {first.toUpperCase()}
            {rest && <span className="text-neon-purple">.{rest.toUpperCase().replace(/\s+/g, '')}</span>}
          </span>
        </motion.button>

        <div className="flex items-center gap-1 sm:gap-4">
          <div className="flex items-center bg-bg-secondary/50 rounded-full px-2 py-1 border border-neon-indigo/20">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`relative px-3 py-2 rounded-full transition-all duration-300 flex items-center gap-2 ${isActive ? 'text-neon-blue' : 'text-text-secondary hover:text-text-primary'}`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-neon-blue/10 rounded-full border border-neon-blue/30"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon size={16} />
                  <span className="hidden md:block text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Only appears for you, once you are signed in. Visitors never see it. */}
          {isAdmin && (
            <a
              href="#/admin"
              className="p-2 rounded-full bg-bg-secondary border border-neon-blue/40 text-neon-blue hover:bg-neon-blue/10 transition-colors"
              aria-label="Open admin dashboard"
              title="Admin dashboard"
            >
              <LayoutDashboard size={18} />
            </a>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-bg-secondary border border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
