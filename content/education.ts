// Chapter III copy and data. TODO(content) items are placeholders for Michael to fill in.

export type Skill = {
  /** Shown on the star and in its status window. TODO(content): real skill names. */
  name: string;
  /** Position in the constellation (viewBox 100 × 60). */
  x: number;
  y: number;
};

export const education = {
  // From Michael's previous site.
  school: "Queen’s University",
  program: "Computer Engineering",
  intro: "TODO(content): one line about what you’re learning and where it’s heading.",
  constellationLabel: "Skill constellation",
  unlocked: "Skill unlocked",
  skills: [
    { name: "Skill I", x: 12, y: 44 },
    { name: "Skill II", x: 26, y: 30 },
    { name: "Skill III", x: 41, y: 38 },
    { name: "Skill IV", x: 52, y: 18 },
    { name: "Skill V", x: 66, y: 32 },
    { name: "Skill VI", x: 79, y: 14 },
    { name: "Skill VII", x: 88, y: 40 },
  ] satisfies Skill[],
  /** Lines between stars (prerequisites), drawn in this order. */
  edges: [
    [0, 1],
    [1, 2],
    [1, 3],
    [3, 4],
    [2, 4],
    [4, 5],
    [4, 6],
  ] as [number, number][],
  recordTitle: "The record",
  timeline: [
    { when: "Year 1", what: "TODO(content)" },
    { when: "Year 2", what: "TODO(content)" },
  ],
  awardsTitle: "Awards",
  awards: ["TODO(content)"],
} as const;
