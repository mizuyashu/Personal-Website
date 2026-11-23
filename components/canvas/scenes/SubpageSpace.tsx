"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  Color,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  MeshStandardMaterial,
  PlaneGeometry,
  Vector3,
  type Group,
  type ShaderMaterial,
} from "three";
import { projects } from "@/content/projects";
import { palette } from "@/lib/palette";
import { useView, view } from "@/lib/view";
import planeVert from "@/shaders/plane.vert.glsl";
import skylightFrag from "@/shaders/skylight.frag.glsl";
import glowFrag from "@/shaders/glow.frag.glsl";
import { SUBPAGE_SPACE, seededRandom } from "../layout";

// The sub-page space (docs/vision.md §18–19): high above the journey, where the camera flies
// when a project page or an education year opens. One huge object, at an isometric angle,
// off to the right (above, on portrait screens); the page's clean text sits on the left.
// Website: a giant laptop with a blueprint screen. Summer build: an exploded stack of plates
// that breathes open and shut. A year: its constellation in 3D. Generated geometry only.

/** Plate fill: ivory tinted with the blueprint's cobalt, so the plates read on an ivory sky. */
const plateTint = new Color(palette.ivory).lerp(new Color(palette.cobalt), 0.16);

const PLATES = [
  [3.6, 2.4],
  [3.2, 2.1],
  [2.6, 1.7],
  [2.0, 1.3],
  [1.3, 0.85],
] as const;

