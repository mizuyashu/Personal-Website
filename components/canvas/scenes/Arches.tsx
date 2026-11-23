"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instance, Instances } from "@react-three/drei";
import { AdditiveBlending, CanvasTexture, Color, DoubleSide, MeshStandardMaterial, SRGBColorSpace, type Group, type HemisphereLight, type PointLight, type ShaderMaterial } from "three";
import { chapters } from "@/content/chapters";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import planeVert from "@/shaders/plane.vert.glsl";
import shaftFrag from "@/shaders/shaft.frag.glsl";
import towerVert from "@/shaders/tower.vert.glsl";
import towerFrag from "@/shaders/tower.frag.glsl";
import { CATHEDRAL_START, CROSSING_Z, FLOOR_Y, LIFT_R, NARTHEX, NAVE_HALF, ROTUNDA_R, ROTUNDA_TOP, SKYLIGHT_Y, VAULT_Y, seededRandom } from "../layout";
import { makeFloorTexture, makeMoteMaterialMap } from "./textures";

// Chapter II opening: the cathedral. You come along the narthex and round the corner (left)
// into a tall nave (fluted colonnade, ribbed barrel vault, aisles with tall windows, inlaid
// marble floor) with four portal arches marking chapters II–V. It opens into the rotunda
// (Rotunda.tsx: the great lift, the gallery, the throne), and above the rotunda the lantern
// tower rises to the skylight (Blueprint.tsx). All geometry is generated; the tower walls are
// one self-lit shader.

/** The nave starts here; in front of it runs the narthex (the passage you come along). */
const HALL_START_Z = -3;
const AISLE_X = 6.8;
/** Where the nave and the aisles meet the rotunda's round wall. */
const NAVE_END_Z = CROSSING_Z + Math.sqrt(ROTUNDA_R ** 2 - NAVE_HALF ** 2);
const AISLE_END_Z = CROSSING_Z + Math.sqrt(ROTUNDA_R ** 2 - AISLE_X ** 2);
const STOREY = 8;

const PORTAL_Z = [-6.5, -9.5, -12.5, -15.5]; // chapters II–V
const PORTAL_RADIUS = 2.6;
const PORTAL_SPRING = FLOOR_Y + 3.6;

const colonnadeZ = Array.from({ length: 8 }, (_, i) => -4 - i * 1.75);
const ribZ = colonnadeZ;
const WINDOW_Z = colonnadeZ.slice(0, -1).map((z) => z - 0.875);

/** The column of light down the tower ends well below the camera at the top (never seen edge-on under the blueprint). */
const LIGHT_COLUMN_TOP = SKYLIGHT_Y - 12;

type Column = { x: number; z: number; bottom: number; top: number; r: number };
const COLUMNS: Column[] = [
  ...colonnadeZ.flatMap((z) => [-1, 1].map((side) => ({ x: side * NAVE_HALF, z, bottom: FLOOR_Y, top: VAULT_Y, r: 0.3 }))),
  ...PORTAL_Z.flatMap((z) => [-1, 1].map((side) => ({ x: side * PORTAL_RADIUS, z, bottom: FLOOR_Y, top: PORTAL_SPRING, r: 0.22 }))),
];

const SHAFTS = [
  { x: -1.8, z: -5.25, lean: -0.38 },
  { x: -1.3, z: -8.75, lean: -0.38 },
  { x: -1.6, z: -12.25, lean: -0.38 },
  { x: 1.4, z: -7.5, lean: 0.34 },
  { x: 1.7, z: -13.5, lean: 0.34 },
];

/** Gold Roman numeral on a transparent canvas, drawn in the site's Cinzel. */
function drawNumeral(texture: CanvasTexture, numeral: string) {
  const canvas = texture.image as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-cinzel").trim() || "serif";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `600 150px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = palette.gold;
  ctx.fillText(numeral, canvas.width / 2, canvas.height / 2 + 8);
  texture.needsUpdate = true;
}

function makeNumeral(numeral: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  drawNumeral(texture, numeral);
  return texture;
}

type Props = { lite: boolean; reducedMotion: boolean };

