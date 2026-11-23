import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { palette } from "@/lib/palette";
import { seededRandom } from "../layout";

// Generated canvas textures shared by the cathedral scenes (Arches, Rotunda). No image files.

export /** One marble floor tile (repeats): ivory with a lavender diagonal inlay and gold studs. */
function makeFloorTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = palette.ivory;
  ctx.fillRect(0, 0, size, size);
  // Faint veining.
  const random = seededRandom(5);
  ctx.strokeStyle = "rgba(185, 180, 232, 0.18)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    let x = random() * size;
    let y = random() * size;
    ctx.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      x += (random() - 0.3) * 60;
      y += (random() - 0.5) * 60;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // Diamond inlay and tile joints.
  ctx.strokeStyle = palette.lavender;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size, size / 2);
  ctx.lineTo(size / 2, size);
  ctx.lineTo(0, size / 2);
  ctx.closePath();
  ctx.stroke();
  ctx.strokeStyle = "rgba(11, 10, 10, 0.12)";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);
  ctx.fillStyle = palette.gold;
  for (const [x, y] of [[0, 0], [size, 0], [0, size], [size, size], [size / 2, size / 2]]) {
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

export /** The lift's top face: an 8-point compass star in rings, gold on ivory stone. */
function makeLiftTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;
  ctx.fillStyle = palette.ivory;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = palette.gold;
  for (const [r, w] of [[c - 8, 8], [c - 34, 3], [c * 0.42, 3]] as const) {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Compass star: four long points, four short.
  ctx.fillStyle = palette.gold;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8 - Math.PI / 2;
    const r = i % 2 === 1 ? c * 0.1 : i % 4 === 0 ? c * 0.86 : c * 0.5;
    const x = c + Math.cos(angle) * r;
    const y = c + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1;
  // Ticks around the rim.
  ctx.lineWidth = 3;
  for (let i = 0; i < 64; i++) {
    const angle = (i * Math.PI * 2) / 64;
    const inner = i % 8 === 0 ? c - 60 : c - 46;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(angle) * inner, c + Math.sin(angle) * inner);
    ctx.lineTo(c + Math.cos(angle) * (c - 34), c + Math.sin(angle) * (c - 34));
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export /** Soft round sprite for the tower motes. */
function makeMoteMaterialMap() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.55)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new CanvasTexture(canvas);
}

/**
 * Carved band for the great lift's edge (repeats around it): a frieze of worn relief,
 * rings, compass-star medallions and invented glyphs, as if cut for giants.
 */
export function makeReliefTexture() {
  const w = 1024;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#e7e0d2";
  ctx.fillRect(0, 0, w, h);
  const shade = "rgba(60, 50, 80, 0.35)";
  const light = "rgba(255, 250, 235, 0.8)";
  // Moulded bands top and bottom.
  for (const [y, t] of [[18, 10], [44, 4], [h - 48, 4], [h - 22, 12]] as const) {
    ctx.fillStyle = shade;
    ctx.fillRect(0, y + 2, w, t);
    ctx.fillStyle = light;
    ctx.fillRect(0, y, w, t * 0.5);
  }
  // Medallions with compass stars, and glyph panels between them.
  const random = seededRandom(404);
  const cell = w / 4;
  for (let k = 0; k < 4; k++) {
    const cx = k * cell + cell / 2;
    const cy = h / 2;
    ctx.lineWidth = 6;
    ctx.strokeStyle = shade;
    ctx.beginPath();
    ctx.arc(cx + 2, cy + 3, 56, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = light;
    ctx.beginPath();
    ctx.arc(cx, cy, 56, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = shade;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8 - Math.PI / 2;
      const r = i % 2 === 1 ? 8 : i % 4 === 0 ? 46 : 26;
      const x = cx + 2 + Math.cos(a) * r;
      const y = cy + 3 + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    // Invented glyph panel to the right of each medallion.
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    for (let g = 0; g < 3; g++) {
      const gx = cx + 80 + g * 26;
      ctx.beginPath();
      let x = gx + Math.floor(random() * 2) * 12;
      let y = cy - 40 + Math.floor(random() * 3) * 20;
      ctx.moveTo(x, y);
      for (let s2 = 0; s2 < 3; s2++) {
        x = gx + Math.floor(random() * 2) * 12;
        y = cy - 40 + Math.floor(random() * 5) * 20;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = shade;
      ctx.stroke();
    }
  }
  // Wear: faint cracks and grime.
  ctx.strokeStyle = "rgba(60, 50, 80, 0.18)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    let x = random() * w;
    let y = random() * h;
    ctx.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      x += (random() - 0.5) * 40;
      y += random() * 30;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}
