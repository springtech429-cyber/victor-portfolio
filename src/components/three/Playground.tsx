'use client';
// Lusion-style physics toy: glowing shapes you push around with the pointer and blast apart with a click.
// Physics runs on Rapier (WebAssembly). This file is only loaded on capable desktops, on the home page.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BallCollider, CuboidCollider, Physics, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { SHAPE_FRAG, SHAPE_VERT } from '@/lib/shaders';

type Kind = 'ball' | 'box' | 'ring';
interface Shape {
  id: number;
  kind: Kind;
  pos: [number, number, number];
  size: number;
}

const BURST_EVENT = 'playground-burst';

function makeShapes(count: number): Shape[] {
  const kinds: Kind[] = ['ball', 'box', 'ring', 'ball', 'box'];
  return Array.from({ length: count }, (_, id) => ({
    id,
    kind: kinds[id % kinds.length],
    pos: [0.8 + Math.random() * 5.2, (Math.random() - 0.5) * 5.4, (Math.random() - 0.5) * 3 - 1],
    size: 0.28 + Math.random() * 0.34,
  }));
}

function Body({ shape, pointer }: { shape: Shape; pointer: React.RefObject<THREE.Vector3> }) {
  const body = useRef<RapierRigidBody>(null);
  const uniforms = useMemo(() => ({ uHot: { value: 0 }, uTime: { value: 0 } }), []);
  const home = useMemo(() => new THREE.Vector3(...shape.pos), [shape.pos]);

  // A click anywhere sends a shockwave outward from the pointer.
  useEffect(() => {
    const onBurst = (e: Event) => {
      const b = body.current;
      if (!b) return;
      const { x, y, z } = (e as CustomEvent<{ x: number; y: number; z: number }>).detail;
      const t = b.translation();
      const dx = t.x - x, dy = t.y - y, dz = t.z - z;
      const d = Math.hypot(dx, dy, dz) + 1e-3;
      const k = Math.max(0, 1 - d / 7) * 0.9 + 0.05;
      b.applyImpulse({ x: (dx / d) * k, y: (dy / d) * k, z: (dz / d) * k }, true);
      b.applyTorqueImpulse({ x: (Math.random() - 0.5) * 0.04, y: (Math.random() - 0.5) * 0.04, z: (Math.random() - 0.5) * 0.04 }, true);
    };
    window.addEventListener(BURST_EVENT, onBurst);
    return () => window.removeEventListener(BURST_EVENT, onBurst);
  }, []);

  useFrame((state) => {
    const b = body.current;
    if (!b) return;
    const t = b.translation();
    const p = pointer.current;
    // A soft pull toward a home position keeps the cluster together; the pointer repels what it touches.
    let ix = (home.x - t.x) * 0.9;
    let iy = (home.y - t.y) * 0.9;
    let iz = (home.z - t.z) * 0.9;
    let hot = 0;
    if (p) {
      const dx = t.x - p.x, dy = t.y - p.y, dz = t.z - p.z;
      const d = Math.hypot(dx, dy, dz) + 1e-3;
      if (d < 2.6) {
        const k = (1 - d / 2.6) * 6;
        ix += (dx / d) * k;
        iy += (dy / d) * k;
        iz += (dz / d) * k;
        hot = 1 - d / 2.6;
      }
    }
    b.applyImpulse({ x: ix * 0.016, y: iy * 0.016, z: iz * 0.016 }, true);
    uniforms.uHot.value = THREE.MathUtils.lerp(uniforms.uHot.value, hot, 0.15);
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <RigidBody ref={body} position={shape.pos} colliders={false} linearDamping={1.4} angularDamping={0.6} restitution={0.7}>
      {shape.kind === 'box' ? (
        <CuboidCollider args={[shape.size / 2, shape.size / 2, shape.size / 2]} />
      ) : (
        <BallCollider args={[shape.kind === 'ring' ? shape.size * 0.9 : shape.size * 0.6]} />
      )}
      <mesh>
        {shape.kind === 'ball' && <icosahedronGeometry args={[shape.size * 0.6, 2]} />}
        {shape.kind === 'box' && <boxGeometry args={[shape.size, shape.size, shape.size]} />}
        {shape.kind === 'ring' && <torusGeometry args={[shape.size * 0.75, shape.size * 0.16, 12, 40]} />}
        <shaderMaterial vertexShader={SHAPE_VERT} fragmentShader={SHAPE_FRAG} uniforms={uniforms} toneMapped={false} />
      </mesh>
    </RigidBody>
  );
}

/** Keeps `pointer` at the 3D point under the cursor, and turns background clicks into bursts. */
function PointerTracker({ pointer }: { pointer: React.RefObject<THREE.Vector3> }) {
  const { camera, raycaster } = useThree();
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 1), []);

  useFrame((state) => {
    raycaster.setFromCamera(state.pointer, camera);
    raycaster.ray.intersectPlane(plane, pointer.current);
  });

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      // Clicks on links, buttons and form fields must stay normal clicks.
      if ((e.target as HTMLElement | null)?.closest?.('a,button,input,textarea,select,summary,nav,label')) return;
      const p = pointer.current;
      window.dispatchEvent(new CustomEvent(BURST_EVENT, { detail: { x: p.x, y: p.y, z: p.z } }));
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [pointer]);

  return null;
}

export default function Playground({ count = 16 }: { count?: number }) {
  const pointer = useRef(new THREE.Vector3(99, 99, 99));
  const shapes = useMemo(() => makeShapes(count), [count]);
  return (
    <Physics gravity={[0, 0, 0]} timeStep="vary">
      <PointerTracker pointer={pointer} />
      {shapes.map((s) => (
        <Body key={s.id} shape={s} pointer={pointer} />
      ))}
    </Physics>
  );
}
