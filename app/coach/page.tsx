import { redirect } from "next/navigation";

/** The class lives on Home for coaches. Old links land there. */
export default async function CoachPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  redirect(tab === "bank" || tab === "labs" ? `/?tab=${tab}` : "/");
}
