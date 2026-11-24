"use client";

import { useId, useRef, useState } from "react";
import { ui } from "@/content/site";
import { chapters } from "@/content/chapters";
import { CORRIDOR } from "@/lib/corridor";
import { useReducedMotion } from "@/lib/motion";
import { setAutoQuality, setQuality, useQuality } from "@/lib/quality";
import { startRoam, stopRoam, useRoam } from "@/lib/roam";
import { journey, scrollToChapter } from "@/lib/scroll";
import { cameraPose } from "@/components/canvas/layout";
import { useEscapeToClose } from "@/lib/focus";
import styles from "./ui.module.css";

/** Free roam starts in the cathedral: from where the guided camera stands if it's there, else at the entry. */
function enterRoam(reducedMotion: boolean) {
  const p = journey.position;
  const inCathedral = p >= 1 && p < 1 + CORRIDOR.tiltEnd;
  if (!inCathedral) scrollToChapter("projects", true);
  const pose = cameraPose(inCathedral ? p : 1, chapters.length);
  startRoam({ x: pose.x, z: pose.z, yaw: pose.yaw, pitch: pose.pitch }, reducedMotion);
}

// Corner menu: the Full/Lite switch and the Explore switch (guided / free roam).
// (Contact is reached through the compass nav, chapter V.)
export default function CornerMenu() {
  const [open, setOpen] = useState(false);
  const { quality, mode } = useQuality();
  const roaming = useRoam();
  const reducedMotion = useReducedMotion();
  const exploreName = useId();
  const panelId = useId();
  const name = useId();
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEscapeToClose(open, () => setOpen(false), root, toggle);
  const autoLabel = `${ui.qualityAuto} (${quality === "full" ? ui.qualityFull : ui.qualityLite})`;

  return (
    <div ref={root} className={`${styles.corner} ${styles.topRight}`}>
      <button
          ref={toggle}
          type="button"
          className={styles.button}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
        >
          {open ? ui.closeMenu : ui.menu}
        </button>
      {open && (
        <div id={panelId} className={styles.panel}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>{ui.quality}</legend>
            <label className={styles.option}>
              <input type="radio" name={name} checked={mode === "auto"} onChange={setAutoQuality} />
              {mode === "auto" ? autoLabel : ui.qualityAuto}
            </label>
            <label className={styles.option}>
              <input type="radio" name={name} checked={mode === "manual" && quality === "full"} onChange={() => setQuality("full")} />
              {ui.qualityFull}
            </label>
            <label className={styles.option}>
              <input type="radio" name={name} checked={mode === "manual" && quality === "lite"} onChange={() => setQuality("lite")} />
              {ui.qualityLite}
            </label>
          </fieldset>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>{ui.explore}</legend>
            <label className={styles.option}>
              <input type="radio" name={exploreName} checked={!roaming} onChange={() => stopRoam(reducedMotion)} />
              {ui.guided}
            </label>
            <label className={styles.option}>
              <input
                type="radio"
                name={exploreName}
                checked={roaming}
                onChange={() => {
                  enterRoam(reducedMotion);
                  setOpen(false);
                }}
              />
              {ui.freeRoam}
            </label>
          </fieldset>
        </div>
      )}
    </div>
  );
}
