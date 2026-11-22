"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, type Group, type ShaderMaterial } from "three";
import { DESCENT } from "@/lib/embers";
import { smoothstep } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import embersVert from "@/shaders/embers.vert.glsl";
import embersFrag from "@/shaders/embers.frag.glsl";
import { seededRandom } from "../layout";

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

// Chapter IV: the embers. Black, ember red rising, a few bright gold sparks. Follows the camera.
export default function Embers({ lite, reducedMotion }: Props) {
  const group = useRef<Group>(null);
  const materials = useRef<(ShaderMaterial | null)[]>([]);
  const emberCount = lite ? 350 : 1300;
  const sparkCount = lite ? 60 : 180;
  const counts = [emberCount, sparkCount];
  const fields = useMemo(() => [field(emberCount, 41), field(sparkCount, 43)], [emberCount, sparkCount]);

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
    group.current.position.set(0, state.camera.position.y, state.camera.position.z);
    for (const m of materials.current) {
      if (!m) continue;
      if (!reducedMotion) m.uniforms.uTime.value += delta;
      m.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
      m.uniforms.uOpacity.value = presence;
    }
  });

  return (
    <group ref={group} visible={false}>
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
