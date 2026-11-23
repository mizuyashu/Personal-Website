"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, Vector2, type Group, type ShaderMaterial } from "three";
import { chapters } from "@/content/chapters";
import { smoothstep } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import planeVert from "@/shaders/plane.vert.glsl";
import worldVert from "@/shaders/world.vert.glsl";
import glowFrag from "@/shaders/glow.frag.glsl";
import horizonFrag from "@/shaders/horizon.frag.glsl";
import cloudsFrag from "@/shaders/clouds.frag.glsl";
import raysFrag from "@/shaders/rays.frag.glsl";
import { basePath } from "../layout";

const CHAPTER = 2;
/** The sun's place, relative to the base path: low on the left, climbing as the chapter goes. */
const SUN = { x: -8, y: -7, z: -24 };
const SUN_DIRECTION = new Vector2(SUN.x, SUN.z).normalize();

// Chapter III: the dawn, high above the cathedral. A sea of clouds below, stretching to the
// horizon, lit warm on the side toward a low sun that climbs as the chapter goes on (the years
// passing), with soft rays and a warm band where the sky meets the clouds. Follows the base path
// (layout.ts), so the camera's pull-off shows the clouds in parallax.
export default function Dawn({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const group = useRef<Group>(null);
  const sun = useRef<Group>(null);
  const materials = useRef<(ShaderMaterial | null)[]>([]);
  const clouds = useRef<ShaderMaterial>(null);
  const rays = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      sun: { uOpacity: { value: 1 }, uGold: { value: new Color(palette.gold) }, uIvory: { value: new Color(palette.ivory) } },
      horizon: { uOpacity: { value: 1 }, uWarm: { value: new Color(palette.gold) }, uLight: { value: new Color(palette.ivory) } },
      rays: { uTime: { value: 0 }, uOpacity: { value: 1 }, uColor: { value: new Color(palette.ivory) } },
      clouds: {
        uTime: { value: 0 },
        uOpacity: { value: 1 },
        uLit: { value: new Color(palette.ivory).lerp(new Color(palette.gold), 0.35) },
        uShade: { value: new Color(palette.lavender).lerp(new Color(palette.sky), 0.35) },
        uHaze: { value: new Color(palette.sky).lerp(new Color(palette.ivory), 0.55) },
        uSun: { value: SUN_DIRECTION.clone() },
        uOrigin: { value: new Vector2(0, 0) },
      },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (!group.current) return;
    const p = journey.position;
    const visible = p > CHAPTER - 0.15 && p < CHAPTER + 1.05;
    group.current.visible = visible;
    if (!visible) return;
    // Follow the base path, not the camera: the camera's side moves then show parallax.
    const base = basePath(journey.position, chapters.length);
    group.current.position.set(0, base.y, base.z);

    const local = p - CHAPTER;
    const presence = smoothstep(-0.15, 0.1, local) * (1 - smoothstep(0.8, 1.02, local));
    const climb = smoothstep(0, 1, local);
    if (sun.current) sun.current.position.y = SUN.y + climb * 3.5;
    for (const m of materials.current) if (m) m.uniforms.uOpacity.value = presence;
    if (!reducedMotion) {
      if (clouds.current) clouds.current.uniforms.uTime.value += delta;
      if (rays.current) rays.current.uniforms.uTime.value += delta;
    }
    if (clouds.current) (clouds.current.uniforms.uOrigin.value as Vector2).set(0, base.z);
  });

  return (
    <group ref={group} visible={false}>
      {/* The sea of clouds below */}
      <mesh position={[0, -9, -90]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[280, 200, 1, 1]} />
        <shaderMaterial
          ref={(m) => {
            materials.current[0] = m;
            clouds.current = m;
          }}
          vertexShader={worldVert}
          fragmentShader={cloudsFrag}
          uniforms={uniforms.clouds}
          transparent
          depthWrite={false}
          fog={false}
        />
      </mesh>
      {/* Warm band where the sky meets the clouds, far away */}
      <mesh position={[0, -6, -150]}>
        <planeGeometry args={[600, 40]} />
        <shaderMaterial ref={(m) => {
            materials.current[1] = m;
          }} vertexShader={planeVert} fragmentShader={horizonFrag} uniforms={uniforms.horizon} transparent depthWrite={false} fog={false} />
      </mesh>
      {/* The low sun and its rays */}
      <group ref={sun} position={[SUN.x, SUN.y, SUN.z]}>
        <mesh scale={9}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial ref={(m) => {
            materials.current[2] = m;
          }} vertexShader={planeVert} fragmentShader={glowFrag} uniforms={uniforms.sun} transparent depthWrite={false} fog={false} />
        </mesh>
        <mesh scale={30} position={[0, 0, -0.1]}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            ref={(m) => {
              materials.current[3] = m;
              rays.current = m;
            }}
            vertexShader={planeVert}
            fragmentShader={raysFrag}
            uniforms={uniforms.rays}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
            fog={false}
          />
        </mesh>
      </group>
    </group>
  );
}
