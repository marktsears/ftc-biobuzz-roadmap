import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { applyOp } from "../apply";
import { EMPTY_STATE, type RemoteState, type TeamId } from "../types";
import type { Store, StoredState } from "./types";

/** Development-only store: one JSON file per team in .data/. Never used in production. */
export function fileStore(): Store {
  const dir = path.join(process.cwd(), ".data");
  const file = (team: TeamId) => path.join(dir, `${team}.json`);
  let queue: Promise<unknown> = Promise.resolve();

  const read = async (team: TeamId): Promise<StoredState> => {
    try {
      const raw = JSON.parse(await fs.readFile(file(team), "utf8")) as Partial<StoredState>;
      return { checks: raw.checks || {}, claims: raw.claims || {}, quests: raw.quests || [], budget: raw.budget ?? null };
    } catch {
      return { checks: {}, claims: {}, quests: [], budget: null };
    }
  };
  /** serialize read-modify-write so quick taps don't clobber each other */
  const mutate = (team: TeamId, f: (s: RemoteState) => RemoteState) => {
    const run = queue.then(async () => {
      const cur = await read(team);
      const next = f({ ...EMPTY_STATE, ...cur, mode: "file" });
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(file(team), JSON.stringify({ checks: next.checks, claims: next.claims, quests: next.quests, budget: next.budget }, null, 1));
    });
    queue = run.catch(() => undefined);
    return run;
  };
  const now = () => new Date().toISOString();

  return {
    mode: "file",
    read,
    setCheck: (team, id, name, on) => mutate(team, s => applyOp(s, { op: "check", id, on }, name, now())),
    setClaim: (team, id, name, on) => mutate(team, s => applyOp(s, { op: "claim", id, on }, name, now())),
    setQuest: (team, quest, name, on, note) => mutate(team, s => applyOp(s, { op: "quest", quest, on, note }, name, now())),
    setBudget: (team, rows) => mutate(team, s => applyOp(s, { op: "budget", rows }, "", now())),
    ping: async () => undefined,
  };
}
