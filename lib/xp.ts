import { QUEST_BY_ID, questXp, type QuestKind } from "./data/quests";
import { getIndex, getWeeks, isTaskKind, weekOfDate } from "./weeks";
import { allItemsOf } from "./progress";
import type { RemoteState, TeamId, TrackCode } from "./types";

/* ---------- names ---------- */

export const NAME_MAX = 24;
export function normName(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, NAME_MAX)
    .replace(/(^|[\s'’-])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase());
}
export const nameKey = (s: string) => s.toLowerCase();

const AVATAR_COLORS = ["#1f3c6e", "#0e487d", "#413780", "#1d6b4f", "#a8741a", "#8a3b5b", "#2f6f8f", "#6b5b1d"];
export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]!.toUpperCase())
    .join("");

/* ---------- XP ---------- */

export const XP = { task: 10, heads: 10, demo: 25, gate: 40, claimBonus: 5 };

export function kindXp(kind: string): number {
  if (kind === "demo") return XP.demo;
  if (kind === "gate") return XP.gate;
  if (kind === "heads") return XP.heads;
  return XP.task;
}
export function checkXp(team: TeamId, id: string): number {
  const e = getIndex(team).get(id);
  return e ? kindXp(e.kind) : 0;
}

/** all the XP available from checkboxes over the season for a team (used to size the hive levels) */
export function seasonCheckXp(team: TeamId): number {
  let t = 0;
  for (const w of getWeeks(team)) for (const it of allItemsOf(w)) t += kindXp(it.kind);
  return t;
}

/* ---------- levels ---------- */

export interface Level {
  idx: number;
  name: string;
  min: number;
  next: number | null;
  pct: number;
}
function levelFor(xp: number, table: { name: string; min: number }[]): Level {
  let idx = 0;
  for (let i = 0; i < table.length; i++) if (xp >= table[i].min) idx = i;
  const cur = table[idx];
  const nxt = table[idx + 1];
  return { idx, name: cur.name, min: cur.min, next: nxt ? nxt.min : null, pct: nxt ? Math.min(100, ((xp - cur.min) / (nxt.min - cur.min)) * 100) : 100 };
}

export const PERSONAL_LEVELS = [
  { name: "Rookie", min: 0 },
  { name: "Tinkerer", min: 40 },
  { name: "Builder", min: 120 },
  { name: "Engineer", min: 260 },
  { name: "Specialist", min: 480 },
  { name: "Captain", min: 800 },
];
export const personalLevel = (xp: number) => levelFor(xp, PERSONAL_LEVELS);

/** The hive grows with the team's total XP. Thresholds scale with how much XP the season holds. */
const HIVE_NAMES = ["Egg", "Larva", "Pupa", "Nurse", "Builder", "Forager", "Guard", "Swarm"];
const HIVE_FRACTIONS = [0, 0.05, 0.14, 0.27, 0.42, 0.58, 0.74, 0.9];
export function hiveLevel(xp: number, team: TeamId): Level {
  const total = seasonCheckXp(team);
  return levelFor(xp, HIVE_NAMES.map((name, i) => ({ name, min: Math.round((HIVE_FRACTIONS[i] * total) / 10) * 10 })));
}

/* ---------- people ---------- */

export interface Person {
  name: string;
  key: string;
  xp: number;
  ticks: number;
  demos: number;
  gates: number;
  quests: number;
  questKinds: Partial<Record<QuestKind, number>>;
  tracks: Record<TrackCode, number>;
  claimsDone: number;
  weeks: number[];
  streak: number;
  last: string;
}

const emptyPerson = (name: string): Person => ({
  name,
  key: nameKey(name),
  xp: 0,
  ticks: 0,
  demos: 0,
  gates: 0,
  quests: 0,
  questKinds: {},
  tracks: { B: 0, S: 0, D: 0, O: 0, A: 0 },
  claimsDone: 0,
  weeks: [],
  streak: 0,
  last: "",
});

