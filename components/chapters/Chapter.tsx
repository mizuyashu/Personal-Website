import type { CSSProperties, ReactNode } from "react";
import type { Chapter as ChapterData } from "@/content/chapters";
import { cssVar } from "@/lib/palette";
import styles from "./Chapter.module.css";

type Props = { chapter: ChapterData; children?: ReactNode };

// M1 placeholder overlay for a chapter: numeral, title, world. Real chapters replace the body.
export default function Chapter({ chapter, children }: Props) {
  const style = {
    "--chapter-fg": cssVar(chapter.foreground),
    "--chapter-accent": cssVar(chapter.accent),
  } as CSSProperties;

  return (
    <section id={chapter.id} data-chapter className={styles.chapter} style={style} aria-labelledby={`${chapter.id}-title`}>
      <div className={styles.inner}>
        <p className={styles.numeral}>{chapter.numeral}</p>
        <h2 id={`${chapter.id}-title`} className={styles.title}>
          {chapter.title}
        </h2>
        <p className={styles.world}>{chapter.world}</p>
        {children}
      </div>
    </section>
  );
}
