import type { CSSProperties } from "react";
import type { Chapter } from "@/content/chapters";
import { contact } from "@/content/contact";
import { CONTACT_SCREENS } from "@/lib/bonfire";
import ContactLinks from "@/components/ui/ContactLinks";
import styles from "./Contact.module.css";

// Chapter V's HTML: rest at the bonfire, the compass of links; then the ending overlay
// (components/chapters/Ending.tsx) takes the rest of the chapter.
export default function Contact({ chapter }: { chapter: Chapter }) {
  return (
    <div className={styles.contact} style={{ "--screens": CONTACT_SCREENS } as CSSProperties}>
      <header className={styles.header}>
        <p className={styles.numeral}>{chapter.numeral}</p>
        <h2 id={`${chapter.id}-title`} className={styles.title}>
          {chapter.title}
        </h2>
        <p className={styles.world}>{chapter.world}</p>
        <p className={styles.intro}>{contact.intro}</p>
      </header>
      <div className={styles.links}>
        <p className={styles.rest}>{contact.rest}</p>
        <ContactLinks />
      </div>
    </div>
  );
}
