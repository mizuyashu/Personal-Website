"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instance, Instances } from "@react-three/drei";
import { AdditiveBlending, CanvasTexture, Color, DoubleSide, SRGBColorSpace, type Group, type ShaderMaterial } from "three";
import { chapters } from "@/content/chapters";
import { INTRO } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import planeVert from "@/shaders/plane.vert.glsl";
import shaftFrag from "@/shaders/shaft.frag.glsl";
import { CEILING_Y, CROSSING_Z, FLOOR_Y, SKYLIGHT_SIZE } from "../layout";

// Chapter II opening: the cathedral corridor. Instanced arches, one per remaining chapter
// (II–V, numeral on each), a colonnade either side, light shafts through the fog, and the
// crossing under the skylight where the camera looks up (see Blueprint.tsx).

const ARCH_RADIUS = 2.2;
const COLUMN_HEIGHT = 3.6;
const SPRING_Y = FLOOR_Y + COLUMN_HEIGHT; // where the arch curve starts
const MARKER_ARCHES = [-12.5, -16, -19.5, -23]; // chapters II–V
const ARCH_Z = MARKER_ARCHES;
const COLONNADE_X = 3.7;
const HALL_HALF_WIDTH = 4.6;
const HALL_START_Z = -9;
const HALL_END_Z = -35;
const SKY_HALF = SKYLIGHT_SIZE / 2;

