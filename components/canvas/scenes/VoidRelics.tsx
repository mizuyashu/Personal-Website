"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  Path,
  Shape,
  ShaderMaterial,
  Vector3,
  type Group,
} from "three";
import { INTRO, kindleAmount, smoothstep } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import rimVert from "@/shaders/rim.vert.glsl";
import rimFrag from "@/shaders/rim.frag.glsl";

// Things half-seen in the void (docs/vision.md §17), kept sparse: two dead planets (a huge one
// half off the top left, a small one with a broken ring), and ruins of a lost kingdom drifting
// in the dark: a broken arch on a column stub, a toppled column, a fallen compass-star relief
// missing a point, a fragment of a pointed window. All near-black, seen only by a thin rim of
// light from the dying sun, which flares faintly with each failed kindling.
// Lives inside the void's drifting sky group (Void.tsx), so it sways with it.

/** The dying sun's place in the void group (Void.tsx: the eclipse, low, 10 ahead). */
const SUN = new Vector3(0, -1.3, -10);

/** A compass star with one point broken off: a relief fallen from some wall. */
function brokenStarShape() {
  const shape = new Shape();
  const points: [number, number][] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8 - Math.PI / 2;
    // The point at index 4 (east) is broken: cut short.
    const r = i === 4 ? 0.32 : i % 2 === 1 ? 0.18 : i % 4 === 0 ? 1 : 0.58;
    points.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  shape.moveTo(...points[0]);
  points.slice(1).forEach((p) => shape.lineTo(...p));
  shape.closePath();
  return shape;
}

/** A pointed (gothic) window frame, with its opening. */
function pointedWindowShape() {
  const outer = new Shape();
  outer.moveTo(-1, 0);
  outer.lineTo(-1, 2);
  outer.quadraticCurveTo(-1, 3.1, 0, 3.6);
  outer.quadraticCurveTo(1, 3.1, 1, 2);
  outer.lineTo(1, 0);
  outer.closePath();
  const hole = new Path();
  hole.moveTo(-0.7, 0.25);
  hole.lineTo(-0.7, 2);
  hole.quadraticCurveTo(-0.7, 2.85, 0, 3.25);
  hole.quadraticCurveTo(0.7, 2.85, 0.7, 2);
  hole.lineTo(0.7, 0.25);
  hole.closePath();
  outer.holes.push(hole);
  return outer;
}

/** Concentric broken bands for the small planet's ring. */
function makeRingTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;
  for (let k = 0; k < 7; k++) {
    const r = c * (0.68 + k * 0.045);
    ctx.strokeStyle = `rgba(255,255,255,${0.25 + (k % 3) * 0.2})`;
    ctx.lineWidth = 2 + (k % 2) * 2;
    const start = k * 1.3;
    ctx.beginPath();
    ctx.arc(c, c, r, start, start + Math.PI * (1.2 + (k % 3) * 0.25));
    ctx.stroke();
  }
  return new CanvasTexture(canvas);
}

/** A near-black material lit only by a rim from the dying sun. */
function makeRimMaterial(rim: Color, power: number) {
  return new ShaderMaterial({
    vertexShader: rimVert,
    fragmentShader: rimFrag,
    uniforms: {
      uBody: { value: new Color(palette.ink).multiplyScalar(0.6) },
      uRim: { value: rim },
      uLightPos: { value: new Vector3() },
      uPower: { value: power },
      uGlow: { value: 0 },
      uOpacity: { value: 1 },
    },
  });
}

/** Light position (view space) and kindling glow for a rim material. */
function lightRim(material: ShaderMaterial, sunView: Vector3, glow: number) {
  (material.uniforms.uLightPos.value as Vector3).copy(sunView);
  material.uniforms.uGlow.value = glow;
}

type Relic = { kind: "arch" | "column" | "star" | "window"; position: [number, number, number]; rotation: [number, number, number]; scale: number; spin: [number, number, number] };

const RELICS: Relic[] = [
  { kind: "arch", position: [-9.5, 1.8, -15], rotation: [0.2, 0.6, -0.35], scale: 1, spin: [0.004, 0.012, 0.006] },
  { kind: "column", position: [10.5, -3.6, -13], rotation: [0.4, 0.2, 1.1], scale: 1, spin: [0.01, 0.003, 0.004] },
  { kind: "star", position: [8.2, 4.6, -18], rotation: [0.9, -0.5, 0.3], scale: 1.2, spin: [0.006, 0.01, 0.008] },
  { kind: "window", position: [-12.5, -4.8, -19], rotation: [-0.3, 0.9, 0.5], scale: 1, spin: [0.003, 0.008, 0.005] },
];

