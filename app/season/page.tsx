import type { Metadata } from "next";
import { SeasonView } from "@/components/SeasonView";
import { Feature } from "@/components/Feature";

export const metadata: Metadata = { title: "The season" };

export default function SeasonPage() {
  return (
    <Feature flag="season">
      <SeasonView />
    </Feature>
  );
}
