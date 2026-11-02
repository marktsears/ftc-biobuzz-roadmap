import { NextResponse } from "next/server";
import { cleanQuest, draftToQuest, type QuestDraft } from "@/lib/customQuest";
import { readFlags } from "@/lib/flags";
import { fixedAdmins, isAdmin, normEmail } from "@/lib/identity";
import { getStore } from "@/lib/store";
import type { Store } from "@/lib/store/types";
import { isSchoolEmail, shortName } from "@/lib/roster";
import { TEAM_IDS, type CoachState, type Settings, type TeamId } from "@/lib/types";
import { getViewer, giveStarter, loadSettings, questExists } from "@/lib/viewer";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const emailList = (v: unknown) => [...new Set((Array.isArray(v) ? v : []).map(e => normEmail(String(e))).filter(e => e.includes("@")))].slice(0, 300);

async function snapshot(store: Store, settings: Settings): Promise<CoachState> {
  const [people, assignments, work, custom] = await Promise.all([store.students(), store.assignments(), store.work(), store.customQuests()]);
  const students = people.filter(s => !isAdmin(s.email, settings.admins));
  const live = custom.filter(c => !c.archived).map(c => cleanQuest(c.quest)).filter(q => !!q);
  const archived = custom.filter(c => c.archived).map(c => cleanQuest(c.quest)).filter(q => !!q);
  return { db: true, students, assignments, work, custom: live, archived, settings, fixedAdmins: fixedAdmins() };
}

async function admin(store: Store | null) {
  const settings = await loadSettings(store);
  const v = await getViewer(settings);
  return { settings, v: v?.admin ? v : null };
}

/** The class roster and everyone's quests. Admins only. */
export async function GET() {
  const store = getStore();
  const { settings, v } = await admin(store);
  if (!v) return json({ error: "Only coaches can open this page" }, 403);
  if (!store) return json({ error: "The database isn’t connected yet. In Vercel, open Storage, add Neon (free) and redeploy." }, 501);
  try {
    return json(await snapshot(store, settings));
  } catch (e) {
    console.error("coach read failed", e);
    return json({ error: "Storage is unavailable" }, 503);
  }
}

export async function POST(req: Request) {
  const store = getStore();
  const { settings, v } = await admin(store);
  if (!v) return json({ error: "Only coaches can do that" }, 403);
  if (!store) return json({ error: "The database isn’t connected yet. In Vercel, open Storage, add Neon (free) and redeploy." }, 501);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad JSON" }, 400);
  }
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) || undefined : undefined;

  try {
    switch (body.op) {
      case "assign": {
        const known = new Set((await store.students()).map(s => s.email));
        const emails = (Array.isArray(body.emails) ? body.emails : []).map(e => normEmail(String(e))).filter(e => known.has(e));
        const quests = (Array.isArray(body.quests) ? body.quests : []).map(String);
        const week = Math.round(Number(body.week));
        if (!emails.length || !quests.length) return json({ error: "Pick at least one student and one quest" }, 400);
        if (!Number.isFinite(week) || week < 1 || week > 60) return json({ error: "Bad week" }, 400);
        for (const q of quests) if (!(await questExists(store, q))) return json({ error: `Unknown quest: ${q}` }, 400);
        await store.assign(emails.flatMap(email => quests.map(quest => ({ email, quest, week, by: v.name, note }))));
        break;
      }
      case "unassign":
        await store.unassign(normEmail(String(body.email)), String(body.quest ?? ""));
        break;
      case "review":
        await store.review(normEmail(String(body.email)), String(body.quest ?? ""), v.name, body.ok === true, note);
        break;
      case "flags":
        await store.saveSettings({ flags: readFlags({ ...settings.flags, ...(body.flags as object) }) });
        break;
      case "admins": {
        const list = (Array.isArray(body.admins) ? body.admins : []).map(e => normEmail(String(e))).filter(e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
        await store.saveSettings({ admins: [...new Set(list)].filter(e => !fixedAdmins().includes(e)).slice(0, 20) });
        break;
      }
      case "saveQuest": {
        const q = draftToQuest(body.quest as QuestDraft);
        if (typeof q === "string") return json({ error: q }, 400);
        await store.saveQuest(q, v.name);
        break;
      }
      case "archiveQuest":
        await store.archiveQuest(String(body.id ?? ""), body.archived !== false);
        break;
      case "addStudents": {
        const team = TEAM_IDS.includes(body.team as TeamId) ? (body.team as TeamId) : null;
        const rows = (Array.isArray(body.students) ? body.students : [])
          .slice(0, 300)
          .map(r => ({ email: normEmail(String((r as { email?: unknown }).email ?? "")), name: (r as { name?: unknown }).name }))
          .filter(r => isSchoolEmail(r.email) && !isAdmin(r.email, settings.admins))
          .map(r => ({ email: r.email, name: shortName(typeof r.name === "string" ? r.name : null, r.email), team }));
        if (!rows.length) return json({ error: "Paste at least one school email address." }, 400);
        const fresh = await store.addStudents(rows);
        if (body.starter !== false) await giveStarter(store, settings, fresh, v.name);
        break;
      }
      case "moveStudents": {
        const team = body.team === null ? null : TEAM_IDS.includes(body.team as TeamId) ? (body.team as TeamId) : undefined;
        if (team === undefined) return json({ error: "Pick a team" }, 400);
        await store.updateStudents(emailList(body.emails), { team });
        break;
      }
      case "listStudents":
        await store.updateStudents(emailList(body.emails), { listed: true });
        break;
      case "removeStudents":
        await store.removeStudents(emailList(body.emails));
        break;
      case "starter": {
        const ids = [...new Set((Array.isArray(body.quests) ? body.quests : []).map(String))].slice(0, 8);
        for (const id of ids) if (!(await questExists(store, id))) return json({ error: `Unknown quest: ${id}` }, 400);
        await store.saveSettings({ starter: ids });
        break;
      }
      default:
        return json({ error: "Unknown action" }, 400);
    }
    return json(await snapshot(store, await loadSettings(store)));
  } catch (e) {
    console.error("coach write failed", e);
    return json({ error: "Couldn’t save. Try again." }, 503);
  }
}