export default function VoidRelics({ lite, reducedMotion }: { lite: boolean; reducedMotion: boolean }) {
  const relics = useRef<(Group | null)[]>([]);
  const ring = useMemo(() => makeRingTexture(), []);
  const geometries = useMemo(
    () => ({
      star: new ExtrudeGeometry(brokenStarShape(), { depth: 0.3, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1 }),
      window: new ExtrudeGeometry(pointedWindowShape(), { depth: 0.45, bevelEnabled: false, curveSegments: 16 }),
    }),
    [],
  );
  const { material, planetMaterial } = useMemo(
    () => ({
      material: makeRimMaterial(new Color(palette.ember).lerp(new Color(palette.rose), 0.35), 3.2),
      planetMaterial: makeRimMaterial(new Color(palette.lavender).lerp(new Color(palette.crimsonViolet), 0.4), 5),
    }),
    [],
  );
  useEffect(
    () => () => {
      ring.dispose();
      geometries.star.dispose();
      geometries.window.dispose();
      material.dispose();
      planetMaterial.dispose();
    },
    [ring, geometries, material, planetMaterial],
  );

  const sunWorld = useMemo(() => new Vector3(), []);
  useFrame((state, delta) => {
    const p = journey.position;
    if (p >= INTRO.flashPeak) return;
    // Light from the dying sun: its position in view space, for both materials.
    const group = relics.current.find(Boolean)?.parent;
    if (group) {
      sunWorld.copy(SUN);
      group.localToWorld(sunWorld);
      sunWorld.applyMatrix4(state.camera.matrixWorldInverse);
    }
    const glow = (reducedMotion ? 0 : kindleAmount(p)) * 1.6 + smoothstep(0.3, INTRO.voidEnd, p) * 0.8;
    lightRim(material, sunWorld, glow);
    lightRim(planetMaterial, sunWorld, glow * 0.6);
    if (reducedMotion) return;
    relics.current.forEach((g, i) => {
      if (!g) return;
      const spin = RELICS[i].spin;
      g.rotation.x += spin[0] * delta * 6;
      g.rotation.y += spin[1] * delta * 6;
      g.rotation.z += spin[2] * delta * 6;
      g.position.y = RELICS[i].position[1] + Math.sin(state.clock.elapsedTime * 0.15 + i * 1.7) * 0.35;
    });
  });

  const shown = lite ? RELICS.slice(0, 2) : RELICS;
  return (
    <>
      {/* Dead planets: a huge one half off the top left, a small one low right with a broken ring */}
      <mesh position={[-26, 15, -46]} scale={11} material={planetMaterial}>
        <sphereGeometry args={[1, 48, 32]} />
      </mesh>
      <group position={[21, -9, -38]} rotation={[0.35, 0, -0.4]}>
        <mesh scale={2.4} material={planetMaterial}>
          <sphereGeometry args={[1, 32, 24]} />
        </mesh>
        <mesh rotation={[-Math.PI / 2 + 0.25, 0, 0]} scale={2.4}>
          <ringGeometry args={[1.35, 2.2, 96]} />
          <meshBasicMaterial map={ring} transparent opacity={0.4} color={palette.rose} side={DoubleSide} depthWrite={false} fog={false} />
        </mesh>
      </group>

      {/* Ruins drifting in the dark */}
      {shown.map((relic, i) => (
        <group
          key={relic.kind}
          ref={(g) => {
            relics.current[i] = g;
          }}
          position={relic.position}
          rotation={relic.rotation}
          scale={relic.scale}
        >
          {relic.kind === "arch" && (
            <>
              <mesh material={material}>
                <torusGeometry args={[2, 0.32, 10, 32, Math.PI * 0.62]} />
              </mesh>
              <mesh position={[2, -1.5, 0]} material={material}>
                <cylinderGeometry args={[0.34, 0.4, 3, 14]} />
              </mesh>
            </>
          )}
          {relic.kind === "column" && (
            <>
              <mesh material={material}>
                <cylinderGeometry args={[0.42, 0.48, 5.5, 16]} />
              </mesh>
              <mesh position={[0, 2.95, 0]} material={material}>
                <boxGeometry args={[1.3, 0.4, 1.3]} />
              </mesh>
            </>
          )}
          {relic.kind === "star" && <mesh geometry={geometries.star} material={material} />}
          {relic.kind === "window" && <mesh geometry={geometries.window} material={material} />}
        </group>
      ))}
    </>
  );
}
