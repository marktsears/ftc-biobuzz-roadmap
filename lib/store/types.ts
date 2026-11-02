import type { Quest } from "../data/quests";
import type { Assignment, BudgetRow, Focus, RemoteState, Settings, Student, TeamId, Work, WorkStatus } from "../types";

export type StoredState = Omit<RemoteState, "mode" | "locked">;

export interface WorkPatch {
  status: WorkStatus;
  proof?: string;
  stuck?: string;
}

export interface Store {
  mode: "db" | "file";

  /* team tools */
  read(team: TeamId): Promise<StoredState>;
  setCheck(team: TeamId, id: string, name: string, on: boolean): Promise<void>;
  setClaim(team: TeamId, id: string, name: string, on: boolean): Promise<void>;
  setBudget(team: TeamId, rows: BudgetRow[]): Promise<void>;

  /* students */
  /** a sign-in or a profile change. True if this is the first time we've heard of them. */
  touchPerson(p: { email: string; name: string; team?: TeamId | null; focus?: Focus | null }): Promise<boolean>;
  students(): Promise<Student[]>;
  /** the coach's paste. Puts everyone on the list; returns the emails that are new. */
  addStudents(rows: { email: string; name: string; team: TeamId | null }[]): Promise<string[]>;
  updateStudents(emails: string[], patch: { team?: TeamId | null; listed?: boolean }): Promise<void>;
  /** never signed in: gone, with their assignments. Signed in: off the list, progress kept. */
  removeStudents(emails: string[]): Promise<void>;

  /* assigned quests */
  assignments(email?: string): Promise<(Assignment & { email: string })[]>;
  assign(rows: { email: string; quest: string; week: number; by: string; note?: string }[]): Promise<void>;
  unassign(email: string, quest: string): Promise<void>;

  /* each student's quest progress */
  work(email?: string): Promise<(Work & { email: string })[]>;
  /** null clears it */
  setWork(email: string, quest: string, patch: WorkPatch | null): Promise<void>;
  /** ok: checked off. not ok: back to "doing", with the coach's note */
  review(email: string, quest: string, by: string, ok: boolean, note?: string): Promise<void>;

  /* quests the coach writes */
  customQuests(): Promise<{ quest: Quest; archived: boolean }[]>;
  saveQuest(q: Quest, by: string): Promise<void>;
  archiveQuest(id: string, archived: boolean): Promise<void>;

  /* Labs */
  settings(): Promise<Settings>;
  saveSettings(patch: Partial<Settings>): Promise<void>;

  /** cheap read, used by the daily keep-alive */
  ping(): Promise<void>;
}
