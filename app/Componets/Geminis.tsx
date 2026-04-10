"use client"; // <--- Add this at the very first line

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend, ThreeElement } from '@react-three/fiber';
import { OrbitControls, Effects } from '@react-three/drei';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';

// Extend the JSX namespace to include UnrealBloomPass
extend({ UnrealBloomPass });

declare module '@react-three/fiber' {
  interface ThreeElements {
    unrealBloomPass: ThreeElement<typeof UnrealBloomPass>;
  }
}

interface Params {
  nodes: number;
  activity: number;
  geometry: number;
  [key: string]: number; // Index signature for addControl
}

const ParticleSwarm: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const count = 20000;
  const speedMult = 1;

  // Reusable objects to avoid GC pressure
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const pColor = useMemo(() => new THREE.Color(), []);

  const positions = useMemo(() => {
    const pos: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      pos.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        )
      );
    }
    return pos;
  }, []);

  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: 0x00aaff }), []);
  const geometry = useMemo(() => new THREE.ConeGeometry(0.1, 0.5, 4).rotateX(Math.PI / 2), []);

  const PARAMS = useMemo<Params>(() => ({ "nodes": 5, "activity": 1.2, "geometry": 25 }), []);

  // Mock functions from your original code
  const addControl = (id: keyof Params, _l: string, _min: number, _max: number, val: number): number => {
    return PARAMS[id] !== undefined ? PARAMS[id] : val;
  };
  const setInfo = (title: string, desc: string) => { };
  const annotate = (id: string, pos: THREE.Vector3, label: string) => { };

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime() * speedMult;

    for (let i = 0; i < count; i++) {
      const nodes = addControl("nodes", "Synaptic Density", 1, 10, 5);
      const activity = addControl("activity", "Neural Pulse", 0.1, 3.0, 1.2);
      const coreGeo = addControl("geometry", "Core Coherence", 5.0, 50.0, 25.0);

      if (i === 0) {
        setInfo("Gemini Neural Matrix", "A visualization of distributed intelligence.");
        annotate("nucleus", new THREE.Vector3(0, 0, 0), "Logical Singularity");
      }

      const t = time * activity;
      const idxRatio = i / count;

      const layerId = Math.floor(idxRatio * nodes);
      const layerNorm = layerId / nodes;
      const pIndex = i % (count / nodes);

      const theta = (pIndex / (count / nodes)) * Math.PI * 2.0;
      const phi = Math.acos(2.0 * ((pIndex + 0.5) / (count / nodes)) - 1.0);

      const layerRadius = coreGeo * (layerNorm + 0.5);
      const pulse = Math.sin(t + layerNorm * Math.PI) * 2.0;

      const streamX = Math.sin(phi) * Math.cos(theta + t * (layerNorm + 0.2));
      const streamY = Math.sin(phi) * Math.sin(theta + t * (layerNorm + 0.2));
      const streamZ = Math.cos(phi);

      const noise = Math.sin(i * 0.5 + t * 5.0) * (0.5 * layerNorm);
      const r = layerRadius + pulse + noise;

      const posX = streamX * r;
      const posY = streamY * r;
      const posZ = streamZ * r;

      const activation = Math.pow(Math.abs(Math.sin(idxRatio * 100.0 + t * 2.0)), 20.0);
      const spark = activation * 0.5;

      target.set(posX, posY, posZ);

      const baseHue = 0.55 + (layerNorm * 0.15);
      const lightness = 0.2 + (layerNorm * 0.3) + spark;

      pColor.setHSL(baseHue % 1.0, 0.8, Math.min(lightness, 1.0));

      positions[i].lerp(target, 0.1);
      dummy.position.copy(positions[i]);
      dummy.lookAt(target); // Bonus: makes cones point towards their destination
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, pColor);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
};

export default function Gemini() {
  return (
    <div className="absolute inset-0 z-0"
      style={{
        // Este fondo ahora será visible
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139, 92, 246, 0.25), transparent 70%), #000000",
      }}>
      <Canvas
        camera={{ position: [0, 0, 100], fov: 60 }}
        // PASO CLAVE: Activar transparencia en el renderizador
        gl={{ alpha: true, antialias: true }}
        // Opcional: Asegurar que el estilo del canvas no tenga fondo
        style={{ background: 'transparent' }}
      >

        <ParticleSwarm />
        <OrbitControls autoRotate={false} />

        <Effects disableGamma>
          <unrealBloomPass threshold={0} strength={1.8} radius={0.4} />
        </Effects>
      </Canvas>
    </div>
  );
}