"use client";

import Link from "next/link";
import { useApp } from "./AppProvider";
import { KIND_ICON } from "./kindIcon";
import { Icon } from "./ui";
import { QUIZ_CHECKER } from "@/lib/coach";
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

export function statusText(w: Work | undefined, short?: boolean): string {
  const s = statusOf(w);
  if (s === "checked" && w?.checkedBy === QUIZ_CHECKER) return "Passed";
  if (short && s === "done") return "Done";
  return STATUS_LABEL[s];
}

export function StatusPill({ w, short }: { w?: Work; short?: boolean }) {
  const s = statusOf(w);
  return (
    <span className={`spill s-${s}`}>
      {(s === "checked" || s === "done") && <Icon name="check" size={13} />}
      {statusText(w, short)}
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

/** One ladder: how far you've climbed and the next rung. Coaches get the full order, with no personal progress. */
export function LadderCard({ l, coach, done: doneIn, as }: { l: Ladder; coach?: boolean; done?: Set<string>; as?: string | null }) {
  const { mine, questById } = useApp();
  const href = (id: string) => (as ? `/quests/${id}?as=${encodeURIComponent(as)}` : `/quests/${id}`);
  if (coach) {
    return (
      <section className="skill-ladder" style={{ ["--tc" as string]: `var(--t-${l.track})` } as React.CSSProperties}>
        <div className="ld-head">
          <div>
            <div className="ld-track">{TRACKS[l.track].short}</div>
            <h3>{l.name}</h3>
          </div>
          <span className="ld-count">{l.steps.length} steps</span>
        </div>
        <ol className="ld-steps">
          {l.steps.map((id, i) => {
            const q = questById(id);
            return (
              <li key={id}>
                <Link href={href(id)}>
                  <span className="n">{i + 1}</span>
                  <span>{q?.title ?? id}</span>
                  {q && <small>{q.mins} min</small>}
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    );
  }
  const done = doneIn ?? doneSet(mine.work);
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
        <Link className="ld-next" href={href(nq.id)}>
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
