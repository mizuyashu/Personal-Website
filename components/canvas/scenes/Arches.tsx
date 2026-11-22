"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instance, Instances } from "@react-three/drei";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Group,
  type ShaderMaterial,
} from "three";
import { chapters } from "@/content/chapters";
import { INTRO } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import planeVert from "@/shaders/plane.vert.glsl";
import shaftFrag from "@/shaders/shaft.frag.glsl";
import towerVert from "@/shaders/tower.vert.glsl";
import towerFrag from "@/shaders/tower.frag.glsl";
import { CROSSING_Z, FLOOR_Y, NAVE_HALF, SKYLIGHT_Y, VAULT_Y, seededRandom } from "../layout";

// Chapter II opening: the cathedral. A tall nave (fluted colonnade, ribbed barrel vault, aisles
// with tall windows, inlaid marble floor), four portal arches marking chapters II–V, and the
// crossing, where a round stone lift carries you up the lantern tower toward the skylight
// (Blueprint.tsx): a slow heavy start, then a surge, the tower's lit windows streaming past.
// All geometry is generated; the tower walls are one self-lit shader.

// The hall starts behind the entry pose (layout.ts ENTRY), so chapter II opens inside the nave.
const HALL_START_Z = -3;
const HALL_END_Z = -35;
const AISLE_X = 6.8;
const TOWER_FRONT_Z = CROSSING_Z + NAVE_HALF;
const TOWER_BACK_Z = CROSSING_Z - NAVE_HALF;
const STOREY = 8;

const PORTAL_Z = [-12.5, -16, -19.5, -23]; // chapters II–V
const PORTAL_RADIUS = 2.6;
const PORTAL_SPRING = FLOOR_Y + 3.6;

const colonnadeZ = Array.from({ length: 18 }, (_, i) => -4 - i * 1.75);
const ribZ = colonnadeZ.filter((z) => z > TOWER_FRONT_Z + 0.5 || z < TOWER_BACK_Z - 0.5);
const WINDOW_Z = colonnadeZ.slice(0, -1).map((z) => z - 0.875);
const LIFT_RADIUS = 2.1;

type Column = { x: number; z: number; bottom: number; top: number; r: number };
const COLUMNS: Column[] = [
  ...colonnadeZ.flatMap((z) => [-1, 1].map((side) => ({ x: side * NAVE_HALF, z, bottom: FLOOR_Y, top: VAULT_Y, r: 0.3 }))),
  ...PORTAL_Z.flatMap((z) => [-1, 1].map((side) => ({ x: side * PORTAL_RADIUS, z, bottom: FLOOR_Y, top: PORTAL_SPRING, r: 0.22 }))),
];

const SHAFTS = [
  { x: -1.8, z: -14.25, lean: -0.38 },
  { x: -1.3, z: -17.75, lean: -0.38 },
  { x: -1.6, z: -21.25, lean: -0.38 },
  { x: 1.4, z: -15.5, lean: 0.34 },
  { x: 1.7, z: -20.5, lean: 0.34 },
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

/** One marble floor tile (repeats): ivory with a lavender diagonal inlay and gold studs. */
function makeFloorTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = palette.ivory;
  ctx.fillRect(0, 0, size, size);
  // Faint veining.
  const random = seededRandom(5);
  ctx.strokeStyle = "rgba(185, 180, 232, 0.18)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    let x = random() * size;
    let y = random() * size;
    ctx.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      x += (random() - 0.3) * 60;
      y += (random() - 0.5) * 60;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // Diamond inlay and tile joints.
  ctx.strokeStyle = palette.lavender;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size, size / 2);
  ctx.lineTo(size / 2, size);
  ctx.lineTo(0, size / 2);
  ctx.closePath();
  ctx.stroke();
  ctx.strokeStyle = "rgba(11, 10, 10, 0.12)";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);
  ctx.fillStyle = palette.gold;
  for (const [x, y] of [[0, 0], [size, 0], [0, size], [size, size], [size / 2, size / 2]]) {
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

/** The lift's top face: an 8-point compass star in rings, gold on ivory stone. */
function makeLiftTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;
  ctx.fillStyle = palette.ivory;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = palette.gold;
  for (const [r, w] of [[c - 8, 8], [c - 34, 3], [c * 0.42, 3]] as const) {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Compass star: four long points, four short.
  ctx.fillStyle = palette.gold;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8 - Math.PI / 2;
    const r = i % 2 === 1 ? c * 0.1 : i % 4 === 0 ? c * 0.86 : c * 0.5;
    const x = c + Math.cos(angle) * r;
    const y = c + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1;
  // Ticks around the rim.
  ctx.lineWidth = 3;
  for (let i = 0; i < 64; i++) {
    const angle = (i * Math.PI * 2) / 64;
    const inner = i % 8 === 0 ? c - 60 : c - 46;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(angle) * inner, c + Math.sin(angle) * inner);
    ctx.lineTo(c + Math.cos(angle) * (c - 34), c + Math.sin(angle) * (c - 34));
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Soft round sprite for the tower motes. */
function makeMoteMaterialMap() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.55)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new CanvasTexture(canvas);
}

