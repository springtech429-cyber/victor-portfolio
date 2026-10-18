export type Tier = 'off' | 'low' | 'high';

/** Decide how much 3D this device should get. Runs in the browser only. */
export function detectTier(): Tier {
  if (typeof window === 'undefined') return 'off';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'off';
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return 'off';
  try {
    const c = document.createElement('canvas');
    if (!(c.getContext('webgl2') || c.getContext('webgl'))) return 'off';
  } catch {
    return 'off';
  }
  const coarse = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
  const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  return coarse || weak ? 'low' : 'high';
}
