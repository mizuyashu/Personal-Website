"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  PlaneGeometry,
  type Group,
  type LineBasicMaterial,
  type MeshBasicMaterial,
  type ShaderMaterial,
} from "three";
import { projects } from "@/content/projects";
import { projectReveal } from "@/lib/corridor";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import glyphsVert from "@/shaders/glyphs.vert.glsl";
import glyphsFrag from "@/shaders/glyphs.frag.glsl";
import { BLUEPRINT_CENTRE, SKYLIGHT_SIZE, seededRandom } from "../layout";

// Chapter II, the blueprint hold: what appears in 3D as the camera pulls off to the side before
// each project. The website gets "code flow" (lanes of invented glyphs streaming across the
// plate, driven by scroll); the summer build gets an exploded view (generic blueprint plates
// separating toward the camera, then folding back). Neither shows real code or real specs.

const REVEAL_STYLE: Record<string, "code" | "exploded"> = { website: "code", "summer-build": "exploded" };

const [CX, PLATE_Y, CZ] = BLUEPRINT_CENTRE;
const GLYPH_Y = PLATE_Y - 0.08;
const LANES = 22;

/** 64 invented glyphs (strokes between points on a small lattice, a few dots and rings). */
function makeGlyphAtlas() {
  const cell = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = cell * 8;
  const ctx = canvas.getContext("2d")!;
  const random = seededRandom(64);
  ctx.strokeStyle = ctx.fillStyle = "#fff";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let g = 0; g < 64; g++) {
    const ox = (g % 8) * cell;
    const oy = Math.floor(g / 8) * cell;
    const point = () => [ox + 14 + Math.floor(random() * 3) * 18, oy + 10 + Math.floor(random() * 4) * 14.5] as const;
    ctx.beginPath();
    let [x, y] = point();
    ctx.moveTo(x, y);
    const strokes = 2 + Math.floor(random() * 3);
    for (let s = 0; s < strokes; s++) {
      [x, y] = point();
      if (random() < 0.25) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    if (random() < 0.4) {
      const [dx, dy] = point();
      const dot = random() < 0.5;
      ctx.beginPath();
      ctx.arc(dx, dy, dot ? 4 : 8, 0, Math.PI * 2);
      if (dot) ctx.fill();
      else ctx.stroke();
    }
  }
  return new CanvasTexture(canvas);
}

/** Exploded-view plates, largest at the top (against the blueprint). */
const PLATES = [
  [3.4, 2.3],
  [3.0, 2.0],
  [2.5, 1.6],
  [1.9, 1.2],
  [1.2, 0.8],
] as const;