function Laptop() {
  const screen = useRef<ShaderMaterial>(null);
  const parts = useMemo(() => {
    const base = new BoxGeometry(4.6, 0.22, 3.1);
    const lid = new BoxGeometry(4.6, 3.0, 0.14);
    return { base, lid, baseEdges: new EdgesGeometry(base), lidEdges: new EdgesGeometry(lid), face: new PlaneGeometry(4.3, 2.7) };
  }, []);
  useEffect(() => () => Object.values(parts).forEach((g) => g.dispose()), [parts]);
  const materials = useMemo(
    () => ({
      shell: new MeshStandardMaterial({ color: palette.ivory, roughness: 0.5, metalness: 0.1 }),
    }),
    [],
  );
  useEffect(() => () => materials.shell.dispose(), [materials]);
  const uniforms = useMemo(
    () => ({
      uBlueprint: { value: 1 },
      uCells: { value: 1.4 },
      uIvory: { value: new Color(palette.ivory) },
      uGold: { value: new Color(palette.gold) },
      uCobalt: { value: new Color(palette.cobalt) },
    }),
    [],
  );
  return (
    <group>
      <mesh geometry={parts.base} material={materials.shell} />
      <lineSegments geometry={parts.baseEdges}>
        <lineBasicMaterial color={palette.cobalt} />
      </lineSegments>
      {/* The lid, hinged at the back edge, open a little past upright */}
      <group position={[0, 0.11, -1.55]} rotation={[-0.25, 0, 0]}>
        <group position={[0, 1.5, 0]}>
          <mesh geometry={parts.lid} material={materials.shell} />
          <lineSegments geometry={parts.lidEdges}>
            <lineBasicMaterial color={palette.cobalt} />
          </lineSegments>
          <mesh geometry={parts.face} position={[0, 0, 0.075]}>
            <shaderMaterial ref={screen} vertexShader={planeVert} fragmentShader={skylightFrag} uniforms={uniforms} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function ExplodedStack({ still }: { still: boolean }) {
  const plates = useRef<(Group | null)[]>([]);
  const geometries = useMemo(
    () =>
      PLATES.map(([w, d]) => {
        const fill = new PlaneGeometry(w, d);
        fill.rotateX(-Math.PI / 2);
        return { fill, edges: new EdgesGeometry(fill) };
      }),
    [],
  );
  useEffect(
    () => () => {
      for (const g of geometries) {
        g.fill.dispose();
        g.edges.dispose();
      }
    },
    [geometries],
  );
  useFrame((state) => {
    const spread = still ? 0.8 : 0.55 + 0.45 * Math.sin(state.clock.elapsedTime * 0.6);
    plates.current.forEach((g, k) => {
      if (g) g.position.set(k * 0.12 * spread, -1.6 + k * (0.15 + 0.75 * spread), k * 0.08 * spread);
    });
  });
  return (
    <group rotation={[0, Math.PI / 6, 0]} scale={1.55}>
      {geometries.map((g, k) => (
        <group
          key={k}
          ref={(el) => {
            plates.current[k] = el;
          }}
        >
          <mesh geometry={g.fill}>
            <meshBasicMaterial color={plateTint} transparent opacity={0.72} side={DoubleSide} depthWrite={false} />
          </mesh>
          <lineSegments geometry={g.edges}>
            <lineBasicMaterial color={palette.cobalt} />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}

function YearConstellation({ seed }: { seed: number }) {
  const data = useMemo(() => {
    const random = seededRandom(seed);
    const stars: Vector3[] = [];
    for (let i = 0; i < 7; i++) {
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(random() * 2 - 1);
      const r = 1.6 + random() * 1.2;
      stars.push(new Vector3(Math.sin(phi) * Math.cos(theta) * r, Math.cos(phi) * r * 0.8, Math.sin(phi) * Math.sin(theta) * r));
    }
    const lines: number[] = [];
    for (let i = 1; i < stars.length; i++) {
      const a = stars[i - 1];
      const b = stars[i];
      lines.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const geometry = new BufferGeometry().setAttribute("position", new Float32BufferAttribute(lines, 3));
    return { stars, geometry };
  }, [seed]);
  useEffect(() => () => data.geometry.dispose(), [data]);
  const glow = useMemo(() => ({ uOpacity: { value: 0.9 }, uGold: { value: new Color(palette.gold) }, uIvory: { value: new Color(palette.ivory) } }), []);
  return (
    <group>
      <lineSegments geometry={data.geometry}>
        <lineBasicMaterial color={palette.navy} transparent opacity={0.7} />
      </lineSegments>
      {data.stars.map((s, i) => (
        <mesh key={i} position={s} scale={0.7}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial vertexShader={planeVert} fragmentShader={glowFrag} uniforms={glow} transparent depthWrite={false} blending={AdditiveBlending} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[3.1, 0.015, 6, 128]} />
        <meshBasicMaterial color={palette.gold} />
      </mesh>
    </group>
  );
}

export default function SubpageSpace({ reducedMotion }: { reducedMotion: boolean }) {
  const current = useView();
  const pool = useMemo(() => ({ uOpacity: { value: 0.35 }, uGold: { value: new Color(palette.gold) }, uIvory: { value: new Color(palette.ivory) } }), []);
  const group = useRef<Group>(null);
  const object = useRef<Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    group.current.visible = view.t > 0.02;
    if (!group.current.visible || !object.current) return;
    // Off to the right on landscape; above the text on portrait.
    const portrait = state.size.width < state.size.height;
    object.current.position.set(portrait ? 0 : 4.4, portrait ? 4.2 : -0.2, 0);
    object.current.scale.setScalar(portrait ? 0.72 : 1);
    // Isometric-ish angle, turning slowly, floating.
    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    object.current.rotation.set(0.42, -0.62 + Math.sin(t * 0.25) * 0.25, 0);
    object.current.position.y += Math.sin(t * 0.7) * 0.12;
  });

  const project = current?.kind === "project" ? projects.find((p) => p.id === current.id) : undefined;
  return (
    <group ref={group} position={[0, SUBPAGE_SPACE.y, 0]} visible={false}>
      <group ref={object}>
        {project?.format === "device" && <Laptop />}
        {project?.format === "exploded" && <ExplodedStack still={reducedMotion} />}
        {current?.kind === "year" && <YearConstellation seed={current.id.length * 97 + current.id.charCodeAt(current.id.length - 1)} />}
      </group>
      {/* A soft pool of light under the object */}
      <mesh position={[4.4, -2.6, -1]} rotation={[-Math.PI / 2, 0, 0]} scale={[9, 6, 1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          vertexShader={planeVert}
          fragmentShader={glowFrag}
          uniforms={pool}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
