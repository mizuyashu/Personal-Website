"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, type Group, type Mesh, type ShaderMaterial } from "three";
import { INTRO, clamp01, kindleAmount, smoothstep } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import ashVert from "@/shaders/ash.vert.glsl";
import embersVert from "@/shaders/embers.vert.glsl";
import embersFrag from "@/shaders/embers.frag.glsl";
import dyingStarVert from "@/shaders/dyingstar.vert.glsl";
import dyingStarFrag from "@/shaders/dyingstar.frag.glsl";
import brokenLinesVert from "@/shaders/brokenlines.vert.glsl";
import brokenLinesFrag from "@/shaders/brokenlines.frag.glsl";
import planeVert from "@/shaders/plane.vert.glsl";
import eclipseFrag from "@/shaders/eclipse.frag.glsl";
import glowFrag from "@/shaders/glow.frag.glsl";
import { seededRandom } from "../layout";
import OwnStar from "./OwnStar";
import VoidRelics from "./VoidRelics";

type Props = { lite: boolean; reducedMotion: boolean };

// Chapter I, the void: dying before the radiance (docs/vision.md §17). A dying world held in a
// cycle of kindling. A huge dying sun hangs low (a black disc in a broken ring of burning, the
// cracked compass star with one point missing); the sky is full of dying stars in broken
// constellations, with one empty socket (yours); ash falls in gusts and only a few embers rise.
// The fire tries to catch three times and dies (KINDLES in lib/intro.ts); the fourth time it
// catches, rising with the dead sun into the flash, which rekindles it as the compass-star sun.
// No gold or ivory until the kindling: the colour withheld is the contrast. Follows the camera.

const ECLIPSE_DISTANCE = 10;
const ECLIPSE_SIZE = 13;
const SKY_Z = [-28, -46] as const;
/** Where the final, successful kindling begins: as the last failed one dies. */
const KINDLE_FINAL = 0.3;

const mix = (a: string, b: string, t: number) => new Color(a).lerp(new Color(b), t);
const EMBER = new Color(palette.ember);
const ROSE = new Color(palette.rose);
const GOLD = new Color(palette.gold);
const IVORY = new Color(palette.ivory);

/** Broken constellations: a few groups of dying stars joined by lines, plus loose stars. */
function buildSky(dyingCount: number, glintCount: number) {
  const random = seededRandom(1733);
  const stars: { x: number; y: number; z: number; seed: number; scale: number; life: number }[] = [];
  const lines: number[] = [];
  const lineSeeds: number[] = [];
  const along: number[] = [];
  const link = (a: (typeof stars)[number], b: (typeof stars)[number]) => {
    lines.push(a.x, a.y, a.z, b.x, b.y, b.z);
    const seed = random();
    lineSeeds.push(seed, seed);
    along.push(0, 1);
  };

  const groups = [
    // Few, and far apart: broken stars, not a crowded sky (Michael, 2026-11-23). Index 1 holds your socket.
    [-22, 9], [7, 5], [24, -1], [-17, -4],
  ];
  let socket = { x: 0, y: 0, z: 0 };
  let socketFrom = { x: 0, y: 0, z: 0 };
  groups.forEach(([gx, gy], g) => {
    const z = SKY_Z[0] + (SKY_Z[1] - SKY_Z[0]) * random();
    const count = 3 + Math.floor(random() * 2);
    let x = gx;
    let y = gy;
    const members: (typeof stars)[number][] = [];
    for (let i = 0; i < count; i++) {
      x += (random() - 0.5) * 6;
      y += (random() - 0.5) * 4.5;
      const star = { x, y, z: z + (random() - 0.5) * 3, seed: random(), scale: 1.6 + random() * 2.2, life: random() * 0.6 };
      members.push(star);
      if (i > 0) link(members[i - 1], star);
    }
    // A branch, so they read as figures rather than chains.
    if (count > 4) link(members[1], members[count - 1]);
    // The group nearest the top centre has an empty socket at its end: yours.
    if (g === 1) {
      const last = members[members.length - 1];
      // Keep the socket in a clear patch of sky at the upper right (in frame, off the sun's disc).
      const d = -last.z;
      socket = {
        x: Math.min(0.6 * d, Math.max(0.3 * d, last.x + 4.5)),
        y: Math.min(0.3 * d, Math.max(0.14 * d, last.y + 2.5)),
        z: last.z,
      };
      socketFrom = { x: last.x, y: last.y, z: last.z };
      link(last, { ...socket, seed: 0, scale: 0, life: 0 });
    }
    stars.push(...members);
  });
  // Loose stars: a few dying rings, and many of the tiniest points of cold, distant starlight.
  for (let i = 0; i < dyingCount; i++) {
    stars.push({
      x: (random() - 0.5) * 70,
      y: (random() - 0.5) * 38,
      z: SKY_Z[0] + (SKY_Z[1] - SKY_Z[0]) * random(),
      seed: random(),
      scale: 0.9 + random() * 1.1,
      life: random() * 0.5,
    });
  }
  for (let i = 0; i < glintCount; i++) {
    stars.push({
      x: (random() - 0.5) * 80,
      y: (random() - 0.5) * 44,
      z: SKY_Z[0] + (SKY_Z[1] - SKY_Z[0]) * random(),
      seed: random(),
      scale: 0.45 + random() * 0.5,
      life: 0.9 + random() * 0.1,
    });
  }

  return {
    positions: new Float32Array(stars.flatMap((s) => [s.x, s.y, s.z])),
    seeds: new Float32Array(stars.map((s) => s.seed)),
    scales: new Float32Array(stars.map((s) => s.scale)),
    lives: new Float32Array(stars.map((s) => s.life)),
    lines: new Float32Array(lines),
    lineSeeds: new Float32Array(lineSeeds),
    along: new Float32Array(along),
    socket,
    socketFrom,
  };
}

