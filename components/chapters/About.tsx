import type { CSSProperties } from "react";
import type { Chapter } from "@/content/chapters";
import { about } from "@/content/about";
import { ABOUT_SCREENS, DESCENT } from "@/lib/embers";
import styles from "./About.module.css";

// Chapter IV's HTML, after the descent (components/chapters/Descent.tsx): webtoon-style
// panels on black (games, music, the cat, moments), tilted frames and wide gutters.
export default function About({ chapter }: { chapter: Chapter }) {
  const layout = {
    "--screens": ABOUT_SCREENS,
    "--descent-screens": DESCENT.letterboxClosed * ABOUT_SCREENS,
  } as CSSProperties;

  return (
    <div className={styles.about} style={layout}>
      <div aria-hidden />
      <header className={styles.header}>
        <p className={styles.numeral}>{chapter.numeral}</p>
        <h2 id={`${chapter.id}-title`} className={styles.title}>
          {chapter.title}
        </h2>
        <p className={styles.world}>{chapter.world}</p>
        <p className={styles.intro}>{about.intro}</p>
      </header>

      <div className={styles.panels}>
        <section className={`${styles.panel} ${styles.games}`}>
          <h3 className={styles.panelTitle}>{about.games.title}</h3>
          <ul className={styles.relics}>
            {about.games.items.map((game) => (
              <li key={game}>{game}</li>
            ))}
          </ul>
        </section>

        <section className={`${styles.panel} ${styles.music}`}>
          <h3 className={styles.panelTitle}>{about.music.title}</h3>
          <p>{about.music.text}</p>
          <p className={styles.note}>{about.music.recording}</p>
        </section>

        <section className={`${styles.panel} ${styles.cat}`}>
          <h3 className={styles.panelTitle}>{about.cat.title}</h3>
          <div className={styles.photo}>{about.cat.photo}</div>
          <p className={styles.note}>{about.cat.caption}</p>
        </section>

        <section className={`${styles.panel} ${styles.moments}`}>
          <h3 className={styles.panelTitle}>{about.photos.title}</h3>
          <div className={styles.strip}>
            {about.photos.items.map((item, i) => (
              <div key={i} className={styles.photo}>
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
