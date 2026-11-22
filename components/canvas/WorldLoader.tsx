"use client";

import dynamic from "next/dynamic";

// WebGL is client-only: load the world without server rendering.
const World = dynamic(() => import("./World"), { ssr: false });

export default function WorldLoader() {
  return <World />;
}
