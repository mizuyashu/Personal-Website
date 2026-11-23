"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, ShaderMaterial, type Group, type Mesh, type PointLight } from "three";
import { BONFIRE, kindleSwell } from "@/lib/bonfire";
import { clamp01, smoothstep } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { chapters } from "@/content/chapters";
import { journey } from "@/lib/scroll";
import planeVert from "@/shaders/plane.vert.glsl";
import flameFrag from "@/shaders/flame.frag.glsl";
import glowFrag from "@/shaders/glow.frag.glsl";
import embersVert from "@/shaders/embers.vert.glsl";
import embersFrag from "@/shaders/embers.frag.glsl";
import burstVert from "@/shaders/burst.vert.glsl";
import { seededRandom, basePath } from "../layout";

const CHAPTER = 4;

/**
 * Flame layers at slightly different depths (parallax gives the fire volume as the camera moves):
 * a wide dim back flame, the main body, and a narrow hot core, each flickering on its own seed.
 */
const FLAME_LAYERS = [
  { z: -10.8, x: -0.2, scale: [1.35, 1.15], opacity: 0.45, seed: 3.1 },
  { z: -10, x: 0, scale: [1, 1], opacity: 0.6, seed: 0 },
  { z: -9.4, x: 0.15, scale: [0.6, 0.72], opacity: 0.55, seed: 7.3 },
] as const;
// Kept low and modest so it sits under the contact compass, not over it (Michael, 2026-11-23).
const FLAME_SIZE: [number, number] = [3.1, 4.1];
const FLAME_BASE_Y = -4.4;

