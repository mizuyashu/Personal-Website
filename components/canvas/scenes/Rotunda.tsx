"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instance, Instances } from "@react-three/drei";
import { BackSide, Color, DoubleSide, LatheGeometry, MeshStandardMaterial, Path, Shape, ShapeGeometry, Vector2, type Group, type Mesh, type PointLight } from "three";
import { medallion } from "@/lib/medallion";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import { view } from "@/lib/view";
import { CROSSING_Z, FLOOR_Y, LIFT_R, NAVE_HALF, ROTUNDA_R, ROTUNDA_TOP, VAULT_Y, CATHEDRAL_START } from "../layout";
import { makeFloorTexture, makeLiftTexture, makeReliefTexture } from "./textures";

// The rotunda at the crossing (docs/vision.md §19): a big round hall where the nave arrives.
// In its centre the great lift, massive and carved as if giants once used it, sunk in a pit and
// ringed by giant carved markers. A ground colonnade and a second-floor gallery run round the
// wall; guardian statues stand in the ring (stand-ins until the real colossi are made as 3D
// assets); and just past the lift rises a giant throne on a stepped dais, the grand viewing
// area, empty, waiting. Above the rotunda's roof the lantern tower continues (Arches.tsx).

const GALLERY_INNER = 7.4;
const COLUMN_RING = 8.6;
/** Columns round the ring, leaving the nave's way in (angle 0 = toward the nave, +z) clear. */
const RING_ANGLES = Array.from({ length: 12 }, (_, k) => Math.PI / 12 + (k * Math.PI) / 6);
/** Statues between the columns, clear of the nave opening and of the throne behind the lift. */
const STATUE_ANGLES = [1.3, 1.95, 2.55, -1.3, -1.95, -2.55];
const MARKER_ANGLES = Array.from({ length: 8 }, (_, k) => Math.PI / 8 + (k * Math.PI) / 4);
const THRONE_Z = CROSSING_Z - 6.6;
/** The nave's opening in the rotunda wall (half-angle), up to the nave vault's crown. */
const OPENING = Math.asin(6.8 / ROTUNDA_R);

const ring = (angle: number, r: number) => [Math.sin(angle) * r, Math.cos(angle) * r + CROSSING_Z] as const;

/**
 * A guardian stand-in: a robed figure with broad shoulders and a hood, resting both hands on a
 * great sword planted point-down in front of it. Silhouette first; the real colossi come later
 * as 3D assets (docs/vision.md §19).
 */
function useStatueGeometry() {
  return useMemo(() => {
    const lathe = (points: number[][], segments = 28) => new LatheGeometry(points.map(([x, y]) => new Vector2(x, y)), segments);
    const robe = lathe([
      [1.35, 0],
      [1.4, 0.35],
      [1.12, 1.1],
      [0.88, 2.6],
      [0.82, 3.9],
      [1.05, 4.55],
      [1.28, 4.95],
      [1.22, 5.2],
      [0.62, 5.42],
      [0, 5.45],
    ]);
    const hood = lathe([
      [0, 0],
      [0.52, 0.02],
      [0.6, 0.45],
      [0.52, 0.9],
      [0.3, 1.18],
      [0.06, 1.32],
      [0, 1.32],
    ]);
    return { robe, hood };
  }, []);
}

