import { NextResponse } from "next/server";
import { QUIZ_CHECKER, needsAttention } from "@/lib/coach";
import { cleanQuest } from "@/lib/customQuest";
import { QUEST_BY_ID } from "@/lib/data/quests";
import { getStore } from "@/lib/store";
import type { Store } from "@/lib/store/types";
import { TEAM_IDS, type Focus, type MeState, type Settings, type TeamId, type Work, type WorkStatus } from "@/lib/types";
import { acceptPassedQuizzes, getViewer, giveStarter, loadSettings, questExists, type Viewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const FOCI: Focus[] = ["all", "B", "S", "D", "O"];
const STATUSES: WorkStatus[] = ["doing", "stuck", "done"];

async function snapshot(store: Store | null, settings: Settings, v: Viewer | null): Promise<MeState> {
  const base: MeState = { db: !!store, admin: !!v?.admin, flags: settings.flags, assignments: [], work: {}, custom: [], profile: null, needs: 0 };
  if (!store) return base;
  const custom = (await store.customQuests()).filter(c => !c.archived).map(c => cleanQuest(c.quest)).filter(q => !!q);
  if (!v) return { ...base, custom };
  if (v.admin) await acceptPassedQuizzes(store);
  const [assignments, work, people, allWork] = await Promise.all([
    store.assignments(v.email),
    store.work(v.email),
    store.students(),
    v.admin ? store.work() : Promise.resolve([]),
  ]);
  const byQuest: Record<string, Work> = {};
  for (const { email: _e, ...w } of work) byQuest[w.quest] = w;
  const p = people.find(s => s.email === v.email);
  return {
    ...base,
    custom,
    assignments: assignments.map(({ email: _e, ...a }) => a),
    work: byQuest,
    profile: { email: v.email, team: p?.team ?? null, focus: p?.focus ?? null },
    needs: v.admin ? allWork.filter(needsAttention).length : 0,
  };
}

/** Your flags, whether you're an admin, the quests your coach gave you and how you're doing on each. */
export async function GET() {
  try {
    const store = getStore();
    const settings = await loadSettings(store);
    const v = await getViewer(settings);
    if (store && v && (await store.touchPerson({ email: v.email, name: v.name })) && !v.admin) await giveStarter(store, settings, [v.email]);
    return json(await snapshot(store, settings, v));
  } catch (e) {
    console.error("me read failed", e);
    return json({ error: "Storage is unavailable" }, 503);
  }
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
  const settings = await loadSettings(store);
  const v = await getViewer(settings);
  if (!v) return json({ error: "Sign in with your Trinity Google account" }, 401);

  try {
    switch (body.op) {
      case "profile": {
        const team = TEAM_IDS.includes(body.team as TeamId) ? (body.team as TeamId) : null;
        const focus = FOCI.includes(body.focus as Focus) ? (body.focus as Focus) : null;
        await store.touchPerson({ email: v.email, name: v.name, team, focus });
        break;
      }
      case "work": {
        const quest = String(body.quest ?? "");
        if (!(await questExists(store, quest))) return json({ error: "Unknown quest" }, 400);
        if (body.status === null) {
          await store.setWork(v.email, quest, null);
          break;
        }
        const status = body.status as WorkStatus;
        if (!STATUSES.includes(status)) return json({ error: "Unknown status" }, 400);
        const text = typeof body.text === "string" ? body.text.trim().slice(0, 500) : "";
        if (status === "stuck" && !text) return json({ error: "Say what you’re stuck on, so your coach knows how to help." }, 400);
        const built = QUEST_BY_ID[quest];
        const quiz = built ? !!built.quiz : (await store.customQuests()).some(c => c.quest.id === quest && c.quest.quiz);
        await store.setWork(v.email, quest, {
          status,
          proof: status === "done" ? text || undefined : undefined,
          stuck: status === "stuck" ? text : undefined,
          checkedBy: status === "done" && quiz ? QUIZ_CHECKER : undefined,
        });
        break;
      }
      default:
        return json({ error: "Unknown action" }, 400);
    }
    return json(await snapshot(store, settings, v));
  } catch (e) {
    console.error("me write failed", e);
    return json({ error: "Couldn’t save. Try again." }, 503);
  }
}
