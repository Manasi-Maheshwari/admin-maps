# MAPS 2026 — Admin Panel

Production-ready React admin console for monitoring `form_submissions` from a Supabase backend. Includes static admin authentication, route protection, search / sort / filter, and a refined editorial UI.

---

## Features

- **Static auth** — hardcoded admin login, session persisted in `localStorage`, protected routes, logout.
- **Supabase integration** — isolated service file, env-driven config, typed-style fetch helper.
- **Submissions table** — full name composition, formatted timestamps, package badges, payload inspector.
- **Search** — global, debounced (300 ms), across name / email / organization / package tier.
- **Sorting** — toggleable asc/desc on Name, Email, Organization, Created At.
- **Filters** — Package Tier, User Type, Meeting Room (yes/no). Combine freely with search.
- **States** — skeleton loading, error retry, empty-state with filter-aware copy.
- **Responsive** — desktop-first; sidebar collapses to a drawer on narrow viewports.

---

## Project Structure

```
maps-admin/
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── components/
    │   ├── AdminLayout.jsx / .css
    │   ├── ProtectedRoute.jsx
    │   ├── Sidebar.jsx / .css
    │   ├── Spinner.jsx / .css
    │   ├── SubmissionsTable.jsx / .css
    │   └── Topbar.jsx / .css
    ├── pages/
    │   ├── Dashboard.jsx / .css
    │   └── Login.jsx / .css
    ├── services/
    │   ├── auth.js
    │   └── supabase.js
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useDebounce.js
    │   └── useSubmissions.js
    ├── utils/
    │   └── data.js
    └── styles/
        └── global.css
```

---

## Local Setup

### 1. Prerequisites

- Node.js 18+ and npm 9+

### 2. Install

```bash
cd maps-admin
npm install
```

### 3. Configure environment

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key...
VITE_SUBMISSIONS_TABLE=form_submissions
```

> `VITE_SUBMISSIONS_TABLE` is optional and defaults to `form_submissions`.

### 4. Run dev server

```bash
npm run dev
```

The app opens at `http://localhost:5173`.

### 5. Build for production

```bash
npm run build
npm run preview
```

---

## Login Credentials

Set these in `.env.local` (or Vercel env vars) to log in:

| Field      | Env var               |
| ---------- | --------------------- |
| Email      | `VITE_ADMIN_EMAIL`    |
| Password   | `VITE_ADMIN_PASSWORD` |

Sessions are stored in `localStorage` under `maps_admin_session`. Logout clears the key and redirects to `/login`. All `/dashboard` routes require an active session.

---

## Supabase: expected table schema

The admin panel reads from a single table (default name: `form_submissions`) with this shape:

| Column                  | Type        |
| ----------------------- | ----------- |
| `id`                    | uuid / text |
| `created_at`            | timestamptz |
| `form_type`             | text        |
| `first_name`            | text        |
| `last_name`             | text        |
| `email`                 | text        |
| `organization`          | text        |
| `title`                 | text        |
| `ticket_size`           | text / null |
| `package_tier`          | text        |
| `meeting_room`          | text (yes/no) |
| `attendee_band`         | text / null |
| `attendee_count_exact`  | int / null  |
| `consent_ack`           | boolean     |
| `user_type`             | text (gp, lp, ...) |
| `payload`               | text (JSON string) |

The `payload` field is parsed safely via `parsePayload()` and rendered in the per-row expanded panel.

### Row Level Security

If RLS is enabled, ensure the anon key has a `SELECT` policy on the table — for example:

```sql
create policy "anon read submissions"
on form_submissions
for select
to anon
using (true);
```

(Tighten as appropriate for production deployments.)

---

## Available Scripts

| Script            | Description                     |
| ----------------- | ------------------------------- |
| `npm run dev`     | Start Vite dev server           |
| `npm run build`   | Production build to `dist/`     |
| `npm run preview` | Preview the built bundle        |

---

## Notes

- Styling is hand-authored CSS; no Tailwind or component library required.
- Fonts (Fraunces, Inter, JetBrains Mono) are loaded via Google Fonts in `index.html`.
- The Supabase client is configured with `persistSession: false` because the admin session is managed independently — the table is read using the anon key only.
