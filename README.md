# Personal Website

A personal website built with **Next.js** (frontend) and **Django + Django REST Framework** (backend API and admin panel) that is currently a work in progress.

## Project structure

```
Michael's Website/
├── backend/             # Django project
│   ├── config/          # settings.py, urls.py, wsgi/asgi
│   ├── content/         # app for models, serializers, API views
│   ├── manage.py
│   └── requirements.txt # Python dependencies
├── frontend/            # Next.js app
│   ├── app/             # pages and layouts (App Router)
│   ├── public/          # static assets
│   └── package.json     # JS dependencies
├── .gitignore
└── README.md
```

## How it works

- Django stores content in a database and exposes it as JSON at `/api/...`.
- Django's built-in admin (`/admin/`) is used to add and edit content.
- Next.js fetches from the API and renders the pages.

## Prerequisites

- [Python 3.11+](https://www.python.org/downloads/) (tick "Add Python to PATH" on Windows)
- [Node.js LTS](https://nodejs.org/)
- [Git](https://git-scm.com/)

## Running it locally

Clone the repo:

```bash
git clone https://github.com/mizuyashu/Personal-Website.git
cd Personal-Website
```

### 1. Backend (Django)

Windows (PowerShell):

```powershell
python -m venv venv
venv\Scripts\activate
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

macOS / Linux:

```bash
python3 -m venv venv
source venv/bin/activate
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

The admin is at http://127.0.0.1:8000/admin/.

### 2. Frontend (Next.js)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

or run it in the original terminal by running 
```bash
cd ..
```
to go back to the main folder

The site is at http://localhost:3000.

## Environment variables

Secrets and config are not committed. Create these files locally:

- `backend/.env` (e.g. `SECRET_KEY`, `DEBUG`)
- `frontend/.env.local` (e.g. `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`)

## Notes

- `venv/`, `node_modules/`, `.next/`, `db.sqlite3`, and `.env` files are git-ignored and must be recreated locally using the steps above.
- The local database (`db.sqlite3`) is not in the repo, so run `python manage.py migrate`
- To log into the admin at `/admin/`, also run `python manage.py createsuperuser`. This is optional until you want to add content.

## Deployment (planned)

- Frontend: Vercel
- Backend: Railway / Render / Fly.io with PostgreSQL