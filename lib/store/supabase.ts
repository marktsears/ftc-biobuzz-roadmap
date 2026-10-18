import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BudgetRow, TeamId } from "../types";
import type { Store, StoredState } from "./types";

const PAGE = 1000;

/** PostgREST caps every response (1000 rows by default), so read in pages. */
async function all<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...(data || []));
    if (!data || data.length < PAGE) return out;
  }
}

export function supabaseStore(url: string, key: string): Store {
  const db: SupabaseClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const fail = (e: { message: string } | null) => {
    if (e) throw new Error(e.message);
  };

  return {
    mode: "db",

    async read(team: TeamId): Promise<StoredState> {
      const [checks, claims, quests, budget] = await Promise.all([
        all<{ item_id: string; by_name: string; at: string }>((a, b) =>
          db.from("checks").select("item_id,by_name,at").eq("team", team).order("item_id").range(a, b),
        ),
        all<{ item_id: string; name: string }>((a, b) => db.from("claims").select("item_id,name").eq("team", team).order("item_id").order("name").range(a, b)),
        all<{ quest_id: string; name: string; note: string | null; at: string }>((a, b) =>
          db.from("quest_log").select("quest_id,name,note,at").eq("team", team).order("quest_id").order("name").range(a, b),
        ),
        db.from("budgets").select("rows").eq("team", team).maybeSingle(),
      ]);
      fail(budget.error);
      const out: StoredState = { checks: {}, claims: {}, quests: [], budget: null };
      for (const r of checks) out.checks[r.item_id] = { by: r.by_name, at: r.at };
      for (const r of claims) (out.claims[r.item_id] ||= []).push(r.name);
      for (const r of quests) out.quests.push({ id: r.quest_id, by: r.name, at: r.at, note: r.note || undefined });
      if (budget.data && Array.isArray(budget.data.rows)) out.budget = budget.data.rows as BudgetRow[];
      return out;
    },

    async setCheck(team, id, name, on) {
      if (on) fail((await db.from("checks").upsert({ team, item_id: id, by_name: name, at: new Date().toISOString() }, { onConflict: "team,item_id" })).error);
      else fail((await db.from("checks").delete().eq("team", team).eq("item_id", id)).error);
    },
    async setClaim(team, id, name, on) {
      if (on) fail((await db.from("claims").upsert({ team, item_id: id, name }, { onConflict: "team,item_id,name" })).error);
      else fail((await db.from("claims").delete().eq("team", team).eq("item_id", id).eq("name", name)).error);
    },
    async setQuest(team, quest, name, on, note) {
      if (on) fail((await db.from("quest_log").upsert({ team, quest_id: quest, name, note: note || null, at: new Date().toISOString() }, { onConflict: "team,quest_id,name" })).error);
      else fail((await db.from("quest_log").delete().eq("team", team).eq("quest_id", quest).eq("name", name)).error);
    },
    async setBudget(team, rows) {
      fail((await db.from("budgets").upsert({ team, rows, updated_at: new Date().toISOString() }, { onConflict: "team" })).error);
    },
    async ping() {
      fail((await db.from("budgets").select("team").limit(1)).error);
    },
  };
}
