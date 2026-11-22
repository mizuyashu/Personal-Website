import styles from "./StatusWindow.module.css";

type Props = { label: string; text: string };

// Game-style status window ("Skill unlocked: CAD"): small, gold-ruled, slides in when shown.
export default function StatusWindow({ label, text }: Props) {
  return (
    <div className={styles.window} role="status">
      <span className={styles.label}>{label}</span>
      <span className={styles.text}>{text}</span>
    </div>
  );
}
