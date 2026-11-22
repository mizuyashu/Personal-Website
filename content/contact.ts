// Chapter V copy and links. TODO(content): real URLs (vision §16 Q11). A link with an empty
// href renders as a disabled placeholder.

export type ContactLink = { label: string; href: string; note: string };

export const contact = {
  intro: "TODO(content): an invitation to reach out.",
  rest: "Rest at the bonfire",
  menuButton: "Contact",
  menuTitle: "Send word",
  close: "Close",
  pending: "TODO(content): link",
  links: [
    { label: "GitHub", href: "", note: "TODO(content)" },
    { label: "LinkedIn", href: "", note: "TODO(content)" },
    { label: "Email", href: "", note: "TODO(content)" },
    { label: "Résumé", href: "", note: "TODO(content)" },
  ] satisfies ContactLink[],
  ending: "TODO(content): a closing line.",
} as const;
