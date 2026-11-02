import { KIND_LABEL, QUEST_BY_ID, type Quest, type QuestKind, type QuestLevel, type Resource } from "./data/quests";
import type { TrackCode } from "./types";

export const CUSTOM_TRACKS: TrackCode[] = ["B", "S", "D", "O"];

/** What the coach types into the "New quest" form. */
export interface QuestDraft {
  id?: string;
  title: string;
  kind: QuestKind;
  track: TrackCode;
  level: QuestLevel;
  mins: number;
  blurb: string;
  why: string;
  /** one step per line */
  steps: string;
  /** one link per line: "Label | https://…" or just the URL */
  links: string;
  proof: string;
  helpsTeam: boolean;
}

export const EMPTY_DRAFT: QuestDraft = { title: "", kind: "build", track: "B", level: 1, mins: 20, blurb: "", why: "", steps: "", links: "", proof: "", helpsTeam: false };

const cut = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);
const lines = (s: string) =>
  s
    .split(/\r?\n/)
    .map(l => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);

function parseLinks(s: string): Resource[] | string {
  const out: Resource[] = [];
  for (const line of lines(s)) {
    const [a, b] = line.includes("|") ? line.split("|").map(x => x.trim()) : ["", line];
    const url = b || a;
    try {
      const u = new URL(url);
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
    } catch {
      return `“${line}” isn’t a web link. Put one link per line, like: Onshape basics | https://…`;
    }
    out.push({ label: cut(b ? a : "", 90) || new URL(url).hostname.replace(/^www\./, ""), url: url.slice(0, 500) });
  }
  return out.slice(0, 6);
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

/** Turn a draft into a quest, or explain what's missing. */
export function draftToQuest(d: QuestDraft, rand = Math.random): Quest | string {
  const title = cut(d.title, 90);
  if (!title) return "Give the quest a title.";
  if (!(d.kind in KIND_LABEL)) return "Pick what kind of quest it is.";
  if (!CUSTOM_TRACKS.includes(d.track)) return "Pick who it’s for.";
  const level = Number(d.level) as QuestLevel;
  if (![1, 2, 3].includes(level)) return "Pick a level.";
  const mins = Math.round(Number(d.mins));
  if (!Number.isFinite(mins) || mins < 5 || mins > 240) return "Time should be between 5 and 240 minutes.";
  const steps = lines(d.steps).map(l => l.slice(0, 300)).slice(0, 10);
  if (!steps.length) return "Add at least one step.";
  const resources = parseLinks(d.links || "");
  if (typeof resources === "string") return resources;
  const id = d.id && d.id.startsWith("c-") ? d.id.slice(0, 48) : `c-${slug(title) || "quest"}-${Math.floor(rand() * 36 ** 4).toString(36)}`;
  if (QUEST_BY_ID[id]) return "That id is taken.";
  return {
    id,
    title,
    kind: d.kind,
    track: d.track,
    level,
    mins,
    blurb: cut(d.blurb, 240) || cut(steps[0], 240),
    why: cut(d.why, 300),
    steps,
    resources,
    proof: cut(d.proof, 240) || "Show your coach what you made.",
    helpsTeam: !!d.helpsTeam || undefined,
  };
}

export function questToDraft(q: Quest): QuestDraft {
  return {
    id: q.id,
    title: q.title,
    kind: q.kind,
    track: q.track,
    level: q.level,
    mins: q.mins,
    blurb: q.blurb,
    why: q.why,
    steps: q.steps.join("\n"),
    links: q.resources.map(r => `${r.label} | ${r.url}`).join("\n"),
    proof: q.proof,
    helpsTeam: !!q.helpsTeam,
  };
}

/** Re-check a quest that came back from the database or the browser. */
export function cleanQuest(v: unknown): Quest | null {
  if (!v || typeof v !== "object") return null;
  const q = v as Quest;
  const r = draftToQuest({ ...questToDraft({ ...q, steps: Array.isArray(q.steps) ? q.steps : [], resources: Array.isArray(q.resources) ? q.resources : [] }), id: q.id });
  return typeof r === "string" ? null : r;
}
