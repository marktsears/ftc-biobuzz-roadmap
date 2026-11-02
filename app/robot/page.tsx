import type { Metadata } from "next";
import { RobotView } from "@/components/RobotView";
import { Feature } from "@/components/Feature";

export const metadata: Metadata = { title: "The robot" };

export default function RobotPage() {
  return (
    <Feature flag="robot">
      <RobotView />
    </Feature>
  );
}
