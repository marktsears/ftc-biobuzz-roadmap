import type { Metadata } from "next";
import { HiveView } from "@/components/HiveView";

export const metadata: Metadata = { title: "The Hive" };

export default function HivePage() {
  return <HiveView />;
}