/** Ash: clumped, not evenly spread (disorder). */
function buildAsh(count: number) {
  const random = seededRandom(7);
  const clumps = Array.from({ length: 9 }, () => [(random() - 0.5) * 22, (random() - 0.5) * 16, -4 - random() * 10]);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    if (random() < 0.65) {
      const [cx, cy, cz] = clumps[Math.floor(random() * clumps.length)];
      const spread = 0.6 + random() * 2.2;
      positions.set([cx + (random() - 0.5) * spread * 2, cy + (random() - 0.5) * spread * 3, cz + (random() - 0.5) * spread], i * 3);
    } else {
      positions.set([(random() - 0.5) * 24, (random() - 0.5) * 16, -3 - random() * 14], i * 3);
    }
    seeds[i] = random();
  }
  return { positions, seeds };
}

/** A few embers rising toward the light (the only things that do). */
function buildRisers(count: number) {
  const random = seededRandom(19);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions.set([(random() - 0.5) * 7, (random() - 0.5) * 16, -6 - random() * 5], i * 3);
    seeds[i] = random();
  }
  return { positions, seeds };
}

export default function Void({ lite, reducedMotion }: Props) {
  const group = useRef<Group>(null);
  const drift = useRef<Group>(null);
  const eclipseMesh = useRef<Mesh>(null);
  const eclipse = useRef<ShaderMaterial>(null);
  const glowMesh = useRef<Mesh>(null);
  const glow = useRef<ShaderMaterial>(null);
  const stars = useRef<ShaderMaterial>(null);
  const lines = useRef<ShaderMaterial>(null);
  const ash = useRef<ShaderMaterial>(null);
  const risers = useRef<ShaderMaterial>(null);

  const sky = useMemo(() => (lite ? buildSky(10, 110) : buildSky(22, 260)), [lite]);
  const ashField = useMemo(() => buildAsh(lite ? 200 : 420), [lite]);
  const riserField = useMemo(() => buildRisers(lite ? 18 : 40), [lite]);

  const uniforms = useMemo(() => {
    const paleEmber = mix(palette.ember, palette.rose, 0.35);
    return {
      eclipse: {
        uTime: { value: 0 },
        uLife: { value: 0.2 },
        uKindle: { value: 0 },
        uOpacity: { value: 1 },
        // Blacker than the sky around it: a hole.
        uDisc: { value: new Color(palette.ink).multiplyScalar(0.35) },
        uCorona: { value: paleEmber },
        uHot: { value: new Color(palette.gold) },
        uHaze: { value: new Color(palette.crimsonViolet) },
      },
      glow: { uOpacity: { value: 0 }, uGold: { value: new Color(palette.ember) }, uIvory: { value: new Color(palette.rose) } },
      stars: {
        uTime: { value: 0 },
        uSize: { value: 220 },
        uPixelRatio: { value: 1 },
        uOpacity: { value: 1 },
        uRing: { value: paleEmber },
        uCold: { value: mix(palette.sky, palette.lavender, 0.5) },
        uDisc: { value: new Color(palette.ink) },
      },
      lines: { uTime: { value: 0 }, uOpacity: { value: 0.45 }, uColor: { value: mix(palette.crimsonViolet, palette.rose, 0.3) } },
      ash: {
        uTime: { value: 0 },
        uSize: { value: 55 },
        uPixelRatio: { value: 1 },
        uOpacity: { value: 0.9 },
        uEmberShare: { value: 0.05 },
        uGold: { value: mix(palette.lavender, palette.navy, 0.55) },
        uEmber: { value: new Color(palette.ember) },
      },
      risers: {
        uTime: { value: 0 },
        uSize: { value: 70 },
        uPixelRatio: { value: 1 },
        uOpacity: { value: 1 },
        uEmberShare: { value: 0.6 },
        uGold: { value: paleEmber },
        uEmber: { value: new Color(palette.ember) },
      },
    };
  }, []);

  useFrame((state, delta) => {
    if (!group.current) return;
    const p = journey.position;
    const visible = p < INTRO.flashPeak;
    group.current.visible = visible;
    if (!visible) return;
    group.current.position.z = state.camera.position.z;

    const time = reducedMotion ? 4 : (stars.current?.uniforms.uTime.value ?? 0) + delta;
    const pixelRatio = state.gl.getPixelRatio();
    for (const material of [stars.current, lines.current, ash.current, risers.current]) {
      if (!material) continue;
      material.uniforms.uTime.value = time;
      if (material.uniforms.uPixelRatio) material.uniforms.uPixelRatio.value = pixelRatio;
    }

    // The fire tries and fails (no flashes with reduced motion), then catches for real.
    const kindle = reducedMotion ? 0 : kindleAmount(p);
    const rise = smoothstep(KINDLE_FINAL, INTRO.voidEnd, p);
    const burst = clamp01((p - INTRO.voidEnd) / (INTRO.flashPeak - INTRO.voidEnd));

    // The dead sun: low and nearly out; each kindling flares it; the final one lifts it into place.
    if (eclipse.current && eclipseMesh.current) {
      eclipse.current.uniforms.uTime.value = time;
      eclipse.current.uniforms.uKindle.value = kindle + burst;
      eclipse.current.uniforms.uLife.value = 0.15 + rise * 0.85;
      eclipseMesh.current.position.y = -2.6 + rise * 2.6;
    }
    // The light inside it: a faint ember that swells with each try, then becomes the flash.
    if (glowMesh.current && glow.current) {
      const scale = 0.5 + kindle * 2.2 + rise * 1.8 + burst * burst * 16;
      glowMesh.current.position.y = -2.6 + rise * 2.6;
      glowMesh.current.scale.setScalar(scale);
      glow.current.uniforms.uOpacity.value = 0.25 + kindle * 0.9 + rise * 0.75;
      // Ember-red until it catches; gold and ivory only as the radiance comes.
      const catching = Math.max(rise, burst);
      glow.current.uniforms.uGold.value.lerpColors(EMBER, GOLD, catching);
      glow.current.uniforms.uIvory.value.lerpColors(ROSE, IVORY, catching);
    }

    // Uneasy drift: the whole sky slowly tilts and sways (not with reduced motion).
    if (drift.current && !reducedMotion) {
      const t = state.clock.elapsedTime;
      drift.current.rotation.z = Math.sin(t * 0.05) * 0.05 + Math.sin(t * 0.13 + 1.3) * 0.02;
      drift.current.position.x = Math.sin(t * 0.07) * 0.4;
      drift.current.position.y = Math.sin(t * 0.09 + 0.7) * 0.25;
    }
  });

  return (
    <group ref={group}>
      <group ref={drift}>
        {/* Dead planets, seen only by their rims */}
        <VoidRelics reducedMotion={reducedMotion} />
        {/* The sky of dying stars and their broken constellations */}
        <points key={`stars-${lite}`} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[sky.positions, 3]} />
            <bufferAttribute attach="attributes-aSeed" args={[sky.seeds, 1]} />
            <bufferAttribute attach="attributes-aScale" args={[sky.scales, 1]} />
            <bufferAttribute attach="attributes-aLife" args={[sky.lives, 1]} />
          </bufferGeometry>
          <shaderMaterial ref={stars} vertexShader={dyingStarVert} fragmentShader={dyingStarFrag} uniforms={uniforms.stars} transparent depthWrite={false} />
        </points>
        <lineSegments key={`lines-${lite}`} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[sky.lines, 3]} />
            <bufferAttribute attach="attributes-aSeed" args={[sky.lineSeeds, 1]} />
            <bufferAttribute attach="attributes-aAlong" args={[sky.along, 1]} />
          </bufferGeometry>
          <shaderMaterial ref={lines} vertexShader={brokenLinesVert} fragmentShader={brokenLinesFrag} uniforms={uniforms.lines} transparent depthWrite={false} blending={AdditiveBlending} />
        </lineSegments>
        {/* The empty socket: a place in the sky where a star should be. Yours. */}
        <mesh position={[sky.socket.x, sky.socket.y, sky.socket.z]}>
          <ringGeometry args={[0.55, 0.62, 48]} />
          <meshBasicMaterial color={palette.rose} transparent opacity={0.28} depthWrite={false} fog={false} />
        </mesh>
        {/* Your star, once earned (lib/ownStar.ts): cold starlight after chapter III, gold and
            joined to its constellation after the ending. */}
        <OwnStar socket={sky.socket} from={sky.socketFrom} reducedMotion={reducedMotion} />

        {/* Falling ash, and the few embers that still rise */}
        <points key={`ash-${lite}`} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[ashField.positions, 3]} />
            <bufferAttribute attach="attributes-aSeed" args={[ashField.seeds, 1]} />
          </bufferGeometry>
          <shaderMaterial ref={ash} vertexShader={ashVert} fragmentShader={embersFrag} uniforms={uniforms.ash} transparent depthWrite={false} />
        </points>
        <points key={`risers-${lite}`} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[riserField.positions, 3]} />
            <bufferAttribute attach="attributes-aSeed" args={[riserField.seeds, 1]} />
          </bufferGeometry>
          <shaderMaterial ref={risers} vertexShader={embersVert} fragmentShader={embersFrag} uniforms={uniforms.risers} transparent depthWrite={false} blending={AdditiveBlending} />
        </points>
      </group>

      {/* The dying sun, low in the frame, and the light trying to catch inside it */}
      <mesh ref={eclipseMesh} position={[0, -2.6, -ECLIPSE_DISTANCE]} renderOrder={1}>
        <planeGeometry args={[ECLIPSE_SIZE, ECLIPSE_SIZE]} />
        <shaderMaterial ref={eclipse} vertexShader={planeVert} fragmentShader={eclipseFrag} uniforms={uniforms.eclipse} transparent depthWrite={false} fog={false} />
      </mesh>
      <mesh ref={glowMesh} position={[0, -2.6, -ECLIPSE_DISTANCE + 0.1]} renderOrder={2}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial ref={glow} vertexShader={planeVert} fragmentShader={glowFrag} uniforms={uniforms.glow} transparent depthWrite={false} blending={AdditiveBlending} fog={false} />
      </mesh>
    </group>
  );
}
