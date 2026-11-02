import Link from "next/link";
import type { ReactNode } from "react";

/* A tiny, safe renderer for quest text: [label](url), **bold** and `code`.
   Addresses that start with "/" are pages in this app; everything else opens in a new tab.
   It builds React nodes, never raw HTML. */
const TOKEN = /(\[[^\]]+\]\([^)\s]+\)|\*\*[^*]+\*\*|`[^`]+`)/g;
const LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/;

export function RichText({ text }: { text: string }) {
  const parts = text.split(TOKEN);
  const out: ReactNode[] = parts.map((p, i) => {
    const m = LINK.exec(p);
    if (m) {
      const [, label, url] = m;
      if (url.startsWith("/")) {
        return (
          <Link key={i} href={url} className="rich-link">
            {label}
          </Link>
        );
      }
      return (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="rich-link">
          {label}
        </a>
      );
    }
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) return <b key={i}>{p.slice(2, -2)}</b>;
    if (p.startsWith("`") && p.endsWith("`") && p.length > 2) return <code key={i}>{p.slice(1, -1)}</code>;
    return p;
  });
  return <>{out}</>;
}
