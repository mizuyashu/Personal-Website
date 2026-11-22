"use client";

import { useId, useState, type ReactNode } from "react";
import { projectsCopy } from "@/content/projects";
import styles from "./HudWindow.module.css";

type Props = { title: string; children: ReactNode; className?: string };

// Blueprint HUD window: cobalt title bar with a working × that folds the window to its bar.
export default function HudWindow({ title, children, className }: Props) {
  const [open, setOpen] = useState(true);
  const bodyId = useId();
  return (
    <section className={`${styles.window} ${className ?? ""}`} data-open={open}>
      <header className={styles.bar}>
        <span className={styles.title}>{title}</span>
        <button
          type="button"
          className={styles.close}
          aria-expanded={open}
          aria-controls={bodyId}
          aria-label={open ? projectsCopy.close : projectsCopy.open}
          onClick={() => setOpen(!open)}
        >
          {open ? "×" : "+"}
        </button>
      </header>
      <div id={bodyId} className={styles.body} hidden={!open}>
        {children}
      </div>
    </section>
  );
}
