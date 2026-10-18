
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Projects } from '../components/Projects';
import { Skills } from '../components/Skills';
import { About } from '../components/About';
import { Contact } from '../components/Contact';
import { useHashRoute } from '../lib/useHashRoute';
import { useSiteData } from '../context/DataContext';

const SECTIONS = ['hero', 'projects', 'skills', 'about', 'contact'];

export function LandingPage() {
  const hash = useHashRoute();
  const { profile } = useSiteData();
  // #/projects, #/skills ... so any section can be shared as a direct link.
  const fromHash = hash.replace(/^#\/?/, '');
  const activeSection = SECTIONS.includes(fromHash) ? fromHash : 'hero';

  const setActiveSection = (id: string) => {
    window.location.hash = id === 'hero' ? '/' : `/${id}`;
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'projects':
        return <Projects />;
      case 'skills':
        return <Skills />;
      case 'about':
        return <About />;
      case 'contact':
        return <Contact />;
      default:
        return <Hero setActiveSection={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-hidden flex flex-col">
      <div className="scanline" />

      <Navbar activeSection={activeSection} setActiveSection={setActiveSection} />

      <main className="flex-1 relative pt-20 perspective-1000">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ rotateY: -90, opacity: 0, x: -100 }}
            animate={{ rotateY: 0, opacity: 1, x: 0 }}
            exit={{ rotateY: 90, opacity: 0, x: 100 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="w-full h-full origin-left"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center">
              {renderSection()}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="hidden sm:block fixed bottom-4 left-4 text-xs font-mono text-text-secondary opacity-60 pointer-events-none">
        © {new Date().getFullYear()} {profile.name}
        {profile.location ? ` · ${profile.location}` : ''}
      </div>
    </div>
  );
}
