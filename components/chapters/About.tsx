import type { CSSProperties } from "react";
import Link from "next/link";
import type { Chapter } from "@/content/chapters";
import { about, aboutCopy } from "@/content/about";
import { ABOUT_SCREENS, DESCENT } from "@/lib/embers";
import styles from "./About.module.css";

// Chapter IV's HTML, after the descent (components/chapters/Descent.tsx): webtoon-style
// panels on black (games, music, the cat, moments), tilted frames and wide gutters. Each panel
// is a taste; "See more" opens the part's own page (/about/<id>) over the journey.

function More({ id }: { id: string }) {
  return (
    <Link href={`/about/${id}`} scroll={false} className={styles.more}>
      {aboutCopy.open} <span aria-hidden>→</span>
    </Link>
  );
}
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
        <section id={`about-${about.games.id}`} className={`${styles.panel} ${styles.games}`}>
          <h3 className={styles.panelTitle}>{about.games.title}</h3>
          <ul className={styles.relics}>
            {about.games.items.map((game) => (
              <li key={game}>{game}</li>
            ))}
          </ul>
          <More id={about.games.id} />
        </section>

        <section id={`about-${about.music.id}`} className={`${styles.panel} ${styles.music}`}>
          <h3 className={styles.panelTitle}>{about.music.title}</h3>
          <p>{about.music.text}</p>
          <p className={styles.note}>{about.music.recording}</p>
          <More id={about.music.id} />
        </section>

        <section id={`about-${about.cat.id}`} className={`${styles.panel} ${styles.cat}`}>
          <h3 className={styles.panelTitle}>{about.cat.title}</h3>
          <div className={styles.photo}>{about.cat.photo}</div>
          <p className={styles.note}>{about.cat.caption}</p>
          <More id={about.cat.id} />
        </section>

        <section id={`about-${about.photos.id}`} className={`${styles.panel} ${styles.moments}`}>
          <h3 className={styles.panelTitle}>{about.photos.title}</h3>
          <div className={styles.strip}>
            {about.photos.items.map((item, i) => (
              <div key={i} className={styles.photo}>
                {item}
              </div>
            ))}
          </div>
          <More id={about.photos.id} />
        </section>
      </div>
    </div>
  );
}
