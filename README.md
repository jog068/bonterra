# Budget Tracker

A lightweight personal budget tracker: log income and expenses, see totals at a glance, filter and search history, and import bank CSV exports with a preview step.

## Prerequisites

- Node.js v20+ (developed on v23)
- npm (comes with Node)

## Setup

Install all workspace dependencies from the repo root:

```sh
npm install
```

## Run the app

One command runs both servers:

```sh
npm run dev
```

Then open http://localhost:5173.

Or run them in separate terminals:

- Terminal 1 (backend): `cd server && npm run dev` — API on http://localhost:3001
- Terminal 2 (frontend): `cd client && npm run dev` — app on http://localhost:5173

The Vite dev server proxies `/api` to the backend, so no CORS setup is needed.

## Tests & typechecking

```sh
npm test          # vitest across all workspaces (66 tests)
npm run typecheck # tsc across all workspaces
```

## Environment variables

None are required. See `.env.example` for the optional `PORT` override for the API server.

## Notes

- **Persistence** is SQLite via Drizzle ORM (`better-sqlite3`). The database file is created automatically at `server/data/budget.db` on first boot; the committed migration runs on startup and ~30 seed transactions are inserted only when the table is empty. Delete the file to reset.
- **Amounts are stored as integer cents** (`amountCents`) and **dates as `YYYY-MM-DD` strings** — both deliberate extensions of the spec's data model, documented in `WRITEUP.md`.
- **CSV import** (the enhancement) accepts pasted text or an uploaded file. Required columns: `date`, `description`, `amount` (synonyms like `Posted Date`/`Memo` are recognized); `type` and `category` are optional — a missing type is inferred from the amount's sign, and a missing category defaults to `Other`. Try `sample-import.csv` in the repo root: it includes messy-but-valid rows, two broken rows, and one duplicate of the seed data so the preview has something to flag.
