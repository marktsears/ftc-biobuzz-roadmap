import { diffDays, pd } from "./time";
import { isTaskKind, wEnd, type Clock } from "./weeks";
import type { CheckRec, Focus, Item, TrackCode, Week } from "./types";

export type Checks = Record<string, CheckRec>;

export const isOn = (c: Checks, id: string) => !!c[id];
export const vis = (it: Item, focus: Focus) => focus === "all" || it.tr === focus || it.tr === "A";

export function tally(items: Item[], c: Checks, focus: Focus = "all"): [number, number] {
  const v = items.filter(it => vis(it, focus));
  return [v.filter(it => isOn(c, it.id)).length, v.length];
}

/** ordinary tasks of a week (everything with a checkbox except demos, gate and heads-up) */
export function tasksOf(w: Week): Item[] {
  return w.build.concat(w.motion, w.scoring, w.both, w.drive, w.outreach, w.all);
}
/** every item that can be ticked in a week */
export function allItemsOf(w: Week): Item[] {
  return tasksOf(w).concat(w.done, w.heads, w.gate ? w.gate.items : []);
}

export const demoTally = (w: Week, c: Checks, f: Focus = "all") => tally(w.done, c, f);
export const gateTally = (w: Week, c: Checks, f: Focus = "all"): [number, number] => (w.gate ? tally(w.gate.items, c, f) : [0, 0]);
export const taskTally = (w: Week, c: Checks, f: Focus = "all") => tally(tasksOf(w), c, f);

export const gateOverdue = (w: Week, k: Clock) => !!w.gate && pd(w.gate.due) < k.today;
export const weekPast = (w: Week, k: Clock) => !k.before && w.n < k.now;

export interface Carry {
  w: Week;
  it: Item;
  label: "demo" | "gate";
}
export function carryOver(weeks: Week[], c: Checks, f: Focus, k: Clock): Carry[] {
  const out: Carry[] = [];
  if (k.before) return out;
  for (const w of weeks) {
    if (w.n < k.now) w.done.filter(it => vis(it, f)).forEach(it => !isOn(c, it.id) && out.push({ w, it, label: "demo" }));
    if (gateOverdue(w, k)) w.gate!.items.filter(it => vis(it, f)).forEach(it => !isOn(c, it.id) && out.push({ w, it, label: "gate" }));
  }
  return out.sort((a, b) => a.w.n - b.w.n);
}

export function weekLate(w: Week, c: Checks, k: Clock): boolean {
  if (!weekPast(w, k)) return false;
  const [dc, dt] = demoTally(w, c);
  const [gc, gt] = gateTally(w, c);
  return dc < dt || (gateOverdue(w, k) && gc < gt);
}
export function nextGate(weeks: Week[], k: Clock): Week | null {
  return weeks.find(w => w.gate && pd(w.gate.due) >= k.today) ?? null;
}

export type RailsStatus = "pre" | "on" | "drift" | "off";
export function railsStatus(carry: Carry[], k: Clock): RailsStatus {
  if (k.before) return "pre";
  if (!carry.length) return "on";
  const gap = k.now - carry[0].w.n;
  return carry.length <= 3 && gap <= 1 ? "drift" : "off";
}

/** Everything that counts toward the season (demos + gates), for the overall bar. */
export function overall(weeks: Week[], c: Checks, f: Focus = "all"): [number, number] {
  let d = 0;
  let t = 0;
  for (const w of weeks) {
    const a = demoTally(w, c, f);
    const g = gateTally(w, c, f);
    d += a[0] + g[0];
    t += a[1] + g[1];
  }
  return [d, t];
}

/** progress of one track in a week, across tasks, demos, gate and heads-up */
export function trackTally(w: Week, code: TrackCode, c: Checks): [number, number] {
  const items = allItemsOf(w).filter(it => it.tr === code);
  return [items.filter(it => isOn(c, it.id)).length, items.length];
}
/** whole-week tally (everything with a checkbox) */
export function weekTally(w: Week, c: Checks, f: Focus = "all"): [number, number] {
  return tally(allItemsOf(w), c, f);
}

/* ---------- pace: are we ahead of, on or behind where the plan says we should be? ---------- */

export type PaceLevel = "pre" | "ahead" | "on" | "slipping" | "behind";
export interface Pace {
  level: PaceLevel;
  expected: number;
  done: number;
  /** done minus expected, rounded: negative = behind */
  delta: number;
  ratio: number;
}

/**
 * Items we expect to be ticked by now: all tasks and demos from past weeks, gate items whose gate is due,
 * and a share of this week's tasks and demos (Mon–Thu are the work days). Work ticked ahead counts as bonus.
 */
export function pace(weeks: Week[], c: Checks, k: Clock, f: Focus = "all"): Pace {
  if (k.before) return { level: "pre", expected: 0, done: 0, delta: 0, ratio: 1 };
  let expected = 0;
  let done = 0;
  const share = Math.min(1, (k.dow + 1) / 4);
  for (const w of weeks) {
    if (w.brk) continue;
    const core = tasksOf(w).concat(w.done).filter(it => vis(it, f));
    const gate = w.gate ? w.gate.items.filter(it => vis(it, f)) : [];
    const coreDone = core.filter(it => isOn(c, it.id)).length;
    const gateDone = gate.filter(it => isOn(c, it.id)).length;
    if (w.n < k.now) expected += core.length;
    else if (w.n === k.now) expected += core.length * share;
    done += coreDone;
    if (w.gate && pd(w.gate.due) <= k.today) {
      expected += gate.length;
      done += gateDone;
    } else done += gateDone;
  }
  if (expected < 1) return { level: "on", expected, done, delta: 0, ratio: 1 };
  const ratio = done / expected;
  const level: PaceLevel = ratio >= 1.05 ? "ahead" : ratio >= 0.85 ? "on" : ratio >= 0.6 ? "slipping" : "behind";
  return { level, expected, done, delta: Math.round(done - expected), ratio };
}

export const PACE_COPY: Record<PaceLevel, { title: string; line: string }> = {
  pre: { title: "Ready to start", line: "Week 1 begins soon. Do the short “Before Monday” list." },
  ahead: { title: "Ahead of pace", line: "The team is out in front of the plan. Keep it up and help someone who’s stuck." },
  on: { title: "On pace", line: "Right where the plan says we should be." },
  slipping: { title: "Slipping a little", line: "A few things are behind. Clear the carry-over before starting new work." },
  behind: { title: "Behind pace", line: "Say so on Monday and work the catch-up ladder. Everyone can pick up one thing." },
};

/** days until a date relative to the clock */
export const daysTo = (d: Date, k: Clock) => diffDays(d, k.today);

/** whether the week is "done enough" to light up: all demos ticked */
export function weekFull(w: Week, c: Checks): boolean {
  const [dc, dt] = demoTally(w, c);
  return dt > 0 && dc === dt;
}

export { wEnd, isTaskKind };