// Lights stay outside the hidden group and are dimmed to 0 instead of hidden: three.js builds lit
// materials for a fixed number of lights, so a light appearing or vanishing recompiles every lit
// material (a 0.7–1 s freeze in the lift, 2026-11-23). Keep the light count constant.
export default function Arches({ lite, reducedMotion }: Props) {
  const group = useRef<Group>(null);
  const fill = useRef<HemisphereLight>(null);
  const lamp = useRef<PointLight>(null);
  const shaftMaterials = useRef<(ShaderMaterial | null)[]>([]);

  const numerals = useMemo(() => chapters.slice(1).map((c) => ({ numeral: c.numeral, texture: makeNumeral(c.numeral) })), []);
  useEffect(() => {
    // Redraw once the web font is ready (the canvas may have drawn with a fallback), and clean up.
    document.fonts.ready.then(() => numerals.forEach((n) => drawNumeral(n.texture, n.numeral)));
    return () => numerals.forEach((n) => n.texture.dispose());
  }, [numerals]);

  const materials = useMemo(() => {
    const floorMap = makeFloorTexture();
    floorMap.repeat.set((AISLE_X - NARTHEX.left) / 1.75, (NARTHEX.back - AISLE_END_Z) / 1.75);
    return {
      stone: new MeshStandardMaterial({ color: palette.ivory, roughness: 0.7, metalness: 0.02 }),
      // Faceted shading reads as fluting on the columns.
      fluted: new MeshStandardMaterial({ color: palette.ivory, roughness: 0.6, metalness: 0.02, flatShading: true }),
      vault: new MeshStandardMaterial({ color: new Color(palette.ivory).lerp(new Color(palette.lavender), 0.25), roughness: 0.8, side: DoubleSide }),
      wall: new MeshStandardMaterial({ color: new Color(palette.ivory).lerp(new Color(palette.lavender), 0.12), roughness: 0.85, side: DoubleSide }),
      gold: new MeshStandardMaterial({ color: palette.gold, roughness: 0.35, metalness: 0.35, emissive: new Color(palette.gold), emissiveIntensity: 0.18 }),
      floor: new MeshStandardMaterial({ map: floorMap, roughness: 0.35, metalness: 0.08 }),
      mote: makeMoteMaterialMap(),
      window: new MeshStandardMaterial({ color: palette.ivory, emissive: new Color(palette.ivory), emissiveIntensity: 1, toneMapped: false }),
    };
  }, []);
  useEffect(
    () => () => {
      Object.values(materials).forEach((m) => {
        if (m instanceof CanvasTexture) return m.dispose();
        m.map?.dispose();
        m.dispose();
      });
    },
    [materials],
  );

  const towerUniforms = useMemo(
    () => ({
      uBottom: { value: ROTUNDA_TOP },
      uTop: { value: SKYLIGHT_Y },
      uStorey: { value: STOREY },
      uStone: { value: new Color(palette.ivory) },
      uShade: { value: new Color(palette.lavender).lerp(new Color(palette.navy), 0.45) },
      uGold: { value: new Color(palette.gold) },
      uLight: { value: new Color(palette.ivory) },
    }),
    [],
  );

  const shafts = lite ? SHAFTS.slice(0, 3) : SHAFTS;
  const shaftUniforms = useMemo(
    () =>
      [...SHAFTS, 0, 1].map((_, i) => ({
        uTime: { value: 0 },
        uOpacity: { value: i < SHAFTS.length ? 0.3 : 0.4 },
        uColor: { value: new Color(palette.ivory) },
      })),
    [],
  );

  // Gold motes hanging in the tower: they stream past as the lift surges.
  const moteCount = lite ? 220 : 700;
  const motes = useMemo(() => {
    const random = seededRandom(303);
    const array = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      array[i * 3] = (random() - 0.5) * (NAVE_HALF * 2 - 0.6);
      array[i * 3 + 1] = ROTUNDA_TOP + random() * (SKYLIGHT_Y - ROTUNDA_TOP - 1);
      array[i * 3 + 2] = CROSSING_Z + (random() - 0.5) * (NAVE_HALF * 2 - 0.6);
    }
    return array;
  }, [moteCount]);

  useFrame((_, delta) => {
    if (!group.current) return;
    const p = journey.position;
    group.current.visible = p > CATHEDRAL_START && p < 2.15;
    const on = group.current.visible ? 1 : 0;
    if (fill.current) fill.current.intensity = 1.2 * on;
    if (lamp.current) lamp.current.intensity = 18 * on;
    if (!group.current.visible || reducedMotion) return;
    for (const material of shaftMaterials.current) if (material) material.uniforms.uTime.value += delta;
  });

  const towerHeight = SKYLIGHT_Y - ROTUNDA_TOP;
  const naveLength = HALL_START_Z - NAVE_END_Z;
  const aisleLength = HALL_START_Z - AISLE_END_Z;

  return (
    <>
    <group ref={group} visible={false}>
      {/* Columns: fluted shafts, moulded bases on plinths, flared capitals under an abacus */}
      <Instances limit={COLUMNS.length} material={materials.fluted}>
        <cylinderGeometry args={[0.92, 1, 1, 18]} />
        {COLUMNS.map((c, i) => (
          <Instance key={i} position={[c.x, (c.bottom + c.top) / 2, c.z]} scale={[c.r, c.top - c.bottom, c.r]} />
        ))}
      </Instances>
      <Instances limit={COLUMNS.length} material={materials.stone}>
        <cylinderGeometry args={[1.3, 1.5, 1, 28]} />
        {COLUMNS.map((c, i) => (
          <Instance key={i} position={[c.x, c.bottom + 0.42, c.z]} scale={[c.r, 0.36, c.r]} />
        ))}
      </Instances>
      <Instances limit={COLUMNS.length * 2} material={materials.stone}>
        <boxGeometry args={[1, 1, 1]} />
        {COLUMNS.flatMap((c, i) => [
          <Instance key={`p${i}`} position={[c.x, c.bottom + 0.12, c.z]} scale={[c.r * 3.4, 0.24, c.r * 3.4]} />,
          <Instance key={`a${i}`} position={[c.x, c.top - 0.08, c.z]} scale={[c.r * 3.6, 0.16, c.r * 3.6]} />,
        ])}
      </Instances>
      <Instances limit={COLUMNS.length} material={materials.stone}>
        <cylinderGeometry args={[1.55, 1, 1, 28]} />
        {COLUMNS.map((c, i) => (
          <Instance key={i} position={[c.x, c.top - 0.38, c.z]} scale={[c.r, 0.44, c.r]} />
        ))}
      </Instances>
      <Instances limit={COLUMNS.length} material={materials.gold}>
        <cylinderGeometry args={[1.08, 1.08, 1, 28]} />
        {COLUMNS.map((c, i) => (
          <Instance key={i} position={[c.x, c.top - 0.63, c.z]} scale={[c.r, 0.07, c.r]} />
        ))}
      </Instances>

      {/* Barrel vault over the nave, with ribs */}
      <mesh position={[0, VAULT_Y, (HALL_START_Z + NAVE_END_Z) / 2]} rotation={[Math.PI / 2, 0, 0]} material={materials.vault}>
        <cylinderGeometry args={[NAVE_HALF, NAVE_HALF, naveLength, 48, 1, true, Math.PI / 2, Math.PI]} />
      </mesh>
      <Instances limit={ribZ.length} material={materials.stone}>
        <torusGeometry args={[NAVE_HALF - 0.06, 0.11, 8, 56, Math.PI]} />
        {ribZ.map((z) => (
          <Instance key={z} position={[0, VAULT_Y, z]} />
        ))}
      </Instances>
      {/* Crown rib running down the vault */}
      <mesh position={[0, VAULT_Y + NAVE_HALF - 0.08, (HALL_START_Z + NAVE_END_Z) / 2]} material={materials.gold}>
        <boxGeometry args={[0.08, 0.08, naveLength]} />
      </mesh>

      {/* Aisles: outer walls with tall windows, flat aisle ceilings */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * AISLE_X, (VAULT_Y + FLOOR_Y) / 2, (HALL_START_Z + AISLE_END_Z) / 2]} rotation={[0, -side * (Math.PI / 2), 0]} material={materials.wall}>
            <planeGeometry args={[aisleLength, VAULT_Y - FLOOR_Y]} />
          </mesh>
          <mesh position={[side * (NAVE_HALF + AISLE_X) / 2, VAULT_Y, (HALL_START_Z + AISLE_END_Z) / 2]} rotation={[Math.PI / 2, 0, 0]} material={materials.wall}>
            <planeGeometry args={[AISLE_X - NAVE_HALF, aisleLength]} />
          </mesh>
        </group>
      ))}
      <Instances limit={WINDOW_Z.length * 2} material={materials.window}>
        <planeGeometry args={[0.8, 4.6]} />
        {WINDOW_Z.flatMap((z) => [
          <Instance key={`l${z}`} position={[-AISLE_X + 0.01, 3.0, z]} rotation={[0, Math.PI / 2, 0]} />,
          <Instance key={`r${z}`} position={[AISLE_X - 0.01, 3.0, z]} rotation={[0, -Math.PI / 2, 0]} />,
        ])}
      </Instances>
      {/* Portal arches marking chapters II–V: moulded arch, gold inner ring, keystone, numeral */}
      <Instances limit={PORTAL_Z.length} material={materials.stone}>
        <torusGeometry args={[PORTAL_RADIUS, 0.22, 14, 48, Math.PI]} />
        {PORTAL_Z.map((z) => (
          <Instance key={z} position={[0, PORTAL_SPRING, z]} />
        ))}
      </Instances>
      <Instances limit={PORTAL_Z.length * 2} material={materials.gold}>
        <torusGeometry args={[PORTAL_RADIUS - 0.24, 0.035, 8, 56, Math.PI]} />
        {PORTAL_Z.flatMap((z) => [
          <Instance key={`f${z}`} position={[0, PORTAL_SPRING, z + 0.16]} />,
          <Instance key={`b${z}`} position={[0, PORTAL_SPRING, z - 0.16]} />,
        ])}
      </Instances>
      <Instances limit={PORTAL_Z.length} material={materials.gold}>
        <boxGeometry args={[0.34, 0.56, 0.5]} />
        {PORTAL_Z.map((z) => (
          <Instance key={z} position={[0, PORTAL_SPRING + PORTAL_RADIUS + 0.05, z]} />
        ))}
      </Instances>
      {numerals.map((n, i) => (
        <mesh key={n.numeral} position={[0, PORTAL_SPRING + 1.5, PORTAL_Z[i] + 0.2]}>
          <planeGeometry args={[1.2, 0.6]} />
          <meshBasicMaterial map={n.texture} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      ))}

      {/* The lantern tower: four self-lit walls rising to the skylight */}
      {[
        { position: [0, 0, CROSSING_Z + NAVE_HALF], rotation: 0 },
        { position: [0, 0, CROSSING_Z - NAVE_HALF], rotation: Math.PI },
        { position: [-NAVE_HALF, 0, CROSSING_Z], rotation: Math.PI / 2 },
        { position: [NAVE_HALF, 0, CROSSING_Z], rotation: -Math.PI / 2 },
      ].map((wall, i) => (
        <mesh key={i} position={[wall.position[0], ROTUNDA_TOP + towerHeight / 2, wall.position[2]]} rotation={[0, wall.rotation, 0]}>
          <planeGeometry args={[NAVE_HALF * 2, towerHeight]} />
          <shaderMaterial vertexShader={towerVert} fragmentShader={towerFrag} uniforms={towerUniforms} side={DoubleSide} />
        </mesh>
      ))}
      <points frustumCulled={false} key={`motes-${moteCount}`}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[motes, 3]} />
        </bufferGeometry>
        <pointsMaterial map={materials.mote} alphaTest={0.01} color={palette.gold} size={0.11} sizeAttenuation transparent opacity={0.85} depthWrite={false} blending={AdditiveBlending} fog={false} />
      </points>

      {/* Floor: inlaid marble (narthex, nave and aisles), a gold line down the nave to the lift */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(NARTHEX.left + AISLE_X) / 2, FLOOR_Y, (NARTHEX.back + AISLE_END_Z) / 2]} material={materials.floor}>
        <planeGeometry args={[AISLE_X - NARTHEX.left, NARTHEX.back - AISLE_END_Z]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.005, (HALL_START_Z + CROSSING_Z + LIFT_R + 1.6) / 2]} material={materials.gold}>
        <planeGeometry args={[0.06, CROSSING_Z + LIFT_R + 1.6 - HALL_START_Z]} />
      </mesh>

      {/* Light: shafts leaning in from the windows, a crossed column of light down the tower */}
      {shafts.map((s, i) => (
        <mesh key={i} position={[s.x, 3.4, s.z]} rotation={[0, 0, s.lean]}>
          <planeGeometry args={[1.2, 10]} />
          <shaderMaterial
            ref={(m) => {
              shaftMaterials.current[i] = m;
            }}
            vertexShader={planeVert}
            fragmentShader={shaftFrag}
            uniforms={shaftUniforms[i]}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
            side={DoubleSide}
          />
        </mesh>
      ))}
      {[Math.PI / 4, -Math.PI / 4].map((angle, i) => (
        <mesh key={angle} position={[0, (FLOOR_Y + LIGHT_COLUMN_TOP) / 2, CROSSING_Z]} rotation={[0, angle, 0]}>
          <planeGeometry args={[NAVE_HALF * 1.3, LIGHT_COLUMN_TOP - FLOOR_Y]} />
          <shaderMaterial
            ref={(m) => {
              shaftMaterials.current[SHAFTS.length + i] = m;
            }}
            vertexShader={planeVert}
            fragmentShader={shaftFrag}
            uniforms={shaftUniforms[SHAFTS.length + i]}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
            side={DoubleSide}
          />
        </mesh>
      ))}

    </group>
      {/* Soft fill: ivory from above, lavender bounce from below; a warm lamp in the nave.
          Outside the group: dimmed, never hidden (see the note at the top of the file). */}
      <hemisphereLight ref={fill} args={[palette.ivory, palette.lavender, 0]} />
      {!lite && <pointLight ref={lamp} position={[0, 4, -9]} color={palette.ivory} intensity={0} distance={14} decay={2} />}
    </>
  );
}
