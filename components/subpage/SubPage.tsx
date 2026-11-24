"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { about, aboutCopy, aboutPart } from "@/content/about";
import { education } from "@/content/education";
import { projects, projectsCopy } from "@/content/projects";
import { presentations } from "@/components/projects/presentations";
import HudWindow from "@/components/ui/HudWindow";
import { ScrollSmoother } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/motion";
import { cssVar } from "@/lib/palette";
import { closeView, openView } from "@/lib/view";
import { focusQuietly, restoreFocus } from "@/lib/focus";
import styles from "./SubPage.module.css";

type Props = { kind: "project" | "year" | "about"; id: string; mode: "modal" | "page" };

/** Where "back" lands on the journey when there's no journey behind the page (a direct load). */
function anchorFor(kind: Props["kind"], id: string) {
  if (kind === "project") return `project-${id}`;
  if (kind === "about") return `about-${id}`;
  return "education-record";
}

// A sub-page (docs/vision.md §18): a project or an education year. Opened from the journey it is
// a modal over it (the journey stays mounted, so closing returns exactly where you were); loaded
// directly it is a page of its own. Either way the camera flies to the sub-page space (lib/view.ts)
// where the project's huge object waits off to the right, and this clean text sits on the left.
export default function SubPage({ kind, id, mode }: Props) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const project = kind === "project" ? projects.find((p) => p.id === id) : undefined;
  const year = kind === "year" ? education.timeline.find((t) => t.id === id) : undefined;
  const part = kind === "about" ? aboutPart(id) : undefined;

  // Keyboard focus: into the page on open (its back button), and back to what opened it (the
  // card or "See more" on the journey) on close, once the journey shows again. Declared before
  // openView's effect: that hides the journey (instantly with reduced motion), which would blur
  // the opener before it could be noted.
  const backButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const opener = document.activeElement;
    focusQuietly(backButton.current);
    return () => {
      if (mode === "modal") restoreFocus(opener);
    };
  }, [mode]);

  useEffect(() => {
    openView({ kind, id }, mode === "page" || reducedMotion);
    const smoother = ScrollSmoother.get();
    smoother?.paused(true);
    return () => {
      smoother?.paused(false);
    };
  }, [kind, id, mode, reducedMotion]);

  const close = () => {
    if (mode === "modal") {
      closeView(reducedMotion);
      router.back();
    } else {
      closeView(true);
      router.push(`/?from=${anchorFor(kind, id)}`);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!project && !year && !part) return null;
  const instant = mode === "page" || reducedMotion;

  return (
    <div className={styles.page} data-kind={kind} data-instant={instant} role="dialog" aria-modal={mode === "modal"} aria-label={project?.title ?? year?.when ?? part?.title}>
      <div className={styles.panel} data-own-scroll>
        <button ref={backButton} type="button" className={styles.back} onClick={close}>
          <span aria-hidden>←</span> {part ? aboutCopy.back : education.yearPage.back} <kbd>Esc</kbd>
        </button>

        {project && (
          <article className={styles.content} style={{ "--frame": cssVar(project.frame) } as CSSProperties}>
            <p className={styles.numeral}>{project.numeral}</p>
            <h1 className={styles.title}>{project.title}</h1>
            <p className={styles.tagline}>{project.tagline}</p>
            <span className={styles.status}>{project.status}</span>
            <p className={styles.summary}>{project.summary}</p>
            <div className={styles.presentation}>{presentations[project.id]?.body}</div>
            <HudWindow title={projectsCopy.specTitle}>
              <dl className={styles.specs}>
                {project.specs.map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </HudWindow>
            <p className={styles.outcome}>
              <span className={styles.label}>{projectsCopy.outcomeLabel}</span>
              <span className={styles.outcomeValue}>{project.outcome}</span>
            </p>
            {project.link && (
              <a className={styles.link} href={project.link.href}>
                {project.link.label}
              </a>
            )}
          </article>
        )}

        {year && (
          <article className={styles.content}>
            <p className={styles.numeral}>{education.school}</p>
            <h1 className={styles.title}>{year.when}</h1>
            <p className={styles.tagline}>{education.program}</p>
            <p className={styles.summary}>{education.yearPage.summary}</p>
            <h2 className={styles.label}>{education.yearPage.coursesTitle}</h2>
            <ul className={styles.list}>
              {education.yearPage.courses.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
            <h2 className={styles.label}>{education.yearPage.skillsTitle}</h2>
            <ul className={styles.list}>
              {education.yearPage.skills.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </article>
        )}

        {part && (
          <article className={styles.content}>
            <p className={styles.numeral}>IV</p>
            <h1 className={styles.title}>{part.title}</h1>
            <p className={styles.summary}>{part.page.summary}</p>
            {part.id === "games" && (
              <ul className={styles.list}>
                {about.games.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            <h2 className={styles.label}>{aboutCopy.galleryTitle}</h2>
            <div className={styles.gallery}>
              {part.page.gallery.map((item, i) => (
                <div key={i} className={styles.tile}>
                  {item}
                </div>
              ))}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
