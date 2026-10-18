import { notFound } from "next/navigation";
import { QuestDetail } from "@/components/QuestDetail";
import { QUESTS, QUEST_BY_ID } from "@/lib/data/quests";

export const dynamicParams = false;

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
  if (!q) notFound();
  return <QuestDetail q={q} />;
}
