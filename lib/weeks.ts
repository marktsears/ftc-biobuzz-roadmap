import { MILESTONES, PHASES, PRE } from "./data/core";
import { RAW_WEEKS } from "./data/weeks";
import { addDays, diffDays, hs, pd, sod } from "./time";
import type { Item, Kind, Milestone, Phase, RawWeek, TeamId, TrackCode, Week } from "./types";
import { TEAM_IDS } from "./types";

export { MILESTONES, PHASES };

const KIND_TR: Record<Kind, TrackCode> = {
  build: "B",
  motion: "S",
  scoring: "S",
  both: "S",
  drive: "D",
  outreach: "O",
  all: "A",
  done: "A",
  heads: "A",
  ahead: "A",
};
const KIND_ID: Partial<Record<Kind | "gate", string>> = { done: "demo" };
const LIST_KEYS = Object.keys(KIND_TR) as Kind[];

/** the kinds that count as ordinary tasks (claimable, +XP) */
export const TASK_KINDS = ["build", "motion", "scoring", "both", "drive", "outreach", "all"] as const;
export const isTaskKind = (k: string) => (TASK_KINDS as readonly string[]).includes(k);

export const itemId = (n: number, kind: string, text: string) => `w${n}.${kind}.${hs(text)}`;

function mk(n: number, arr: string[] | undefined, tm: TeamId | null, k: Kind | "gate", def?: TrackCode): Item[] {
  return (arr || []).map(s => {
    const m = /^([BSDOA]):\s*([\s\S]*)$/.exec(s);
    const kind = KIND_ID[k] || k;
    const t = m ? m[2] : s;
    return { id: itemId(n, kind, t), tr: (m ? m[1] : def || KIND_TR[k as Kind]) as TrackCode, t, tm, kind };
  });
}

/** merge a raw week with a team's overrides: xxxPre prepends, xxx replaces, xxxAdd appends */
export function mergeWeek(w: RawWeek, team: TeamId): Week {
  const o = (w.t && w.t[team]) || {};
  const lists: Record<string, Item[]> = {};
  for (const k of LIST_KEYS) {
    const over = o[k] as string[] | undefined;
    const pre = o[k + "Pre"] as string[] | undefined;
    const add = o[k + "Add"] as string[] | undefined;
    const base = over ? mk(w.n, over, team, k) : mk(w.n, w[k], null, k);
    lists[k] = mk(w.n, pre, team, k).concat(base, mk(w.n, add, team, k));
  }
  const gateAdd = o.gateAdd as string[] | undefined;
  return {
    n: w.n,
    start: w.start,
    phase: w.phase,
    title: w.title,
    short: w.short,
    brk: !!w.brk,
    goal: w.goal,
    why: w.why,
    event: w.event,
    build: lists.build,
    motion: lists.motion,
    scoring: lists.scoring,
    both: lists.both,
    drive: lists.drive,
    outreach: lists.outreach,
    all: lists.all,
    done: lists.done,
    heads: lists.heads,
    ahead: lists.ahead,
    gate: w.gate
      ? { name: w.gate.name, due: w.gate.due, items: mk(w.n, w.gate.items, null, "gate", "A").concat(mk(w.n, gateAdd, team, "gate", "A")) }
      : null,
    traps: ([] as string[]).concat((o.trap as string[] | undefined) ?? w.trap ?? []),
    learn: (o.learn as unknown as string[] | undefined) || w.learn || [],
    behind: (o.behind as string | undefined) || w.behind || "",
    sat: (o.sat as string | undefined) || w.sat || "",
  };
}

const cache: Partial<Record<TeamId, Week[]>> = {};
export function getWeeks(team: TeamId): Week[] {
  return (cache[team] ??= RAW_WEEKS.map(w => mergeWeek(w, team)));
}

/** "Before Monday" list (week 0) */
export const PRE_ITEMS: Item[] = mk(0, PRE, null, "all");

export interface IndexEntry {
  week: number;
  kind: string;
  tr: TrackCode;
  t: string;
}
const idxCache: Partial<Record<TeamId, Map<string, IndexEntry>>> = {};
/** every valid item ID for a team → what it is */
export function getIndex(team: TeamId): Map<string, IndexEntry> {
  const hit = idxCache[team];
  if (hit) return hit;
  const m = new Map<string, IndexEntry>();
  const add = (n: number, items: Item[]) => items.forEach(it => m.set(it.id, { week: n, kind: it.kind, tr: it.tr, t: it.t }));
  PRE_ITEMS.forEach(it => m.set(it.id, { week: 0, kind: it.kind, tr: it.tr, t: it.t }));
  for (const w of getWeeks(team)) {
    for (const k of LIST_KEYS) if (k !== "ahead") add(w.n, w[k as keyof Week] as Item[]);
    if (w.gate) add(w.n, w.gate.items);
  }
  return (idxCache[team] = m);
}
export const allTeams = TEAM_IDS;

/* ---------- the season clock ---------- */

export interface Layout {
  cols: number;
  startCol: Record<number, number>;
}
export function layoutOf(weeks: Week[]): Layout {
  const startCol: Record<number, number> = {};
  let c = 0;
  for (const w of weeks) {
    startCol[w.n] = c;
    c += w.brk ? 2 : 1;
  }
  return { cols: c, startCol };
}

export interface Clock {
  today: Date;
  before: boolean;
  after: boolean;
  /** week number we're in (1 before the season starts, last week after it ends) */
  now: number;
  first: Date;
  last: Date;
  lastEnd: Date;
  /** days since this week's Monday */
  dow: number;
}
export const wStart = (w: Week) => pd(w.start);
export const wEnd = (w: Week) => addDays(pd(w.start), w.brk ? 13 : 6);

export function clockOf(weeks: Week[], todayIn: Date): Clock {
  const today = sod(todayIn);
  const first = pd(weeks[0].start);
  const last = weeks[weeks.length - 1];
  const lastEnd = wEnd(last);
  let now = 1;
  for (const w of weeks) if (pd(w.start) <= today) now = w.n;
  const cur = weeks[now - 1];
  return {
    today,
    before: today < first,
    after: today > lastEnd,
    now,
    first,
    last: pd(last.start),
    lastEnd,
    dow: Math.max(0, diffDays(today, pd(cur.start))),
  };
}

export const phaseOf = (id: string): Phase => PHASES.find(p => p.id === id) ?? PHASES[0];
export const qualifier: Milestone = MILESTONES.find(m => m.key === "qual")!;

/** which plan week a date falls into (null before the season) */
export function weekOfDate(weeks: Week[], d: Date): number | null {
  let n: number | null = null;
  for (const w of weeks) if (pd(w.start) <= d) n = w.n;
  return n;
}
