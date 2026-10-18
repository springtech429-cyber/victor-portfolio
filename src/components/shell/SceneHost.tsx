'use client';
import { StudioBackdrop } from './StudioBackdrop';

/**
 * Page background: a soft neon glow (always present, also the whole background when JavaScript is off)
 * with the speech video and the scroll-driven TV studio on top of it.
 */
export function SceneHost() {
  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(60% 50% at 78% 18%, rgba(0,217,255,0.14), transparent 70%), radial-gradient(55% 45% at 12% 82%, rgba(47,107,255,0.16), transparent 70%)',
        }}
      />
      <StudioBackdrop />
    </>
  );
}
