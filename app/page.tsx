import { site } from "@/content/site";
import styles from "./page.module.css";

// M0: blank ivory page with the name in Cinzel. The journey replaces this in M1.
export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.mark}>
        <h1 className={styles.name}>{site.name}</h1>
        <p className={styles.epithet}>{site.epithet}</p>
      </div>
    </main>
  );
}
