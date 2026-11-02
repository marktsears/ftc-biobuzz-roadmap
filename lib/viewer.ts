import "server-only";
import { auth } from "@/auth";
import { QUEST_BY_ID } from "./data/quests";
import { DEFAULT_FLAGS } from "./flags";
import { isAdmin, isAllowedAccount, normEmail } from "./identity";
import type { Store } from "./store/types";
import type { Settings } from "./types";
import { NAME_MAX, normName } from "./xp";

export interface Viewer {
  email: string;
  name: string;
  admin: boolean;
}

export async function loadSettings(store: Store | null): Promise<Settings> {
  return store ? store.settings() : { flags: { ...DEFAULT_FLAGS }, admins: [] };
}

/** Who's asking, from the Google session. Null if they aren't signed in with an allowed account. */
export async function getViewer(settings: Settings): Promise<Viewer | null> {
  const session = await auth();
  const email = normEmail(session?.user?.email);
  if (!session?.user || !email || !isAllowedAccount(email)) return null;
  const name = normName(session.user.name || "");
  if (!name || name.length > NAME_MAX) return null;
  return { email, name, admin: isAdmin(email, settings.admins) };
}

/** A built-in quest, or one the coach wrote and hasn't archived. */
export async function questExists(store: Store, id: string): Promise<boolean> {
  if (QUEST_BY_ID[id]) return true;
  return (await store.customQuests()).some(c => c.quest.id === id && !c.archived);
}
