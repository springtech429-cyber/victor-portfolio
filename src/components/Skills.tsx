
import { motion } from 'framer-motion';
import { Layout, Server, Settings, Layers } from 'lucide-react';
import { useSiteData } from '../context/DataContext';
import { ACCENT } from '../lib/helpers';

const GROUP_ICONS = [Layout, Server, Settings, Layers];

export function Skills() {
  const { profile } = useSiteData();
  const groups = profile.skillGroups.filter((g) => g.title || g.skills.length);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-orbitron font-bold text-text-primary mb-4">
          SKILLS &amp; <span className="text-neon-purple">SERVICES</span>
        </h2>
        <p className="text-text-secondary font-mono max-w-2xl mx-auto">
          What I can do for you, and the tools I use to do it.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        {groups.map((group, index) => {
          const Icon = GROUP_ICONS[index % GROUP_ICONS.length];
          const a = ACCENT[group.color];
          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              className={`relative p-6 bg-bg-card border ${a.borderSoft} ${a.hoverBorder} transition-colors duration-300`}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-4 bg-gradient-to-b from-transparent to-text-secondary/30" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-4 bg-gradient-to-t from-transparent to-text-secondary/30" />

              <div className="flex flex-col items-center text-center mb-6">
                <div className={`p-3 rounded-full bg-bg-secondary mb-4 ${a.text} ring-1 ring-inset ring-white/10`}>
                  <Icon size={32} />
                </div>
                <h3 className="font-cinzel font-bold text-xl text-text-primary">{group.title}</h3>
              </div>

              <ul className="flex flex-wrap justify-center gap-2">
                {group.skills.map((skill) => (
                  <li
                    key={skill}
                    className={`text-sm font-mono px-3 py-1 border ${a.borderSoft} text-text-secondary bg-bg-secondary/60`}
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