const colonnadeZ = Array.from({ length: 14 }, (_, i) => -11 - i * 1.75);
const WINDOW_Z = colonnadeZ.slice(0, -1).map((z) => z - 0.875); // between the colonnade columns
const SHAFTS = [
  { x: -1.6, z: -14.25, lean: -0.42 },
  { x: -1.2, z: -17.75, lean: -0.42 },
  { x: -1.4, z: -21.25, lean: -0.42 },
  { x: 1.3, z: -15.5, lean: 0.38 },
  { x: 1.5, z: -20.5, lean: 0.38 },
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

export default function Arches({ lite, reducedMotion }: Props) {
  const group = useRef<Group>(null);
  const shaftMaterials = useRef<(ShaderMaterial | null)[]>([]);

  const numerals = useMemo(() => chapters.slice(1).map((c) => ({ numeral: c.numeral, texture: makeNumeral(c.numeral) })), []);
  useEffect(() => {
    // Redraw once the web font is ready (the canvas may have drawn with a fallback), and clean up.
    document.fonts.ready.then(() => numerals.forEach((n) => drawNumeral(n.texture, n.numeral)));
    return () => numerals.forEach((n) => n.texture.dispose());
  }, [numerals]);

  const shafts = lite ? SHAFTS.slice(0, 3) : SHAFTS;
  const shaftUniforms = useMemo(
    () =>
      [...SHAFTS, { x: 0, z: 0, lean: 0 }, { x: 0, z: 0, lean: 0 }].map(() => ({
        uTime: { value: 0 },
        uOpacity: { value: 0.32 },
        uColor: { value: new Color(palette.ivory) },
      })),
    [],
  );

  useFrame((_, delta) => {
    if (!group.current) return;
    const p = journey.position;
    group.current.visible = p > INTRO.fadeOutStart && p < 2.15;
    if (!group.current.visible || reducedMotion) return;
    for (const material of shaftMaterials.current) if (material) material.uniforms.uTime.value += delta;
  });

  const stone = <meshStandardMaterial color={palette.ivory} roughness={0.65} metalness={0.05} />;
  const gold = <meshStandardMaterial color={palette.gold} roughness={0.3} metalness={0.8} />;

  return (
    <group ref={group} visible={false}>
      {/* Arch columns */}
      <Instances limit={ARCH_Z.length * 2}>
        <cylinderGeometry args={[0.22, 0.27, COLUMN_HEIGHT, 20]} />
        {stone}
        {ARCH_Z.flatMap((z) => [
          <Instance key={`l${z}`} position={[-ARCH_RADIUS, FLOOR_Y + COLUMN_HEIGHT / 2, z]} />,
          <Instance key={`r${z}`} position={[ARCH_RADIUS, FLOOR_Y + COLUMN_HEIGHT / 2, z]} />,
        ])}
      </Instances>
      {/* Arch curves (upper half-torus) and their gold trim */}
      <Instances limit={ARCH_Z.length}>
        <torusGeometry args={[ARCH_RADIUS, 0.17, 14, 40, Math.PI]} />
        {stone}
        {ARCH_Z.map((z) => (
          <Instance key={z} position={[0, SPRING_Y, z]} />
        ))}
      </Instances>
      <Instances limit={ARCH_Z.length}>
        <torusGeometry args={[ARCH_RADIUS - 0.2, 0.035, 8, 48, Math.PI]} />
        {gold}
        {ARCH_Z.map((z) => (
          <Instance key={z} position={[0, SPRING_Y, z + 0.12]} />
        ))}
      </Instances>
      {/* Colonnade either side, floor to ceiling */}
      <Instances limit={colonnadeZ.length * 2}>
        <cylinderGeometry args={[0.13, 0.15, CEILING_Y - FLOOR_Y, 14]} />
        {stone}
        {colonnadeZ.flatMap((z) => [
          <Instance key={`l${z}`} position={[-COLONNADE_X, (CEILING_Y + FLOOR_Y) / 2, z]} />,
          <Instance key={`r${z}`} position={[COLONNADE_X, (CEILING_Y + FLOOR_Y) / 2, z]} />,
        ])}
      </Instances>

      {/* Side walls behind the colonnade, with tall clerestory windows the shafts fall from */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * HALL_HALF_WIDTH, (CEILING_Y + FLOOR_Y) / 2, (HALL_START_Z + HALL_END_Z) / 2]}
          rotation={[0, -side * (Math.PI / 2), 0]}
        >
          <planeGeometry args={[HALL_START_Z - HALL_END_Z, CEILING_Y - FLOOR_Y]} />
          {stone}
        </mesh>
      ))}
      <Instances limit={WINDOW_Z.length * 2}>
        <planeGeometry args={[0.55, 2.8]} />
        <meshBasicMaterial color={palette.ivory} toneMapped={false} />
        {WINDOW_Z.flatMap((z) => [
          <Instance key={`l${z}`} position={[-HALL_HALF_WIDTH + 0.01, 2.2, z]} rotation={[0, Math.PI / 2, 0]} />,
          <Instance key={`r${z}`} position={[HALL_HALF_WIDTH - 0.01, 2.2, z]} rotation={[0, -Math.PI / 2, 0]} />,
        ])}
      </Instances>

      {/* Chapter numerals inside the marker arches */}
      {numerals.map((n, i) => (
        <mesh key={n.numeral} position={[0, SPRING_Y + 1.25, MARKER_ARCHES[i] + 0.2]}>
          <planeGeometry args={[1.2, 0.6]} />
          <meshBasicMaterial map={n.texture} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      ))}

      {/* Floor: stone, a gold line down the nave, a gold ring at the crossing */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, (HALL_START_Z + HALL_END_Z) / 2]}>
        <planeGeometry args={[HALL_HALF_WIDTH * 2, HALL_START_Z - HALL_END_Z]} />
        <meshStandardMaterial color={palette.ivory} roughness={0.45} metalness={0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.005, (HALL_START_Z + CROSSING_Z + 1.6) / 2]}>
        <planeGeometry args={[0.05, CROSSING_Z + 1.6 - HALL_START_Z]} />
        {gold}
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.006, CROSSING_Z]}>
        <ringGeometry args={[1.5, 1.56, 96]} />
        {gold}
      </mesh>

      {/* Ceiling around the skylight opening */}
      {[
        { x: 0, z: (HALL_START_Z + CROSSING_Z + SKY_HALF) / 2, w: HALL_HALF_WIDTH * 2, d: HALL_START_Z - (CROSSING_Z + SKY_HALF) },
        { x: 0, z: (CROSSING_Z - SKY_HALF + HALL_END_Z) / 2, w: HALL_HALF_WIDTH * 2, d: CROSSING_Z - SKY_HALF - HALL_END_Z },
        { x: -(SKY_HALF + HALL_HALF_WIDTH) / 2, z: CROSSING_Z, w: HALL_HALF_WIDTH - SKY_HALF, d: SKYLIGHT_SIZE },
        { x: (SKY_HALF + HALL_HALF_WIDTH) / 2, z: CROSSING_Z, w: HALL_HALF_WIDTH - SKY_HALF, d: SKYLIGHT_SIZE },
      ].map((piece, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[piece.x, CEILING_Y, piece.z]}>
          <planeGeometry args={[piece.w, piece.d]} />
          {stone}
        </mesh>
      ))}

      {/* Light: shafts leaning in from the clerestory, a crossed column of light under the skylight */}
      {shafts.map((s, i) => (
        <mesh key={i} position={[s.x, (CEILING_Y + FLOOR_Y) / 2 + 0.6, s.z]} rotation={[0, 0, s.lean]}>
          <planeGeometry args={[1.1, 7.5]} />
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
        <mesh key={angle} position={[0, (CEILING_Y + FLOOR_Y) / 2, CROSSING_Z]} rotation={[0, angle, 0]}>
          <planeGeometry args={[SKYLIGHT_SIZE * 0.8, CEILING_Y - FLOOR_Y]} />
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

      {/* Soft fill: ivory from above, lavender bounce from below (lights the vault's underside) */}
      <hemisphereLight args={[palette.ivory, palette.lavender, 1.1]} />
      <pointLight position={[0, CEILING_Y - 1, CROSSING_Z]} color={palette.gold} intensity={lite ? 18 : 30} distance={14} decay={2} />
    </group>
  );
}
