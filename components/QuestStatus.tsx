"use client";

import Link from "next/link";
import { useApp } from "./AppProvider";
import { KIND_ICON } from "./kindIcon";
import { Icon } from "./ui";
import { LADDERS, nextRung, type Ladder } from "@/lib/data/ladders";
import { KIND_LABEL } from "@/lib/data/quests";
import { TRACKS } from "@/lib/data/core";
import type { Focus, Work } from "@/lib/types";

export type StatusKey = "none" | "doing" | "stuck" | "done" | "checked";

export function statusOf(w?: Work): StatusKey {
  if (!w) return "none";
  if (w.status === "done") return w.checkedBy ? "checked" : "done";
  return w.status;
}

export const STATUS_LABEL: Record<StatusKey, string> = {
  none: "Not started",
  doing: "Working on it",
  stuck: "Stuck",
  done: "Done · waiting for a check",
  checked: "Checked",
};

export function StatusPill({ w, short }: { w?: Work; short?: boolean }) {
  const s = statusOf(w);
  return (
    <span className={`spill s-${s}`}>
      {(s === "checked" || s === "done") && <Icon name="check" size={13} />}
      {short && s === "done" ? "Done" : STATUS_LABEL[s]}
    </span>
  );
}

/** Quests you've finished (checked or not). */
export const doneSet = (work: Record<string, Work>) => new Set(Object.values(work).filter(w => w.status === "done").map(w => w.quest));

/** Ladders, the ones that match your focus first. */
export function laddersFor(focus: Focus): Ladder[] {
  if (focus === "all") return LADDERS;
  return [...LADDERS].sort((a, b) => Number(b.track === focus) - Number(a.track === focus));
}

/** One ladder: how far you've climbed and the next rung. */
export function LadderCard({ l }: { l: Ladder }) {
  const { mine, questById } = useApp();
  const done = doneSet(mine.work);
  const next = nextRung(l, done);
  const nq = next ? questById(next) : undefined;
  const n = l.steps.filter(id => done.has(id)).length;
  return (
    <section className="skill-ladder" style={{ ["--tc" as string]: `var(--t-${l.track})` } as React.CSSProperties}>
      <div className="ld-head">
        <div>
          <div className="ld-track">{TRACKS[l.track].short}</div>
          <h3>{l.name}</h3>
        </div>
        <span className="ld-count">
          {n} of {l.steps.length}
        </span>
      </div>
      <ol className="ld-rungs" aria-hidden="true">
        {l.steps.map(id => (
          <li key={id} className={done.has(id) ? "on" : id === next ? "next" : ""} title={questById(id)?.title} />
        ))}
      </ol>
      {nq ? (
        <Link className="ld-next" href={`/quests/${nq.id}`}>
          <span className="qc-ico">
            <Icon name={KIND_ICON[nq.kind]} size={18} />
          </span>
          <span>
            <small>Next step</small>
            <b>{nq.title}</b>
            <small>
              {KIND_LABEL[nq.kind]} · {nq.mins} min
            </small>
          </span>
          <Icon name="arrow" size={16} />
        </Link>
      ) : (
        <p className="ld-done">
          <Icon name="check" size={16} /> All done. Ask your coach what’s next.
        </p>
      )}
    </section>
  );
}
