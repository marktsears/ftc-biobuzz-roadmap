import "server-only";
import { fileStore } from "./file";
import { supabaseStore } from "./supabase";
import type { Store } from "./types";

let cached: Store | null | undefined;

/**
 * Pick the storage:
 *  - SUPABASE_URL + a service key → Supabase (production)
 *  - otherwise, in `next dev` only → a JSON file in .data/
 *  - otherwise null → the app falls back to "local mode" (each browser keeps its own progress)
 */
export function getStore(): Store | null {
  if (cached !== undefined) return cached;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (url && key) cached = supabaseStore(url, key);
  else if (process.env.NODE_ENV !== "production") cached = fileStore();
  else cached = null;
  return cached;
}

export const teamCode = () => (process.env.TEAM_CODE || "").trim();