type Props = { lite: boolean; reducedMotion: boolean };

export default function Arches({ lite, reducedMotion }: Props) {
  const group = useRef<Group>(null);
  const lift = useRef<Group>(null);
  const shaftMaterials = useRef<(ShaderMaterial | null)[]>([]);

  const numerals = useMemo(() => chapters.slice(1).map((c) => ({ numeral: c.numeral, texture: makeNumeral(c.numeral) })), []);
  useEffect(() => {
    // Redraw once the web font is ready (the canvas may have drawn with a fallback), and clean up.
    document.fonts.ready.then(() => numerals.forEach((n) => drawNumeral(n.texture, n.numeral)));
    return () => numerals.forEach((n) => n.texture.dispose());
  }, [numerals]);

  const materials = useMemo(() => {
    const floorMap = makeFloorTexture();
    floorMap.repeat.set((AISLE_X * 2) / 1.75, (HALL_START_Z - HALL_END_Z) / 1.75);
    const liftMap = makeLiftTexture();
    return {
      stone: new MeshStandardMaterial({ color: palette.ivory, roughness: 0.7, metalness: 0.02 }),
      // Faceted shading reads as fluting on the columns.
      fluted: new MeshStandardMaterial({ color: palette.ivory, roughness: 0.6, metalness: 0.02, flatShading: true }),
      vault: new MeshStandardMaterial({ color: new Color(palette.ivory).lerp(new Color(palette.lavender), 0.25), roughness: 0.8, side: DoubleSide }),
      wall: new MeshStandardMaterial({ color: new Color(palette.ivory).lerp(new Color(palette.lavender), 0.12), roughness: 0.85, side: DoubleSide }),
      gold: new MeshStandardMaterial({ color: palette.gold, roughness: 0.35, metalness: 0.35, emissive: new Color(palette.gold), emissiveIntensity: 0.18 }),
      floor: new MeshStandardMaterial({ map: floorMap, roughness: 0.35, metalness: 0.08 }),
      liftTop: new MeshStandardMaterial({ map: liftMap, roughness: 0.4, metalness: 0.1 }),
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
      uBottom: { value: VAULT_Y },
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
      array[i * 3 + 1] = VAULT_Y + random() * (SKYLIGHT_Y - VAULT_Y - 1);
      array[i * 3 + 2] = CROSSING_Z + (random() - 0.5) * (NAVE_HALF * 2 - 0.6);
    }
    return array;
  }, [moteCount]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const p = journey.position;
    group.current.visible = p > INTRO.fadeOutStart && p < 2.15;
    if (!group.current.visible) return;
    // The lift carries the camera: it rides at eye height below it (and stays clear of the
    // pull-offs before each project, which swing the camera down and out to the side).
    if (lift.current) lift.current.position.y = Math.max(FLOOR_Y, state.camera.position.y + FLOOR_Y);
    if (reducedMotion) return;
    for (const material of shaftMaterials.current) if (material) material.uniforms.uTime.value += delta;
  });

  const towerHeight = SKYLIGHT_Y - VAULT_Y;
  const hallLength = HALL_START_Z - HALL_END_Z;

  return (
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

      {/* Barrel vault over the nave (split at the crossing, where the tower rises), with ribs */}
      {[
        { from: HALL_START_Z, to: TOWER_FRONT_Z },
        { from: TOWER_BACK_Z, to: HALL_END_Z },
      ].map(({ from, to }) => (
        <mesh key={from} position={[0, VAULT_Y, (from + to) / 2]} rotation={[Math.PI / 2, 0, 0]} material={materials.vault}>
          <cylinderGeometry args={[NAVE_HALF, NAVE_HALF, from - to, 48, 1, true, Math.PI / 2, Math.PI]} />
        </mesh>
      ))}
      <Instances limit={ribZ.length} material={materials.stone}>
        <torusGeometry args={[NAVE_HALF - 0.06, 0.11, 8, 56, Math.PI]} />
        {ribZ.map((z) => (
          <Instance key={z} position={[0, VAULT_Y, z]} />
        ))}
      </Instances>
      {/* Crown rib running down the vault */}
      <mesh position={[0, VAULT_Y + NAVE_HALF - 0.08, (HALL_START_Z + TOWER_FRONT_Z) / 2]} material={materials.gold}>
        <boxGeometry args={[0.08, 0.08, HALL_START_Z - TOWER_FRONT_Z]} />
      </mesh>

      {/* Aisles: outer walls with tall windows, flat aisle ceilings */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * AISLE_X, (VAULT_Y + FLOOR_Y) / 2, (HALL_START_Z + HALL_END_Z) / 2]} rotation={[0, -side * (Math.PI / 2), 0]} material={materials.wall}>
            <planeGeometry args={[hallLength, VAULT_Y - FLOOR_Y]} />
          </mesh>
          <mesh position={[side * (NAVE_HALF + AISLE_X) / 2, VAULT_Y, (HALL_START_Z + HALL_END_Z) / 2]} rotation={[Math.PI / 2, 0, 0]} material={materials.wall}>
            <planeGeometry args={[AISLE_X - NAVE_HALF, hallLength]} />
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
      {/* End wall */}
      <mesh position={[0, (VAULT_Y + NAVE_HALF + FLOOR_Y) / 2, HALL_END_Z]} material={materials.wall}>
        <planeGeometry args={[AISLE_X * 2, VAULT_Y + NAVE_HALF - FLOOR_Y]} />
      </mesh>

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

      {/* Crossing arches framing the tower */}
      {[TOWER_FRONT_Z, TOWER_BACK_Z].map((z) => (
        <group key={z}>
          <mesh position={[0, VAULT_Y, z]} material={materials.stone}>
            <torusGeometry args={[NAVE_HALF, 0.26, 14, 64, Math.PI]} />
          </mesh>
          <mesh position={[0, VAULT_Y, z + 0.2]} material={materials.gold}>
            <torusGeometry args={[NAVE_HALF - 0.28, 0.045, 8, 64, Math.PI]} />
          </mesh>
        </group>
      ))}

      {/* The lantern tower: four self-lit walls rising to the skylight */}
      {[
        { position: [0, 0, TOWER_FRONT_Z], rotation: 0 },
        { position: [0, 0, TOWER_BACK_Z], rotation: Math.PI },
        { position: [-NAVE_HALF, 0, CROSSING_Z], rotation: Math.PI / 2 },
        { position: [NAVE_HALF, 0, CROSSING_Z], rotation: -Math.PI / 2 },
      ].map((wall, i) => (
        <mesh key={i} position={[wall.position[0], VAULT_Y + towerHeight / 2, wall.position[2]]} rotation={[0, wall.rotation, 0]}>
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

      {/* Floor: inlaid marble, a gold line down the nave to the lift */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, (HALL_START_Z + HALL_END_Z) / 2]} material={materials.floor}>
        <planeGeometry args={[AISLE_X * 2, hallLength]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.005, (HALL_START_Z + CROSSING_Z + LIFT_RADIUS) / 2]} material={materials.gold}>
        <planeGeometry args={[0.06, CROSSING_Z + LIFT_RADIUS - HALL_START_Z]} />
      </mesh>

      {/* The lift: a round stone dais with a compass star inlay and a gold rim */}
      <group ref={lift} position={[0, FLOOR_Y, CROSSING_Z]}>
        <mesh position={[0, -0.6, 0]} material={materials.stone}>
          <cylinderGeometry args={[LIFT_RADIUS, LIFT_RADIUS * 0.94, 1.2, 64]} />
        </mesh>
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.liftTop}>
          <circleGeometry args={[LIFT_RADIUS, 64]} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.gold}>
          <torusGeometry args={[LIFT_RADIUS, 0.06, 8, 96]} />
        </mesh>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.004, CROSSING_Z]} material={materials.gold}>
        <ringGeometry args={[LIFT_RADIUS + 0.12, LIFT_RADIUS + 0.2, 96]} />
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
        <mesh key={angle} position={[0, (FLOOR_Y + SKYLIGHT_Y) / 2, CROSSING_Z]} rotation={[0, angle, 0]}>
          <planeGeometry args={[NAVE_HALF * 1.3, SKYLIGHT_Y - FLOOR_Y]} />
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

      {/* Soft fill: ivory from above, lavender bounce from below; warm light pooled on the lift */}
      <hemisphereLight args={[palette.ivory, palette.lavender, 1.2]} />
      <pointLight position={[0, 5, CROSSING_Z]} color={palette.gold} intensity={lite ? 24 : 40} distance={16} decay={2} />
      {!lite && <pointLight position={[0, 4, -15]} color={palette.ivory} intensity={18} distance={14} decay={2} />}
    </group>
  );
}
