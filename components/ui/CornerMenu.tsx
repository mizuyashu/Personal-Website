"use client";

import { useId, useState } from "react";
import { ui } from "@/content/site";
import { setAutoQuality, setQuality, useQuality } from "@/lib/quality";
import styles from "./ui.module.css";

// Corner menu: the Full/Lite switch. (Contact is reached through the compass nav, chapter V.)
export default function CornerMenu() {
  const [open, setOpen] = useState(false);
  const { quality, mode } = useQuality();
  const panelId = useId();
  const name = useId();
  const autoLabel = `${ui.qualityAuto} (${quality === "full" ? ui.qualityFull : ui.qualityLite})`;

  return (
    <div className={`${styles.corner} ${styles.topRight}`}>
      <button
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
        </div>
      )}
    </div>
  );
}
