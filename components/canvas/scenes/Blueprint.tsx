"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type Mesh, type ShaderMaterial } from "three";
import { CORRIDOR } from "@/lib/corridor";
import { smoothstep } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import planeVert from "@/shaders/plane.vert.glsl";
import skylightFrag from "@/shaders/skylight.frag.glsl";
import { CROSSING_Z, SKYLIGHT_SIZE, SKYLIGHT_Y, CATHEDRAL_START } from "../layout";

// The skylight at the top of the lantern tower. Gold mullions on blinding light while the lift
// climbs; as it arrives, the grid turns cobalt and becomes the blueprint (chapter II).
// M4 puts the projects on top of it.
export default function Blueprint({ reducedMotion }: { reducedMotion: boolean }) {
  const mesh = useRef<Mesh>(null);
  const material = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uBlueprint: { value: 0 },
      // Matches the on-screen grid of the original blueprint plate (measured).
      uCells: { value: 2 },
      uIvory: { value: new Color(palette.ivory) },
      uGold: { value: new Color(palette.gold) },
      uCobalt: { value: new Color(palette.cobalt) },
    }),
    [],
  );

  useFrame(() => {
    if (!mesh.current || !material.current) return;
    const p = journey.position;
    mesh.current.visible = p > CATHEDRAL_START && p < 2.15;
    // Reduced motion holds the finished blueprint as chapter II's key frame.
    material.current.uniforms.uBlueprint.value = reducedMotion ? 1 : smoothstep(CORRIDOR.arrive - 0.01, CORRIDOR.riseEnd + 0.01, p - 1);
  });

  return (
    <mesh ref={mesh} rotation={[Math.PI / 2, 0, 0]} position={[0, SKYLIGHT_Y, CROSSING_Z]} visible={false}>
      <planeGeometry args={[SKYLIGHT_SIZE, SKYLIGHT_SIZE]} />
      <shaderMaterial ref={material} vertexShader={planeVert} fragmentShader={skylightFrag} uniforms={uniforms} />
    </mesh>
  );
}
