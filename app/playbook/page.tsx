import type { Metadata } from "next";
import { PlaybookView } from "@/components/PlaybookView";
import { Feature } from "@/components/Feature";

export const metadata: Metadata = { title: "Playbook" };

export default function PlaybookPage() {
  return (
    <Feature flag="playbook">
      <PlaybookView />
    </Feature>
  );
}
