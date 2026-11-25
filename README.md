# ScriptureIQ

A web app (installable to the home screen) for the BibleProject plan *One Story That Leads to Jesus* — 358 days, NIV.

This first build covers the private reading-and-notes side of the design:

| Module | Status |
| --- | --- |
| **Today** — Before you read (pre-read, video), Reading (passage + psalm, read-aloud, block tracker, Go deeper links), calendar and catch-up | Built |
| **My Study Notes** — one entry per day with Q1–Q3 loaded, autosaving answers, own questions, reorder/delete, browse by day or book | Built |
| **Member login** — email + password through Supabase Auth; start date set by each member | Built |
| **Talk It Over** — groups, invite links, one thread per day | Database and privacy rules built; screens are the next phase |
| **Study Aggregate** — answers from your own notes, using Claude | Planned (phase 7) |

## Stack

- **Next.js 16** (App Router) on **Vercel**
- **Supabase**: Auth, Postgres, row-level security on every private table
- **YouVersion Platform** for NIV text, fetched live and never stored
- **Anthropic API** reserved for Study Aggregate

## Setup

1. **Supabase project.** Create a project, then in the SQL editor run, in order:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/seed.sql` (loads all 358 plan days with their pre-reads and approved questions)

   In *Authentication → URL Configuration*, set the Site URL to your app's address and add `https://YOUR-DOMAIN/auth/confirm` (and `http://localhost:3000/auth/confirm`) to the redirect URLs.
2. **Environment.** Copy `.env.example` to `.env.local` and fill in the Supabase URL and publishable key.
3. **Run locally.** `npm install`, then `npm run dev`, and open http://localhost:3000.
4. **Deploy.** Import the repository in Vercel and add the same environment variables there.
5. **NIV text (when ready).** Register at platform.youversion.com, accept the NIV licence for your app key, and set `YOUVERSION_APP_KEY`. Until then, each passage shows *Read on Bible.com* and *Mark as read*, so the tracker still works.

## Updating plan content

The workbook is the source of truth. Export the Schedule, Story map and Daily content tabs to `supabase/plan_days.json`, run `npm run seed` to rebuild `supabase/seed.sql`, and run it again in Supabase. It updates rows in place, and members' notes are untouched (each entry keeps a snapshot of the questions it was opened with).

## Privacy model

- Every private row (`day_progress`, `note_entries`, `note_items`) carries `user_id`, and row-level security allows only its owner to read or write it.
- Groups and posts are visible only to group members. A member can only be added through the owner trigger or the `join_group(invite_token)` function.
- Nothing links a group post to a private note.

`supabase/tests/` holds a privacy test you can run against a plain Postgres: `auth_stub.sql`, then the migration and seed, then `rls_test.sql`. It checks that one member cannot see or write another's notes or progress, and that non-members cannot read or post in a group.

## Tests

`npm test` checks that every plan day's reading code parses, the date-to-day mapping, and the passage splitting used by read-aloud.
