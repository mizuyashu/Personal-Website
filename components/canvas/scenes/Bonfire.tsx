"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, type Group, type PointLight, type ShaderMaterial } from "three";
import { BONFIRE } from "@/lib/bonfire";
import { smoothstep } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import planeVert from "@/shaders/plane.vert.glsl";
import flameFrag from "@/shaders/flame.frag.glsl";
import glowFrag from "@/shaders/glow.frag.glsl";
import embersVert from "@/shaders/embers.vert.glsl";
import embersFrag from "@/shaders/embers.frag.glsl";
import { seededRandom } from "../layout";

const CHAPTER = 4;

// Chapter V: the bonfire. One warm light in the dark: a shader flame, a ground glow,
// sparks rising. Follows the camera; fades as the golden flash takes over.
export default function Bonfire({ lite, reducedMotion }: { lite: boolean; reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const flame = useRef<ShaderMaterial>(null);
  const glow = useRef<ShaderMaterial>(null);
  const sparks = useRef<ShaderMaterial>(null);
  const light = useRef<PointLight>(null);
  const sparkCount = lite ? 80 : 260;

  const sparkField = useMemo(() => {
    const random = seededRandom(77);
    const positions = new Float32Array(sparkCount * 3);
    const seeds = new Float32Array(sparkCount);
    for (let i = 0; i < sparkCount; i++) {
      positions[i * 3] = (random() - 0.5) * 2.2;
      positions[i * 3 + 1] = (random() - 0.5) * 16;
      positions[i * 3 + 2] = -9 - random() * 2;
      seeds[i] = random();
    }
    return { positions, seeds };
  }, [sparkCount]);

  const uniforms = useMemo(
    () => ({
      flame: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uEmber: { value: new Color(palette.ember) },
        uGold: { value: new Color(palette.gold) },
        uIvory: { value: new Color(palette.ivory) },
      },
      glow: { uOpacity: { value: 0 }, uGold: { value: new Color(palette.ember) }, uIvory: { value: new Color(palette.gold) } },
      sparks: {
        uTime: { value: 0 },
        uSize: { value: 80 },
        uPixelRatio: { value: 1 },
        uOpacity: { value: 0 },
        uEmberShare: { value: 0.4 },
        uGold: { value: new Color(palette.gold) },
        uEmber: { value: new Color(palette.ember) },
      },
    }),
    [],
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    const local = journey.position - CHAPTER;
    const presence = smoothstep(-0.1, 0.12, local) * (1 - smoothstep(BONFIRE.flashStart, BONFIRE.flashPeak, local));
    group.current.visible = presence > 0;
    if (!group.current.visible) return;
    group.current.position.set(0, state.camera.position.y, state.camera.position.z);
    const time = (flame.current?.uniforms.uTime.value ?? 0) + (reducedMotion ? 0 : delta);
    if (flame.current) {
      flame.current.uniforms.uTime.value = time;
      flame.current.uniforms.uOpacity.value = presence;
    }
    if (glow.current) glow.current.uniforms.uOpacity.value = presence * 0.9;
    if (sparks.current) {
      sparks.current.uniforms.uTime.value = time * 2;
      sparks.current.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
      sparks.current.uniforms.uOpacity.value = presence;
    }
    if (light.current) light.current.intensity = presence * (14 + (reducedMotion ? 0 : Math.sin(time * 9) * 2.5));
  });

  return (
    <group ref={group} visible={false}>
      <mesh position={[0, -3.2, -12]} scale={[9, 4, 1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial ref={glow} vertexShader={planeVert} fragmentShader={glowFrag} uniforms={uniforms.glow} transparent depthWrite={false} blending={AdditiveBlending} fog={false} />
      </mesh>
      <mesh position={[0, -2, -10]}>
        <planeGeometry args={[2, 3.2]} />
        <shaderMaterial ref={flame} vertexShader={planeVert} fragmentShader={flameFrag} uniforms={uniforms.flame} transparent depthWrite={false} blending={AdditiveBlending} fog={false} />
      </mesh>
      <points key={sparkCount} position={[0, 2, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkField.positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[sparkField.seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial ref={sparks} vertexShader={embersVert} fragmentShader={embersFrag} uniforms={uniforms.sparks} transparent depthWrite={false} blending={AdditiveBlending} />
      </points>
      <pointLight ref={light} position={[0, -1, -9]} color={palette.gold} intensity={0} distance={20} decay={1.5} />
    </group>
  );
}
