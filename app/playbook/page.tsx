import type { Metadata } from "next";
import { PlaybookView } from "@/components/PlaybookView";

export const metadata: Metadata = { title: "Playbook" };

export default function PlaybookPage() {
  return <PlaybookView />;
}
