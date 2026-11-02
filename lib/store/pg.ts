import "server-only";
import { neon } from "@neondatabase/serverless";
import { readFlags } from "../flags";
import type { Quest } from "../data/quests";
import type { BudgetRow, Focus, Settings, TeamId, WorkStatus } from "../types";
import type { Store, StoredState } from "./types";

/** The whole schema. Every statement is safe to run again, so it runs once per server start. */
const SCHEMA = [
  `create table if not exists checks (team text not null, item_id text not null, by_name text not null, at timestamptz not null default now(), primary key (team, item_id))`,
  `create table if not exists claims (team text not null, item_id text not null, name text not null, at timestamptz not null default now(), primary key (team, item_id, name))`,
  `create table if not exists budgets (team text primary key, rows jsonb not null, updated_at timestamptz not null default now())`,
  `create table if not exists people (email text primary key, name text not null, team text, focus text, first_seen timestamptz not null default now(), last_seen timestamptz default now())`,
  `alter table people alter column last_seen drop not null`,
  `alter table people add column if not exists listed boolean not null default false`,
  `create table if not exists assignments (email text not null, quest_id text not null, week int not null, by_name text not null, note text, at timestamptz not null default now(), primary key (email, quest_id))`,
  `create table if not exists quest_work (email text not null, quest_id text not null, status text not null check (status in ('doing', 'stuck', 'done')), proof text, stuck text, coach_note text, checked_by text, checked_at timestamptz, at timestamptz not null default now(), primary key (email, quest_id))`,
  `create table if not exists custom_quests (id text primary key, data jsonb not null, by_name text, archived boolean not null default false, at timestamptz not null default now())`,
  `create table if not exists settings (key text primary key, value jsonb not null, at timestamptz not null default now())`,
];

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v));
const opt = (v: unknown) => (v == null || v === "" ? undefined : String(v));

