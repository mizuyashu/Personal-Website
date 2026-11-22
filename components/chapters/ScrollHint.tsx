import { ui } from "@/content/site";
import styles from "./Intro.module.css";

// Bottom of the first screen of chapter I; scrolls away with the void.
export default function ScrollHint() {
  return (
    <div className={styles.hint} aria-hidden>
      <span>{ui.scrollHint}</span>
      <span className={styles.hintLine} />
    </div>
  );
}
