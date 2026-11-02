import { LADDERS, type Ladder } from "./data/ladders";
import type { Assignment, Work } from "./types";

/** Written onto a quiz the student passed, so it never waits in the coach's queue. */
export const QUIZ_CHECKER = "Quiz";

export function needsAttention(w: Pick<Work, "status" | "checkedBy">): boolean {
  return w.status === "stuck" || (w.status === "done" && !w.checkedBy);
}

export interface CarryRow {
  email: string;
  quest: string;
  week: number;
  by: string;
  note?: string;
}

/**
 * Assignments in fromWeek that are not done, rewritten onto toWeek.
 * The note and the coach who assigned them stay. Done quests stay where they are.
 */
export function carryForward(
  assignments: (Assignment & { email: string })[],
  work: Pick<Work & { email: string }, "email" | "quest" | "status">[],
  emails: string[],
  fromWeek: number,
  toWeek: number,
): CarryRow[] {
  const who = new Set(emails);
  const done = new Set(work.filter(w => w.status === "done").map(w => `${w.email}\0${w.quest}`));
  return assignments
    .filter(a => who.has(a.email) && a.week === fromWeek && !done.has(`${a.email}\0${a.quest}`))
    .map(a => ({ email: a.email, quest: a.quest, week: toWeek, by: a.by, note: a.note }));
}

/** The first ladder step that is neither finished nor already assigned. */
export function nextUnassigned(steps: string[], done: Set<string>, assigned: Set<string>): string | null {
  return steps.find(id => !done.has(id) && !assigned.has(id)) ?? null;
}

export function ladderById(id: string): Ladder | undefined {
  return LADDERS.find(l => l.id === id);
}
