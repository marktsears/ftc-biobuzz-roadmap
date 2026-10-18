"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "./AppProvider";
import { Task } from "./Task";
import { Bar, Pill } from "./ui";
import { TRACKS } from "@/lib/data/core";
import { carryOver, daysTo, gateTally, isOn, nextGate, railsStatus, vis, weekPast } from "@/lib/progress";
import { fmt, fmtLong, plural, pd } from "@/lib/time";
import { PRE_ITEMS } from "@/lib/weeks";

export function RailsCard() {
  const { weeks, clock, state, focus } = useApp();
  const [whole, setWhole] = useState(false);
  const scope = focus === "all" || whole ? "all" : focus;
  const carry = carryOver(weeks, state.checks, scope, clock);
  const status = railsStatus(carry, clock);
  const ng = nextGate(weeks, clock);

  let title = "On the rails";
  let msg = "Nothing carried over from earlier weeks. Keep ticking this week’s demos.";
  if (status === "pre") {
    title = "Ready to start";
    msg = `Week 1 begins Monday ${fmt(clock.first)}. These take about ten minutes and make Monday’s kickoff easy.`;
  } else if (status === "drift") {
    title = "Drifting";
    msg = `${plural(carry.length, "item")} from earlier weeks ${carry.length === 1 ? "isn’t" : "aren’t"} ticked. Clear ${carry.length === 1 ? "it" : "them"} before starting new work.`;
  } else if (status === "off") {
    title = "Off the rails";
    msg = `${plural(carry.length, "item")} overdue, going back to Week ${carry[0].w.n}. Say so on Monday, then work the catch-up ladder.`;
  }

  const shown = carry.slice(0, 6);
  return (
    <section className={`card rails ${status}`} aria-labelledby="rails-h">
      <div className="rails-head">
        <span className="dot" aria-hidden="true" />
        <h2 id="rails-h">{title}</h2>
        <span className="tag">Rails check{scope !== "all" ? ` · ${TRACKS[scope].short}` : ""}</span>
      </div>
      <p className="note">{msg}</p>

      {status === "pre" && (
        <div className="carry">
          {PRE_ITEMS.filter(it => vis(it, scope)).map(it => (
            <Task key={it.id} it={it} showTrack />
          ))}
        </div>
      )}
      {status !== "pre" && carry.length > 0 && (
        <div className="carry">
          {shown.map(c => (
            <div key={c.it.id}>
              <Task it={c.it} showTrack weekLabel={`Week ${c.w.n}${c.label === "gate" ? " gate" : " demo"}`} />
            </div>
          ))}
          {carry.length > shown.length && <p className="note">…and {carry.length - shown.length} more. Open the older weeks from the tracker.</p>}
        </div>
      )}

      {focus !== "all" && status !== "pre" && (
        <button type="button" className="link-btn" onClick={() => setWhole(w => !w)}>
          {whole ? `Show only ${TRACKS[focus].short}` : "Show the whole team"}
        </button>
      )}

      {ng && <NextGate week={ng.n} />}

      <details className="ladder">
        <summary>The catch-up ladder</summary>
        <ol>
          <li>
            <b>Carry-over first.</b> Unticked demos come before new work, unless the week page says they can be cut.
          </li>
          <li>
            <b>Cut from “If you’re behind”.</b> Every week names what to drop and what never to drop.
          </li>
          <li>
            <b>Borrow people.</b> Builders can run drive tests, coders can wire, drivers can build the practice field.
          </li>
          <li>
            <b>Protect three things:</b> drivers’ time on the robot, the next gate, and a release that installs offline.
          </li>
        </ol>
      </details>
    </section>
  );
}

function NextGate({ week }: { week: number }) {
  const { weeks, clock, state, focus } = useApp();
  const w = weeks[week - 1];
  if (!w.gate) return null;
  const [gd, gt] = gateTally(w, state.checks, focus);
  if (!gt) return null;
  const dd = daysTo(pd(w.gate.due), clock);
  return (
    <div className="nextgate">
      <div className="ngr">
        <b>Next gate: {w.gate.name}</b>
        <span className="mono">
          {fmtLong(pd(w.gate.due))} · {dd > 0 ? plural(dd, "day") : dd === 0 ? "today" : "overdue"}
        </span>
      </div>
      <Bar pct={(100 * gd) / gt} className="gold" />
      <div className="ngr">
        <span>
          {gd} of {gt} ready
        </span>
        <Link className="btn sm" href={`/week/${w.n}?tab=gate`}>
          Open the gate →
        </Link>
      </div>
    </div>
  );
}

export function HeadsUp() {
  const { weeks, clock, state, focus } = useApp();
  const lo = clock.before ? 1 : clock.now;
  const hi = lo + 2;
  const rows: { n: number; it: (typeof weeks)[number]["heads"][number]; over: boolean }[] = [];
  for (const w of weeks)
    for (const it of w.heads.filter(i => vis(i, focus))) {
      const over = weekPast(w, clock) && !isOn(state.checks, it.id);
      if (over || (w.n >= lo && w.n <= hi)) rows.push({ n: w.n, it, over });
    }
  rows.sort((a, b) => Number(b.over) - Number(a.over) || a.n - b.n);
  const open = rows.filter(r => !isOn(state.checks, r.it.id)).length;
  return (
    <section className="card heads" aria-labelledby="heads-h">
      <h3 id="heads-h">
        Heads-up: don’t forget <Pill tone={open ? undefined : "full"}>{open ? `${open} open` : "all clear"}</Pill>
      </h3>
      <p className="note">Things with lead time: orders, registrations, deadlines, logistics. Showing this week and the next two.</p>
      <div className="hl">
        {rows.length ? (
          rows.map(r => <Task key={r.it.id} it={r.it} showTrack claimable={false} weekLabel={r.over ? `Week ${r.n} · overdue` : `Week ${r.n}`} />)
        ) : (
          <p className="empty">Nothing with lead time in the next three weeks.</p>
        )}
      </div>
    </section>
  );
}
