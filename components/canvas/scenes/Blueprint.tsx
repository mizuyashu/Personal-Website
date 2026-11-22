"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type Mesh, type ShaderMaterial } from "three";
import { CORRIDOR } from "@/lib/corridor";
import { INTRO, smoothstep } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import planeVert from "@/shaders/plane.vert.glsl";
import skylightFrag from "@/shaders/skylight.frag.glsl";
import { CEILING_Y, CROSSING_Z, SKYLIGHT_SIZE } from "../layout";

// The skylight over the crossing. Gold mullions on light while you walk the corridor;
// as the camera rises into it, the grid turns cobalt and becomes the blueprint (chapter II).
// M4 puts the projects on top of it.
export default function Blueprint({ reducedMotion }: { reducedMotion: boolean }) {
  const mesh = useRef<Mesh>(null);
  const material = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uBlueprint: { value: 0 },
      uIvory: { value: new Color(palette.ivory) },
      uGold: { value: new Color(palette.gold) },
      uCobalt: { value: new Color(palette.cobalt) },
    }),
    [],
  );

  useFrame(() => {
    if (!mesh.current || !material.current) return;
    const p = journey.position;
    mesh.current.visible = p > INTRO.fadeOutStart && p < 2.15;
    // Reduced motion holds the finished blueprint as chapter II's key frame.
    material.current.uniforms.uBlueprint.value = reducedMotion ? 1 : smoothstep(CORRIDOR.tiltEnd, CORRIDOR.riseEnd, p - 1);
  });

  return (
    <mesh ref={mesh} rotation={[Math.PI / 2, 0, 0]} position={[0, CEILING_Y + 0.01, CROSSING_Z]} visible={false}>
      <planeGeometry args={[SKYLIGHT_SIZE, SKYLIGHT_SIZE]} />
      <shaderMaterial ref={material} vertexShader={planeVert} fragmentShader={skylightFrag} uniforms={uniforms} />
    </mesh>
  );
}
