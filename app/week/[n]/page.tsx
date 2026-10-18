import { Suspense } from "react";
import { notFound } from "next/navigation";
import { WeekView } from "@/components/WeekView";
import { RAW_WEEKS } from "@/lib/data/weeks";

export const dynamicParams = false;

export function generateStaticParams() {
  return RAW_WEEKS.map(w => ({ n: String(w.n) }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const w = RAW_WEEKS.find(x => x.n === Number(n));
  return { title: w ? `Week ${w.n}: ${w.title}` : "Week" };
}

export default async function WeekPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const num = Number(n);
  if (!RAW_WEEKS.some(w => w.n === num)) notFound();
  return (
    <Suspense fallback={null}>
      <WeekView n={num} />
    </Suspense>
  );
}
