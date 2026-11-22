import { site } from "@/content/site";
import styles from "./Chapter.module.css";

// Placeholder name mark; the real one (glowing serif in the compass-star sun) comes in M2.
export default function NameMark() {
  return (
    <>
      <h1 className={styles.name}>{site.name}</h1>
      <p className={styles.epithet}>{site.epithet}</p>
    </>
  );
}
