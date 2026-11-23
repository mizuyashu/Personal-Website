import type { CSSProperties } from "react";
import Link from "next/link";
import type { Chapter } from "@/content/chapters";
import { education } from "@/content/education";
import { DAWN, EDUCATION_SCREENS } from "@/lib/dawn";
import styles from "./Education.module.css";

// Chapter III's HTML: the header as the dawn opens, open sky while the constellation
// overlay draws (components/chapters/Constellation.tsx), then the record.
export default function Education({ chapter }: { chapter: Chapter }) {
  const layout = {
    "--screens": EDUCATION_SCREENS,
    "--opening-screens": DAWN.skyIn * EDUCATION_SCREENS,
    "--record-screens": (1 - DAWN.skyOut) * EDUCATION_SCREENS,
  } as CSSProperties;

  return (
    <div className={styles.education} style={layout}>
      <header className={styles.header}>
        <p className={styles.numeral}>{chapter.numeral}</p>
        <h2 id={`${chapter.id}-title`} className={styles.title}>
          {chapter.title}
        </h2>
        <p className={styles.world}>{chapter.world}</p>
        <p className={styles.school}>
          {education.program} · {education.school}
        </p>
        <p className={styles.intro}>{education.intro}</p>
      </header>
      <div aria-hidden />
      <section id="education-record" className={styles.record} aria-label={education.recordTitle}>
        <h3 className={styles.recordTitle}>{education.recordTitle}</h3>
        <ol className={styles.timeline}>
          {education.timeline.map((item) => (
            <li key={item.id}>
              <span className={styles.when}>{item.when}</span>
              <span>{item.what}</span>
              {/* Each year opens its own page (docs/vision.md §18), over the journey. */}
              <Link href={`/education/${item.id}`} scroll={false} className={styles.open}>
                {education.yearPage.open} <span aria-hidden>→</span>
              </Link>
            </li>
          ))}
        </ol>
        <h3 className={styles.recordTitle}>{education.awardsTitle}</h3>
        <ul className={styles.awards}>
          {education.awards.map((award) => (
            <li key={award}>{award}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
