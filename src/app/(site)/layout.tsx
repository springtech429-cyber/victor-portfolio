import { SceneHost } from '@/components/shell/SceneHost';
import { Cursor } from '@/components/shell/Cursor';
import { SmoothScroll } from '@/components/shell/SmoothScroll';
import { TransitionProvider } from '@/components/shell/Transition';
import { Nav } from '@/components/shell/Nav';
import { Footer } from '@/components/shell/Footer';
import { getProfile } from '@/lib/data';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  return (
    <div className="relative">
      <SceneHost />
      <Cursor />
      <SmoothScroll />
      <TransitionProvider>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-neon-blue focus:px-4 focus:py-2 focus:text-bg-primary">
          Skip to content
        </a>
        <Nav name={profile.name} resumeUrl={profile.resumeUrl} />
        <main id="main" className="relative z-10 min-h-screen">
          {children}
        </main>
        <Footer profile={profile} />
      </TransitionProvider>
    </div>
  );
}