// Chapter V: the bonfire. It ignites as hard as the radiance pop-in: the flame overshoots,
// a fan of sparks bursts out and the light flares, then it settles into a big, wild fire.
// Shader flame on crossed planes, a ground glow, a column of sparks. Follows the camera;
// fades as the golden flash takes over.
export default function Bonfire({ lite, reducedMotion }: { lite: boolean; reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const flameRoot = useRef<Group>(null);
  const glow = useRef<ShaderMaterial>(null);
  const glowMesh = useRef<Mesh>(null);
  const sparks = useRef<ShaderMaterial>(null);
  const burst = useRef<ShaderMaterial>(null);
  const light = useRef<PointLight>(null);
  const sparkCount = lite ? 160 : 520;
  const burstCount = lite ? 90 : 260;

  const sparkField = useMemo(() => {
    const random = seededRandom(77);
    const positions = new Float32Array(sparkCount * 3);
    const seeds = new Float32Array(sparkCount);
    for (let i = 0; i < sparkCount; i++) {
      // Dense over the fire, thinning out to the sides.
      positions[i * 3] = (random() - 0.5) * (random() < 0.7 ? 2.6 : 6);
      positions[i * 3 + 1] = (random() - 0.5) * 16;
      positions[i * 3 + 2] = -8.5 - random() * 3;
      seeds[i] = random();
    }
    return { positions, seeds };
  }, [sparkCount]);

  const burstField = useMemo(() => {
    const random = seededRandom(91);
    const positions = new Float32Array(burstCount * 3);
    const dirs = new Float32Array(burstCount * 3);
    const seeds = new Float32Array(burstCount);
    for (let i = 0; i < burstCount; i++) {
      positions.set([(random() - 0.5) * 0.6, FLAME_BASE_Y + 1.4 + random() * 0.8, -10 + (random() - 0.5) * 0.6], i * 3);
      // Mostly upward and outward: a fan, not a full sphere.
      const angle = Math.PI * (0.08 + random() * 0.84);
      const tilt = (random() - 0.5) * 0.8;
      dirs.set([Math.cos(angle), Math.sin(angle) * (0.7 + random() * 0.6), tilt], i * 3);
      seeds[i] = random();
    }
    return { positions, dirs, seeds };
  }, [burstCount]);

  const flameMaterials = useMemo(
    () =>
      FLAME_LAYERS.map(
        (layer) =>
          new ShaderMaterial({
            vertexShader: planeVert,
            fragmentShader: flameFrag,
            uniforms: {
              uTime: { value: 0 },
              uOpacity: { value: 0 },
              uWild: { value: 1 },
              uSeed: { value: layer.seed },
              uEmber: { value: new Color(palette.ember) },
              uGold: { value: new Color(palette.gold) },
              uIvory: { value: new Color(palette.ivory) },
            },
            transparent: true,
            depthWrite: false,
            blending: AdditiveBlending,
            fog: false,
          }),
      ),
    [],
  );
  useEffect(() => () => flameMaterials.forEach((m) => m.dispose()), [flameMaterials]);

  const uniforms = useMemo(
    () => ({
      glow: { uOpacity: { value: 0 }, uGold: { value: new Color(palette.ember) }, uIvory: { value: new Color(palette.gold) } },
      sparks: {
        uTime: { value: 0 },
        uSize: { value: 90 },
        uPixelRatio: { value: 1 },
        uOpacity: { value: 0 },
        uEmberShare: { value: 0.4 },
        uGold: { value: new Color(palette.gold) },
        uEmber: { value: new Color(palette.ember) },
      },
      burst: {
        uBurst: { value: 0 },
        uSize: { value: 120 },
        uPixelRatio: { value: 1 },
        uOpacity: { value: 1 },
        uEmberShare: { value: 0.3 },
        uGold: { value: new Color(palette.gold) },
        uEmber: { value: new Color(palette.ember) },
      },
    }),
    [],
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    const local = journey.position - CHAPTER;
    const presence = smoothstep(-0.1, 0.06, local) * (1 - smoothstep(BONFIRE.flashStart, BONFIRE.flashPeak, local));
    group.current.visible = presence > 0;
    if (!group.current.visible) return;
    // Follow the base path, not the camera: the camera's side moves then show parallax.
    const base = basePath(journey.position, chapters.length);
    group.current.position.set(0, base.y, base.z);

    // Ignition, driven by scroll like the intro flash: 0 → 1 across the start of the chapter.
    const ignite = reducedMotion ? 1 : clamp01((local - BONFIRE.igniteStart) / (BONFIRE.igniteEnd - BONFIRE.igniteStart));
    // Grows fast, overshoots (a brief flare, ~1.4×) and settles back to full size.
    // Kindling: grows slowly over the whole ignition, with a gentle swell near the end (no pop).
    const grow = smoothstep(0, 0.85, ignite);
    const pop = reducedMotion ? 0 : kindleSwell(ignite);

    const time = flameMaterials[0].uniforms.uTime.value + (reducedMotion ? 0 : delta);
    flameMaterials.forEach((m, i) => {
      m.uniforms.uTime.value = time;
      m.uniforms.uOpacity.value = presence * FLAME_LAYERS[i].opacity;
      m.uniforms.uWild.value = 1 + pop * 1.5;
    });
    if (flameRoot.current) {
      const s = Math.max(0.001, grow * (1 + pop));
      flameRoot.current.scale.set(s * (1 + pop * 0.4), s, 1);
      // Keep the base on the ground while it grows.
      flameRoot.current.position.y = FLAME_BASE_Y * (1 - s);
    }
    if (glow.current) glow.current.uniforms.uOpacity.value = presence * (0.9 + pop * 0.8);
    if (glowMesh.current) glowMesh.current.scale.set(11 * (1 + pop * 0.6), 5 * (1 + pop * 0.6), 1);
    if (sparks.current) {
      sparks.current.uniforms.uTime.value = time * 2.6;
      sparks.current.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
      sparks.current.uniforms.uOpacity.value = presence * grow;
    }
    if (burst.current) {
      burst.current.uniforms.uBurst.value = reducedMotion ? 0 : ignite;
      burst.current.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    }
    if (light.current) {
      const flicker = reducedMotion ? 0 : Math.sin(time * 9) * 3 + Math.sin(time * 23.7) * 1.5;
      light.current.intensity = presence * grow * (20 + flicker + pop * 30);
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={glowMesh} position={[0, FLAME_BASE_Y + 0.2, -12]} scale={[11, 5, 1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial ref={glow} vertexShader={planeVert} fragmentShader={glowFrag} uniforms={uniforms.glow} transparent depthWrite={false} blending={AdditiveBlending} fog={false} />
      </mesh>
      {/* Scaled about the flame base on the ground (y = FLAME_BASE_Y), so it grows upward. */}
      <group ref={flameRoot}>
        {FLAME_LAYERS.map((layer, i) => (
          <mesh
            key={i}
            position={[layer.x, FLAME_BASE_Y + (FLAME_SIZE[1] * layer.scale[1]) / 2, layer.z]}
            scale={[layer.scale[0], layer.scale[1], 1]}
            material={flameMaterials[i]}
          >
            <planeGeometry args={FLAME_SIZE} />
          </mesh>
        ))}
      </group>
      <points key={`sparks-${sparkCount}`} position={[0, 2, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkField.positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[sparkField.seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial ref={sparks} vertexShader={embersVert} fragmentShader={embersFrag} uniforms={uniforms.sparks} transparent depthWrite={false} blending={AdditiveBlending} />
      </points>
      <points key={`burst-${burstCount}`} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[burstField.positions, 3]} />
          <bufferAttribute attach="attributes-aDir" args={[burstField.dirs, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[burstField.seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial ref={burst} vertexShader={burstVert} fragmentShader={embersFrag} uniforms={uniforms.burst} transparent depthWrite={false} blending={AdditiveBlending} />
      </points>
      <pointLight ref={light} position={[0, FLAME_BASE_Y + 2, -9]} color={palette.gold} intensity={0} distance={24} decay={1.5} />
    </group>
  );
}
