import type { BudgetRow, RemoteState, TeamId } from "../types";

export type StoredState = Omit<RemoteState, "mode" | "locked">;

export interface Store {
  mode: "db" | "file";
  read(team: TeamId): Promise<StoredState>;
  setCheck(team: TeamId, id: string, name: string, on: boolean): Promise<void>;
  setClaim(team: TeamId, id: string, name: string, on: boolean): Promise<void>;
  setQuest(team: TeamId, quest: string, name: string, on: boolean, note?: string): Promise<void>;
  setBudget(team: TeamId, rows: BudgetRow[]): Promise<void>;
  /** cheap read, used by the daily keep-alive */
  ping(): Promise<void>;
}
