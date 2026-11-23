"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ACESFilmicToneMapping, HalfFloatType, NoToneMapping, WebGLRenderTarget, type Object3D } from "three";

// Compile every shader once, up front, behind the loader. Three compiles a material the first
// time it is drawn, and only for objects that are visible, so each scene used to compile as it
// came on screen: a visible hitch (e.g. ~40 fps through the descent's flash, where the embers'
// ground, ridge and sun and the film pass all appeared at once). Here, a few frames after the
// canvas starts: make everything visible for a moment, compile for the screen (ACES tone
// mapping) and for the film composer's buffer (half-float target, no tone mapping: a different
// shader variant), draw it all once off-screen (uploads geometry and textures), then put
// visibility back. Each scene's own frame loop keeps owning its
// visibility afterwards.
export default function WarmUp() {
  const frames = useRef(0);
  const done = useRef(false);

  useFrame(({ gl, scene, camera }) => {
    if (done.current || ++frames.current < 3) return;
    done.current = true;
    const hidden: Object3D[] = [];
    const culled: Object3D[] = [];
    scene.traverse((o) => {
      if (!o.visible) {
        hidden.push(o);
        o.visible = true;
      }
      if (o.frustumCulled) {
        culled.push(o);
        o.frustumCulled = false;
      }
    });
    const toneMapping = gl.toneMapping;
    const target = gl.getRenderTarget();
    try {
      gl.toneMapping = ACESFilmicToneMapping;
      gl.setRenderTarget(null);
      gl.compile(scene, camera);
      const buffer = new WebGLRenderTarget(4, 4, { type: HalfFloatType });
      gl.toneMapping = NoToneMapping;
      gl.setRenderTarget(buffer);
      gl.compile(scene, camera);
      // Draw everything once into the tiny buffer: uploads every geometry and texture to the GPU
      // now, not on first sight (the cathedral entry and the project reveals hitched on uploads).
      gl.render(scene, camera);
      buffer.dispose();
    } finally {
      gl.toneMapping = toneMapping;
      gl.setRenderTarget(target);
      for (const o of hidden) o.visible = false;
      for (const o of culled) o.frustumCulled = true;
    }
  }, -10);

  return null;
}
