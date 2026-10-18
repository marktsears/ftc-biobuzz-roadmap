import { NextResponse } from "next/server";
import { QUEST_BY_ID } from "@/lib/data/quests";
import { getStore, teamCode } from "@/lib/store";
import { TEAM_IDS, type BudgetRow, type RemoteState, type TeamId, type WriteOp } from "@/lib/types";
import { getIndex, isTaskKind } from "@/lib/weeks";
import { NAME_MAX, normName } from "@/lib/xp";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const isTeam = (t: unknown): t is TeamId => typeof t === "string" && (TEAM_IDS as string[]).includes(t);

async function snapshot(team: TeamId): Promise<RemoteState> {
  const store = getStore();
  if (!store) return { mode: "local", locked: false, checks: {}, claims: {}, quests: [], budget: null };
  const s = await store.read(team);
  return { ...s, mode: store.mode, locked: !!teamCode() };
}

export async function GET(req: Request) {
  const team = new URL(req.url).searchParams.get("team");
  if (!isTeam(team)) return json({ error: "Unknown team" }, 400);
  try {
    return json(await snapshot(team));
  } catch (e) {
    console.error("state read failed", e);
    return json({ error: "Storage is unavailable" }, 503);
  }
}

function parseBudget(rows: unknown): BudgetRow[] | null {
  if (!Array.isArray(rows) || rows.length > 40) return null;
  const out: BudgetRow[] = [];
  for (const r of rows) {
    if (!Array.isArray(r) || typeof r[0] !== "string") return null;
    const m = Math.round(Number(r[1]));
    const s = Math.round(Number(r[2]));
    if (!Number.isFinite(m) || !Number.isFinite(s)) return null;
    out.push([r[0].slice(0, 60), Math.min(99, Math.max(0, m)), Math.min(99, Math.max(0, s))]);
  }
  return out;
}

export async function POST(req: Request) {
  const store = getStore();
  if (!store) return json({ error: "No shared storage is set up" }, 501);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad JSON" }, 400);
  }
  const team = body.team;
  if (!isTeam(team)) return json({ error: "Unknown team" }, 400);

  const need = teamCode();
  if (need && String(body.code ?? "").trim() !== need) return json({ error: "Wrong team code" }, 401);

  const name = normName(String(body.name ?? ""));
  if (!name || name.length > NAME_MAX) return json({ error: "Add your name first" }, 400);

  const op = body.op as WriteOp["op"];
  try {
    switch (op) {
      case "check": {
        const id = String(body.id ?? "");
        if (!getIndex(team).has(id)) return json({ error: "Unknown item" }, 400);
        await store.setCheck(team, id, name, body.on !== false);
        break;
      }
      case "claim": {
        const id = String(body.id ?? "");
        const e = getIndex(team).get(id);
        if (!e || !isTaskKind(e.kind)) return json({ error: "That item can’t be claimed" }, 400);
        await store.setClaim(team, id, name, body.on !== false);
        break;
      }
      case "quest": {
        const q = String(body.quest ?? "");
        if (!QUEST_BY_ID[q]) return json({ error: "Unknown quest" }, 400);
        const note = typeof body.note === "string" ? body.note.trim().slice(0, 280) : undefined;
        await store.setQuest(team, q, name, body.on !== false, note);
        break;
      }
      case "budget": {
        const rows = parseBudget(body.rows);
        if (!rows) return json({ error: "Bad budget" }, 400);
        await store.setBudget(team, rows);
        break;
      }
      default:
        return json({ error: "Unknown action" }, 400);
    }
    return json(await snapshot(team));
  } catch (e) {
    console.error("state write failed", e);
    return json({ error: "Couldn’t save. Try again." }, 503);
  }
}
