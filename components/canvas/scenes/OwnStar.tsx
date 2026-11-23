"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferGeometry, CanvasTexture, Color, Float32BufferAttribute, type Group, type LineBasicMaterial, type MeshBasicMaterial, type ShaderMaterial } from "three";
import { ownStarStage } from "@/lib/ownStar";
import { palette } from "@/lib/palette";
import planeVert from "@/shaders/plane.vert.glsl";
import glowFrag from "@/shaders/glow.frag.glsl";

type Point = { x: number; y: number; z: number };

/** A four-point sparkle (white; tinted by the material). */
function makeSparkle() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;
  const glow = ctx.createRadialGradient(c, c, 0, c, c, c * 0.5);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const r = i % 2 === 0 ? c * 0.95 : c * 0.12;
    const x = c + Math.cos(a) * r;
    const y = c + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  return new CanvasTexture(canvas);
}

const COLD = new Color(palette.sky).lerp(new Color(palette.ivory), 0.4);
const GOLD = new Color(palette.gold).lerp(new Color(palette.ivory), 0.25);

// Your star in the void's socket (lib/ownStar.ts, docs/vision.md §17). Stage 0: nothing (the
// empty ring shows). Stage 1, after chapter III's constellation: a cold point of starlight.
// Stage 2, after the ending: gold, with a halo, joined to its constellation by a line.
export default function OwnStar({ socket, from, reducedMotion }: { socket: Point; from: Point; reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const sparkle = useRef<MeshBasicMaterial>(null);
  const halo = useRef<ShaderMaterial>(null);
  const line = useRef<LineBasicMaterial>(null);
  const texture = useMemo(() => makeSparkle(), []);
  const lineGeometry = useMemo(
    () => new BufferGeometry().setAttribute("position", new Float32BufferAttribute([from.x - socket.x, from.y - socket.y, from.z - socket.z, 0, 0, 0], 3)),
    [from, socket],
  );
  useEffect(
    () => () => {
      texture.dispose();
      lineGeometry.dispose();
    },
    [texture, lineGeometry],
  );
  const haloUniforms = useMemo(() => ({ uOpacity: { value: 0 }, uGold: { value: new Color(palette.gold) }, uIvory: { value: new Color(palette.ivory) } }), []);

  useFrame((state) => {
    if (!group.current) return;
    const stage = ownStarStage();
    group.current.visible = stage > 0;
    if (stage === 0) return;
    const twinkle = reducedMotion ? 1 : 1 + 0.08 * Math.sin(state.clock.elapsedTime * 2.1);
    group.current.scale.setScalar((stage === 2 ? 2.6 : 1.5) * twinkle);
    if (sparkle.current) {
      sparkle.current.color.copy(stage === 2 ? GOLD : COLD);
      sparkle.current.opacity = stage === 2 ? 1 : 0.75;
    }
    if (halo.current) halo.current.uniforms.uOpacity.value = stage === 2 ? 0.55 : 0;
    if (line.current) line.current.opacity = stage === 2 ? 0.7 : 0;
  });

  return (
    <group position={[socket.x, socket.y, socket.z]}>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial ref={line} color={palette.gold} transparent opacity={0} depthWrite={false} fog={false} />
      </lineSegments>
      <group ref={group} visible={false}>
        <mesh scale={2.2}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial ref={halo} vertexShader={planeVert} fragmentShader={glowFrag} uniforms={haloUniforms} transparent depthWrite={false} blending={AdditiveBlending} fog={false} />
        </mesh>
        <mesh>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial ref={sparkle} map={texture} transparent depthWrite={false} blending={AdditiveBlending} fog={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
