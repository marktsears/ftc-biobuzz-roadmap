import type { IconName } from "./ui";
import type { QuestKind } from "@/lib/data/quests";

export const KIND_ICON: Record<QuestKind, IconName> = { watch: "play", code: "code", design: "design", build: "build", plan: "plan", quiz: "quiz" };
