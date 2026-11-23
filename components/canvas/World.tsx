"use client";

import { useState } from "react";

import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { chapters } from "@/content/chapters";
import { markWorldReady } from "@/lib/loading";
import { useReducedMotion } from "@/lib/motion";
import { stepDownAuto, useQuality } from "@/lib/quality";
import Backdrop from "./Backdrop";
import CameraRig from "./CameraRig";
import Dust from "./Dust";
import FilmComposer from "./Film";
import FlightStreaks from "./FlightStreaks";
import WarmUp from "./WarmUp";
import Arches from "./scenes/Arches";
import Blueprint from "./scenes/Blueprint";
import Dawn from "./scenes/Dawn";
import Bonfire from "./scenes/Bonfire";
import Embers from "./scenes/Embers";
import Sun from "./scenes/Sun";
import Narthex from "./scenes/Narthex";
import Reveals from "./scenes/Reveals";
import Rotunda from "./scenes/Rotunda";
import SubpageSpace from "./scenes/SubpageSpace";
import Void from "./scenes/Void";
import { CAMERA_START_Z } from "./layout";
import styles from "./World.module.css";

// The one <Canvas> for the whole site, fixed behind the HTML. Load it via WorldLoader (no SSR).
export default function World() {
  const { quality } = useQuality();
  const reducedMotion = useReducedMotion();
  const lite = quality === "lite";
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      className={styles.canvas}
      dpr={lite ? 1 : dpr}
      camera={{ position: [0, 0, CAMERA_START_Z], fov: 50, near: 0.1, far: 200 }}
      gl={{ antialias: !lite, powerPreference: "high-performance" }}
      onCreated={markWorldReady}
      aria-hidden
    >
      {/* Full: pixel density adapts between 1× and 1.5× to hold the frame rate (Retina screens at 2×
          would draw 4× the pixels); if it keeps struggling, Auto steps down to Lite. */}
      <PerformanceMonitor factor={1} flipflops={4} onChange={({ factor }) => setDpr(Math.round((1 + 0.5 * factor) * 10) / 10)} onFallback={stepDownAuto} />
      <Backdrop />
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 5]} intensity={2} />
      {!lite && <directionalLight position={[-6, -2, -4]} intensity={0.8} />}
      <Void lite={lite} reducedMotion={reducedMotion} />
      <Sun reducedMotion={reducedMotion} />
      <Arches lite={lite} reducedMotion={reducedMotion} />
      <Narthex lite={lite} reducedMotion={reducedMotion} />
      <Rotunda lite={lite} />
      <Blueprint reducedMotion={reducedMotion} />
      <Reveals lite={lite} reducedMotion={reducedMotion} />
      <Dawn reducedMotion={reducedMotion} />
      <Embers lite={lite} reducedMotion={reducedMotion} />
      <Bonfire lite={lite} reducedMotion={reducedMotion} />
      <SubpageSpace reducedMotion={reducedMotion} />
      <FlightStreaks reducedMotion={reducedMotion} />
      <WarmUp />
      <Dust count={lite ? 600 : 4000} chapterCount={chapters.length} />
      <CameraRig chapterCount={chapters.length} reducedMotion={reducedMotion} />
      {!lite && <FilmComposer reducedMotion={reducedMotion} />}
    </Canvas>
  );
}
