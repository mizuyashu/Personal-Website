import { contact } from "@/content/contact";
import CompassStar from "./CompassStar";
import styles from "./ContactLinks.module.css";

// Compass contact (vision §12): the four links sit on the star's four points.
// Placeholder links (empty href) render disabled until Michael adds the URLs.
export default function ContactLinks() {
  return (
    <nav className={styles.compass} aria-label={contact.menuTitle}>
      <CompassStar className={styles.star} />
      <ul className={styles.points}>
        {contact.links.map((link, i) => (
          <li key={link.label} className={styles[`p${i}`]}>
            {link.href ? (
              <a href={link.href} className={styles.link} target={link.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                {link.label}
              </a>
            ) : (
              <span className={styles.link} aria-disabled="true" title={contact.pending}>
                {link.label}
              </span>
            )}
            <span className={styles.note}>{link.note}</span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
