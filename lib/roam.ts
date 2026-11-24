"use client";

import { useSyncExternalStore } from "react";
import { gsap, ScrollSmoother } from "@/lib/gsap";
import { FLOOR_OBSTACLES } from "@/components/canvas/layout";

// Free roam (docs/vision.md §19): instead of the guided, scroll-driven camera, the visitor walks
// the cathedral themselves: the narthex, the nave and aisles, the rotunda. Guided is the default.
// The camera blends between the guided pose and the roaming one (`roam.t`); while roaming the
// page doesn't scroll and the journey position holds (so the cathedral stays on screen).
// Walls bound the walk; columns, statue plinths and the throne's dais block it too, and you
// slide round them (layout.ts FLOOR_OBSTACLES). No walkable gallery yet.

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

/** How close the eye may come to anything solid (world units). */
const BODY = 0.3;

/**
 * Push a point out of every obstacle (circles and boxes grown by BODY), along the shortest way
 * out, so walking into a column slides you round it instead of stopping you dead. Two passes
 * settle the rare spot where two footprints nearly touch.
 */
function clearOfObstacles(x: number, z: number): [number, number] {
  for (let pass = 0; pass < 2; pass++) {
    for (const c of FLOOR_OBSTACLES.circles) {
      const dx = x - c.x;
      const dz = z - c.z;
      const min = c.r + BODY;
      const d = Math.hypot(dx, dz);
      if (d >= min) continue;
      if (d < 1e-6) {
        z = c.z + min;
      } else {
        x = c.x + (dx / d) * min;
        z = c.z + (dz / d) * min;
      }
    }
    for (const b of FLOOR_OBSTACLES.boxes) {
      const left = x - (b.minX - BODY);
      const right = b.maxX + BODY - x;
      const back = z - (b.minZ - BODY);
      const front = b.maxZ + BODY - z;
      if (left <= 0 || right <= 0 || back <= 0 || front <= 0) continue;
      const least = Math.min(left, right, back, front);
      if (least === left) x = b.minX - BODY;
      else if (least === right) x = b.maxX + BODY;
      else if (least === back) z = b.minZ - BODY;
      else z = b.maxZ + BODY;
    }
  }
  return [x, z];
}

/** Inside any obstacle (after pushing out, only where two footprints pinch a gap shut). */
function blocked(x: number, z: number) {
  return (
    FLOOR_OBSTACLES.circles.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + BODY - 1e-3) ||
    FLOOR_OBSTACLES.boxes.some((b) => x > b.minX - BODY + 1e-3 && x < b.maxX + BODY - 1e-3 && z > b.minZ - BODY + 1e-3 && z < b.maxZ + BODY - 1e-3)
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
  let x = roam.x;
  let z = roam.z;
  if (walkable(x + dx, z + dz)) {
    x += dx;
    z += dz;
  } else if (walkable(x + dx, z)) x += dx;
  else if (walkable(x, z + dz)) z += dz;
  // Then slide round whatever stands on the floor; if that would push through a wall or into the
  // next footprint (a pinched gap), stay put.
  const [cx, cz] = clearOfObstacles(x, z);
  if (walkable(cx, cz) && !blocked(cx, cz)) {
    roam.x = cx;
    roam.z = cz;
  }
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
  const [cx, cz] = clearOfObstacles(roam.x, roam.z);
  if (walkable(cx, cz)) [roam.x, roam.z] = [cx, cz];
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
