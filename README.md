# Michael's Personal Website

Personal site for showcasing my education, design teams, and projects as a
Computer Engineering student at Queen's University.

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- TypeScript
- Tailwind CSS

## Pages

| Route           | Description                          |
| --------------- | ------------------------------------ |
| `/`             | Home                                 |
| `/about`        | About me                             |
| `/education`    | Education                            |
| `/design-teams` | Design teams I'm part of             |
| `/projects`     | Current and past projects            |
| `/dashboard`    | [What the dashboard shows]           |

## Project Structure

```
app/          # Routes (page.tsx) and the root layout
components/   # Shared components (Navbar, Footer, PageHeader)
public/       # Static assets (logos, images)
```

## Folder Structure

app/
├── page.tsx 
├── layout.tsx            
├── about/page.tsx
├── education/page.tsx
├── design-teams/page.tsx
├── projects/page.tsx
└── dashboard/page.tsx
components/
├── Navbar.tsx
├── Footer.tsx
└── PageHeader.tsx
public/

## Getting Started

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

## Notes

All routes now live in the
`app/` directory.