export function computePeople(state: RemoteState, team: TeamId, nowWeek: number): Person[] {
  const weeks = getWeeks(team);
  const index = getIndex(team);
  const map = new Map<string, Person>();
  const get = (name: string) => {
    const k = nameKey(name);
    let p = map.get(k);
    if (!p) map.set(k, (p = emptyPerson(name)));
    return p;
  };
  const touch = (p: Person, at: string) => {
    if (at > p.last) p.last = at;
    const wk = weekOfDate(weeks, new Date(at));
    if (wk && !p.weeks.includes(wk)) p.weeks.push(wk);
  };

  for (const [id, rec] of Object.entries(state.checks)) {
    const e = index.get(id);
    if (!e) continue;
    const p = get(rec.by);
    p.ticks++;
    p.xp += kindXp(e.kind);
    if (e.kind === "demo") p.demos++;
    if (e.kind === "gate") p.gates++;
    p.tracks[e.tr]++;
    if (isTaskKind(e.kind) && (state.claims[id] || []).some(n => nameKey(n) === p.key)) {
      p.claimsDone++;
      p.xp += XP.claimBonus;
    }
    touch(p, rec.at);
  }
  for (const q of state.quests) {
    const def = QUEST_BY_ID[q.id];
    if (!def) continue;
    const p = get(q.by);
    p.quests++;
    p.xp += questXp(def);
    p.questKinds[def.kind] = (p.questKinds[def.kind] || 0) + 1;
    p.tracks[def.track]++;
    touch(p, q.at);
  }
  for (const p of map.values()) {
    let n = nowWeek;
    if (!p.weeks.includes(n)) n--;
    let s = 0;
    while (n >= 1 && p.weeks.includes(n)) {
      s++;
      n--;
    }
    p.streak = s;
  }
  return [...map.values()];
}

/* ---------- badges ---------- */

export interface Badge {
  id: string;
  name: string;
  desc: string;
  test: (p: Person) => boolean;
}
const kindsTried = (p: Person) => Object.values(p.questKinds).filter(n => (n ?? 0) > 0).length;
export const BADGES: Badge[] = [
  { id: "first", name: "First flight", desc: "Tick a box or finish a quest.", test: p => p.ticks + p.quests >= 1 },
  { id: "grabber", name: "Task grabber", desc: "Grab 3 tasks and finish them.", test: p => p.claimsDone >= 3 },
  { id: "finisher", name: "Finisher", desc: "Tick 10 things.", test: p => p.ticks >= 10 },
  { id: "workhorse", name: "Workhorse", desc: "Tick 40 things.", test: p => p.ticks >= 40 },
  { id: "demo", name: "Demo day hero", desc: "Tick 3 Thursday demo items.", test: p => p.demos >= 3 },
  { id: "gate", name: "Gate keeper", desc: "Tick 3 gate items.", test: p => p.gates >= 3 },
  { id: "quest1", name: "Quest taker", desc: "Finish your first quest.", test: p => p.quests >= 1 },
  { id: "quest5", name: "Quest hunter", desc: "Finish 5 quests.", test: p => p.quests >= 5 },
  { id: "quest10", name: "Quest legend", desc: "Finish 10 quests.", test: p => p.quests >= 10 },
  { id: "explorer", name: "Explorer", desc: "Finish quests of 3 different kinds.", test: p => kindsTried(p) >= 3 },
  { id: "quizzer", name: "Quiz whiz", desc: "Pass 2 quizzes.", test: p => (p.questKinds.quiz || 0) >= 2 },
  { id: "builder", name: "Builder", desc: "5 things done on the Build track.", test: p => p.tracks.B >= 5 },
  { id: "coder", name: "Coder", desc: "5 things done on the Software track.", test: p => p.tracks.S >= 5 },
  { id: "strategist", name: "Strategist", desc: "5 things done on the Drive track.", test: p => p.tracks.D >= 5 },
  { id: "storyteller", name: "Storyteller", desc: "5 things done on the Outreach track.", test: p => p.tracks.O >= 5 },
  { id: "roll", name: "On a roll", desc: "Be active 3 weeks in a row.", test: p => p.streak >= 3 },
  { id: "unstoppable", name: "Unstoppable", desc: "Be active 6 weeks in a row.", test: p => p.streak >= 6 },
];
export const badgesOf = (p: Person | null | undefined): string[] => (p ? BADGES.filter(b => b.test(p)).map(b => b.id) : []);
