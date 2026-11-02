import { isTrinityAccount, normEmail } from "./identity";
import { NAME_MAX, normName } from "./xp";

export interface PastedStudent {
  email: string;
  /** from the paste, if there was one next to the address */
  name: string | null;
}

const EMAIL = /[A-Z0-9._%+'-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)+/gi;

/** "Torres, Maya" → "Maya Torres"; strips quotes, brackets, "To:" and list separators. */
function cleanName(raw: string): string | null {
  let s = raw
    .replace(/^\s*(to|cc|bcc)\s*:/i, "")
    .replace(/[<>()[\]"“”]/g, " ")
    .replace(/^[\s,;|\t]+|[\s,;|\t]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const lastFirst = /^([^,]+),\s*([^,]+)$/.exec(s);
  if (lastFirst) s = `${lastFirst[2]} ${lastFirst[1]}`;
  if (s.includes(",") || s.includes(";")) return null;
  if (!/\p{L}/u.test(s) || s.length > 60) return null;
  return s;
}

/**
 * Every address in whatever the coach pasted: a spreadsheet column, an email's To: line, or one per line.
 * A name right before the address (or right after it on the same line, as in "email, name" sheets) is kept.
 */
export function parsePaste(text: string): PastedStudent[] {
  const out = new Map<string, PastedStudent>();
  for (const line of text.split(/\r?\n/)) {
    const hits = [...line.matchAll(EMAIL)];
    hits.forEach((m, i) => {
      const start = m.index ?? 0;
      const before = line.slice(i === 0 ? 0 : (hits[i - 1].index ?? 0) + hits[i - 1][0].length, start);
      const after = hits.length === 1 ? line.slice(start + m[0].length) : "";
      const email = normEmail(m[0]);
      const name = cleanName(before) ?? cleanName(after);
      const was = out.get(email);
      if (!was || (!was.name && name)) out.set(email, { email, name });
    });
  }
  return [...out.values()];
}

/** Only school Google accounts can sign in as students. */
export const isSchoolEmail = (email: string) => isTrinityAccount(email);

/** "Maya Torres" → "Maya T", the way Google names show on the site. Falls back to the part before the @. */
export function shortName(full: string | null, email: string): string {
  const words = (full || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return email.split("@")[0].slice(0, NAME_MAX);
  return normName(words.length >= 2 ? `${words[0]} ${words[words.length - 1][0]}` : words[0]).slice(0, NAME_MAX);
}
