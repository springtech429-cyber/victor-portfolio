'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTransitionNav } from '../shell/Transition';

export interface GalleryItem {
  title: string;
  href: string;
  image: string;
  label: string;
}

const RADIUS = 5.2;
const W = 3.4;
const H = 2.3;

const vertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const fragment = /* glsl */ `
uniform sampler2D uMap; uniform float uTime; uniform float uHover; uniform float uDim;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  // Hover: a travelling ripple and a split of the colour channels.
  float wave = sin(uv.y * 14.0 + uTime * 3.0) * 0.012 * uHover;
  uv.x += wave;
  float split = 0.012 * uHover;
  vec3 c = vec3(texture2D(uMap, uv + vec2(split, 0.0)).r, texture2D(uMap, uv).g, texture2D(uMap, uv - vec2(split, 0.0)).b);
  float e = min(min(vUv.x, 1.0 - vUv.x) * 1.48, min(vUv.y, 1.0 - vUv.y));
  float edge = smoothstep(0.0, 0.012, e);
  c = mix(c * 0.28, c, uDim);
  c += vec3(0.0, 0.1, 0.14) * uHover;
  gl_FragColor = vec4(c * edge + (1.0 - edge) * vec3(0.1, 0.9, 1.0), 1.0);
  #include <colorspace_fragment>
}`;

function fallbackTexture(title: string, i: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 680;
  c.height = 460;
  const g = c.getContext('2d')!;
  const hue = [192, 205, 218][i % 3];
  const grad = g.createLinearGradient(0, 0, 680, 460);
  grad.addColorStop(0, `hsl(${hue} 80% 14%)`);
  grad.addColorStop(1, '#05050f');
  g.fillStyle = grad;
  g.fillRect(0, 0, 680, 460);
  g.strokeStyle = `hsl(${hue} 100% 60% / .25)`;
  for (let x = 0; x < 680; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 460); g.stroke(); }
  for (let y = 0; y < 460; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(680, y); g.stroke(); }
  g.fillStyle = `hsl(${hue} 100% 65%)`;
  g.font = '700 220px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(title.charAt(0).toUpperCase(), 340, 240);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function useTextures(items: GalleryItem[]): THREE.Texture[] {
  const [textures, setTextures] = useState<THREE.Texture[]>([]);
  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const base = items.map((it, i) => fallbackTexture(it.title, i));
    setTextures(base);
    items.forEach((it, i) => {
      if (!it.image) return;
      loader.load(
        it.image,
        (tex) => {
          if (cancelled) return tex.dispose();
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 4;
          setTextures((prev) => prev.map((t, k) => (k === i ? tex : t)));
        },
        undefined,
        () => {
          /* keep the generated fallback if the picture cannot be used as a texture */
        }
      );
    });
    return () => {
      cancelled = true;
    };
  }, [items]);
  return textures;
}

function Card({ item, texture, angle, index, active, onOpen }: { item: GalleryItem; texture: THREE.Texture; angle: number; index: number; active: boolean; onOpen: () => void }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const hover = useRef(0);
  const [hovered, setHovered] = useState(false);
  const uniforms = useMemo(() => ({ uMap: { value: texture }, uTime: { value: 0 }, uHover: { value: 0 }, uDim: { value: 1 } }), []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state, dt) => {
    if (!mat.current || !mesh.current) return;
    mat.current.uniforms.uMap.value = texture;
    mat.current.uniforms.uTime.value = state.clock.elapsedTime;
    hover.current = THREE.MathUtils.damp(hover.current, hovered ? 1 : 0, 8, dt);
    mat.current.uniforms.uHover.value = hover.current;
    mat.current.uniforms.uDim.value = THREE.MathUtils.damp(mat.current.uniforms.uDim.value, active ? 1 : 0.35, 6, dt);
    mesh.current.scale.setScalar(1 + hover.current * 0.06);
  });

  return (
    <group position={[Math.sin(angle) * RADIUS, Math.sin(index * 1.7) * 0.18, Math.cos(angle) * RADIUS]} rotation={[0, angle, 0]}>
      <mesh
        ref={mesh}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = ''; }}
        onClick={(e) => { e.stopPropagation(); onOpen(); }}
      >
        <planeGeometry args={[W, H, 1, 1]} />
        <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Ring({ items, progress, onActive }: { items: GalleryItem[]; progress: React.RefObject<number>; onActive: (i: number) => void }) {
  const group = useRef<THREE.Group>(null);
  const textures = useTextures(items);
  const { go } = useTransitionNav();
  const [active, setActive] = useState(0);
  const n = items.length;
  const step = (Math.PI * 2) / n;

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const p = progress.current ?? 0;
    // Scrolling through the section turns the ring by one card per step; a slow drift keeps it alive.
    // Ease between cards so each one rests in the centre for a while before the next swings in.
    const x = p * (n - 1);
    const i = Math.min(n - 1, Math.floor(x));
    const f = x - i;
    const eased = i + THREE.MathUtils.smoothstep(f, 0.3, 0.7);
    const target = -eased * step + Math.sin(state.clock.elapsedTime * 0.4) * 0.03;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, target, 4, dt);
    const idx = THREE.MathUtils.clamp(Math.round(-g.rotation.y / step), 0, n - 1);
    if (idx !== active) {
      setActive(idx);
      onActive(idx);
    }
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, state.pointer.x * 0.5, 3, dt);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, state.pointer.y * 0.3, 3, dt);
    state.camera.lookAt(0, 0, RADIUS * 0.3);
  });

  if (textures.length !== n) return null;
  return (
    <group ref={group} position={[0, 0, -RADIUS + 1.2]}>
      {items.map((it, i) => (
        <Card key={it.href} item={it} texture={textures[i]} angle={i * step} index={i} active={i === active} onOpen={() => go(it.href)} />
      ))}
    </group>
  );
}

export default function Gallery3D({ items, progress, onActive, active = true }: { items: GalleryItem[]; progress: React.RefObject<number>; onActive: (i: number) => void; active?: boolean }) {
  return (
    <Canvas frameloop={active ? 'always' : 'never'} dpr={[1, 1.5]} camera={{ position: [0, 0, 6.2], fov: 42 }} gl={{ antialias: true, alpha: true }} aria-hidden="true">
      <Ring items={items} progress={progress} onActive={onActive} />
    </Canvas>
  );
}
