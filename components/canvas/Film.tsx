"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Bloom, ChromaticAberration, EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, Effect, type BloomEffect, type ChromaticAberrationEffect } from "postprocessing";
import { ACESFilmicToneMapping, Color, NoToneMapping, Uniform, Vector2 } from "three";
import { BONFIRE, kindleSwell } from "@/lib/bonfire";
import { DESCENT } from "@/lib/embers";
import { INTRO, clamp01, kindleAmount, smoothstep } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { journey, onJourneyPosition } from "@/lib/scroll";
import { useView } from "@/lib/view";
import filmFrag from "@/shaders/film.frag.glsl";

// The shader feel (docs/vision.md §19): soft bloom, chromatic fringes, halftone in the shadows,
// light leaks and grain, for the dark chapters only: the void (until the flash) and chapters
// IV–V (embers, bonfire, ending). Those scenes are all custom shaders, so the composer (which
// turns the renderer's tone mapping off while mounted) changes nothing else about them; the
// cathedral, blueprint and dawn render exactly as before (the composer is unmounted there).
// Full quality only. Reduced motion: still (no drifting leaks or animated grain).
//
// The composer stays mounted for the whole visit and is only switched on and off (2026-11-23):
// mounting it compiled its shaders on the spot, a ~0.3 s hitch right in the descent's white
// flash. While it is off, the renderer's tone mapping is put back (ACES) every frame, so the
// cathedral, blueprint, dawn and the project/year sub-pages look exactly as before.

class FilmEffect extends Effect {
  constructor() {
    super("FilmEffect", filmFrag, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ["uTime", new Uniform(0)],
        ["uLeak", new Uniform(0)],
        ["uHalftone", new Uniform(0)],
        ["uGrain", new Uniform(0)],
        ["uLeakA", new Uniform(new Color())],
        ["uLeakB", new Uniform(new Color())],
      ]),
    });
  }
}

const Film = forwardRef<FilmEffect>(function Film(_, ref) {
  const effect = useMemo(() => new FilmEffect(), []);
  useEffect(() => () => effect.dispose(), [effect]);
  return <primitive ref={ref} object={effect} dispose={null} />;
});

/** Where the composer is on: the void, and from the descent's bokeh onward. */
function inDarkChapters(p: number) {
  return p < INTRO.flashEnd || p > 3 + DESCENT.bokeh;
}

type Mood = { bloom: number; fringe: number; leak: number; halftone: number; grain: number; a: string; b: string };

/** The look at a journey position. */
function moodAt(p: number): Mood {
  if (p < 1) {
    // The void: cold and faint; it swells with each failed kindling; bloom only as the fire catches.
    const kindle = kindleAmount(p);
    const rise = smoothstep(0.3, INTRO.voidEnd, p);
    const burst = clamp01((p - INTRO.voidEnd) / (INTRO.flashPeak - INTRO.voidEnd));
    return {
      bloom: 0.05 + kindle * 1.1 + rise * 0.9 + burst * 2.5,
      fringe: 0.0006 + kindle * 0.0025 + burst * 0.004,
      leak: 0.035 + kindle * 0.1 + rise * 0.06,
      halftone: 0.55,
      grain: 0.42,
      a: palette.crimsonViolet,
      b: palette.ember,
    };
  }
  if (p < 4) {
    // The embers: warm leaks, the strongest halftone (the printed, gritty chapter).
    return { bloom: 0.7, fringe: 0.0012, leak: 0.07, halftone: 0.7, grain: 0.38, a: palette.ember, b: palette.gold };
  }
  // The bonfire: gold leaks; a gentle bloom swell as it kindles.
  const local = p - 4;
  const ignite = clamp01((local - BONFIRE.igniteStart) / (BONFIRE.igniteEnd - BONFIRE.igniteStart));
  const pop = kindleSwell(ignite);
  return { bloom: 0.9 + pop * 3, fringe: 0.001 + pop * 0.006, leak: 0.08 + pop * 0.2, halftone: 0.4, grain: 0.3, a: palette.gold, b: palette.ember };
}

function FilmPasses({ reducedMotion, enabled }: { reducedMotion: boolean; enabled: boolean }) {
  const film = useRef<FilmEffect>(null);
  const bloom = useRef<BloomEffect>(null);
  const fringe = useRef<ChromaticAberrationEffect>(null);
  const offset = useMemo(() => new Vector2(0.001, 0.001), []);

  // Before anything renders: tone mapping off for the composer, ACES (the default) without it.
  useFrame(({ gl }) => {
    gl.toneMapping = enabled ? NoToneMapping : ACESFilmicToneMapping;
  }, -20);

  useFrame((_, delta) => {
    if (!enabled) return;
    const mood = moodAt(journey.position);
    if (bloom.current) bloom.current.intensity = mood.bloom;
    if (fringe.current) fringe.current.offset.set(mood.fringe, mood.fringe * 0.6);
    const u = film.current?.uniforms;
    if (!u) return;
    if (!reducedMotion) u.get("uTime")!.value += delta;
    u.get("uLeak")!.value = mood.leak;
    u.get("uHalftone")!.value = mood.halftone;
    u.get("uGrain")!.value = reducedMotion ? mood.grain * 0.5 : mood.grain;
    (u.get("uLeakA")!.value as Color).set(mood.a);
    (u.get("uLeakB")!.value as Color).set(mood.b);
  });

  return (
    <EffectComposer enabled={enabled} multisampling={0} enableNormalPass={false}>
      <Bloom ref={bloom} mipmapBlur intensity={0.5} luminanceThreshold={0.55} luminanceSmoothing={0.25} radius={0.75} />
      <ChromaticAberration ref={fringe} offset={offset} radialModulation modulationOffset={0.25} />
      <Film ref={film} />
    </EffectComposer>
  );
}

export default function FilmComposer({ reducedMotion }: { reducedMotion: boolean }) {
  const [dark, setDark] = useState(() => inDarkChapters(journey.position));
  useEffect(() => onJourneyPosition((p) => setDark(inDarkChapters(p))), []);
  // A project or year page lives in its own lit space: no film there (about pages keep it).
  const sub = useView();
  const enabled = dark && (!sub || sub.kind === "about");
  return <FilmPasses reducedMotion={reducedMotion} enabled={enabled} />;
}
