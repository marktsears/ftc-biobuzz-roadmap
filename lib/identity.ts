/** Trinity School Google Workspace. Students and staff use @tsdch.org. */
export const ALLOWED_DOMAIN = (process.env.AUTH_ALLOWED_DOMAIN || "tsdch.org").trim().toLowerCase();

export function isTrinityAccount(email?: string | null, hd?: string | null): boolean {
  const root = ALLOWED_DOMAIN;
  const domain = email?.split("@")[1]?.toLowerCase();
  if (domain && (domain === root || domain.endsWith("." + root))) return true;
  return !!hd && hd.toLowerCase() === root;
}

/** "Maya Sears" → "Maya S", short enough for the crew list. */
export function displayNameFromGoogle(profile: { name?: string | null; given_name?: string; family_name?: string; email?: string | null }): string {
  const given = profile.given_name?.trim();
  const family = profile.family_name?.trim();
  if (given && family) return `${given} ${family[0]}`;
  if (profile.name?.trim()) return profile.name.trim();
  return profile.email?.split("@")[0] || "Student";
}
