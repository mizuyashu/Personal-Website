"use client";

import { useSyncExternalStore } from "react";
import { gsap, ScrollSmoother } from "@/lib/gsap";

// Free roam (docs/vision.md §19): instead of the guided, scroll-driven camera, the visitor walks
// the cathedral themselves: the narthex, the nave and aisles, the rotunda. Guided is the default.
// The camera blends between the guided pose and the roaming one (`roam.t`); while roaming the
// page doesn't scroll and the journey position holds (so the cathedral stays on screen).
// Walls only for now: columns, statues and the throne don't block yet.

export const roam = {
  active: false,
  /** Blend: 0 = guided camera, 1 = roaming camera. */
  t: 0,
  x: -23,
  z: -0.6,
  yaw: -Math.PI / 2,
  pitch: 0.1,
  /** Inputs, set by the HUD (keys, buttons, gamepad): -1…1. */
  forward: 0,
  turn: 0,
  strafe: 0,
};

/** Walkable areas (world units, matching components/canvas/layout.ts and the scenes). */
const AREAS = {
  narthex: { minX: -27.4, maxX: 6.2, minZ: -2.6, maxZ: 1.3 },
  nave: { minX: -6.3, maxX: 6.3, minZ: -19.6, maxZ: -2.6 },
  rotunda: { x: 0, z: -27, r: 9.1 },
};

function walkable(x: number, z: number) {
  const n = AREAS.narthex;
  const v = AREAS.nave;
  const r = AREAS.rotunda;
  return (
    (x > n.minX && x < n.maxX && z > n.minZ && z < n.maxZ) ||
    (x > v.minX && x < v.maxX && z > v.minZ && z < v.maxZ) ||
    Math.hypot(x - r.x, z - r.z) < r.r
  );
}

const WALK_SPEED = 4.2; // units per second
const TURN_SPEED = 1.6; // radians per second

/** Advance the walk by dt seconds (called every frame while roaming). */
export function stepRoam(dt: number) {
  roam.yaw -= roam.turn * TURN_SPEED * dt;
  // Facing −Z at yaw 0; yaw turns left.
  const fx = -Math.sin(roam.yaw);
  const fz = -Math.cos(roam.yaw);
  const sx = Math.cos(roam.yaw);
  const sz = -Math.sin(roam.yaw);
  const dx = (fx * roam.forward + sx * roam.strafe) * WALK_SPEED * dt;
  const dz = (fz * roam.forward + sz * roam.strafe) * WALK_SPEED * dt;
  // Slide along walls: try the full move, then each axis alone.
  if (walkable(roam.x + dx, roam.z + dz)) {
    roam.x += dx;
    roam.z += dz;
  } else if (walkable(roam.x + dx, roam.z)) roam.x += dx;
  else if (walkable(roam.x, roam.z + dz)) roam.z += dz;
}

/** Look around (mouse / touch drag, right stick). */
export function look(dYaw: number, dPitch: number) {
  roam.yaw += dYaw;
  roam.pitch = Math.max(-0.9, Math.min(1.35, roam.pitch + dPitch));
}

const listeners = new Set<() => void>();
let snapshot = false;
function emit() {
  snapshot = roam.active;
  listeners.forEach((l) => l());
}

export function useRoam(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => snapshot,
    () => false,
  );
}

let blend: gsap.core.Tween | null = null;

/** Start roaming from a pose (the guided camera's, so the hand-over is seamless). */
export function startRoam(from: { x: number; z: number; yaw: number; pitch: number }, instant = false) {
  roam.x = walkable(from.x, from.z) ? from.x : -23;
  roam.z = walkable(from.x, from.z) ? from.z : -0.6;
  roam.yaw = walkable(from.x, from.z) ? from.yaw : -Math.PI / 2;
  roam.pitch = Math.max(-0.9, Math.min(1.35, from.pitch));
  roam.forward = roam.turn = roam.strafe = 0;
  roam.active = true;
  ScrollSmoother.get()?.paused(true);
  emit();
  blend?.kill();
  if (instant) roam.t = 1;
  else blend = gsap.to(roam, { t: 1, duration: 0.8, ease: "power2.inOut" });
}

/** Back to the guided camera, where the journey was. */
export function stopRoam(instant = false) {
  if (!roam.active) return;
  roam.active = false;
  roam.forward = roam.turn = roam.strafe = 0;
  ScrollSmoother.get()?.paused(false);
  emit();
  blend?.kill();
  if (instant) roam.t = 0;
  else blend = gsap.to(roam, { t: 0, duration: 0.9, ease: "power2.inOut" });
}
