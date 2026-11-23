"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, Vector2, type Group, type ShaderMaterial } from "three";
import { DESCENT } from "@/lib/embers";
import { smoothstep } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { chapters } from "@/content/chapters";
import { journey } from "@/lib/scroll";
import embersVert from "@/shaders/embers.vert.glsl";
import embersFrag from "@/shaders/embers.frag.glsl";
import worldVert from "@/shaders/world.vert.glsl";
import planeVert from "@/shaders/plane.vert.glsl";
import ashGroundFrag from "@/shaders/ashground.frag.glsl";
import ridgeFrag from "@/shaders/ridge.frag.glsl";
import eclipseFrag from "@/shaders/eclipse.frag.glsl";
import { seededRandom, basePath } from "../layout";

const CHAPTER = 3;

function field(count: number, seed: number) {
  const random = seededRandom(seed);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (random() - 0.5) * 22;
    positions[i * 3 + 1] = (random() - 0.5) * 16;
    positions[i * 3 + 2] = -3 - random() * 14;
    seeds[i] = random();
  }
  return { positions, seeds };
}

type Props = { lite: boolean; reducedMotion: boolean };

/** A few big soft embers close to the camera (out of focus): depth. */
function bokehField(count: number) {
  const random = seededRandom(47);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions.set([(random() - 0.5) * 12, (random() - 0.5) * 8, -2.5 - random() * 3.5], i * 3);
    seeds[i] = random();
  }
  return { positions, seeds };
}

// Chapter IV: the embers, the dying world again, now survived; stillness. Black, ember red
// rising, a few bright gold sparks and big soft embers close by; below, an ash plain with ember
// veins breathing in its cracks; far off, a jagged ridge against a crimson glow, and low behind it
// the dying sun from the void, faint (docs/vision.md §17). Follows the base path (layout.ts).
export default function Embers({ lite, reducedMotion }: Props) {
  const group = useRef<Group>(null);
  const materials = useRef<(ShaderMaterial | null)[]>([]);
  const emberCount = lite ? 350 : 1300;
  const sparkCount = lite ? 60 : 180;
  const counts = [emberCount, sparkCount];
  const fields = useMemo(() => [field(emberCount, 41), field(sparkCount, 43)], [emberCount, sparkCount]);

  const bokehCount = lite ? 6 : 16;
  const bokeh = useMemo(() => bokehField(bokehCount), [bokehCount]);
  const world = useRef<(ShaderMaterial | null)[]>([]);
  const worldUniforms = useMemo(
    () => ({
      ground: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uAsh: { value: new Color(palette.ink).lerp(new Color(palette.crimsonViolet), 0.1) },
        uEmber: { value: new Color(palette.ember) },
        uGold: { value: new Color(palette.gold) },
        uOrigin: { value: new Vector2() },
      },
      ridge: {
        uOpacity: { value: 0 },
        uGlow: { value: new Color(palette.crimsonViolet).lerp(new Color(palette.ember), 0.45) },
        uRim: { value: new Color(palette.ember).lerp(new Color(palette.gold), 0.4) },
        uDark: { value: new Color(palette.ink) },
      },
      sun: {
        uTime: { value: 0 },
        uLife: { value: 0.08 },
        uKindle: { value: 0 },
        uOpacity: { value: 0 },
        uDisc: { value: new Color(palette.ink).multiplyScalar(0.5) },
        uCorona: { value: new Color(palette.ember).lerp(new Color(palette.rose), 0.3) },
        uHot: { value: new Color(palette.gold) },
        uHaze: { value: new Color(palette.crimsonViolet) },
      },
      bokeh: {
        uTime: { value: 0 },
        uSize: { value: 220 },
        uPixelRatio: { value: 1 },
        uOpacity: { value: 0 },
        uEmberShare: { value: 0.6 },
        uGold: { value: new Color(palette.gold) },
        uEmber: { value: new Color(palette.ember) },
      },
    }),
    [],
  );

  const uniforms = useMemo(
    () =>
      [
        { size: 90, share: 0.55 },
        { size: 150, share: 0 },
      ].map(({ size, share }) => ({
        uTime: { value: 0 },
        uSize: { value: size },
        uPixelRatio: { value: 1 },
        uOpacity: { value: 0 },
        uEmberShare: { value: share },
        uGold: { value: new Color(palette.gold) },
        uEmber: { value: new Color(palette.ember) },
      })),
    [],
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    const local = journey.position - CHAPTER;
    const presence = smoothstep(DESCENT.whitePeak, DESCENT.dark + 0.03, local) * (1 - smoothstep(0.93, 1.05, local));
    group.current.visible = presence > 0;
    if (!group.current.visible) return;
    // Follow the base path, not the camera: the camera's side moves then show parallax.
    const base = basePath(journey.position, chapters.length);
    group.current.position.set(0, base.y, base.z);
    for (const m of [...materials.current, ...world.current]) {
      if (!m) continue;
      if (!reducedMotion && m.uniforms.uTime) m.uniforms.uTime.value += delta;
      if (m.uniforms.uPixelRatio) m.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
      m.uniforms.uOpacity.value = presence * (m.uniforms.uLife ? 0.7 : m.uniforms.uSize?.value === 220 ? 0.55 : 1);
      if (m.uniforms.uOrigin) (m.uniforms.uOrigin.value as Vector2).set(0, base.z);
    }
  });

  return (
    <group ref={group} visible={false}>
      {/* The ash plain with breathing ember veins */}
      <mesh position={[0, -7, -38]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[220, 72]} />
        <shaderMaterial ref={(m) => {
          world.current[0] = m;
        }} vertexShader={worldVert} fragmentShader={ashGroundFrag} uniforms={worldUniforms.ground} transparent depthWrite={false} fog={false} />
      </mesh>
      {/* The dying sun, low and faint behind the ridge */}
      <mesh position={[10, -7, -78]} scale={34} renderOrder={-2}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial ref={(m) => {
          world.current[1] = m;
        }} vertexShader={planeVert} fragmentShader={eclipseFrag} uniforms={worldUniforms.sun} transparent depthWrite={false} fog={false} />
      </mesh>
      {/* The far ridge against a crimson glow */}
      <mesh position={[0, -4, -72]} renderOrder={1}>
        <planeGeometry args={[240, 30]} />
        <shaderMaterial ref={(m) => {
          world.current[2] = m;
        }} vertexShader={planeVert} fragmentShader={ridgeFrag} uniforms={worldUniforms.ridge} transparent depthWrite={false} fog={false} />
      </mesh>
      {/* Big soft embers near the camera, out of focus */}
      <points key={`bokeh-${bokehCount}`}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[bokeh.positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[bokeh.seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial ref={(m) => {
          world.current[3] = m;
        }} vertexShader={embersVert} fragmentShader={embersFrag} uniforms={worldUniforms.bokeh} transparent depthWrite={false} blending={AdditiveBlending} />
      </points>
      {fields.map((f, i) => (
        <points key={`${i}-${counts[i]}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[f.positions, 3]} />
            <bufferAttribute attach="attributes-aSeed" args={[f.seeds, 1]} />
          </bufferGeometry>
          <shaderMaterial
            ref={(m) => {
              materials.current[i] = m;
            }}
            vertexShader={embersVert}
            fragmentShader={embersFrag}
            uniforms={uniforms[i]}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </points>
      ))}
    </group>
  );
}
