import "server-only";
import { fileStore } from "./file";
import { pgStore } from "./pg";
import type { Store } from "./types";

let cached: Store | null | undefined;

/**
 * Pick the storage:
 *  - DATABASE_URL (Neon, added from Vercel Storage) → Postgres (production)
 *  - otherwise, in `next dev` only → a JSON file in .data/
 *  - otherwise null → the app falls back to "local mode" (each browser keeps its own progress)
 */
export function getStore(): Store | null {
  if (cached !== undefined) return cached;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) cached = pgStore(url);
  else if (process.env.NODE_ENV !== "production") cached = fileStore();
  else cached = null;
  return cached;
}

export const teamCode = () => (process.env.TEAM_CODE || "").trim();
