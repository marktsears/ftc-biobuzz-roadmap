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
  /** Short label for a collapsed calendar chunk. */
  short: string;
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

/* ---------- quests the coach assigns ---------- */

/** Parts of the site an admin can switch on and off from Labs. */
export type FlagKey = "week" | "season" | "robot" | "playbook" | "hive" | "xp" | "teamTasks";
export type Flags = Record<FlagKey, boolean>;

export type WorkStatus = "doing" | "stuck" | "done";

/** One student's progress on one quest. */
export interface Work {
  quest: string;
  status: WorkStatus;
  /** what they made: a link or a sentence */
  proof?: string;
  /** what they're stuck on */
  stuck?: string;
  /** the coach's latest reply */
  coach?: string;
  checkedBy?: string;
  checkedAt?: string;
  at: string;
}

export interface Assignment {
  quest: string;
  /** the calendar week it was assigned for */
  week: number;
  by: string;
  at: string;
  note?: string;
}

export interface Student {
  email: string;
  name: string;
  team: TeamId | null;
  focus: Focus | null;
  /** null until they sign in for the first time */
  seen: string | null;
  /** on the coach's class list. False for someone who signed in without being added. */
  listed: boolean;
}

export interface Settings {
  flags: Flags;
  /** admins added from Labs, on top of the ones in code */
  admins: string[];
  /** quests every new student gets */
  starter: string[];
}

/** What /api/me returns. */
export interface MeState {
  db: boolean;
  admin: boolean;
  flags: Flags;
  assignments: Assignment[];
  work: Record<string, Work>;
  custom: import("./data/quests").Quest[];
  /** the team and focus saved for whoever is signed in */
  profile: Pick<Student, "email" | "team" | "focus"> | null;
  /** stuck, or done and not checked. Only filled in for a coach. */
  needs: number;
}

/** What /api/coach returns. */
export interface CoachState {
  db: boolean;
  students: Student[];
  assignments: (Assignment & { email: string })[];
  work: (Work & { email: string })[];
  custom: import("./data/quests").Quest[];
  archived: import("./data/quests").Quest[];
  settings: Settings;
  /** admins that are set in code and can't be removed from Labs */
  fixedAdmins: string[];
}