// Reduced motion: no reveals (the camera holds the flat blueprint).
export default function Reveals({ lite, reducedMotion }: { lite: boolean; reducedMotion: boolean }) {
  const code = useRef<Group>(null);
  const glyphs = useRef<ShaderMaterial>(null);
  const exploded = useRef<Group>(null);
  const plateFill = useRef<(MeshBasicMaterial | null)[]>([]);
  const plateEdge = useRef<(LineBasicMaterial | null)[]>([]);
  const axis = useRef<LineBasicMaterial>(null);

  const atlas = useMemo(() => makeGlyphAtlas(), []);
  useEffect(() => () => atlas.dispose(), [atlas]);

  const perLane = lite ? 9 : 18;
  const glyphGeometry = useMemo(() => {
    const geometry = new PlaneGeometry(1, 1);
    geometry.rotateX(Math.PI / 2); // lie flat, facing down at the camera
    const random = seededRandom(11);
    const lanes = new Float32Array(LANES * perLane * 4);
    for (let lane = 0; lane < LANES; lane++) {
      const z = CZ - SKYLIGHT_SIZE * 0.42 + (lane / (LANES - 1)) * SKYLIGHT_SIZE * 0.84;
      const speed = (random() < 0.5 ? -1 : 1) * (0.6 + random() * 1.4);
      for (let k = 0; k < perLane; k++) {
        const i = (lane * perLane + k) * 4;
        lanes[i] = (k / perLane) * 10 - 5 + random() * 0.2;
        lanes[i + 1] = z;
        lanes[i + 2] = speed;
        lanes[i + 3] = Math.floor(random() * 64);
      }
    }
    geometry.setAttribute("aLane", new InstancedBufferAttribute(lanes, 4));
    return geometry;
  }, [perLane]);
  useEffect(() => () => glyphGeometry.dispose(), [glyphGeometry]);

  const plateGeometries = useMemo(
    () =>
      PLATES.map(([w, d]) => {
        const fill = new PlaneGeometry(w, d);
        fill.rotateX(Math.PI / 2);
        return { fill, edges: new EdgesGeometry(fill) };
      }),
    [],
  );
  const axisGeometry = useMemo(() => new BufferGeometry().setAttribute("position", new Float32BufferAttribute([0, 0, 0, 0, -1, 0], 3)), []);
  useEffect(
    () => () => {
      for (const g of plateGeometries) {
        g.fill.dispose();
        g.edges.dispose();
      }
      axisGeometry.dispose();
    },
    [plateGeometries, axisGeometry],
  );

  const glyphUniforms = useMemo(
    () => ({
      uFlow: { value: 0 },
      uWidth: { value: 10 },
      uSize: { value: 0.17 },
      uAtlas: { value: atlas },
      uColor: { value: new Color(palette.cobalt) },
      uOpacity: { value: 0 },
    }),
    [atlas],
  );

  useFrame((state) => {
    const u = journey.position - 1;
    const reveal = !reducedMotion && u > 0 && u < 1 ? projectReveal(u) : { index: -1, amount: 0, phase: 0 };
    const style = reveal.index >= 0 ? REVEAL_STYLE[projects[reveal.index].id] : undefined;

    if (code.current) {
      code.current.visible = style === "code";
      if (code.current.visible && glyphs.current) {
        glyphs.current.uniforms.uOpacity.value = reveal.amount * 0.85;
        // Flows with the scroll, plus a slow drift so it lives while you rest.
        glyphs.current.uniforms.uFlow.value = reveal.phase * 7 + state.clock.elapsedTime * 0.15;
      }
    }
    if (exploded.current) {
      exploded.current.visible = style === "exploded";
      if (exploded.current.visible) {
        const spread = reveal.amount;
        // Plates separate toward the camera (and a little sideways, like exploded-view leaders).
        for (const child of exploded.current.children) {
          const k = child.userData.plate as number | undefined;
          if (k === undefined) continue;
          child.position.set(CX + k * 0.18 * spread, PLATE_Y - 0.12 - k * (0.05 + 0.62 * spread), CZ + k * 0.12 * spread);
        }
        for (const m of plateFill.current) if (m) m.opacity = 0.5 * spread;
        for (const m of plateEdge.current) if (m) m.opacity = spread;
        if (axis.current) axis.current.opacity = 0.6 * spread;
      }
    }
  });

  return (
    <>
      <group ref={code} visible={false}>
        <instancedMesh args={[glyphGeometry, undefined, LANES * perLane]} frustumCulled={false} position={[CX, GLYPH_Y, 0]}>
          <shaderMaterial ref={glyphs} vertexShader={glyphsVert} fragmentShader={glyphsFrag} uniforms={glyphUniforms} transparent depthWrite={false} side={DoubleSide} />
        </instancedMesh>
      </group>
      <group ref={exploded} visible={false}>
        {plateGeometries.map((g, k) => (
          <group key={k} userData={{ plate: k }} rotation={[0, Math.PI / 6, 0]}>
            <mesh geometry={g.fill}>
              <meshBasicMaterial
                ref={(m) => {
                  plateFill.current[k] = m;
                }}
                color={palette.ivory}
                transparent
                opacity={0}
                depthWrite={false}
                side={DoubleSide}
                fog={false}
              />
            </mesh>
            <lineSegments geometry={g.edges}>
              <lineBasicMaterial
                ref={(m) => {
                  plateEdge.current[k] = m;
                }}
                color={palette.cobalt}
                transparent
                opacity={0}
                fog={false}
              />
            </lineSegments>
          </group>
        ))}
        {/* Assembly axis through the plates, like the dashed centre line of an exploded drawing */}
        <lineSegments geometry={axisGeometry} position={[CX, PLATE_Y, CZ]} scale={[1, 3, 1]}>
          <lineBasicMaterial ref={axis} color={palette.cobalt} transparent opacity={0} fog={false} />
        </lineSegments>
      </group>
    </>
  );
}
