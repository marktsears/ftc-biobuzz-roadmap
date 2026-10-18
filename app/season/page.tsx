import type { Metadata } from "next";
import { SeasonView } from "@/components/SeasonView";

export const metadata: Metadata = { title: "The season" };

export default function SeasonPage() {
  return <SeasonView />;
}
