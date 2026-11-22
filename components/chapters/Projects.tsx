import type { CSSProperties, ReactNode } from "react";
import type { Chapter } from "@/content/chapters";
import { projects, projectsCopy, type Project } from "@/content/projects";
import { BLUEPRINT_SCREENS, CORRIDOR, PROJECTS_SCREENS } from "@/lib/corridor";
import HudWindow from "@/components/ui/HudWindow";
import TarotCard from "@/components/ui/TarotCard";
import WebsiteProject, { WebsiteEmblem } from "@/components/projects/website/WebsiteProject";
import SummerBuild, { SummerBuildEmblem } from "@/components/projects/summer-build/SummerBuild";
import styles from "./Projects.module.css";

// Each project owns its presentation (components/projects/<id>/).
const presentations: Record<string, { body: ReactNode; emblem: ReactNode }> = {
  website: { body: <WebsiteProject />, emblem: <WebsiteEmblem /> },
  "summer-build": { body: <SummerBuild />, emblem: <SummerBuildEmblem /> },
};

// Chapter II's HTML. The first part of the chapter is the 3D corridor (nothing to read);
// the projects scroll past while the camera holds on the blueprint.
export default function Projects({ chapter }: { chapter: Chapter }) {
  const layout = {
    "--corridor-screens": CORRIDOR.riseEnd * PROJECTS_SCREENS,
    "--blueprint-screens": BLUEPRINT_SCREENS,
  } as CSSProperties;

  return (
    <div className={styles.projects} style={layout}>
      <div className={styles.corridor} aria-hidden />
      <div className={styles.blueprint}>
        <header className={styles.header}>
          <p className={styles.numeral}>{chapter.numeral}</p>
          <h2 id={`${chapter.id}-title`} className={styles.title}>
            {chapter.title}
          </h2>
          <p className={styles.world}>{chapter.world}</p>
          <p className={styles.intro}>{projectsCopy.intro}</p>
        </header>

        <div className={styles.index}>
          <p className={styles.pick}>{projectsCopy.pickCard}</p>
          <div className={styles.cards}>
            {projects.map((p) => (
              <TarotCard
                key={p.id}
                numeral={p.numeral}
                title={p.title}
                tagline={p.tagline}
                status={p.status}
                frame={p.frame}
                emblem={presentations[p.id]?.emblem}
                target={`project-${p.id}`}
              />
            ))}
          </div>
        </div>

        {projects.map((p) => (
          <ProjectPanel key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
}

function ProjectPanel({ project }: { project: Project }) {
  return (
    <article id={`project-${project.id}`} className={styles.panel} aria-labelledby={`project-${project.id}-title`}>
      <header className={styles.panelHead}>
        <span className={styles.panelNumeral}>{project.numeral}</span>
        <h3 id={`project-${project.id}-title`} className={styles.panelTitle}>
          {project.title}
        </h3>
        <span className={styles.panelStatus}>{project.status}</span>
      </header>
      <p className={styles.summary}>{project.summary}</p>
      <div className={styles.panelBody}>
        <div className={styles.presentation}>{presentations[project.id]?.body}</div>
        <HudWindow title={projectsCopy.specTitle} className={styles.spec}>
          <dl className={styles.specList}>
            {project.specs.map((row) => (
              <div key={row.label} className={styles.specRow}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </HudWindow>
      </div>
      <p className={styles.outcome}>
        <span className={styles.outcomeLabel}>{projectsCopy.outcomeLabel}</span>
        <span className={styles.outcomeValue}>{project.outcome}</span>
      </p>
    </article>
  );
}
