/* ============================================================
   QUESTS: "Not sure what to do? Bored?"
   Small, finishable challenges that keep every student learning and moving the team forward.

   The quests live in lib/data/quest-sets/, one file per area.
   Types, the resource list and the link helpers live in quest-kit.ts.
   Read the "How to write a good quest" note at the top of quest-kit.ts before adding one.
   Quest ids are stored with people’s progress: never rename one.
   ============================================================ */
import { BUILD } from "./quest-sets/build";
import { CODE } from "./quest-sets/code";
import { DESIGN } from "./quest-sets/design";
import { DRIVE } from "./quest-sets/drive";
import { OUTREACH } from "./quest-sets/outreach";
import { QUIZZES } from "./quest-sets/quizzes";
import type { Quest } from "./quest-kit";

export { KIND_LABEL, LEVEL_LABEL, LEVEL_XP, questXp } from "./quest-kit";
export type { Quest, QuestKind, QuestLevel, QuizQ, Resource, Step } from "./quest-kit";

export const QUESTS: Quest[] = [...DESIGN, ...CODE, ...DRIVE, ...BUILD, ...OUTREACH, ...QUIZZES];

export const QUEST_BY_ID: Record<string, Quest> = Object.fromEntries(QUESTS.map(q => [q.id, q]));
