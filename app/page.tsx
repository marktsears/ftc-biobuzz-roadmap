import { Suspense } from "react";
import { HomeView } from "@/components/HomeView";

export default function Home() {
  return (
    <Suspense>
      <HomeView />
    </Suspense>
  );
}
