import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Hit once a day by Vercel Cron (see vercel.json) so a free Supabase project never goes idle and pauses. */
export async function GET() {
  const store = getStore();
  if (!store) return NextResponse.json({ ok: true, storage: "none" });
  try {
    await store.ping();
    return NextResponse.json({ ok: true, storage: store.mode });
  } catch (e) {
    console.error("health check failed", e);
    return NextResponse.json({ ok: false, storage: store.mode }, { status: 503 });
  }
}
