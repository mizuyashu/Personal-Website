"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instance, Instances } from "@react-three/drei";
import { AdditiveBlending, Color, DoubleSide, MeshStandardMaterial, type Group, type PointLight, type ShaderMaterial } from "three";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import planeVert from "@/shaders/plane.vert.glsl";
import shaftFrag from "@/shaders/shaft.frag.glsl";
import glowFrag from "@/shaders/glow.frag.glsl";
import { CATHEDRAL_START, FLOOR_Y, NARTHEX } from "../layout";
import { makeReliefTexture } from "./textures";

// The narthex (chapter II): the long passage in front of the nave that you walk along before
// rounding the corner to the left into the nave. A ribbed barrel vault on pilasters, a bay every
// few units; tall arched windows down the back wall, each throwing a shaft of light that lands
// as a pool on the floor; a blind arcade of dark niches under a carved frieze on the front wall;
// a great round window at the end you walk toward. Generated geometry only.

const { left: L, right: R, front: F, back: B, spring: SPRING, bay: BAY } = NARTHEX;
const WIDTH = B - F;
const MID_Z = (F + B) / 2;
const RADIUS = WIDTH / 2;
/** Where the front wall stops: beyond it the narthex opens onto the nave and its aisles. */
const OPENING_X = -6.8;

const RIBS = Array.from({ length: Math.floor((R - L) / BAY) + 1 }, (_, k) => L + 2 + k * BAY).filter((x) => x < R);
const WINDOWS = RIBS.slice(0, -1).map((x) => x + BAY / 2);
const NICHES = WINDOWS.filter((x) => x + 1.2 < OPENING_X);
/** The window's light lands on the floor this far toward the front. */
const POOL_Z = F + 1.4;

