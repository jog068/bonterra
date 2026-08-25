# Writeup

## What I built and notable decisions

A monorepo (`/client`, `/server`, `/shared`) where the `/shared` package is the single source of truth: Zod schemas define the API contract, TypeScript types are inferred from them, the server parses every request body and query string against them, and the client form reuses them for validation. No type is written twice.

Decisions worth calling out:

- **Integer cents, not floats.** `amountCents` is an integer end to end; dollars exist only in the form and the formatter. A test pins the classic `0.1 + 0.2` drift case.
- **Dates are `YYYY-MM-DD` strings.** Transactions are calendar facts, not instants; date-only strings sort correctly and can't shift a day across timezones. They never round-trip through `Date` for display.
- **The summary respects active filters.** The spec doesn't say whether filtering the list should change the summary. I decided it should — the panel should describe what you're looking at — so `/api/summary` accepts the same params via the same WHERE-clause builder, and the totals always match the transactions in view.
- **PUT is a full replacement** validated by the create schema — the simplest honest contract.
- **Errors are one envelope** (`{ error: { message, fieldErrors? } }`) produced by a single Express middleware from Zod issues.

SQLite via Drizzle (`better-sqlite3`): the committed migration runs on boot and seed data inserts only when the table is empty, so a cold clone works with two commands. TanStack Query handles data flow — mutations invalidate `transactions` and `summary`, search is debounced 300ms, and `keepPreviousData` stops the list flickering between filter states.

## How I used AI tools

I worked decision-first: before any code, I had Claude interrogate the spec and my stack choices round by round (persistence, money representation, filter semantics, enhancement scope), so ambiguities were resolved on purpose rather than discovered mid-build. Implementation then went ticket by ticket, test-first at five pre-agreed seams: schemas, the WHERE builder, summary math, the CSV normalizer, and duplicate keys — 123 tests, each written red before the implementation. Each slice was verified in a real browser before committing.

Where I steered: the shadcn CLI now ships a Base UI registry that no longer includes the react-hook-form `<Form>` wrapper my plan assumed — we read the generated source and wired RHF manually against `field.tsx` instead. AI's first pass at negative-amount parsing had a convoluted branch (`negative = !parenthesized && true`) that I had rewritten. When `markDuplicates` produced a type error in a test, the right fix was strengthening the function's return type, not loosening the test — I made sure it went that way.

## The enhancement: CSV import with preview

Manually entering history is the real adoption barrier for a budget tracker, so I built the on-ramp: paste or upload a bank export, review a per-row preview, import in one shot. The substance is the normalizer — bank CSVs have signed amounts with no type column, `$1,234.56` formatting, `(42.50)` negatives, `M/D/YYYY` dates, synonym headers, and no categories — plus duplicate detection (date + amount + normalized description, matched against the database *and* within the batch), shown as badges and excluded by default. The commit is all-or-nothing inside a DB transaction. `sample-import.csv` demonstrates all of it, broken rows included.

## What I'd do next

A column-mapping step for arbitrary exports, a category combobox allowing custom entries, undo-toast delete instead of a confirm dialog, supertest coverage over the route layer, and a month-over-month spending view reusing the summary query.
