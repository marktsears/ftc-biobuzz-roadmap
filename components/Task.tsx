"use client";

import { useApp } from "./AppProvider";
import { Avatar, Icon } from "./ui";
import { TRACKS } from "@/lib/data/core";
import { ago } from "@/lib/time";
import { isTaskKind } from "@/lib/weeks";
import { kindXp, nameKey } from "@/lib/xp";
import type { Item } from "@/lib/types";

/** One tickable line. Shows who ticked it and who grabbed it. */
export function Task({ it, showTrack, weekLabel, claimable = true }: { it: Item; showTrack?: boolean; weekLabel?: string; claimable?: boolean }) {
  const { state, tick, claim, person } = useApp();
  const rec = state.checks[it.id];
  const on = !!rec;
  const claimers = state.claims[it.id] || [];
  const mine = !!person && claimers.some(n => nameKey(n) === nameKey(person));
  const canClaim = claimable && isTaskKind(it.kind);
  const xp = kindXp(it.kind);

  return (
    <div className={`task ${on ? "done" : ""} ${mine ? "mine" : ""}`} style={{ ["--tc" as string]: `var(--t-${it.tr})` } as React.CSSProperties}>
      <label className="task-main">
        <input type="checkbox" checked={on} onChange={e => tick(it.id, e.target.checked)} />
        <span className="box" aria-hidden="true">
          <Icon name="check" size={16} />
        </span>
        <span className="task-body">
          {showTrack && <span className="trtag">{TRACKS[it.tr].short}</span>}
          <span className="task-text">{it.t}</span>
          {it.tm && <em className="tt">{it.tm} only</em>}
          {weekLabel && <span className="wkl">{weekLabel}</span>}
          {on && rec && (
            <span className="by">
              Done by {rec.by} · {ago(rec.at)}
            </span>
          )}
        </span>
      </label>
      <div className="task-side">
        {!on && xp >= 25 && <span className="xpchip">+{xp}</span>}
        {claimers.length > 0 && (
          <span className="claimers" aria-label={`Grabbed by ${claimers.join(", ")}`}>
            {claimers.slice(0, 3).map(n => (
              <Avatar key={n} name={n} size={24} title={`${n} grabbed this`} />
            ))}
            {claimers.length > 3 && <span className="more">+{claimers.length - 3}</span>}
          </span>
        )}
        {canClaim && !on && (
          <button type="button" className={`grab ${mine ? "on" : ""}`} onClick={() => claim(it.id, !mine)} aria-pressed={mine} title={mine ? "Let it go" : "Grab this task"}>
            <Icon name="hand" size={16} />
            <span>{mine ? "Mine" : "Grab"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
