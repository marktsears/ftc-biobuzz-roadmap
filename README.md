# Trinity Robotics · BIOBUZZ Rails

A quest site for Trinity Robotics FTC teams **2827** and **3587** (2026–27, BIOBUZZ).
It's a Next.js app, hosted on Vercel. Students sign in with their Trinity Google account (`@tsdch.org`).

The goal is simple: every student who walks in knows one useful thing to do. The coach picks quests for each student, week by week. Students can also climb a ladder on their own.

- **Home**: the quests your coach picked for you this week, and anything still open. Ladders show when you don't already have quests to do.
- **Quests**: every quest, with filters. Each one fits in one session and ends with something to show.
- **Quest page**: steps, links, hints, and three buttons: _Start it_, _I'm stuck_ (with a one-line note), _I finished it_ (with a link or a sentence as proof).
- **Coach** (coaches only): a "Needs you" list of stuck and finished work, the class roster with week-by-week assigning, quests you write yourself, and Labs.

### Labs

Labs is a set of on/off switches on the Coach page. Everything except quests starts **off**, so students only see Home and Quests. Turn on the week plans, season calendar, robot snapshot, playbook, Hive, XP, or team tasks when the class is ready. Coaches can still open switched-off pages, with a note that students can't.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run build
```

Preview any date, to see the app mid-season: `http://localhost:3000/?date=2026-11-18`.

To try it signed in without Google, open `http://localhost:3000/dev-login` and pick a test person (Mark is a coach; Maya and Leo are students). That page only exists in `npm run dev`.

## Sign in and coaches

Google sign-in is limited to the Trinity School Workspace domain (`tsdch.org`, including subdomains), plus a short allowlist. `msears@gmail.com` is always allowed. Add more with `AUTH_ALLOWED_EMAILS` (comma-separated).

1. In Google Cloud, create an OAuth client of type **Web application**.
2. Add the redirect URIs in `.env.example`.
3. Set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` in Vercel (and in `.env.local` for local testing).
4. If a student sees “admin approval required”, a Trinity Workspace admin has to allow the app once.

`msears@gmail.com` is always a coach. Add more coaches on **Coach → Labs → Coaches**, or with `AUTH_ADMIN_EMAILS`.

### Adding students

On **Coach → Class → Add students**, paste school emails in any shape (a sheet column, an email's To: line, one per line) and pick a team. Students are on the roster right away as "hasn't signed in yet", and you can assign them quests. There's no invite to accept: when they sign in with their school Google account, everything is already there, and they skip the team question if you set it. The second step gives you a message to post in Classroom and a QR code for the projector; the site doesn't send email.

**Your quests → Starter quests** go to every new student, added or not. Students who sign in without being added show up under "Not on your list".

## How state is stored

| Situation | Storage |
| --- | --- |
| `DATABASE_URL` (or `POSTGRES_URL`) is set | Postgres on Neon (shared by everyone) |
| Local development, nothing set | A JSON file in `.data/` (git-ignored) |
| Production, nothing set | "Local mode": nothing is shared, and the coach page can't save |

### Set up the database (free)

1. In the Vercel project, open **Storage → Create → Neon** and pick the free plan. Connect it to the project; Vercel adds `DATABASE_URL` for you.
2. Redeploy. The tables are created on first use. There's no SQL to run.
3. `/api/health` reports `"storage": "db"` when it's connected. A daily cron in `vercel.json` calls it.

To use the same database locally, copy `DATABASE_URL` into `.env.local`.

## Editing the content

Everything is plain TypeScript in `lib/data/`. No CMS needed. Coaches can also write quests on the Coach page without touching code.

- `quests.ts`: the built-in quests and quizzes, with their resources.
- `ladders.ts`: the ladders, as ordered lists of quest ids. The top rung is real robot work.
- `weeks.ts`: the weekly plans and tasks (behind a Labs switch).
- `core.ts`: tracks, links, team info, phases, milestones, motor/servo budget and the vision plan.

Task IDs come from week, kind and a hash of the text, so **rewording a task resets its ticks**.

## Layout

```
app/          routes and API (api/me, api/coach, api/state, api/health)
components/   UI, split by page
lib/          data, flags, ladders, week logic, storage adapters (lib/store)
legacy/       the original single-file HTML version
```

Not affiliated with FIRST or Trinity School.
