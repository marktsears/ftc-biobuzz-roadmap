import type { Metadata } from "next";
import { Suspense } from "react";
import { CoachView } from "@/components/CoachView";

export const metadata: Metadata = { title: "Coach", robots: { index: false } };

export default function CoachPage() {
  return (
    <Suspense>
      <CoachView />
    </Suspense>
  );
}
