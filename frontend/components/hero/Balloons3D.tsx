"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { BurstSignal } from "@/lib/types";

type BalloonKind = "gold" | "rose";

interface Balloon {
  id: number;
  kind: BalloonKind;
  scale: number;
  bx: number;
  y: number;
  z: number;
  sp: number;
  sway: number;
  sws: number;
  burst: boolean;
  vy: number;
  bornAt: number; // clock seconds (burst balloons only)
}

const LIFE = 2.6; // burst balloon lifetime in seconds

/** Warm gradient environment → the metallic gold/crimson reflections. */
function GradientEnv() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const g = c.getContext("2d")!;
    const grd = g.createLinearGradient(0, 0, 0, 128);
    grd.addColorStop(0, "#2a0d10");
    grd.addColorStop(0.45, "#7c4f12");
    grd.addColorStop(0.62, "#f6cf72");
    grd.addColorStop(0.8, "#b3243a");
    grd.addColorStop(1, "#140a0e");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    let envMap: THREE.Texture = tex;
    const prev = scene.environment;
    try {
      const pmrem = new THREE.PMREMGenerator(gl);
      envMap = pmrem.fromEquirectangular(tex).texture;
      pmrem.dispose();
    } catch {
      /* fall back to the raw equirect texture */
    }
    scene.environment = envMap;
    return () => {
      scene.environment = prev;
      tex.dispose();
    };
  }, [gl, scene]);
  return null;
}

function BalloonField({ burstRef }: { burstRef: React.RefObject<BurstSignal> }) {
  const { viewport } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const meshes = useRef(new Map<number, THREE.Group>());
  const idCounter = useRef(0);
  const lastBurst = useRef(0);
  const pointer = useRef({ x: 0.5, y: 0.5 });

  // Shared geometries + materials (ambient balloons share; bursts clone).
  const sphere = useMemo(() => new THREE.SphereGeometry(1, 40, 40), []);
  const knot = useMemo(() => new THREE.ConeGeometry(0.2, 0.42, 16), []);
  const goldMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xd6a23a,
        metalness: 1,
        roughness: 0.2,
        envMapIntensity: 1.35,
      }),
    [],
  );
  const roseMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xb1283f,
        metalness: 1,
        roughness: 0.26,
        envMapIntensity: 1.2,
      }),
    [],
  );

  // Ambient balloon pool (created once). Uses index-based pseudo-randomness so
  // it stays deterministic (no Math.random in render).
  const initial = useMemo<Balloon[]>(() => {
    const rand = mulberry32(1337);
    return Array.from({ length: 11 }, () => {
      const side = rand() < 0.5 ? -1 : 1;
      return {
        id: idCounter.current++,
        kind: rand() < 0.62 ? "gold" : "rose",
        scale: 0.55 + rand() * 1.0,
        bx: side * (3.5 + rand() * 8),
        y: rand() * 26 - 13,
        z: (rand() - 0.5) * 9,
        sp: 0.45 + rand() * 0.7,
        sway: rand() * 6.28,
        sws: 0.25 + rand() * 0.4,
        burst: false,
        vy: 0,
        bornAt: 0,
      } as Balloon;
    });
  }, []);

  const [balloons, setBalloons] = useState<Balloon[]>(initial);
  const balloonsRef = useRef(balloons);
  balloonsRef.current = balloons;

  // Pointer parallax input (the field is a fixed full-page layer, so it does
  // not react to scroll — balloons drift perpetually in view).
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointer.current.x = e.clientX / Math.max(1, window.innerWidth);
      pointer.current.y = e.clientY / Math.max(1, window.innerHeight);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Handle a pending burst click.
    const sig = burstRef.current;
    if (sig && sig.n !== lastBurst.current) {
      lastBurst.current = sig.n;
      const cnt = 4 + Math.floor(Math.random() * 3);
      const vw = viewport.width;
      const vh = viewport.height;
      const fresh: Balloon[] = Array.from({ length: cnt }, () => ({
        id: idCounter.current++,
        kind: Math.random() < 0.6 ? "gold" : "rose",
        scale: 0.4 + Math.random() * 0.5,
        bx: (sig.x - 0.5) * vw + (Math.random() - 0.5) * 2.4,
        y: (0.5 - sig.y) * vh,
        z: 1 + Math.random() * 3,
        sp: 0,
        sway: Math.random() * 6.28,
        sws: 0.4 + Math.random() * 0.5,
        burst: true,
        vy: 2.6 + Math.random() * 2,
        bornAt: t,
      }));
      const ids = fresh.map((b) => b.id);
      setBalloons((prev) => [...prev, ...fresh]);
      // Despawn after their lifetime.
      window.setTimeout(() => {
        setBalloons((prev) => prev.filter((b) => !ids.includes(b.id)));
      }, LIFE * 1000);
    }

    // Animate each balloon's transform via its mesh ref (no per-frame state).
    for (const b of balloonsRef.current) {
      const g = meshes.current.get(b.id);
      if (!g) continue;
      if (b.burst) {
        const age = t - b.bornAt;
        b.y += b.vy * delta;
        const op = Math.max(0, 1 - age / LIFE);
        g.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.material) {
            const m = mesh.material as THREE.MeshStandardMaterial;
            m.transparent = true;
            m.opacity = op;
          }
        });
      } else {
        b.y += 0.9 * b.sp * delta;
        const limit = viewport.height / 2 + 3;
        if (b.y > limit) b.y = -limit;
      }
      g.position.set(b.bx + Math.sin(t * b.sws + b.sway) * 0.7, b.y, b.z);
      g.rotation.y += 0.25 * delta;
      g.rotation.z = Math.sin(t * b.sws + b.sway) * 0.14;
    }

    // Group-level mouse parallax.
    if (groupRef.current) {
      groupRef.current.rotation.y = (pointer.current.x - 0.5) * 0.5;
      groupRef.current.rotation.x = (pointer.current.y - 0.5) * -0.22;
    }
  });

  return (
    <group ref={groupRef}>
      {balloons.map((b) => {
        const base = b.kind === "gold" ? goldMat : roseMat;
        const mat = b.burst ? base.clone() : base;
        return (
          <group
            key={b.id}
            scale={b.scale}
            ref={(el) => {
              if (el) meshes.current.set(b.id, el);
              else meshes.current.delete(b.id);
            }}
          >
            <mesh geometry={sphere} material={mat} scale={[0.84, 1.06, 0.84]} />
            <mesh geometry={knot} material={mat} position={[0, -1.04, 0]} />
          </group>
        );
      })}
    </group>
  );
}

/** Small deterministic PRNG so the ambient layout is stable across renders. */
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function Balloons3D({
  burstRef,
}: {
  burstRef: React.RefObject<BurstSignal>;
}) {
  return (
    <Canvas
      className="!absolute inset-0"
      style={{ pointerEvents: "none" }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      camera={{ fov: 50, position: [0, 0, 17], near: 0.1, far: 140 }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x000000, 0);
        scene.fog = new THREE.FogExp2(0x09040b, 0.035);
      }}
    >
      <GradientEnv />
      <ambientLight color={0x412022} intensity={0.7} />
      <pointLight color={0xffd98a} intensity={1.4} distance={140} position={[12, 14, 16]} />
      <pointLight color={0xc23048} intensity={1.1} distance={140} position={[-16, -8, 12]} />
      <directionalLight color={0xfff0d0} intensity={0.6} position={[-6, 9, 7]} />
      <BalloonField burstRef={burstRef} />
    </Canvas>
  );
}
