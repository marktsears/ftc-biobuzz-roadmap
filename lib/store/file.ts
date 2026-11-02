import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { applyOp } from "../apply";
import { readFlags } from "../flags";
import type { Quest } from "../data/quests";
import { EMPTY_STATE, type Assignment, type BudgetRow, type CheckRec, type Settings, type Student, type TeamId, type Work } from "../types";
import type { Store, StoredState } from "./types";

interface TeamFile {
  checks: Record<string, CheckRec>;
  claims: Record<string, string[]>;
  budget: BudgetRow[] | null;
}
interface DbFile {
  teams: Partial<Record<TeamId, TeamFile>>;
  people: Record<string, Student>;
  assignments: (Assignment & { email: string })[];
  work: (Work & { email: string })[];
  custom: { quest: Quest; archived: boolean }[];
  settings: Partial<Settings>;
}
const EMPTY_DB: DbFile = { teams: {}, people: {}, assignments: [], work: [], custom: [], settings: {} };
const EMPTY_TEAM: TeamFile = { checks: {}, claims: {}, budget: null };

/** Development-only store: one JSON file in .data/. Never used in production. */
export function fileStore(): Store {
  const file = path.join(process.cwd(), ".data", "db.json");
  let queue: Promise<unknown> = Promise.resolve();
  const now = () => new Date().toISOString();

  const load = async (): Promise<DbFile> => {
    try {
      return { ...EMPTY_DB, ...(JSON.parse(await fs.readFile(file, "utf8")) as Partial<DbFile>) };
    } catch {
      return structuredClone(EMPTY_DB);
    }
  };
  /** serialize read-modify-write so quick taps don't clobber each other */
  const mutate = (f: (d: DbFile) => void) => {
    const run = queue.then(async () => {
      const d = await load();
      f(d);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(d, null, 1));
    });
    queue = run.catch(() => undefined);
    return run;
  };
  const teamOp = (team: TeamId, op: Parameters<typeof applyOp>[1], name: string) =>
    mutate(d => {
      const t = d.teams[team] ?? EMPTY_TEAM;
      const next = applyOp({ ...EMPTY_STATE, ...t, mode: "file" }, op, name, now());
      d.teams[team] = { checks: next.checks, claims: next.claims, budget: next.budget };
    });

  return {
    mode: "file",

    async read(team): Promise<StoredState> {
      const d = await load();
      const t = d.teams[team] ?? EMPTY_TEAM;
      const quests = d.work
        .filter(w => w.status === "done" && d.people[w.email]?.team === team)
        .map(w => ({ id: w.quest, by: d.people[w.email].name, at: w.at, note: w.proof }));
      return { checks: t.checks, claims: t.claims, budget: t.budget, quests };
    },
    setCheck: (team, id, name, on) => teamOp(team, { op: "check", id, on }, name),
    setClaim: (team, id, name, on) => teamOp(team, { op: "claim", id, on }, name),
    setBudget: (team, rows) => teamOp(team, { op: "budget", rows }, ""),

    async touchPerson({ email, name, team, focus }) {
      let created = false;
      await mutate(d => {
        const was = d.people[email];
        created = !was;
        d.people[email] = { email, name, team: team ?? was?.team ?? null, focus: focus ?? was?.focus ?? null, seen: now(), listed: !!was?.listed };
      });
      return created;
    },
    async students() {
      return Object.values((await load()).people)
        .map(p => ({ ...p, seen: p.seen ?? null, listed: !!p.listed }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    async addStudents(rows) {
      const made: string[] = [];
      await mutate(d => {
        for (const r of rows) {
          const was = d.people[r.email];
          if (!was) {
            made.push(r.email);
            d.people[r.email] = { email: r.email, name: r.name, team: r.team, focus: null, seen: null, listed: true };
          } else {
            d.people[r.email] = { ...was, listed: true, team: was.team ?? r.team, name: was.seen ? was.name : r.name };
          }
        }
      });
      return made;
    },
    updateStudents: (emails, patch) =>
      mutate(d => {
        for (const e of emails) {
          const p = d.people[e];
          if (!p) continue;
          if (patch.team !== undefined) p.team = patch.team;
          if (patch.listed !== undefined) p.listed = patch.listed;
        }
      }),
    removeStudents: emails =>
      mutate(d => {
        for (const e of emails) {
          const p = d.people[e];
          if (!p) continue;
          if (p.seen) p.listed = false;
          else {
            delete d.people[e];
            d.assignments = d.assignments.filter(a => a.email !== e);
          }
        }
      }),

    async assignments(email) {
      const all = (await load()).assignments;
      return email ? all.filter(a => a.email === email) : all;
    },
    assign: rows =>
      mutate(d => {
        for (const r of rows) {
          d.assignments = d.assignments.filter(a => !(a.email === r.email && a.quest === r.quest));
          d.assignments.push({ email: r.email, quest: r.quest, week: r.week, by: r.by, note: r.note, at: now() });
        }
      }),
    unassign: (email, quest) =>
      mutate(d => {
        d.assignments = d.assignments.filter(a => !(a.email === email && a.quest === quest));
      }),

    async work(email) {
      const all = (await load()).work;
      return email ? all.filter(w => w.email === email) : all;
    },
    setWork: (email, quest, patch) =>
      mutate(d => {
        const was = d.work.find(w => w.email === email && w.quest === quest);
        d.work = d.work.filter(w => w !== was);
        if (!patch) return;
        d.work.push({
          email,
          quest,
          status: patch.status,
          proof: patch.proof ?? was?.proof,
          stuck: patch.status === "stuck" ? patch.stuck : undefined,
          coach: was?.coach,
          at: now(),
        });
      }),
    review: (email, quest, by, ok, note) =>
      mutate(d => {
        const w = d.work.find(x => x.email === email && x.quest === quest);
        if (ok) {
          if (w) Object.assign(w, { checkedBy: by, checkedAt: now(), coach: note });
          return;
        }
        if (w) Object.assign(w, { status: "doing", stuck: undefined, coach: note, checkedBy: undefined, checkedAt: undefined });
        else d.work.push({ email, quest, status: "doing", coach: note, at: now() });
      }),

    async customQuests() {
      return (await load()).custom;
    },
    saveQuest: quest =>
      mutate(d => {
        const was = d.custom.find(c => c.quest.id === quest.id);
        if (was) was.quest = quest;
        else d.custom.push({ quest, archived: false });
      }),
    archiveQuest: (id, archived) =>
      mutate(d => {
        const c = d.custom.find(x => x.quest.id === id);
        if (c) c.archived = archived;
      }),

    async settings() {
      const s = (await load()).settings;
      return { flags: readFlags(s.flags), admins: s.admins ?? [], starter: s.starter ?? [] };
    },
    saveSettings: patch =>
      mutate(d => {
        d.settings = { ...d.settings, ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) };
      }),

    ping: async () => undefined,
  };
}
