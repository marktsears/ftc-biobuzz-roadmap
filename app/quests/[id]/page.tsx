import { Suspense } from "react";
import { QuestDetail } from "@/components/QuestDetail";
import { CustomQuest } from "@/components/CustomQuest";
import { QUESTS, QUEST_BY_ID } from "@/lib/data/quests";

/** Built-in quests are prebuilt; the ones the coach writes load in the browser. */
export const dynamicParams = true;

export function generateStaticParams() {
  return QUESTS.map(q => ({ id: q.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: QUEST_BY_ID[id]?.title ?? "Quest" };
}

export default async function QuestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = QUEST_BY_ID[id];
  if (!q) return <CustomQuest id={id} />;
  return (
    <Suspense>
      <QuestDetail q={q} />
    </Suspense>
  );
}
