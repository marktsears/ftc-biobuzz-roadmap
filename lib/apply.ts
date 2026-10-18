import { nameKey } from "./xp";
import type { BudgetRow, RemoteState, WriteOp } from "./types";

/** Apply one write to a copy of the state. Used for instant (optimistic) updates and for local mode. */
export function applyOp(s: RemoteState, op: WriteOp, name: string, at: string): RemoteState {
  switch (op.op) {
    case "check": {
      const checks = { ...s.checks };
      if (op.on) checks[op.id] = { by: name, at };
      else delete checks[op.id];
      return { ...s, checks };
    }
    case "claim": {
      const claims = { ...s.claims };
      const list = (claims[op.id] || []).filter(n => nameKey(n) !== nameKey(name));
      if (op.on) list.push(name);
      if (list.length) claims[op.id] = list;
      else delete claims[op.id];
      return { ...s, claims };
    }
    case "quest": {
      const rest = s.quests.filter(q => !(q.id === op.quest && nameKey(q.by) === nameKey(name)));
      if (op.on) rest.push({ id: op.quest, by: name, at, note: op.note || undefined });
      return { ...s, quests: rest };
    }
    case "budget":
      return { ...s, budget: op.rows.map(r => [...r] as BudgetRow) };
  }
}
