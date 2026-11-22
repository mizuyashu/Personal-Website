"use client";

import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { chapters } from "@/content/chapters";
import { markWorldReady } from "@/lib/loading";
import { useReducedMotion } from "@/lib/motion";
import { stepDownAuto, useQuality } from "@/lib/quality";
import Backdrop from "./Backdrop";
import CameraRig from "./CameraRig";
import Dust from "./Dust";
import Placeholders from "./Placeholders";
import Sun from "./scenes/Sun";
import Void from "./scenes/Void";
import { CAMERA_START_Z } from "./layout";
import styles from "./World.module.css";

// The one <Canvas> for the whole site, fixed behind the HTML. Load it via WorldLoader (no SSR).
export default function World() {
  const { quality } = useQuality();
  const reducedMotion = useReducedMotion();
  const lite = quality === "lite";

  return (
    <Canvas
      className={styles.canvas}
      dpr={lite ? 1 : [1, 2]}
      camera={{ position: [0, 0, CAMERA_START_Z], fov: 50, near: 0.1, far: 200 }}
      gl={{ antialias: !lite, powerPreference: "high-performance" }}
      onCreated={markWorldReady}
      aria-hidden
    >
      <PerformanceMonitor onDecline={stepDownAuto} />
      <Backdrop />
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 5]} intensity={2} />
      {!lite && <directionalLight position={[-6, -2, -4]} intensity={0.8} />}
      <Void lite={lite} reducedMotion={reducedMotion} />
      <Sun reducedMotion={reducedMotion} />
      <Placeholders reducedMotion={reducedMotion} />
      <Dust count={lite ? 600 : 4000} chapterCount={chapters.length} />
      <CameraRig chapterCount={chapters.length} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
