"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type Group, type Mesh, type ShaderMaterial } from "three";
import { smoothstep } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import planeVert from "@/shaders/plane.vert.glsl";
import glowFrag from "@/shaders/glow.frag.glsl";
import horizonFrag from "@/shaders/horizon.frag.glsl";

const CHAPTER = 2;

// Chapter III: the dawn. A low sun in the lower-left corner that climbs as the chapter goes on
// (the years passing), and a warm band along the horizon. Follows the camera.
export default function Dawn() {
  const group = useRef<Group>(null);
  const sun = useRef<Mesh>(null);
  const sunMaterial = useRef<ShaderMaterial>(null);
  const horizon = useRef<ShaderMaterial>(null);

  const sunUniforms = useMemo(
    () => ({ uOpacity: { value: 1 }, uGold: { value: new Color(palette.gold) }, uIvory: { value: new Color(palette.ivory) } }),
    [],
  );
  const horizonUniforms = useMemo(
    () => ({ uOpacity: { value: 1 }, uWarm: { value: new Color(palette.gold) }, uLight: { value: new Color(palette.ivory) } }),
    [],
  );

  useFrame((state) => {
    if (!group.current) return;
    const p = journey.position;
    const visible = p > CHAPTER - 0.15 && p < CHAPTER + 1.05;
    group.current.visible = visible;
    if (!visible) return;
    group.current.position.set(0, state.camera.position.y, state.camera.position.z);

    const local = p - CHAPTER;
    const presence = smoothstep(-0.15, 0.1, local) * (1 - smoothstep(0.8, 1.02, local));
    const climb = smoothstep(0, 1, local);
    if (sun.current) sun.current.position.y = -7 + climb * 3.5;
    if (sunMaterial.current) sunMaterial.current.uniforms.uOpacity.value = presence;
    if (horizon.current) horizon.current.uniforms.uOpacity.value = presence;
  });

  return (
    <group ref={group} visible={false}>
      <mesh position={[0, -9, -26]}>
        <planeGeometry args={[120, 16]} />
        <shaderMaterial
          ref={horizon}
          vertexShader={planeVert}
          fragmentShader={horizonFrag}
          uniforms={horizonUniforms}
          transparent
          depthWrite={false}
          fog={false}
        />
      </mesh>
      <mesh ref={sun} position={[-8, -7, -24]} scale={9}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={sunMaterial}
          vertexShader={planeVert}
          fragmentShader={glowFrag}
          uniforms={sunUniforms}
          transparent
          depthWrite={false}
          fog={false}
        />
      </mesh>
    </group>
  );
}
