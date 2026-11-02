"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useApp } from "./AppProvider";
import { FLAG_INFO } from "@/lib/flags";
import type { FlagKey } from "@/lib/types";

/** Shows a page only if its Labs switch is on. Admins can still look, with a note that students can't. */
export function Feature({ flag, children }: { flag: FlagKey; children: ReactNode }) {
  const { flags, admin, mineReady } = useApp();
  const name = FLAG_INFO.find(f => f.key === flag)?.name ?? "This page";
  if (flags[flag]) return <>{children}</>;
  if (!mineReady) return null;
  if (admin)
    return (
      <>
        <div className="labs-bar" role="status">
          <div className="wrap">
            <span>
              <b>{name}</b> is off for students.
            </span>
            <Link href="/?tab=labs">Labs</Link>
          </div>
        </div>
        {children}
      </>
    );
  return (
    <div className="wrap stack-lg">
      <section className="card off-card">
        <h1>{name} is switched off for now</h1>
        <p className="muted">Your quests are on Home.</p>
        <Link className="btn" href="/">
          Go to Home
        </Link>
      </section>
    </div>
  );
}
