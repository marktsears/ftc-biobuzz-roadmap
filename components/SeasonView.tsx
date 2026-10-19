"use client";

import Link from "next/link";
import { useApp } from "./AppProvider";
import { Tracker } from "./Tracker";
import { Bar, Pill, Ring, Shapes } from "./ui";
import { daysTo, demoTally, gateTally, weekFull, weekLate, weekTally } from "@/lib/progress";
import { fmt, fmtLong, pd } from "@/lib/time";
import { MILESTONES, PHASES, wEnd, wStart } from "@/lib/weeks";

export function SeasonView() {
  const { weeks, clock, state } = useApp();
  const c = state.checks;
  const next = MILESTONES.find(m => pd(m.date) >= clock.today);
  return (
    <>
      <section className="page-hero">
        <Shapes variant="banner" />
        <div className="wrap">
          <div className="eyebrow light">The whole season</div>
          <h1>Every week at a glance</h1>
          <p>Tap a week to open its plan. A red dot means a past week still has unticked demos.</p>
        </div>
      </section>

      <div className="wrap stack-lg pull">
        <Tracker selected={clock.before ? 1 : clock.now} />

        <section aria-labelledby="miles-h">
          <h2 id="miles-h" className="h-section">
            Dates that matter
          </h2>
          <div className="miles">
            {MILESTONES.map(m => {
              const d = pd(m.date);
              const n = daysTo(d, clock);
              const gw = weeks[m.week - 1];
              const [gd, gt] = gateTally(gw, c);
              return (
                <Link key={m.key} href={`/week/${gw.n}?tab=gate`} className={`mile ${n < 0 ? "past" : ""} ${next?.key === m.key ? "next" : ""}`}>
                  <span className="mn">{m.name}</span>
                  <span className="md">{fmtLong(d)}</span>
                  <span className="mc">
                    {n > 0 ? n : n === 0 ? "Today" : "Done"}
                    {n > 0 && <small>{n === 1 ? "day" : "days"}</small>}
                  </span>
                  <span className="mg">{gt ? `${gw.gate!.name}: ${gd}/${gt}` : " "}</span>
                  {gt > 0 && <Bar pct={(100 * gd) / gt} className="gold" />}
                </Link>
              );
            })}
          </div>
        </section>

        {PHASES.map(p => {
          const ws = weeks.filter(w => w.phase === p.id);
          if (!ws.length) return null;
          return (
            <section key={p.id} className="phase" style={{ ["--c" as string]: `var(${p.color})` } as React.CSSProperties}>
              <div className="phase-head">
                <i className="sw" aria-hidden="true" />
                <div>
                  <h2>{p.name}</h2>
                  <p>{p.blurb}</p>
                </div>
              </div>
              <div className="wgrid">
                {ws.map(w => {
                  const [dc, dt] = demoTally(w, c);
                  const [gc, gt] = gateTally(w, c);
                  const [tc, tt] = weekTally(w, c);
                  const isNow = !clock.before && w.n === clock.now;
                  const late = weekLate(w, c, clock);
                  const full = weekFull(w, c);
                  return (
                    <Link key={w.n} href={`/week/${w.n}`} className={`wcard ${isNow ? "now" : ""} ${w.brk ? "brk" : ""}`}>
                      <Ring pct={tt ? (100 * tc) / tt : 0} size={58} stroke={6} color="var(--c)" label={`${tc} of ${tt} done`}>
                        <b>{w.n}</b>
                      </Ring>
                      <div className="wc-body">
                        <div className="d">
                          {fmt(wStart(w))} – {fmt(wEnd(w))}
                          {w.short ? ` · ${w.short}` : ""}
                          {isNow ? " · this week" : ""}
                        </div>
                        <div className="t">{w.title}</div>
                        <div className="g">{w.goal}</div>
                        <div className="pp">
                          {gt > 0 && <Pill tone={gc === gt ? "full" : undefined}>Gate {gc}/{gt}</Pill>}
                          {dt > 0 && (
                            <Pill tone={full ? "full" : late ? "late" : undefined}>
                              {dc}/{dt} demos
                            </Pill>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
