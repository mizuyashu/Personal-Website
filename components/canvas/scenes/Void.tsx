"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, type Group, type ShaderMaterial, type Mesh } from "three";
import { INTRO, clamp01, smoothstep } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import embersVert from "@/shaders/embers.vert.glsl";
import embersFrag from "@/shaders/embers.frag.glsl";
import glowlinesVert from "@/shaders/glowlines.vert.glsl";
import glowlinesFrag from "@/shaders/glowlines.frag.glsl";
import planeVert from "@/shaders/plane.vert.glsl";
import glowFrag from "@/shaders/glow.frag.glsl";
import { seededRandom } from "../layout";

type Props = { lite: boolean; reducedMotion: boolean };

// Chapter I, beat 2: black void, drifting embers, short glowing lines,
// and a light rising from below that bursts into the flash. Follows the camera.
export default function Void({ lite, reducedMotion }: Props) {
  const group = useRef<Group>(null);
  const embers = useRef<ShaderMaterial>(null);
  const lines = useRef<ShaderMaterial>(null);
  const glowMesh = useRef<Mesh>(null);
  const glow = useRef<ShaderMaterial>(null);

  const emberCount = lite ? 400 : 1500;
  const lineCount = lite ? 30 : 80;

  const emberData = useMemo(() => {
    const random = seededRandom(7);
    const positions = new Float32Array(emberCount * 3);
    const seeds = new Float32Array(emberCount);
    for (let i = 0; i < emberCount; i++) {
      positions[i * 3] = (random() - 0.5) * 18;
      positions[i * 3 + 1] = (random() - 0.5) * 16;
      positions[i * 3 + 2] = -4 - random() * 12;
      seeds[i] = random();
    }
    return { positions, seeds };
  }, [emberCount]);

  const lineData = useMemo(() => {
    const random = seededRandom(21);
    const positions = new Float32Array(lineCount * 6);
    const seeds = new Float32Array(lineCount * 2);
    for (let i = 0; i < lineCount; i++) {
      const x = (random() - 0.5) * 16;
      const y = (random() - 0.5) * 9;
      const z = -6 - random() * 8;
      const angle = random() * Math.PI * 2;
      const length = 0.3 + random() * 0.9;
      positions.set([x, y, z, x + Math.cos(angle) * length, y + Math.sin(angle) * length, z], i * 6);
      const seed = random();
      seeds[i * 2] = seed;
      seeds[i * 2 + 1] = seed;
    }
    return { positions, seeds };
  }, [lineCount]);

  const emberUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 70 },
      uPixelRatio: { value: 1 },
      uOpacity: { value: 1 },
      uGold: { value: new Color(palette.gold) },
      uEmber: { value: new Color(palette.ember) },
    }),
    [],
  );
  const lineUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uOpacity: { value: 1 }, uColor: { value: new Color(palette.gold) } }),
    [],
  );
  const glowUniforms = useMemo(
    () => ({ uOpacity: { value: 1 }, uGold: { value: new Color(palette.gold) }, uIvory: { value: new Color(palette.ivory) } }),
    [],
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    const p = journey.position;
    const visible = p < INTRO.flashPeak;
    group.current.visible = visible;
    if (!visible) return;
    group.current.position.z = state.camera.position.z;

    const time = reducedMotion ? 4 : (embers.current?.uniforms.uTime.value ?? 0) + delta;
    if (embers.current) {
      embers.current.uniforms.uTime.value = time;
      embers.current.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    }
    if (lines.current) lines.current.uniforms.uTime.value = time;

    // The light rises through the void, then swells into the flash.
    if (glowMesh.current && glow.current) {
      const rise = smoothstep(0, INTRO.voidEnd, p);
      const burst = clamp01((p - INTRO.voidEnd) / (INTRO.flashPeak - INTRO.voidEnd));
      const scale = 0.9 + rise * 1.6 + burst * burst * 14;
      glowMesh.current.position.y = -3.6 + rise * 3.6;
      glowMesh.current.scale.setScalar(scale);
      glow.current.uniforms.uOpacity.value = 0.6 + rise * 0.4;
    }
  });

  return (
    <group ref={group}>
      <points key={`embers-${emberCount}`}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[emberData.positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[emberData.seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={embers}
          vertexShader={embersVert}
          fragmentShader={embersFrag}
          uniforms={emberUniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
      <lineSegments key={`lines-${lineCount}`}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lineData.positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[lineData.seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={lines}
          vertexShader={glowlinesVert}
          fragmentShader={glowlinesFrag}
          uniforms={lineUniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </lineSegments>
      <mesh ref={glowMesh} position={[0, -3.6, -8]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={glow}
          vertexShader={planeVert}
          fragmentShader={glowFrag}
          uniforms={glowUniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
