export type TeamId = "2827" | "3587";
export const TEAM_IDS: TeamId[] = ["2827", "3587"];

/** B = Build, S = Software, D = Drive & strategy, O = Outreach & awards, A = All hands */
export type TrackCode = "B" | "S" | "D" | "O" | "A";
export type Focus = TrackCode | "all";

export type Kind =
  | "build"
  | "motion"
  | "scoring"
  | "both"
  | "drive"
  | "outreach"
  | "all"
  | "done"
  | "heads"
  | "ahead";

/** One entry in a week list as written in the data files. */
export type RawList = string[];

export interface RawTeamOverrides {
  [key: string]: string[] | string | undefined;
}

export interface RawWeek {
  n: number;
  start: string;
  phase: string;
  title: string;
  short?: string;
  brk?: boolean;
  goal: string;
  why: string;
  event?: string;
  build?: RawList;
  motion?: RawList;
  scoring?: RawList;
  both?: RawList;
  drive?: RawList;
  outreach?: RawList;
  all?: RawList;
  done?: RawList;
  gate?: { name: string; due: string; items: RawList };
  heads?: RawList;
  behind?: string;
  ahead?: RawList;
  sat?: string;
  trap?: RawList;
  learn?: string[];
  t?: Partial<Record<TeamId, RawTeamOverrides>>;
}

/** A single tickable thing, after merging team overrides. */
export interface Item {
  id: string;
  tr: TrackCode;
  t: string;
  /** set when this line only applies to one team */
  tm: TeamId | null;
  kind: string;
}

export interface Week {
  n: number;
  start: string;
  phase: string;
  title: string;
  short?: string;
  brk: boolean;
  goal: string;
  why: string;
  event?: string;
  build: Item[];
  motion: Item[];
  scoring: Item[];
  both: Item[];
  drive: Item[];
  outreach: Item[];
  all: Item[];
  done: Item[];
  heads: Item[];
  ahead: Item[];
  gate: { name: string; due: string; items: Item[] } | null;
  traps: string[];
  learn: string[];
  behind: string;
  sat: string;
}

export interface Phase {
  id: string;
  name: string;
  color: string;
  blurb: string;
}

export interface Milestone {
  key: string;
  name: string;
  date: string;
  week: number;
  flag: [string, string];
}

/* ---------- shared (server + client) state ---------- */

export interface CheckRec {
  by: string;
  at: string;
}
export interface QuestRec {
  id: string;
  by: string;
  at: string;
  note?: string;
}
export type BudgetRow = [string, number, number];

export interface RemoteState {
  /** where the data lives: "db" = Supabase, "file" = dev file, "local" = this browser only */
  mode: "db" | "file" | "local";
  /** true if the server wants a team code before it accepts writes */
  locked: boolean;
  checks: Record<string, CheckRec>;
  claims: Record<string, string[]>;
  quests: QuestRec[];
  budget: BudgetRow[] | null;
}

export const EMPTY_STATE: RemoteState = {
  mode: "local",
  locked: false,
  checks: {},
  claims: {},
  quests: [],
  budget: null,
};

export type WriteOp =
  | { op: "check"; id: string; on: boolean }
  | { op: "claim"; id: string; on: boolean }
  | { op: "quest"; quest: string; on: boolean; note?: string }
  | { op: "budget"; rows: BudgetRow[] };
