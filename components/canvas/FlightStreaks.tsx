"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type Group, type LineBasicMaterial, type LineSegments } from "three";
import { palette } from "@/lib/palette";
import { view } from "@/lib/view";
import { seededRandom } from "./layout";

// The flight to a sub-page and back (lib/view.ts): streaks of light rushing past the camera, so
// the move reads as speed ("move, move", docs/vision.md §18). Attached to the camera, strongest
// mid-flight, gone at rest. Not with reduced motion (the flight is instant there anyway).

const COUNT = 140;
const DEPTH = 70;

export default function FlightStreaks({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const material = useRef<LineBasicMaterial>(null);
  const travel = useRef(0);
  const last = useRef(0);

  const lines = useRef<LineSegments>(null);
  const { base, positions } = useMemo(() => {
    const random = seededRandom(808);
    const base = Array.from({ length: COUNT }, () => {
      const angle = random() * Math.PI * 2;
      const radius = 1.5 + random() * 9;
      return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, z: -random() * DEPTH, length: 0.6 + random() * 1.4 };
    });
    return { base, positions: new Float32Array(COUNT * 6) };
  }, []);
  // Cobalt (the blueprint's ink): it reads on both sub-page skies (ivory and dawn blue).
  const colour = useMemo(() => new Color(palette.cobalt), []);

  useFrame((state, delta) => {
    if (!group.current || !material.current) return;
    const t = view.t;
    const moving = !reducedMotion && t > 0 && t < 1;
    group.current.visible = moving;
    if (!moving) {
      last.current = t;
      return;
    }
    // Speed from how fast the flight is going this frame.
    const speed = Math.min(1, (Math.abs(t - last.current) / Math.max(delta, 1e-3)) * 1.4);
    last.current = t;
    travel.current += delta * (10 + speed * 90);
    group.current.position.copy(state.camera.position);
    group.current.quaternion.copy(state.camera.quaternion);
    material.current.opacity = Math.sin(Math.PI * t) * 0.55;
    const attribute = lines.current?.geometry.attributes.position;
    if (!attribute) return;
    const array = attribute.array as Float32Array;
    base.forEach((s, i) => {
      const z = ((s.z + travel.current) % DEPTH) - DEPTH;
      const stretch = s.length * (1 + speed * 14);
      array.set([s.x, s.y, z, s.x, s.y, z - stretch], i * 6);
    });
    attribute.needsUpdate = true;
  });

  return (
    <group ref={group} visible={false}>
      <lineSegments ref={lines} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial ref={material} color={colour} transparent opacity={0} depthWrite={false} fog={false} />
      </lineSegments>
    </group>
  );
}
