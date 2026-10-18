'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * The page background.
 *
 *  1. Top of the home page: a muted, looping video of someone giving a speech (public/media/speech.mp4).
 *  2. As you scroll, the video fades and the camera moves forward through a TV studio drawn in neon blue:
 *     glass office partitions, ceiling light bars, monitor walls, studio cameras, an ON AIR sign and a news desk.
 *
 * The studio is a single 2D canvas (no three.js, no WebGL, no physics engine). It only redraws while you scroll,
 * so it costs almost nothing when the page is still. If the video file is missing the page simply shows the studio.
 */

const FRAME_SPACING = 1; // distance between glass frames
const TRAVEL = 11.5; // how far the camera travels from top to bottom of a page
const FAR = 9.5; // how far ahead we draw
const NEAR = 0.42; // closer than this is not drawn
const HALF_W = 1; // corridor half width
const HALF_H = 0.56; // corridor half height
const CYAN = '0,217,255';
const BLUE = '47,107,255';

type Pt = { x: number; y: number; s: number };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

export function StudioBackdrop() {
  const pathname = usePathname();
  const home = pathname === '/';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const homeRef = useRef(home);
  const kickRef = useRef<() => void>(() => {});
  const readyRef = useRef(false);
  const [allowVideo, setAllowVideo] = useState(false);

  // Decide once, in the browser, whether this visitor should download the video at all.
  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const slow = nav.connection?.saveData || /(^|-)2g$/.test(nav.connection?.effectiveType || '');
    setAllowVideo(!reduced && !slow);
  }, []);

  useEffect(() => {
    homeRef.current = home;
    kickRef.current();
  }, [home]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const low = window.matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency ?? 8) <= 4;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let camZ = 0;
    let targetZ = 0;
    let px = 0;
    let py = 0;
    let tpx = 0;
    let tpy = 0;
    let raf = 0;
    let videoPlaying = false;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, low ? 1 : 1.5);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    const readScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = clamp(window.scrollY / max);
      targetZ = reduced ? TRAVEL * 0.25 : p * TRAVEL;
    };

    /** Draws everything for the current camera position. */
    const draw = () => {
      const isHome = homeRef.current;
      const heroT = isHome ? smooth(clamp(window.scrollY / (h * 0.95))) : 1;

      // Video: fully visible at the very top of the home page, gone after roughly one screen.
      const wrap = videoWrapRef.current;
      if (wrap) {
        const o = isHome && readyRef.current ? (1 - heroT) : 0;
        wrap.style.opacity = o.toFixed(3);
        const video = videoRef.current;
        if (video) {
          const shouldPlay = o > 0.02 && !document.hidden;
          if (shouldPlay && !videoPlaying) {
            videoPlaying = true;
            video.play().catch(() => {});
          } else if (!shouldPlay && videoPlaying) {
            videoPlaying = false;
            video.pause();
          }
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // The studio is faint over the video and takes over as the video fades.
      const base = isHome ? 0.28 + 0.72 * heroT : 0.55;
      const f = Math.max(w, h * 0.75) * 0.85;
      const cx = w * 0.5 + px * w * 0.03;
      const cy = h * 0.46 + py * h * 0.02;

      const project = (x: number, y: number, z: number): Pt | null => {
        const zr = z - camZ;
        if (zr < NEAR * 0.5) return null;
        const s = f / zr;
        return { x: cx + (x - px * 0.06) * s, y: cy + y * s, s };
      };
      /** Brightness for something at distance `zr`: fades with distance and just before it reaches the camera. */
      const fade = (zr: number) => clamp(1 - zr / FAR) ** 1.3 * smooth(clamp((zr - NEAR) / 0.5)) * base;

      const line = (a: Pt | null, b: Pt | null, alpha: number, width: number, rgb = CYAN) => {
        if (!a || !b || alpha < 0.01) return;
        ctx.strokeStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      };
      const poly = (pts: (Pt | null)[], fill: string, stroke?: string, width = 1) => {
        if (pts.some((p) => !p)) return;
        ctx.beginPath();
        pts.forEach((p, i) => (i ? ctx.lineTo(p!.x, p!.y) : ctx.moveTo(p!.x, p!.y)));
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = width;
          ctx.stroke();
        }
      };

      // Light at the far end of the studio.
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.55);
      g.addColorStop(0, `rgba(${CYAN},${(0.2 * base).toFixed(3)})`);
      g.addColorStop(0.4, `rgba(${BLUE},${(0.1 * base).toFixed(3)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const zStart = Math.floor(camZ);
      const zEnd = camZ + FAR;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Long lines: floor grid, wall rails, ceiling light strips.
      const runs: [number, number, number, number, number, string][] = [
        // x, y, alpha, width, (unused), colour
        [-HALF_W, HALF_H, 0.2, 1, 0, CYAN],
        [-HALF_W / 2, HALF_H, 0.12, 1, 0, CYAN],
        [0, HALF_H, 0.12, 1, 0, CYAN],
        [HALF_W / 2, HALF_H, 0.12, 1, 0, CYAN],
        [HALF_W, HALF_H, 0.2, 1, 0, CYAN],
        [-HALF_W, -HALF_H, 0.2, 1, 0, CYAN],
        [HALF_W, -HALF_H, 0.2, 1, 0, CYAN],
        [-HALF_W, 0.12, 0.14, 1, 0, BLUE],
        [HALF_W, 0.12, 0.14, 1, 0, BLUE],
      ];
      for (const [x, y, a] of runs) {
        const a0 = project(x, y, camZ + NEAR);
        const a1 = project(x, y, zEnd);
        line(a0, a1, a * base, 1);
      }

      // Frames (glass partitions), ceiling light bars, floor lines and wall mullions, far to near.
      for (let z = zStart + Math.ceil(FAR); z >= zStart; z -= FRAME_SPACING) {
        const zr = z - camZ;
        if (zr < NEAR || zr > FAR) continue;
        const a = fade(zr);
        const tl = project(-HALF_W, -HALF_H, z);
        const tr = project(HALF_W, -HALF_H, z);
        const br = project(HALF_W, HALF_H, z);
        const bl = project(-HALF_W, HALF_H, z);
        if (!tl || !tr || !br || !bl) continue;

        // Glass tint on the walls: a very faint blue fill between this frame and the next one.
        const nTl = project(-HALF_W, -HALF_H, z + FRAME_SPACING);
        const nBl = project(-HALF_W, HALF_H, z + FRAME_SPACING);
        const nTr = project(HALF_W, -HALF_H, z + FRAME_SPACING);
        const nBr = project(HALF_W, HALF_H, z + FRAME_SPACING);
        poly([tl, nTl, nBl, bl], `rgba(${BLUE},${(0.035 * a).toFixed(3)})`);
        poly([tr, nTr, nBr, br], `rgba(${BLUE},${(0.035 * a).toFixed(3)})`);

        // Frame glow and edge.
        ctx.beginPath();
        ctx.moveTo(tl.x, tl.y);
        ctx.lineTo(tr.x, tr.y);
        ctx.lineTo(br.x, br.y);
        ctx.lineTo(bl.x, bl.y);
        ctx.closePath();
        if (!low) {
          ctx.strokeStyle = `rgba(${CYAN},${(a * 0.1).toFixed(3)})`;
          ctx.lineWidth = 7;
          ctx.stroke();
        }
        ctx.strokeStyle = `rgba(${CYAN},${(a * 0.7).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Mullions halfway between frames, and floor cross lines.
        const mz = z + FRAME_SPACING / 2;
        line(project(-HALF_W, -HALF_H, mz), project(-HALF_W, HALF_H, mz), a * 0.22, 1);
        line(project(HALF_W, -HALF_H, mz), project(HALF_W, HALF_H, mz), a * 0.22, 1);
        line(project(-HALF_W, HALF_H, mz), project(HALF_W, HALF_H, mz), a * 0.14, 1);

        // Ceiling light bars (office panels): two per bay.
        for (const x of [-0.42, 0.42]) {
          const l0 = project(x, -HALF_H, z + 0.18);
          const l1 = project(x, -HALF_H, z + 0.82);
          line(l0, l1, a * 0.9, Math.max(1.5, (l0?.s ?? 1) * 0.012));
        }
      }

      // Props, far to near.
      drawProps({ ctx, project, fade, line, poly, camZ, base });

      // Pull everything toward black at the edges so text always reads.
      const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.8);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, w, h);
    };

    const tick = () => {
      raf = 0;
      readScroll();
      const dz = targetZ - camZ;
      const dx = tpx - px;
      const dy = tpy - py;
      camZ += dz * 0.12;
      px += dx * 0.08;
      py += dy * 0.08;
      draw();
      if (Math.abs(dz) > 0.0008 || Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    kickRef.current = kick;

    const onResize = () => {
      resize();
      kick();
    };
    const onPointer = (e: PointerEvent) => {
      if (reduced || low || e.pointerType === 'touch') return;
      tpx = (e.clientX / window.innerWidth - 0.5) * 2;
      tpy = (e.clientY / window.innerHeight - 0.5) * 2;
      kick();
    };

    resize();
    readScroll();
    camZ = targetZ;
    draw();
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('visibilitychange', kick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', kick);
      kickRef.current = () => {};
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Speech video. Hidden until the file has actually loaded, so a missing file leaves no broken box. */}
      <div ref={videoWrapRef} className="absolute inset-0 opacity-0 transition-opacity duration-300">
        {allowVideo && (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            disablePictureInPicture
            tabIndex={-1}
            onLoadedData={() => {
              readyRef.current = true;
              kickRef.current();
            }}
          >
            <source src="/media/speech.webm" type="video/webm" />
            <source src="/media/speech.mp4" type="video/mp4" />
          </video>
        )}
        {/* Neon-blue grade so any footage matches the site, plus darker edges behind the headline. */}
        <div className="absolute inset-0 bg-[#00152e]/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
      </div>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Studio props. Each sits at a fixed distance along the corridor; the camera flies past them.       */
/* ------------------------------------------------------------------------------------------------ */

interface PropCtx {
  ctx: CanvasRenderingContext2D;
  project: (x: number, y: number, z: number) => Pt | null;
  fade: (zr: number) => number;
  line: (a: Pt | null, b: Pt | null, alpha: number, width: number, rgb?: string) => void;
  poly: (pts: (Pt | null)[], fill: string, stroke?: string, width?: number) => void;
  camZ: number;
  base: number;
}

type Prop =
  | { kind: 'monitors'; z: number; side: -1 | 1 }
  | { kind: 'camera'; z: number; x: number }
  | { kind: 'rig'; z: number }
  | { kind: 'onair'; z: number }
  | { kind: 'desk'; z: number };

const PROPS: Prop[] = [
  { kind: 'monitors', z: 2.1, side: -1 },
  { kind: 'camera', z: 3.6, x: 0.55 },
  { kind: 'rig', z: 4.5 },
  { kind: 'onair', z: 6.2 },
  { kind: 'monitors', z: 7.1, side: 1 },
  { kind: 'camera', z: 8.4, x: -0.5 },
  { kind: 'rig', z: 9.4 },
  { kind: 'desk', z: 11.6 },
];

function drawProps(c: PropCtx) {
  const sorted = [...PROPS].sort((a, b) => b.z - a.z);
  for (const p of sorted) {
    const zr = p.z - c.camZ;
    if (zr < NEAR || zr > FAR + 1) continue;
    const a = c.fade(zr);
    if (a < 0.01) continue;
    if (p.kind === 'monitors') monitors(c, p.z, p.side, a);
    else if (p.kind === 'camera') studioCamera(c, p.z, p.x, a);
    else if (p.kind === 'rig') lightRig(c, p.z, a);
    else if (p.kind === 'onair') onAir(c, p.z, a);
    else desk(c, p.z, a);
  }
}

/** A wall of six screens set into the glass wall. One of them shows a speaker. */
function monitors(c: PropCtx, z: number, side: -1 | 1, a: number) {
  const x = HALF_W * side;
  const cols = 3;
  const rows = 2;
  const zw = 0.26;
  const gap = 0.04;
  const yh = 0.24;
  const y0 = -0.34;
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const za = z + k * (zw + gap);
      const zb = za + zw;
      const ya = y0 + r * (yh + gap);
      const yb = ya + yh;
      const pts = [c.project(x, ya, za), c.project(x, ya, zb), c.project(x, yb, zb), c.project(x, yb, za)];
      const tone = (r * cols + k) % 3;
      const fill = tone === 0 ? `rgba(${CYAN},${0.2 * a})` : tone === 1 ? `rgba(${BLUE},${0.26 * a})` : `rgba(0,60,120,${0.4 * a})`;
      c.poly(pts, fill, `rgba(${CYAN},${0.75 * a})`, 1.2);
      // The first screen shows a silhouette of a person at a lectern.
      if (r === 0 && k === 0 && pts.every(Boolean)) {
        const mx = (pts[0]!.x + pts[1]!.x + pts[2]!.x + pts[3]!.x) / 4;
        const my = (pts[0]!.y + pts[1]!.y + pts[2]!.y + pts[3]!.y) / 4;
        const sz = Math.abs(pts[3]!.y - pts[0]!.y) * 0.34;
        c.ctx.fillStyle = `rgba(${CYAN},${0.7 * a})`;
        c.ctx.beginPath();
        c.ctx.arc(mx, my - sz * 0.45, sz * 0.34, 0, Math.PI * 2);
        c.ctx.fill();
        c.ctx.beginPath();
        c.ctx.ellipse(mx, my + sz * 0.62, sz * 0.78, sz * 0.5, 0, Math.PI, 0);
        c.ctx.fill();
      }
    }
  }
}

