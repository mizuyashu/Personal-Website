"use client";

import { useRef, useState } from "react";
import { ui } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { whenWorldReady } from "@/lib/loading";
import { useReducedMotion } from "@/lib/motion";
import CompassStar from "./CompassStar";
import styles from "./Loader.module.css";

const FALLBACK_MS = 6000;

// 000% → 100% loader over the void. Counts while fonts load and the 3D world starts,
// then fades away. Scrolling is locked until it's gone.
// TODO(content): the loader image is open (vision §16 Q9: blooming rose or small bonfire); compass star for now.
export default function Loader() {
  const [done, setDone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      const html = document.documentElement;
      html.style.overflow = "hidden";
      let alive = true;
      let finished = false;
      const counter = { value: 0 };
      const render = () => {
        if (count.current) count.current.textContent = `${String(Math.round(counter.value)).padStart(3, "0")}%`;
      };
      const crawl = gsap.to(counter, { value: 90, duration: 4, ease: "power1.out", onUpdate: render });

      const finish = () => {
        if (!alive || finished) return;
        finished = true;
        crawl.kill();
        gsap
          .timeline({
            onComplete: () => {
              html.style.overflow = "";
              setDone(true);
            },
          })
          .to(counter, { value: 100, duration: reducedMotion ? 0 : 0.5, ease: "power2.out", onUpdate: render })
          .to(root.current, { autoAlpha: 0, duration: reducedMotion ? 0.2 : 0.9, ease: "power2.inOut" }, "+=0.15");
      };

      Promise.all([document.fonts.ready, whenWorldReady()]).then(finish);
      const fallback = window.setTimeout(finish, FALLBACK_MS);
      return () => {
        alive = false;
        window.clearTimeout(fallback);
        html.style.overflow = "";
      };
    },
    { scope: root },
  );

  if (done) return null;
  return (
    <div ref={root} className={styles.loader} role="status" aria-label={ui.loading}>
      <CompassStar className={styles.star} />
      <span ref={count} className={styles.count}>
        000%
      </span>
    </div>
  );
}