export function pgStore(url: string): Store {
  const sql = neon(url);
  let ready: Promise<unknown> | null = null;
  const q = async (text: string, params: unknown[] = []) => {
    ready ||= sql.transaction(SCHEMA.map(s => sql.query(s))).catch(e => {
      ready = null;
      throw e;
    });
    await ready;
    return (await sql.query(text, params)) as Record<string, unknown>[];
  };

  return {
    mode: "db",

    async read(team: TeamId): Promise<StoredState> {
      const [checks, claims, quests, budget] = await Promise.all([
        q(`select item_id, by_name, at from checks where team = $1`, [team]),
        q(`select item_id, name from claims where team = $1 order by item_id, name`, [team]),
        q(`select w.quest_id, p.name, w.proof, w.at from quest_work w join people p on p.email = w.email where w.status = 'done' and p.team = $1 order by w.at`, [team]),
        q(`select rows from budgets where team = $1`, [team]),
      ]);
      const out: StoredState = { checks: {}, claims: {}, quests: [], budget: null };
      for (const r of checks) out.checks[String(r.item_id)] = { by: String(r.by_name), at: iso(r.at) };
      for (const r of claims) (out.claims[String(r.item_id)] ||= []).push(String(r.name));
      for (const r of quests) out.quests.push({ id: String(r.quest_id), by: String(r.name), at: iso(r.at), note: opt(r.proof) });
      if (budget[0] && Array.isArray(budget[0].rows)) out.budget = budget[0].rows as BudgetRow[];
      return out;
    },
    async setCheck(team, id, name, on) {
      if (on) await q(`insert into checks (team, item_id, by_name, at) values ($1, $2, $3, now()) on conflict (team, item_id) do update set by_name = excluded.by_name, at = now()`, [team, id, name]);
      else await q(`delete from checks where team = $1 and item_id = $2`, [team, id]);
    },
    async setClaim(team, id, name, on) {
      if (on) await q(`insert into claims (team, item_id, name) values ($1, $2, $3) on conflict do nothing`, [team, id, name]);
      else await q(`delete from claims where team = $1 and item_id = $2 and name = $3`, [team, id, name]);
    },
    async setBudget(team, rows) {
      await q(`insert into budgets (team, rows, updated_at) values ($1, $2::jsonb, now()) on conflict (team) do update set rows = excluded.rows, updated_at = now()`, [team, JSON.stringify(rows)]);
    },

    async touchPerson({ email, name, team, focus }) {
      const rows = await q(
        `insert into people (email, name, team, focus, last_seen) values ($1, $2, $3, $4, now())
         on conflict (email) do update set name = excluded.name, last_seen = now(),
           team = coalesce(excluded.team, people.team), focus = coalesce(excluded.focus, people.focus)
         returning (xmax = 0) as created`,
        [email, name, team ?? null, focus ?? null],
      );
      return rows[0]?.created === true;
    },
    async students() {
      const rows = await q(`select email, name, team, focus, last_seen, listed from people order by name`);
      return rows.map(r => ({
        email: String(r.email),
        name: String(r.name),
        team: (r.team as TeamId) ?? null,
        focus: (r.focus as Focus) ?? null,
        seen: r.last_seen ? iso(r.last_seen) : null,
        listed: !!r.listed,
      }));
    },
    async addStudents(rows) {
      if (!rows.length) return [];
      const made = await q(
        `insert into people (email, name, team, last_seen, listed)
         select e, n, t, null, true from unnest($1::text[], $2::text[], $3::text[]) as x(e, n, t)
         on conflict (email) do update set listed = true,
           team = coalesce(people.team, excluded.team),
           name = case when people.last_seen is null then excluded.name else people.name end
         returning email, (xmax = 0) as created`,
        [rows.map(r => r.email), rows.map(r => r.name), rows.map(r => r.team)],
      );
      return made.filter(r => r.created === true).map(r => String(r.email));
    },
    async updateStudents(emails, patch) {
      if (!emails.length) return;
      if (patch.team !== undefined) await q(`update people set team = $2 where email = any($1::text[])`, [emails, patch.team]);
      if (patch.listed !== undefined) await q(`update people set listed = $2 where email = any($1::text[])`, [emails, patch.listed]);
    },
    async removeStudents(emails) {
      if (!emails.length) return;
      await q(`delete from assignments where email in (select email from people where email = any($1::text[]) and last_seen is null)`, [emails]);
      await q(`delete from people where email = any($1::text[]) and last_seen is null`, [emails]);
      await q(`update people set listed = false where email = any($1::text[])`, [emails]);
    },

    async assignments(email) {
      const rows = email ? await q(`select * from assignments where email = $1 order by at`, [email]) : await q(`select * from assignments order by at`);
      return rows.map(r => ({ email: String(r.email), quest: String(r.quest_id), week: Number(r.week), by: String(r.by_name), at: iso(r.at), note: opt(r.note) }));
    },
    async assign(rows) {
      if (!rows.length) return;
      await q(
        `insert into assignments (email, quest_id, week, by_name, note)
         select * from unnest($1::text[], $2::text[], $3::int[], $4::text[], $5::text[])
         on conflict (email, quest_id) do update set week = excluded.week, by_name = excluded.by_name, note = excluded.note, at = now()`,
        [rows.map(r => r.email), rows.map(r => r.quest), rows.map(r => r.week), rows.map(r => r.by), rows.map(r => r.note ?? null)],
      );
    },
    async unassign(email, quest) {
      await q(`delete from assignments where email = $1 and quest_id = $2`, [email, quest]);
    },

    async work(email) {
      const rows = email ? await q(`select * from quest_work where email = $1 order by at`, [email]) : await q(`select * from quest_work order by at`);
      return rows.map(r => ({
        email: String(r.email),
        quest: String(r.quest_id),
        status: r.status as WorkStatus,
        proof: opt(r.proof),
        stuck: opt(r.stuck),
        coach: opt(r.coach_note),
        checkedBy: opt(r.checked_by),
        checkedAt: r.checked_at ? iso(r.checked_at) : undefined,
        at: iso(r.at),
      }));
    },
    async setWork(email, quest, patch) {
      if (!patch) {
        await q(`delete from quest_work where email = $1 and quest_id = $2`, [email, quest]);
        return;
      }
      await q(
        `insert into quest_work (email, quest_id, status, proof, stuck, checked_by, checked_at, at)
         values ($1, $2, $3, $4, $5, $6, case when $6::text is null then null else now() end, now())
         on conflict (email, quest_id) do update set status = excluded.status,
           proof = coalesce(excluded.proof, quest_work.proof),
           stuck = case when excluded.status = 'stuck' then excluded.stuck else null end,
           checked_by = excluded.checked_by,
           checked_at = case when excluded.checked_by is null then null else now() end,
           at = now()`,
        [email, quest, patch.status, patch.proof ?? null, patch.stuck ?? null, patch.checkedBy ?? null],
      );
    },
    async review(email, quest, by, ok, note) {
      if (ok) await q(`update quest_work set checked_by = $3, checked_at = now(), coach_note = $4 where email = $1 and quest_id = $2`, [email, quest, by, note ?? null]);
      else
        await q(
          `insert into quest_work (email, quest_id, status, coach_note, at) values ($1, $2, 'doing', $3, now())
           on conflict (email, quest_id) do update set status = 'doing', stuck = null, coach_note = $3, checked_by = null, checked_at = null`,
          [email, quest, note ?? null],
        );
    },

    async customQuests() {
      const rows = await q(`select data, archived from custom_quests order by at`);
      return rows.map(r => ({ quest: r.data as Quest, archived: !!r.archived }));
    },
    async saveQuest(quest, by) {
      await q(`insert into custom_quests (id, data, by_name) values ($1, $2::jsonb, $3) on conflict (id) do update set data = excluded.data, at = now()`, [quest.id, JSON.stringify(quest), by]);
    },
    async archiveQuest(id, archived) {
      await q(`update custom_quests set archived = $2 where id = $1`, [id, archived]);
    },

    async settings(): Promise<Settings> {
      const rows = await q(`select key, value from settings where key in ('flags', 'admins', 'starter')`);
      const get = (k: string) => rows.find(r => r.key === k)?.value;
      const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
      return { flags: readFlags(get("flags")), admins: list(get("admins")), starter: list(get("starter")) };
    },
    async saveSettings(patch) {
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined) continue;
        await q(`insert into settings (key, value, at) values ($1, $2::jsonb, now()) on conflict (key) do update set value = excluded.value, at = now()`, [k, JSON.stringify(v)]);
      }
    },

    async ping() {
      await q(`select 1`);
    },
  };
}
