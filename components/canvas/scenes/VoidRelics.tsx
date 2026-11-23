"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, Color, DoubleSide, ShaderMaterial, Vector3, type Group } from "three";
import { INTRO, kindleAmount, smoothstep } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import rimVert from "@/shaders/rim.vert.glsl";
import rimFrag from "@/shaders/rim.frag.glsl";

// Dead planets in the void (docs/vision.md §17): a huge one half off the top left, a small one
// low right with a broken ring. Near-black, seen only by a thin rim of light from the dying sun,
// which flares faintly with each failed kindling. Lives inside the void's drifting sky group
// (Void.tsx). The drifting ruins that used to be here were removed (2026-11-23: the sky felt
// cluttered, "random blocks"); the void is meant to be sparse.

/** The dying sun's place in the void group (Void.tsx: the eclipse, low, 10 ahead). */
const SUN = new Vector3(0, -1.3, -10);

/** Concentric broken bands for the small planet's ring. */
function makeRingTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;
  for (let k = 0; k < 7; k++) {
    const r = c * (0.68 + k * 0.045);
    ctx.strokeStyle = `rgba(255,255,255,${0.25 + (k % 3) * 0.2})`;
    ctx.lineWidth = 2 + (k % 2) * 2;
    const start = k * 1.3;
    ctx.beginPath();
    ctx.arc(c, c, r, start, start + Math.PI * (1.2 + (k % 3) * 0.25));
    ctx.stroke();
  }
  return new CanvasTexture(canvas);
}

/** A near-black material lit only by a rim from the dying sun. */
function makeRimMaterial(rim: Color, power: number) {
  return new ShaderMaterial({
    vertexShader: rimVert,
    fragmentShader: rimFrag,
    uniforms: {
      uBody: { value: new Color(palette.ink).multiplyScalar(0.6) },
      uRim: { value: rim },
      uLightPos: { value: new Vector3() },
      uPower: { value: power },
      uGlow: { value: 0 },
      uOpacity: { value: 1 },
    },
  });
}

/** Light position (view space) and kindling glow for a rim material. */
function lightRim(material: ShaderMaterial, sunView: Vector3, glow: number) {
  (material.uniforms.uLightPos.value as Vector3).copy(sunView);
  material.uniforms.uGlow.value = glow;
}

export default function VoidRelics({ reducedMotion }: { reducedMotion: boolean }) {
  const root = useRef<Group>(null);
  const ring = useMemo(() => makeRingTexture(), []);
  const material = useMemo(() => makeRimMaterial(new Color(palette.lavender).lerp(new Color(palette.crimsonViolet), 0.4), 5), []);
  useEffect(
    () => () => {
      ring.dispose();
      material.dispose();
    },
    [ring, material],
  );

  const sunView = useMemo(() => new Vector3(), []);
  useFrame((state) => {
    const p = journey.position;
    if (p >= INTRO.flashPeak || !root.current?.parent) return;
    sunView.copy(SUN);
    root.current.parent.localToWorld(sunView);
    sunView.applyMatrix4(state.camera.matrixWorldInverse);
    const glow = (reducedMotion ? 0 : kindleAmount(p)) * 1.6 + smoothstep(0.3, INTRO.voidEnd, p) * 0.8;
    lightRim(material, sunView, glow * 0.6);
  });

  return (
    <group ref={root}>
      <mesh position={[-26, 15, -46]} scale={11} material={material}>
        <sphereGeometry args={[1, 48, 32]} />
      </mesh>
      <group position={[21, -9, -38]} rotation={[0.35, 0, -0.4]}>
        <mesh scale={2.4} material={material}>
          <sphereGeometry args={[1, 32, 24]} />
        </mesh>
        <mesh rotation={[-Math.PI / 2 + 0.25, 0, 0]} scale={2.4}>
          <ringGeometry args={[1.35, 2.2, 96]} />
          <meshBasicMaterial map={ring} transparent opacity={0.4} color={palette.rose} side={DoubleSide} depthWrite={false} fog={false} />
        </mesh>
      </group>
    </group>
  );
}
