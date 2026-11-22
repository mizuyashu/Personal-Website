import { projectsCopy } from "@/content/projects";
import styles from "./WebsiteProject.module.css";

// Coding project → device-frame mockup. TODO(content): real screenshots of the site go on the
// screen (images in public/images/, Michael's own). Never show real source code here.
export default function WebsiteProject() {
  return (
    <figure className={styles.device} aria-label={projectsCopy.formatLabels.device}>
      <div className={styles.screen}>
        <div className={styles.browserBar} aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className={styles.placeholder}>{projectsCopy.screensPending}</div>
      </div>
      <div className={styles.base} aria-hidden />
    </figure>
  );
}

/** Card emblem: a small laptop outline. */
export function WebsiteEmblem() {
  return (
    <svg viewBox="0 0 64 48" focusable="false">
      <rect x="10" y="6" width="44" height="28" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M4 40 H60 L56 34 H8 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 14 H34 M16 20 H44 M16 26 H28" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
