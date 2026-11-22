import type { CSSProperties, ReactNode } from "react";
import type { Chapter as ChapterData } from "@/content/chapters";
import { cssVar } from "@/lib/palette";
import styles from "./Chapter.module.css";

type Props = {
  chapter: ChapterData;
  /** Show the numeral / title / world header (placeholder chapters). */
  header?: boolean;
  children?: ReactNode;
};

// One chapter's scroll section. Placeholder chapters show a header; built chapters bring their own overlay.
export default function Chapter({ chapter, header = true, children }: Props) {
  const style = {
    "--chapter-fg": cssVar(chapter.foreground),
    "--chapter-accent": cssVar(chapter.accent),
    "--chapter-screens": chapter.screens,
    "--chapter-header-at": chapter.headerAt ?? 0,
  } as CSSProperties;

  return (
    <section
      id={chapter.id}
      data-chapter
      className={styles.chapter}
      style={style}
      aria-labelledby={header ? `${chapter.id}-title` : undefined}
      aria-label={header ? undefined : chapter.title}
    >
      {header ? (
        <div className={styles.inner}>
          <p className={styles.numeral}>{chapter.numeral}</p>
          <h2 id={`${chapter.id}-title`} className={styles.title}>
            {chapter.title}
          </h2>
          <p className={styles.world}>{chapter.world}</p>
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
}