/** A studio camera on a tripod, standing on the floor. Drawn flat, facing the viewer. */
function studioCamera(c: PropCtx, z: number, x: number, a: number) {
  const base = c.project(x, HALF_H, z);
  if (!base) return;
  const u = base.s; // pixels per world unit at this depth
  const ctx = c.ctx;
  const bodyW = 0.3 * u;
  const bodyH = 0.17 * u;
  const topY = base.y - 0.5 * u;
  ctx.strokeStyle = `rgba(${CYAN},${0.8 * a})`;
  ctx.fillStyle = `rgba(0,12,28,${0.85 * a})`;
  ctx.lineWidth = Math.max(1, u * 0.008);
  // Tripod legs.
  for (const dx of [-0.2, 0, 0.2]) {
    ctx.beginPath();
    ctx.moveTo(base.x, topY + bodyH);
    ctx.lineTo(base.x + dx * u, base.y);
    ctx.stroke();
  }
  // Body, lens hood and viewfinder.
  ctx.beginPath();
  ctx.rect(base.x - bodyW / 2, topY, bodyW, bodyH);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.rect(base.x - bodyW * 0.18, topY - bodyH * 0.5, bodyW * 0.36, bodyH * 0.5);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(base.x, topY + bodyH / 2, bodyH * 0.36, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${CYAN},${0.35 * a})`;
  ctx.fill();
  ctx.stroke();
}

/** A ceiling truss with spotlights and faint light cones. */
function lightRig(c: PropCtx, z: number, a: number) {
  const y = -HALF_H * 0.9;
  const l = c.project(-HALF_W, y, z);
  const r = c.project(HALF_W, y, z);
  c.line(l, r, a * 0.9, 2);
  const lines = [-0.7, -0.35, 0, 0.35, 0.7];
  for (const x of lines) {
    const top = c.project(x, y, z);
    const can = c.project(x, y + 0.1, z);
    const floorL = c.project(x - 0.16, HALF_H, z + 0.2);
    const floorR = c.project(x + 0.16, HALF_H, z + 0.2);
    if (!top || !can || !floorL || !floorR) continue;
    c.poly([can, floorL, floorR], `rgba(${CYAN},${0.045 * a})`);
    c.line(top, can, a * 0.8, 1.2);
    c.ctx.fillStyle = `rgba(${CYAN},${0.95 * a})`;
    c.ctx.beginPath();
    c.ctx.arc(can.x, can.y, Math.max(1.5, can.s * 0.018), 0, Math.PI * 2);
    c.ctx.fill();
  }
}

/** An ON AIR sign hanging in the middle of the corridor. */
function onAir(c: PropCtx, z: number, a: number) {
  const tl = c.project(-0.22, -0.5, z);
  const br = c.project(0.22, -0.36, z);
  if (!tl || !br) return;
  const ctx = c.ctx;
  const w = br.x - tl.x;
  const h = br.y - tl.y;
  ctx.fillStyle = `rgba(0,12,28,${0.8 * a})`;
  ctx.strokeStyle = `rgba(${CYAN},${a})`;
  ctx.lineWidth = Math.max(1.2, w * 0.012);
  ctx.beginPath();
  ctx.roundRect?.(tl.x, tl.y, w, h, h * 0.18);
  if (!ctx.roundRect) ctx.rect(tl.x, tl.y, w, h);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(${CYAN},${a})`;
  ctx.font = `700 ${Math.max(6, h * 0.5)}px ui-monospace, Menlo, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ON AIR', tl.x + w / 2, tl.y + h / 2 + h * 0.03);
  c.line(c.project(-0.12, -HALF_H, z), c.project(-0.12, -0.5, z), a * 0.6, 1);
  c.line(c.project(0.12, -HALF_H, z), c.project(0.12, -0.5, z), a * 0.6, 1);
}

/** The news desk at the end of the studio, with a screen behind it. */
function desk(c: PropCtx, z: number, a: number) {
  const screen = [c.project(-0.5, -0.38, z + 0.5), c.project(0.5, -0.38, z + 0.5), c.project(0.5, 0.1, z + 0.5), c.project(-0.5, 0.1, z + 0.5)];
  c.poly(screen, `rgba(${BLUE},${0.22 * a})`, `rgba(${CYAN},${0.9 * a})`, 1.5);
  const front = [c.project(-0.42, 0.28, z), c.project(0.42, 0.28, z), c.project(0.42, HALF_H, z), c.project(-0.42, HALF_H, z)];
  c.poly(front, `rgba(0,14,32,${0.9 * a})`, `rgba(${CYAN},${a})`, 1.6);
  c.line(c.project(-0.42, 0.28, z), c.project(0.42, 0.28, z), a, 2.5);
}
