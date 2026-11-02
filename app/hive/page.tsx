import type { Metadata } from "next";
import { HiveView } from "@/components/HiveView";
import { Feature } from "@/components/Feature";

export const metadata: Metadata = { title: "The Hive" };

export default function HivePage() {
  return (
    <Feature flag="hive">
      <HiveView />
    </Feature>
  );
}
