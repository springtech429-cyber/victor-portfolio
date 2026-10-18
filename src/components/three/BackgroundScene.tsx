'use client';
import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { Tier } from '@/lib/quality';
import { FIELD_FRAG, FIELD_VERT, ORB_FRAG, ORB_VERT, PARTICLE_FRAG, PARTICLE_VERT } from '@/lib/shaders';

// Rapier's WebAssembly is only fetched when the physics playground is actually shown.
const Playground = lazy(() => import('./Playground'));

type Mode = 'hero' | 'ambient';
const damp = THREE.MathUtils.damp;

function scrollState() {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  return { y: window.scrollY, progress: Math.min(1, window.scrollY / max), vh: window.innerHeight };
}

/** Shared between shaders: how fast the page is scrolling (smoothed). */
const motion = { vel: 0, lastY: 0 };
function useMotion() {
  useFrame((_, dt) => {
    const y = window.scrollY;
    motion.vel = damp(motion.vel, Math.min(60, Math.abs(y - motion.lastY)), 6, dt);
    motion.lastY = y;
  });
}

/** Custom shader: slow neon flow lines across the whole screen, bending around the pointer. */
function SignalField() {
  const size = useThree((s) => s.size);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uMouse: { value: new THREE.Vector2(0.5, 0.5) }, uScroll: { value: 0 }, uAspect: { value: 1 }, uVel: { value: 0 } }), []);
  useFrame((state, dt) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uAspect.value = size.width / size.height;
    uniforms.uMouse.value.x = damp(uniforms.uMouse.value.x, state.pointer.x * 0.5 + 0.5, 4, dt);
    uniforms.uMouse.value.y = damp(uniforms.uMouse.value.y, state.pointer.y * 0.5 + 0.5, 4, dt);
    uniforms.uScroll.value = scrollState().progress;
    uniforms.uVel.value = motion.vel;
  });
  return (
    <mesh frustumCulled={false} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial vertexShader={FIELD_VERT} fragmentShader={FIELD_FRAG} uniforms={uniforms} depthWrite={false} depthTest={false} />
    </mesh>
  );
}

function Orb({ mode }: { mode: Mode }) {
  const group = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uVel: { value: 0 }, uAmp: { value: 0.32 } }), []);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const s = scrollState();
    const wide = state.size.width > 900;
    const fade = Math.min(1, s.y / s.vh);
    const target =
      mode === 'hero'
        ? { x: wide ? 2.9 : 0, y: (wide ? 0.1 : 1.3) + fade * 3.2, z: -fade * 3, k: (wide ? 1 : 0.62) * (1 - fade * 0.55) }
        : { x: wide ? 4.8 : 1.8, y: -0.6 + s.progress * 1.5, z: -7, k: wide ? 0.75 : 0.5 };
    g.position.x = damp(g.position.x, target.x, 2.5, dt);
    g.position.y = damp(g.position.y, target.y, 2.5, dt);
    g.position.z = damp(g.position.z, target.z, 2.5, dt);
    g.scale.setScalar(damp(g.scale.x, target.k, 2.5, dt));
    g.rotation.y += dt * 0.16 + motion.vel * 0.0015;
    g.rotation.x = damp(g.rotation.x, state.pointer.y * -0.3, 3, dt);
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uVel.value = motion.vel * 0.02;
    rings.current?.children.forEach((r, i) => {
      r.rotation.x += dt * (0.25 + i * 0.12) * (i % 2 ? -1 : 1);
      r.rotation.y += dt * (0.18 + i * 0.1);
    });
  });

  return (
    <group ref={group} position={[2.9, 0.1, 0]}>
      <mesh>
        <icosahedronGeometry args={[1.25, 48]} />
        <shaderMaterial vertexShader={ORB_VERT} fragmentShader={ORB_FRAG} uniforms={uniforms} toneMapped={false} />
      </mesh>
      <group ref={rings}>
        {[2.1, 2.55, 3.05].map((r, i) => (
          <mesh key={r} rotation={[Math.PI / 2 + i * 0.5, i * 0.7, 0]}>
            <torusGeometry args={[r, 0.011, 8, 180]} />
            <meshBasicMaterial color={new THREE.Color(i === 1 ? '#9fe8ff' : '#00d9ff').multiplyScalar(2.4)} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Custom shader points: noise-driven drift and pointer repulsion run entirely on the GPU. */
function Particles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const pointer3 = useRef(new THREE.Vector3(99, 99, 99));
  const { camera, raycaster } = useThree();
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const { positions, seeds } = useMemo(() => {
    const p = new Float32Array(count * 3);
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 18;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      p[i * 3] = r * Math.sin(ph) * Math.cos(th);
      p[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.7;
      p[i * 3 + 2] = r * Math.cos(ph) - 5;
      s[i] = Math.random();
    }
    return { positions: p, seeds: s };
  }, [count]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uMouse: { value: new THREE.Vector3(99, 99, 99) }, uSize: { value: 2.2 }, uPixelRatio: { value: 1 }, uVel: { value: 0 } }), []);

  useFrame((state) => {
    raycaster.setFromCamera(state.pointer, camera);
    raycaster.ray.intersectPlane(plane, pointer3.current);
    uniforms.uMouse.value.copy(pointer3.current);
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    uniforms.uVel.value = motion.vel;
    const pts = ref.current;
    if (pts) pts.position.y = damp(pts.position.y, scrollState().y * 0.0016, 3, 1 / 60);
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial vertexShader={PARTICLE_VERT} fragmentShader={PARTICLE_FRAG} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}

function Rig() {
  useFrame((state, dt) => {
    const s = scrollState();
    state.camera.position.x = damp(state.camera.position.x, state.pointer.x * 0.7, 2.5, dt);
    state.camera.position.y = damp(state.camera.position.y, state.pointer.y * 0.45 - s.progress * 1.2, 2.5, dt);
    state.camera.lookAt(0, -s.progress * 0.8, 0);
  });
  return null;
}

export default function BackgroundScene({ tier, mode }: { tier: Exclude<Tier, 'off'>; mode: Mode }) {
  const [quality, setQuality] = useState<0 | 1 | 2>(tier === 'high' ? 2 : 1);
  const dpr: [number, number] = quality === 2 ? [1, 2] : [1, 1.25];
  const particles = quality === 2 ? 3200 : quality === 1 ? 1100 : 450;
  const physics = mode === 'hero' && tier === 'high' && quality >= 1;

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 0, 7.5], fov: 45, near: 0.1, far: 80 }}
      gl={{ antialias: quality < 2, alpha: false, powerPreference: 'high-performance' }}
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
      aria-hidden="true"
    >
      <color attach="background" args={['#000000']} />
      <PerformanceMonitor onDecline={() => setQuality((q) => Math.max(0, q - 1) as 0 | 1 | 2)} flipflops={2} />
      <MotionProbe />
      <SignalField />
      <Orb mode={mode} />
      <Particles count={particles} />
      {physics && (
        <Suspense fallback={null}>
          <HeroOnly>
            <Playground />
          </HeroOnly>
        </Suspense>
      )}
      <Rig />
      {quality === 2 && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={1.2} luminanceThreshold={0.16} luminanceSmoothing={0.4} mipmapBlur />
          <Vignette eskil={false} offset={0.25} darkness={0.8} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

/** Shows its children only while the hero is on screen, so shapes never float behind later sections. */
function HeroOnly({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(true);
  useFrame(() => {
    const next = window.scrollY < window.innerHeight * 1.05;
    if (next !== show) setShow(next);
  });
  return <group visible={show}>{children}</group>;
}

function MotionProbe() {
  useMotion();
  return null;
}
