import type { Metadata } from "next";
import { RobotView } from "@/components/RobotView";

export const metadata: Metadata = { title: "The robot" };

export default function RobotPage() {
  return <RobotView />;
}
