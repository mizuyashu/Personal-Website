# Michael's Personal Website

Personal site for a Computer Engineering student at Queen’s University.

The site is being rebuilt as a scroll-driven 3D journey on the `Radiance` branch.
`main` is the live site until the final milestone.

- Creative vision: [docs/vision.md](docs/vision.md)
- Build order and status: [docs/milestones.md](docs/milestones.md)
- Working rules for code (stack, layout, architecture): [CLAUDE.md](CLAUDE.md)

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router), React 19, TypeScript
- Three.js, React Three Fiber, drei, postprocessing
- GSAP + `@gsap/react` (ScrollTrigger, ScrollSmoother, SplitText)
- Plain CSS / CSS Modules with palette variables

Requires Node.js 20.9 or newer.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: create a production build
- `npm run start`: run the production build
- `npm run lint`: run ESLint

## Structure

```
app/
├── layout.tsx            fonts, global CSS
├── globals.css           palette variables, base styles
└── page.tsx              the whole journey, chapters in order
components/
├── canvas/               the one fixed <Canvas>: World, CameraRig, Backdrop, Dust, placeholders
│   └── scenes/           Void, Sun (intro), Arches, Blueprint (chapter II corridor + skylight)
├── chapters/             Journey (scroll timeline), Chapter, Intro (name mark + flash), Filigree, ScrollHint
└── ui/                   Loader, CornerMenu (Full/Lite), CompassNav, CompassStar
content/                  site.ts, chapters.ts (all copy lives here)
lib/                      palette, gsap, scroll, intro, corridor, loading, quality, motion
shaders/                  .glsl (imported as strings via loaders/glsl-loader.js)
public/logos/             design team and Queen’s logos
docs/                     vision.md, milestones.md
```