// Lights stay outside the hidden group and are dimmed to 0 instead of hidden: three.js builds lit
// materials for a fixed number of lights, so a light appearing or vanishing recompiles every lit
// material (a 0.7–1 s freeze in the lift, 2026-11-23). Keep the light count constant.
export default function Narthex({ lite, reducedMotion }: { lite: boolean; reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const lampA = useRef<PointLight>(null);
  const lampB = useRef<PointLight>(null);
  const shafts = useRef<(ShaderMaterial | null)[]>([]);

  const materials = useMemo(() => {
    const relief = makeReliefTexture();
    relief.repeat.set((OPENING_X - L) / 6, 1);
    return {
      wall: new MeshStandardMaterial({ color: new Color(palette.ivory).lerp(new Color(palette.lavender), 0.14), roughness: 0.85, side: DoubleSide }),
      stone: new MeshStandardMaterial({ color: palette.ivory, roughness: 0.7, metalness: 0.02 }),
      niche: new MeshStandardMaterial({ color: new Color(palette.lavender).lerp(new Color(palette.navy), 0.55), roughness: 0.95 }),
      gold: new MeshStandardMaterial({ color: palette.gold, roughness: 0.35, metalness: 0.35, emissive: new Color(palette.gold), emissiveIntensity: 0.18 }),
      relief: new MeshStandardMaterial({ map: relief, roughness: 0.8 }),
      window: new MeshStandardMaterial({ color: palette.ivory, emissive: new Color(palette.ivory), emissiveIntensity: 1, toneMapped: false, side: DoubleSide }),
    };
  }, []);
  useEffect(
    () => () =>
      Object.values(materials).forEach((m) => {
        m.map?.dispose();
        m.dispose();
      }),
    [materials],
  );

  const uniforms = useMemo(
    () => ({
      shafts: WINDOWS.map(() => ({ uTime: { value: 0 }, uOpacity: { value: 0.13 }, uColor: { value: new Color(palette.ivory) } })),
      pool: { uOpacity: { value: 0.55 }, uGold: { value: new Color(palette.gold) }, uIvory: { value: new Color(palette.ivory) } },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (!group.current) return;
    const p = journey.position;
    // Only needed until the walk down the nave has begun.
    group.current.visible = p > CATHEDRAL_START && p < 1.35;
    const on = group.current.visible ? 1 : 0;
    if (lampA.current) lampA.current.intensity = 16 * on;
    if (lampB.current) lampB.current.intensity = 14 * on;
    if (!group.current.visible || reducedMotion) return;
    for (const m of shafts.current) if (m) m.uniforms.uTime.value += delta;
  });

  // A shaft from a window (back wall, high) down to its pool on the floor (toward the front).
  const shaftTop = { y: SPRING - 1.2, z: B };
  const shaftBottom = { y: FLOOR_Y, z: POOL_Z };
  const dz = shaftBottom.z - shaftTop.z;
  const dy = shaftBottom.y - shaftTop.y;
  const shaftLength = Math.hypot(dz, dy);
  const shaftAngle = Math.atan2(-dz, -dy); // tilt of the long axis away from vertical, in the y–z plane
  const lowerWall = SPRING - FLOOR_Y;

  return (
    <>
    <group ref={group} visible={false}>
      {/* Walls: back (windows), front (blind arcade, up to the nave opening), the two ends */}
      <mesh position={[(L + R) / 2, (SPRING + FLOOR_Y) / 2, B]} material={materials.wall}>
        <planeGeometry args={[R - L, lowerWall]} />
      </mesh>
      <mesh position={[(L + OPENING_X) / 2, (SPRING + FLOOR_Y) / 2, F]} material={materials.wall}>
        <planeGeometry args={[OPENING_X - L, lowerWall]} />
      </mesh>
      {[L, R].map((x) => (
        <mesh key={x} position={[x, (SPRING + RADIUS + FLOOR_Y) / 2, MID_Z]} rotation={[0, Math.PI / 2, 0]} material={materials.wall}>
          <planeGeometry args={[WIDTH, SPRING + RADIUS - FLOOR_Y]} />
        </mesh>
      ))}

      {/* The barrel vault and its transverse ribs on pilasters */}
      <mesh position={[(L + R) / 2, SPRING, MID_Z]} rotation={[0, 0, Math.PI / 2]} material={materials.wall}>
        <cylinderGeometry args={[RADIUS, RADIUS, R - L, 32, 1, true, 0, Math.PI]} />
      </mesh>
      <Instances limit={RIBS.length} material={materials.stone}>
        <torusGeometry args={[RADIUS - 0.05, 0.13, 8, 40, Math.PI]} />
        {RIBS.map((x) => (
          <Instance key={x} position={[x, SPRING, MID_Z]} rotation={[0, Math.PI / 2, 0]} />
        ))}
      </Instances>
      <Instances limit={RIBS.length * 2} material={materials.stone}>
        <boxGeometry args={[0.55, lowerWall, 0.28]} />
        {RIBS.flatMap((x) => [
          <Instance key={`b${x}`} position={[x, (SPRING + FLOOR_Y) / 2, B - 0.14]} />,
          ...(x < OPENING_X ? [<Instance key={`f${x}`} position={[x, (SPRING + FLOOR_Y) / 2, F + 0.14]} />] : []),
        ])}
      </Instances>
      <Instances limit={RIBS.length * 2} material={materials.gold}>
        <boxGeometry args={[0.66, 0.1, 0.36]} />
        {RIBS.flatMap((x) => [
          <Instance key={`b${x}`} position={[x, SPRING - 0.05, B - 0.16]} />,
          ...(x < OPENING_X ? [<Instance key={`f${x}`} position={[x, SPRING - 0.05, F + 0.16]} />] : []),
        ])}
      </Instances>

      {/* Tall arched windows down the back wall */}
      <Instances limit={WINDOWS.length} material={materials.window}>
        <planeGeometry args={[1.1, 3.4]} />
        {WINDOWS.map((x) => (
          <Instance key={x} position={[x, 1.6, B - 0.01]} rotation={[0, Math.PI, 0]} />
        ))}
      </Instances>
      <Instances limit={WINDOWS.length} material={materials.window}>
        <circleGeometry args={[0.55, 24, 0, Math.PI]} />
        {WINDOWS.map((x) => (
          <Instance key={x} position={[x, 3.3, B - 0.01]} rotation={[0, Math.PI, 0]} />
        ))}
      </Instances>

      {/* Light falling across the floor: a shaft from each window to a pool on the floor */}
      {WINDOWS.map((x, i) => (
        <group key={x} position={[x, (shaftTop.y + shaftBottom.y) / 2, (shaftTop.z + shaftBottom.z) / 2]} rotation={[0, Math.PI / 2, 0]}>
          <mesh rotation={[0, 0, shaftAngle]}>
            <planeGeometry args={[1.15, shaftLength]} />
            <shaderMaterial
              ref={(m) => {
                shafts.current[i] = m;
              }}
              vertexShader={planeVert}
              fragmentShader={shaftFrag}
              uniforms={uniforms.shafts[i]}
              transparent
              depthWrite={false}
              blending={AdditiveBlending}
              side={DoubleSide}
            />
          </mesh>
        </group>
      ))}
      <Instances limit={WINDOWS.length}>
        <planeGeometry args={[1.6, 3]} />
        <shaderMaterial vertexShader={planeVert} fragmentShader={glowFrag} uniforms={uniforms.pool} transparent depthWrite={false} blending={AdditiveBlending} />
        {WINDOWS.map((x) => (
          <Instance key={x} position={[x, FLOOR_Y + 0.02, POOL_Z]} rotation={[-Math.PI / 2, 0, 0]} />
        ))}
      </Instances>

      {/* Blind arcade on the front wall: dark arched niches with gold outlines, a carved frieze above */}
      <Instances limit={NICHES.length} material={materials.niche}>
        <planeGeometry args={[2.1, 3.2]} />
        {NICHES.map((x) => (
          <Instance key={x} position={[x, 0.7, F + 0.02]} />
        ))}
      </Instances>
      <Instances limit={NICHES.length} material={materials.niche}>
        <circleGeometry args={[1.05, 32, 0, Math.PI]} />
        {NICHES.map((x) => (
          <Instance key={x} position={[x, 2.3, F + 0.02]} />
        ))}
      </Instances>
      <Instances limit={NICHES.length} material={materials.gold}>
        <torusGeometry args={[1.1, 0.03, 6, 40, Math.PI]} />
        {NICHES.map((x) => (
          <Instance key={x} position={[x, 2.3, F + 0.04]} />
        ))}
      </Instances>
      <mesh position={[(L + OPENING_X) / 2, SPRING - 0.55, F + 0.03]} material={materials.relief}>
        <planeGeometry args={[OPENING_X - L, 0.9]} />
      </mesh>

      {/* The great round window at the end you walk toward */}
      <group position={[R - 0.02, 2.4, MID_Z]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh material={materials.window}>
          <circleGeometry args={[1.7, 48]} />
        </mesh>
        <mesh position={[0, 0, 0.02]} material={materials.gold}>
          <torusGeometry args={[1.72, 0.07, 8, 64]} />
        </mesh>
        <mesh position={[0, 0, 0.02]} material={materials.gold}>
          <torusGeometry args={[0.6, 0.05, 8, 48]} />
        </mesh>
        {Array.from({ length: 8 }, (_, k) => (
          <mesh key={k} position={[0, 0, 0.02]} rotation={[0, 0, (k * Math.PI) / 4]} material={materials.gold}>
            <boxGeometry args={[0.05, 3.4, 0.04]} />
          </mesh>
        ))}
      </group>

    </group>
      {/* Outside the group: dimmed, never hidden (see the note at the top of the file). */}
      {!lite && (
        <>
          <pointLight ref={lampA} position={[-19, 3, 0.6]} color={palette.ivory} intensity={0} distance={14} decay={2} />
          <pointLight ref={lampB} position={[-7, 3, 0.6]} color={palette.ivory} intensity={0} distance={14} decay={2} />
        </>
      )}
    </>
  );
}
