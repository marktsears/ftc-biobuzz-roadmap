"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "./AppProvider";
import type { Assignment, CoachState, Student, Work } from "@/lib/types";

/** A coach opened `?as=student@school`. Students ignore the parameter. */
export function usePreviewEmail(): string | null {
  const params = useSearchParams();
  const { admin } = useApp();
  const as = params.get("as")?.trim().toLowerCase() || "";
  return admin && as.includes("@") ? as : null;
}

export function questHref(id: string, as?: string | null) {
  return as ? `/quests/${id}?as=${encodeURIComponent(as)}` : `/quests/${id}`;
}

/** The class row, assignments, and progress for the student in `?as=`. */
export function usePreviewStudent() {
  const email = usePreviewEmail();
  const [data, setData] = useState<CoachState | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!email) return;
    let cancel = false;
    setData(null);
    setFailed(false);
    fetch("/api/coach", { cache: "no-store" })
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Couldn’t load");
        return d as CoachState;
      })
      .then(d => {
        if (!cancel) setData(d);
      })
      .catch(() => {
        if (!cancel) setFailed(true);
      });
    return () => {
      cancel = true;
    };
  }, [email]);

  return useMemo(() => {
    if (!email) return { email: null as string | null, student: null as Student | null, assignments: [] as Assignment[], work: {} as Record<string, Work>, loading: false, missing: false };
    const student = data?.students.find(s => s.email === email) ?? null;
    const assignments = (data?.assignments ?? []).filter(a => a.email === email).map(({ email: _e, ...a }) => a);
    const work: Record<string, Work> = {};
    for (const row of data?.work ?? []) {
      if (row.email !== email) continue;
      const { email: _e, ...w } = row;
      work[w.quest] = w;
    }
    return { email, student, assignments, work, loading: !data && !failed, missing: !!data && !student };
  }, [email, data, failed]);
}

export function PreviewBar({ name }: { name?: string }) {
  return (
    <div className="preview-bar">
      <p>{name ? <>Looking at <b>{name}</b>’s screen. Nothing you do here is saved.</> : "Loading their screen…"}</p>
      <Link href="/">Back to class</Link>
    </div>
  );
}