// Lights stay outside the hidden group and are dimmed to 0 instead of hidden: three.js builds lit
// materials for a fixed number of lights, so a light appearing or vanishing recompiles every lit
// material (a 0.7–1 s freeze in the lift, 2026-11-23). Keep the light count constant.
export default function Rotunda({ lite }: { lite: boolean }) {
  const group = useRef<Group>(null);
  const throneLamp = useRef<PointLight>(null);
  const liftLamp = useRef<PointLight>(null);
  const lift = useRef<Group>(null);
  const liftTop = useRef<Mesh>(null);
  const statue = useStatueGeometry();

  const materials = useMemo(() => {
    const floorMap = makeFloorTexture();
    floorMap.repeat.set((ROTUNDA_R * 2) / 1.75, (ROTUNDA_R * 2) / 1.75);
    const relief = makeReliefTexture();
    relief.repeat.set(3, 1);
    const liftTop = makeLiftTexture();
    return {
      stone: new MeshStandardMaterial({ color: palette.ivory, roughness: 0.7, metalness: 0.02 }),
      fluted: new MeshStandardMaterial({ color: palette.ivory, roughness: 0.6, metalness: 0.02, flatShading: true }),
      wall: new MeshStandardMaterial({ color: new Color(palette.ivory).lerp(new Color(palette.lavender), 0.18), roughness: 0.85, side: DoubleSide }),
      aged: new MeshStandardMaterial({ color: new Color(palette.ivory).lerp(new Color(palette.lavender), 0.35), roughness: 0.9 }),
      gold: new MeshStandardMaterial({ color: palette.gold, roughness: 0.35, metalness: 0.35, emissive: new Color(palette.gold), emissiveIntensity: 0.18 }),
      // Deep, muted violet (velvet), not a flat bright purple.
      violet: new MeshStandardMaterial({ color: new Color(palette.violet).lerp(new Color(palette.navy), 0.6).lerp(new Color(palette.crimsonViolet), 0.2), roughness: 0.85 }),
      floor: new MeshStandardMaterial({ map: floorMap, roughness: 0.35, metalness: 0.08 }),
      relief: new MeshStandardMaterial({ map: relief, roughness: 0.8 }),
      // The lift's top: the compass inlay, which lights up as the medallion is raised.
      liftTop: new MeshStandardMaterial({ map: liftTop, roughness: 0.4, metalness: 0.1, emissive: new Color(palette.gold), emissiveIntensity: 0, emissiveMap: liftTop }),
      pit: new MeshStandardMaterial({ color: new Color(palette.navy).lerp(new Color(palette.ink), 0.4), roughness: 1, side: BackSide }),
      window: new MeshStandardMaterial({ color: palette.ivory, emissive: new Color(palette.ivory), emissiveIntensity: 1, toneMapped: false }),
    };
  }, []);
  useEffect(
    () => () => {
      Object.values(materials).forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
      statue.robe.dispose();
      statue.hood.dispose();
    },
    [materials, statue],
  );

  // The roof: a disc with a square hole where the tower rises.
  const roof = useMemo(() => {
    const shape = new Shape();
    shape.absarc(0, 0, ROTUNDA_R, 0, Math.PI * 2, false);
    const hole = new Path();
    hole.moveTo(-NAVE_HALF, -NAVE_HALF);
    hole.lineTo(NAVE_HALF, -NAVE_HALF);
    hole.lineTo(NAVE_HALF, NAVE_HALF);
    hole.lineTo(-NAVE_HALF, NAVE_HALF);
    hole.lineTo(-NAVE_HALF, -NAVE_HALF);
    shape.holes.push(hole);
    return new ShapeGeometry(shape, 48);
  }, []);
  useEffect(() => () => roof.dispose(), [roof]);

  useFrame((state) => {
    if (!group.current) return;
    const p = journey.position;
    group.current.visible = p > CATHEDRAL_START && p < 2.15;
    const on = group.current.visible ? 1 : 0;
    if (throneLamp.current) throneLamp.current.intensity = (lite ? 14 : 26) * on;
    if (liftLamp.current) liftLamp.current.intensity = (lite ? 24 : 40) * on;
    if (!group.current.visible) return;
    // The lift carries the camera: it rides at eye height below it (and stays clear of the
    // pull-offs before each project, which swing the camera down and out to the side).
    // While a sub-page is open the camera flies elsewhere: the lift stays where it was.
    if (lift.current && view.t === 0) lift.current.position.y = Math.max(FLOOR_Y, state.camera.position.y + FLOOR_Y);
    // The inlay answers the medallion: it glows as you raise it, and stays lit once registered.
    const top = liftTop.current?.material as MeshStandardMaterial | undefined;
    if (top) top.emissiveIntensity = medallion.raised ? 0.55 : medallion.progress * 0.6;
  });

  const lowerWallHeight = VAULT_Y + NAVE_HALF - FLOOR_Y;

  return (
    <>
    <group ref={group} visible={false}>
      {/* Floor ring round the lift's pit, and the pit itself (left open as the lift rises) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.003, CROSSING_Z]} material={materials.floor}>
        <ringGeometry args={[LIFT_R + 0.05, ROTUNDA_R, 96, 1]} />
      </mesh>
      <mesh position={[0, FLOOR_Y - 5, CROSSING_Z]} material={materials.pit}>
        <cylinderGeometry args={[LIFT_R + 0.05, LIFT_R + 0.05, 10, 64, 1, true]} />
      </mesh>

      {/* The great lift: a carved drum for giants, compass inlay on top, gold rim */}
      <group ref={lift} position={[0, FLOOR_Y, CROSSING_Z]}>
        <mesh position={[0, -1.1, 0]} material={materials.relief}>
          <cylinderGeometry args={[LIFT_R, LIFT_R, 2.2, 96, 1, true]} />
        </mesh>
        <mesh position={[0, -4.2, 0]} material={materials.aged}>
          <cylinderGeometry args={[LIFT_R * 0.96, LIFT_R * 0.8, 4, 64]} />
        </mesh>
        <mesh ref={liftTop} position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.liftTop}>
          <circleGeometry args={[LIFT_R, 96]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.gold}>
          <torusGeometry args={[LIFT_R, 0.08, 10, 128]} />
        </mesh>
        <mesh position={[0, -2.2, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.gold}>
          <torusGeometry args={[LIFT_R, 0.06, 8, 128]} />
        </mesh>
      </group>

      {/* A low carved curb round the pit and eight giant markers between the compass points */}
      <mesh position={[0, FLOOR_Y + 0.17, CROSSING_Z]} material={materials.relief}>
        <cylinderGeometry args={[LIFT_R + 1.5, LIFT_R + 1.6, 0.34, 96, 1, true]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.34, CROSSING_Z]} material={materials.stone}>
        <ringGeometry args={[LIFT_R + 0.05, LIFT_R + 1.5, 96, 1]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.345, CROSSING_Z]} material={materials.gold}>
        <ringGeometry args={[LIFT_R + 0.7, LIFT_R + 0.78, 128, 1]} />
      </mesh>
      <Instances limit={MARKER_ANGLES.length} material={materials.relief}>
        <boxGeometry args={[1.3, 1.1, 0.95]} />
        {MARKER_ANGLES.map((a) => {
          const [x, z] = ring(a, LIFT_R + 0.85);
          return <Instance key={a} position={[x, FLOOR_Y + 0.34 + 0.55, z]} rotation={[0, a, 0]} />;
        })}
      </Instances>
      <Instances limit={MARKER_ANGLES.length} material={materials.gold}>
        <boxGeometry args={[1.42, 0.1, 1.07]} />
        {MARKER_ANGLES.map((a) => {
          const [x, z] = ring(a, LIFT_R + 0.85);
          return <Instance key={a} position={[x, FLOOR_Y + 0.34 + 1.15, z]} rotation={[0, a, 0]} />;
        })}
      </Instances>

      {/* The round wall: open toward the nave below the vault's crown, closed above */}
      <mesh position={[0, FLOOR_Y + lowerWallHeight / 2, CROSSING_Z]} material={materials.wall}>
        <cylinderGeometry args={[ROTUNDA_R, ROTUNDA_R, lowerWallHeight, 96, 1, true, OPENING, Math.PI * 2 - OPENING * 2]} />
      </mesh>
      <mesh position={[0, (VAULT_Y + NAVE_HALF + ROTUNDA_TOP) / 2, CROSSING_Z]} material={materials.wall}>
        <cylinderGeometry args={[ROTUNDA_R, ROTUNDA_R, ROTUNDA_TOP - VAULT_Y - NAVE_HALF, 96, 1, true]} />
      </mesh>
      <Instances limit={RING_ANGLES.length * 2} material={materials.window}>
        <planeGeometry args={[1.1, 4.4]} />
        {RING_ANGLES.filter((a) => Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) > OPENING + 0.1).flatMap((a) => {
          const mid = a + Math.PI / 12;
          const [x, z] = ring(mid, ROTUNDA_R - 0.02);
          const [ux, uz] = ring(mid, ROTUNDA_R - 0.02);
          return [
            <Instance key={`g${a}`} position={[x, 2.8, z]} rotation={[0, mid + Math.PI, 0]} />,
            <Instance key={`u${a}`} position={[ux, VAULT_Y + 4.4, uz]} rotation={[0, mid + Math.PI, 0]} />,
          ];
        })}
      </Instances>

      {/* Ground colonnade and the upper colonnade on the gallery */}
      <Instances limit={RING_ANGLES.length * 2} material={materials.fluted}>
        <cylinderGeometry args={[0.32, 0.36, 1, 18]} />
        {RING_ANGLES.flatMap((a) => {
          const [x, z] = ring(a, COLUMN_RING);
          return [
            <Instance key={`g${a}`} position={[x, (FLOOR_Y + VAULT_Y) / 2, z]} scale={[1, VAULT_Y - FLOOR_Y, 1]} />,
            <Instance key={`u${a}`} position={[x, (VAULT_Y + ROTUNDA_TOP) / 2, z]} scale={[0.8, ROTUNDA_TOP - VAULT_Y, 0.8]} />,
          ];
        })}
      </Instances>
      <Instances limit={RING_ANGLES.length * 2} material={materials.gold}>
        <cylinderGeometry args={[0.5, 0.36, 0.5, 18]} />
        {RING_ANGLES.flatMap((a) => {
          const [x, z] = ring(a, COLUMN_RING);
          return [<Instance key={`g${a}`} position={[x, VAULT_Y - 0.25, z]} />, <Instance key={`u${a}`} position={[x, ROTUNDA_TOP - 0.25, z]} scale={[0.85, 1, 0.85]} />];
        })}
      </Instances>

      {/* The gallery: a second floor all the way round, with a balustrade */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, VAULT_Y, CROSSING_Z]} material={materials.wall}>
        <ringGeometry args={[GALLERY_INNER, ROTUNDA_R, 96, 1]} />
      </mesh>
      <mesh position={[0, VAULT_Y - 0.3, CROSSING_Z]} material={materials.stone}>
        <cylinderGeometry args={[GALLERY_INNER, GALLERY_INNER, 0.6, 96, 1, true]} />
      </mesh>
      <mesh position={[0, VAULT_Y + 1.05, CROSSING_Z]} rotation={[Math.PI / 2, 0, 0]} material={materials.gold}>
        <torusGeometry args={[GALLERY_INNER, 0.07, 8, 128]} />
      </mesh>
      <Instances limit={lite ? 36 : 72} material={materials.stone}>
        <cylinderGeometry args={[0.07, 0.09, 1, 8]} />
        {Array.from({ length: lite ? 36 : 72 }, (_, k) => {
          const a = (k / (lite ? 36 : 72)) * Math.PI * 2;
          const [x, z] = ring(a, GALLERY_INNER);
          return <Instance key={k} position={[x, VAULT_Y + 0.5, z]} />;
        })}
      </Instances>

      {/* The roof, with the square opening of the tower */}
      <mesh geometry={roof} rotation={[Math.PI / 2, 0, 0]} position={[0, ROTUNDA_TOP, CROSSING_Z]} material={materials.wall} />
      <mesh position={[0, ROTUNDA_TOP, CROSSING_Z]} rotation={[Math.PI / 2, 0, 0]} material={materials.gold}>
        <torusGeometry args={[ROTUNDA_R - 0.15, 0.1, 8, 128]} />
      </mesh>

      {/* Guardian statues (stand-ins), taller than the gallery rail */}
      {STATUE_ANGLES.map((a) => {
        const [x, z] = ring(a, ROTUNDA_R - 1.15);
        return (
          <group key={a} position={[x, FLOOR_Y, z]} rotation={[0, a + Math.PI, 0]} scale={1.35}>
            <mesh position={[0, 0.4, 0]} material={materials.relief}>
              <cylinderGeometry args={[1.55, 1.7, 0.8, 32]} />
            </mesh>
            <mesh geometry={statue.robe} position={[0, 0.8, 0]} material={materials.aged} />
            <mesh geometry={statue.hood} position={[0, 6.05, 0.05]} material={materials.aged} />
            {/* The great sword: blade planted point-down, crossguard, grip, pommel, both hands on it */}
            <mesh position={[0, 2.85, 1.05]} material={materials.stone}>
              <boxGeometry args={[0.22, 4.1, 0.07]} />
            </mesh>
            <mesh position={[0, 4.95, 1.05]} material={materials.gold}>
              <boxGeometry args={[1.1, 0.13, 0.16]} />
            </mesh>
            <mesh position={[0, 5.3, 1.05]} material={materials.aged}>
              <cylinderGeometry args={[0.07, 0.07, 0.6, 10]} />
            </mesh>
            <mesh position={[0, 5.65, 1.05]} material={materials.gold}>
              <sphereGeometry args={[0.13, 12, 10]} />
            </mesh>
            <mesh position={[0, 5.3, 0.98]} scale={[1.4, 0.8, 1]} material={materials.aged}>
              <sphereGeometry args={[0.26, 14, 10]} />
            </mesh>
          </group>
        );
      })}

      {/* The throne, just past the lift: a stepped dais, an empty seat, a back that climbs */}
      <group position={[0, FLOOR_Y, THRONE_Z]}>
        {[
          [7, 3.6, 0.4],
          [5.8, 2.8, 0.4],
          [4.6, 2.0, 0.4],
        ].map(([w, d, h], k) => (
          <mesh key={k} position={[0, h * k + h / 2, -0.2 * k]} material={materials.stone}>
            <boxGeometry args={[w, h, d]} />
          </mesh>
        ))}
        {/* A violet runner up the steps */}
        <mesh position={[0, 0.62, 0.9]} rotation={[-0.42, 0, 0]} material={materials.violet}>
          <boxGeometry args={[1.5, 0.04, 2.6]} />
        </mesh>
        <group position={[0, 1.2, -0.4]}>
          <mesh position={[0, 0.9, 0]} material={materials.stone}>
            <boxGeometry args={[3, 0.5, 1.8]} />
          </mesh>
          <mesh position={[0, 1.25, 0.05]} material={materials.violet}>
            <boxGeometry args={[2.4, 0.25, 1.5]} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 1.55, 1.6, 0.1]} material={materials.stone}>
              <boxGeometry args={[0.4, 0.9, 1.7]} />
            </mesh>
          ))}
          <mesh position={[0, 5.6, -0.75]} material={materials.stone}>
            <boxGeometry args={[3, 9, 0.4]} />
          </mesh>
          <mesh position={[0, 4.6, -0.52]} material={materials.violet}>
            <boxGeometry args={[2.1, 6.4, 0.08]} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 1.08, 4.6, -0.5]} material={materials.gold}>
              <boxGeometry args={[0.06, 6.5, 0.1]} />
            </mesh>
          ))}
          <mesh position={[0, 1.38, 0.05]} material={materials.gold}>
            <boxGeometry args={[2.5, 0.05, 1.55]} />
          </mesh>
          <mesh position={[0, 11.6, -0.75]} rotation={[0, Math.PI / 4, 0]} material={materials.stone}>
            <coneGeometry args={[2.1, 3, 4]} />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 1.8, 0, -0.75]}>
              <mesh position={[0, 6, 0]} material={materials.fluted}>
                <cylinderGeometry args={[0.24, 0.3, 10, 12]} />
              </mesh>
              <mesh position={[0, 11.8, 0]} material={materials.gold}>
                <coneGeometry args={[0.3, 1.6, 8]} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 7.9, -0.5]} material={materials.gold}>
            <torusGeometry args={[0.6, 0.06, 8, 48]} />
          </mesh>
        </group>
      </group>

    </group>
      {/* Outside the group: dimmed, never hidden (see the note at the top of the file).
          Light on the throne, and warm light pooled on the lift. */}
      <pointLight ref={throneLamp} position={[0, FLOOR_Y + 6, THRONE_Z + 2.5]} color={palette.gold} intensity={0} distance={12} decay={2} />
      <pointLight ref={liftLamp} position={[0, 6, CROSSING_Z]} color={palette.gold} intensity={0} distance={18} decay={2} />
    </>
  );
}
