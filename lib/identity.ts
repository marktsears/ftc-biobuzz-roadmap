/** Trinity School Google Workspace. Students and staff use @tsdch.org. */
export const ALLOWED_DOMAIN = (process.env.AUTH_ALLOWED_DOMAIN || "tsdch.org").trim().toLowerCase();

/** Personal accounts that may sign in besides the school domain. AUTH_ALLOWED_EMAILS adds more, comma-separated. */
const EXTRA_EMAILS = ["msears@gmail.com"];

export function allowedEmails(): Set<string> {
  const fromEnv = (process.env.AUTH_ALLOWED_EMAILS || "")
    .split(/[,;\s]+/)
    .map(s => s.trim().toLowerCase())
    .filter(s => s.includes("@"));
  return new Set([...EXTRA_EMAILS, ...fromEnv]);
}

export function isTrinityAccount(email?: string | null, hd?: string | null): boolean {
  const root = ALLOWED_DOMAIN;
  const domain = email?.split("@")[1]?.toLowerCase();
  if (domain && (domain === root || domain.endsWith("." + root))) return true;
  return !!hd && hd.toLowerCase() === root;
}

/** School domain, or an address on the extra allowlist. */
export function isAllowedAccount(email?: string | null, hd?: string | null): boolean {
  const normalized = email?.trim().toLowerCase();
  if (normalized && allowedEmails().has(normalized)) return true;
  return isTrinityAccount(email, hd);
}

/** "Maya Sears" → "Maya S", short enough for the crew list. */
export function displayNameFromGoogle(profile: { name?: string | null; given_name?: string; family_name?: string; email?: string | null }): string {
  const given = profile.given_name?.trim();
  const family = profile.family_name?.trim();
  if (given && family) return `${given} ${family[0]}`;
  if (profile.name?.trim()) return profile.name.trim();
  return profile.email?.split("@")[0] || "Student";
}
