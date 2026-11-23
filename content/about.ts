// Chapter IV copy. TODO(content) items are placeholders for Michael to fill in.
// Only Michael's own photos go in public/images/ (never saved reference art).
//
// Each part (games, music, the cat, moments) shows a small panel on the journey and opens its
// own page (/about/<id>, docs/vision.md §18) for everything that doesn't fit: more photos, more
// words. The journey keeps only a taste; the page holds the rest.

type Page = {
  /** A paragraph for the part's own page. */
  summary: string;
  /** The gallery on the part's own page (photo placeholders until Michael's photos are in). */
  gallery: string[];
};

export const aboutCopy = {
  open: "See more",
  back: "Back to the journey",
  galleryTitle: "Gallery",
};

export const about = {
  intro: "TODO(content): a line about who you are outside engineering.",
  games: {
    id: "games",
    title: "The games",
    // From Michael's vision brief (games he loves).
    items: ["Hollow Knight", "Silksong", "Dark Souls", "Sekiro", "Elden Ring", "Persona 3 Reload", "Minecraft shaders"],
    page: {
      summary: "TODO(content): why these games: what they taught you about difficulty, mood, and craft.",
      gallery: ["TODO(content): your own screenshot or photo", "TODO(content): your own screenshot or photo"],
    } satisfies Page,
  },
  music: {
    id: "music",
    title: "Music",
    // Vision brief: school concert; instrument still to decide.
    text: "School concert · TODO(content): instrument",
    recording: "TODO(content): a recording (plays only behind the audio toggle)",
    page: {
      summary: "TODO(content): the instrument, the concert, what you play.",
      gallery: ["TODO(content): concert photo", "TODO(content): photo"],
    } satisfies Page,
  },
  cat: {
    id: "cat",
    title: "The cat",
    photo: "TODO(content): cat photo",
    caption: "TODO(content): name",
    page: {
      summary: "TODO(content): the cat’s name and a line about them.",
      gallery: ["TODO(content): cat photo", "TODO(content): cat photo", "TODO(content): cat photo", "TODO(content): cat photo"],
    } satisfies Page,
  },
  photos: {
    id: "moments",
    title: "Moments",
    items: ["TODO(content): photo", "TODO(content): photo", "TODO(content): photo"],
    page: {
      summary: "TODO(content): a line for the moments.",
      gallery: [
        "TODO(content): photo",
        "TODO(content): photo",
        "TODO(content): photo",
        "TODO(content): photo",
        "TODO(content): photo",
        "TODO(content): photo",
      ],
    } satisfies Page,
  },
} as const;

/** The parts that open their own page, in journey order. */
export const aboutParts = [about.games, about.music, about.cat, about.photos];

export function aboutPart(id: string) {
  return aboutParts.find((part) => part.id === id);
}
