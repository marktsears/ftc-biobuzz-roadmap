import { hs } from "./time";
import { isOn, tasksOf, vis } from "./progress";
import { nameKey } from "./xp";
import type { Quest, QuestKind, QuestLevel } from "./data/quests";
import type { Clock } from "./weeks";
import type { Focus, Item, RemoteState, Week } from "./types";

const jitter = (seed: string) => parseInt(hs(seed), 36) % 1000 / 1000;

export const questsDoneBy = (state: RemoteState, person: string): Set<string> =>
  new Set(state.quests.filter(q => !!person && nameKey(q.by) === nameKey(person)).map(q => q.id));

export const questCrew = (state: RemoteState, id: string) => state.quests.filter(q => q.id === id);

export function relevantNow(q: Quest, week: number): boolean {
  return !q.weeks || (week >= q.weeks[0] && week <= q.weeks[1]);
}

export interface PickOpts {
  quests: Quest[];
  done: Set<string>;
  focus: Focus;
  week: number;
  seed: string;
  maxMins?: number;
  kind?: QuestKind | "all";
  level?: QuestLevel | "all";
  includeDone?: boolean;
}

/** Rank quests for "what should I do right now?". Deterministic for a given seed, so a daily pick is stable. */
export function rankQuests(o: PickOpts): Quest[] {
  return o.quests
    .filter(q => (o.includeDone || !o.done.has(q.id)) && (!o.maxMins || q.mins <= o.maxMins) && (!o.kind || o.kind === "all" || q.kind === o.kind) && (!o.level || o.level === "all" || q.level === o.level))
    .map(q => {
      let s = jitter(o.seed + q.id);
      if (o.focus !== "all" && q.track === o.focus) s += 3;
      if (q.weeks) s += relevantNow(q, o.week) ? 2 : -1.5;
      if (q.helpsTeam) s += 0.8;
      if (q.level === 1) s += 0.3; // start easy
      if (o.done.has(q.id)) s -= 10;
      return { q, s };
    })
    .sort((a, b) => b.s - a.s)
    .map(x => x.q);
}

export interface OpenTask {
  w: Week;
  it: Item;
}
/** Unticked, ungrabbed tasks from this week (and earlier ones still open), the ones that match your focus first. */
export function openTasks(weeks: Week[], state: RemoteState, focus: Focus, k: Clock): OpenTask[] {
  const upto = k.before ? 1 : k.now;
  const out: OpenTask[] = [];
  for (const w of weeks) {
    if (w.n > upto || w.brk) continue;
    for (const it of tasksOf(w)) {
      if (isOn(state.checks, it.id) || (state.claims[it.id] || []).length) continue;
      if (!vis(it, "all")) continue;
      out.push({ w, it });
    }
  }
  const rank = (x: OpenTask) => (focus !== "all" && x.it.tr === focus ? 0 : x.it.tr === "A" ? 1 : 2) * 100 - x.w.n;
  return out.sort((a, b) => rank(a) - rank(b));
}

/** Tasks a person has grabbed and not finished yet. */
export function myTasks(weeks: Week[], state: RemoteState, person: string): OpenTask[] {
  if (!person) return [];
  const out: OpenTask[] = [];
  for (const w of weeks)
    for (const it of tasksOf(w)) {
      const list = state.claims[it.id] || [];
      if (!isOn(state.checks, it.id) && list.some(n => nameKey(n) === nameKey(person))) out.push({ w, it });
    }
  return out;
}
