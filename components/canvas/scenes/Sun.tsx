"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type Group, type ShaderMaterial } from "three";
import { radianceAmount } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import planeVert from "@/shaders/plane.vert.glsl";
import sunFrag from "@/shaders/sun.frag.glsl";

type Props = { reducedMotion: boolean };

const DISTANCE = 10;
const SIZE = 13;

// Chapter I, beat 4: the compass-star sun behind the name, on the ivory ground. Follows the camera.
export default function Sun({ reducedMotion }: Props) {
  const group = useRef<Group>(null);
  const material = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uOpacity: { value: 0 }, uGold: { value: new Color(palette.gold) } }),
    [],
  );

  useFrame((state, delta) => {
    if (!group.current || !material.current) return;
    const opacity = radianceAmount(journey.position);
    group.current.visible = opacity > 0;
    if (opacity <= 0) return;
    group.current.position.z = state.camera.position.z;
    material.current.uniforms.uOpacity.value = opacity;
    if (!reducedMotion) material.current.uniforms.uTime.value += delta;
  });

  return (
    <group ref={group} visible={false}>
      <mesh position={[0, 0, -DISTANCE]} renderOrder={-1}>
        <planeGeometry args={[SIZE, SIZE]} />
        <shaderMaterial
          ref={material}
          vertexShader={planeVert}
          fragmentShader={sunFrag}
          uniforms={uniforms}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
