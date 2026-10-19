# Trinity Robotics · BIOBUZZ Rails

A season guide and progress tracker for Trinity Robotics FTC teams **2827** and **3587** (2026–27, BIOBUZZ).
It's a Next.js app, hosted on Vercel. Students sign in with their Trinity Google account (`@tsdch.org`).

- **Home**: "Week N" counted from the week after the BIOBUZZ reveal, a calendar of the season, your next moves, and a "Not sure what to do? Bored?" panel.
- **Week**: the plan for each week (Build, Software, Drive, Outreach, Demo and Gate), with tickable tasks, "if you're behind" guidance and traps.
- **Quests**: small self-serve challenges (watch, Onshape design, code, quiz, hands-on, planning) for anyone who isn't sure what to do.
- **Season, Robot, Playbook**: the whole season, each team's robot and motor/servo budget, and the cheat sheets.
- **The Hive**: team progress, light gamification (XP, levels, badges, weekly streak). No ranked leaderboard.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run build
```

Preview any date, to see the app mid-season: `http://localhost:3000/?date=2026-11-18`.

## Sign in

Google sign-in is limited to the Trinity School Workspace domain (`tsdch.org`, including subdomains), plus a short allowlist. `msears@gmail.com` is always allowed. Add more with `AUTH_ALLOWED_EMAILS` (comma-separated). The name on a tick comes from the Google account, not from something typed in.

1. In Google Cloud, create an OAuth client of type **Web application**.
2. Add the redirect URIs in `.env.example`.
3. Set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` in Vercel (and in `.env.local` for local testing).
4. If a student sees “admin approval required”, a Trinity Workspace admin has to allow the app once.

The season plan can be read without signing in. Ticking, grabbing, and finishing a quest require a Trinity account.

## How state is stored

Ticks, claims, finished quests and the budget table are shared per team, with "done by" shown. The storage is chosen automatically:

| Situation | Storage |
| --- | --- |
| `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set | Supabase (shared by everyone) |
| Local development, nothing set | A JSON file in `.data/` (git-ignored) |
| Production, nothing set | "Local mode": each browser keeps its own progress |

### Set up Supabase (free)

1. Create a free project at <https://supabase.com>.
2. Open **SQL editor**, paste in `supabase/schema.sql` and run it. Row-level security is on with no policies, so only the server key can reach the tables.
3. In Vercel, add these environment variables:
   - `SUPABASE_URL`: the project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: the **service role** key. Keep it server-side only; the app never sends it to the browser.
   - `TEAM_CODE` (optional): a shared word. When set, changes need that code (students enter it once in their profile). Reading stays open.
4. `vercel.json` has a daily cron on `/api/health` that touches the database. This keeps a free Supabase project from pausing after a week of inactivity.

Copy `.env.example` to `.env.local` to try Supabase locally.

### Be aware

- With no `TEAM_CODE`, anyone with the URL can tick boxes. That's the "we know who they are" trade-off. Set `TEAM_CODE` if it ever matters.
- Free Supabase projects can pause after inactivity. The cron covers normal use, but over a long break check the dashboard.

## Editing the content

Everything is plain TypeScript in `lib/data/`. No CMS needed.

- `weeks.ts`: the 16 weeks and every task. Items can be team-specific with `t: { "3587": { motionAdd: [...] } }` (see the existing `...Add` keys).
- `core.ts`: tracks, links, team info, phases, milestones, motor/servo budget and the vision plan.
- `quests.ts`: the quests and quizzes, with their resources. The set is a starter list. Review it with the coach, and add or remove freely.

Task IDs come from week, kind and a hash of the text, so **rewording a task resets its ticks**. Fix typos early in the season.

## Deploying (not done yet)

Import the repo into Vercel, add the environment variables above, and deploy. The app is a standard Next.js build with no other setup.

## Layout

```
app/          routes and API (api/state, api/health)
components/   UI, split by page
lib/          data, week and pace logic, XP, storage adapters (lib/store)
supabase/     schema.sql
legacy/       the original single-file HTML version
```

Not affiliated with FIRST or Trinity School.
