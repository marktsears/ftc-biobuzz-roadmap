import type { Metadata } from "next";
import { QuestBoard } from "@/components/QuestBoard";

export const metadata: Metadata = { title: "Quest board" };

export default function QuestsPage() {
  return <QuestBoard />;
}
