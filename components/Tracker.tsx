"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { useApp } from "./AppProvider";
import { Eyebrow } from "./ui";
import { weekFull, weekLate } from "@/lib/progress";
import { DAY, fmt, fmtLong } from "@/lib/time";
import { MILESTONES, layoutOf, phaseOf, wStart, wEnd } from "@/lib/weeks";

/** The pizza tracker: every week of the season, with a pin on where we are today. */
export function Tracker({ selected, compact }: { selected?: number; compact?: boolean }) {
  const { weeks, clock, state } = useApp();
  const checks = state.checks;
  const { cols, startCol } = useMemo(() => layoutOf(weeks), [weeks]);
  const scroll = useRef<HTMLDivElement>(null);

  const centerPct = (n: number) => {
    const w = weeks[n - 1];
    return ((startCol[n] + (w.brk ? 1 : 0.5)) / cols) * 100;
  };
  const cur = weeks[clock.now - 1];
  const pin = (() => {
    if (clock.before) return centerPct(1);
    if (clock.after) return centerPct(weeks.length);
    const span = cur.brk ? 14 : 7;
    const di = Math.round((clock.today.getTime() - wStart(cur).getTime()) / DAY);
    const frac = Math.min(1, Math.max(0, (di + 0.5) / span));
    const colw = (100 / cols) * (cur.brk ? 2 : 1);
    return centerPct(cur.n) + (frac - 0.5) * 0.6 * colw;
  })();

  // bring the pin into view on first paint
  useEffect(() => {
    const el = scroll.current;
    if (!el) return;
    const inner = el.firstElementChild as HTMLElement | null;
    if (!inner) return;
    el.scrollLeft = Math.max(0, (inner.scrollWidth * pin) / 100 - el.clientWidth / 2);
    // only on first mount for this team
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeks]);

  const stages = useMemo(() => {
    const out: { phase: string; from: number; to: number; span: number }[] = [];
    for (const w of weeks) {
      const last = out[out.length - 1];
      if (last && last.phase === w.phase) {
        last.to = w.n;
        last.span += w.brk ? 2 : 1;
      } else out.push({ phase: w.phase, from: w.n, to: w.n, span: w.brk ? 2 : 1 });
    }
    return out;
  }, [weeks]);

  const msByWeek = useMemo(() => {
    const m: Record<number, (typeof MILESTONES)[number][]> = {};
    MILESTONES.forEach(x => (m[x.week] ||= []).push(x));
    return m;
  }, []);

  const gridCols = { ["--cols" as string]: cols } as React.CSSProperties;

  return (
    <section className={`tracker ${compact ? "compact" : ""}`} aria-label="Where we are in the season">
      <div className="tr-head">
        <Eyebrow>Season tracker · tap a week</Eyebrow>
        <span className="mono">Today {fmtLong(clock.today)}</span>
      </div>
      <div className="tr-scroll" ref={scroll}>
        <div className="tr-inner" style={{ ...gridCols, ["--min" as string]: `${Math.max(900, cols * 54)}px` } as React.CSSProperties}>
          <div className="tr-row tr-stages" style={gridCols}>
            {stages.map(s => {
              const ph = phaseOf(s.phase);
              const st = clock.before ? "next" : clock.after ? "done" : clock.now > s.to ? "done" : clock.now >= s.from ? "now" : "next";
              const range = s.from === s.to ? `Wk ${s.from}` : `Wk ${s.from}–${s.to}`;
              return (
                <div key={s.from} className={`stage ${st}`} style={{ gridColumn: `span ${s.span}`, ["--c" as string]: `var(${ph.color})` } as React.CSSProperties}>
                  <i />
                  <div className="sn">{ph.name}</div>
                  <div className="ss">
                    {range}
                    {st === "done" ? " · done" : st === "now" ? " · now" : ""}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="tr-rail" style={{ ["--p" as string]: `${clock.before ? 0 : pin}%` } as React.CSSProperties}>
            <div className="tr-fill" />
            <div className="tr-cells" style={gridCols}>
              {weeks.map(w => {
                const ph = phaseOf(w.phase);
                const past = (!clock.before && w.n < clock.now) || (clock.after && w.n <= clock.now);
                const isNow = !clock.before && !clock.after && w.n === clock.now;
                const cls = ["node", w.brk ? "brk" : "", past ? "past" : "", isNow ? "now" : "", w.n === selected ? "sel" : "", past && weekFull(w, checks) ? "full" : "", weekLate(w, checks, clock) ? "late" : ""].filter(Boolean).join(" ");
                return (
                  <div key={w.n} className="nw" style={{ gridColumn: `span ${w.brk ? 2 : 1}` }}>
                    {isNow && <span className="ring-pulse" />}
                    <Link href={`/week/${w.n}`} className={cls} style={{ ["--c" as string]: `var(${ph.color})` } as React.CSSProperties} aria-label={`Week ${w.n}: ${w.title}${isNow ? " (this week)" : ""}`} aria-current={isNow ? "step" : undefined} title={`Week ${w.n}: ${w.title}`}>
                      {w.brk ? "break" : w.n}
                    </Link>
                  </div>
                );
              })}
            </div>
            <div className="pin" style={{ ["--p" as string]: `${pin}%` } as React.CSSProperties}>
              <b>{clock.before ? "STARTS MON" : clock.after ? "SEASON DONE" : "YOU ARE HERE"}</b>
            </div>
          </div>

          <div className="tr-row tr-dates" style={gridCols}>
            {weeks.map(w => (
              <div key={w.n} className="d" style={{ gridColumn: `span ${w.brk ? 2 : 1}` }} title={`${fmt(wStart(w))} – ${fmt(wEnd(w))}`}>
                {fmt(wStart(w))}
              </div>
            ))}
          </div>
          <div className="tr-row tr-flags" style={gridCols}>
            {weeks.map(w => (
              <div key={w.n} className="f" style={{ gridColumn: `span ${w.brk ? 2 : 1}` }}>
                {(msByWeek[w.n] || []).slice(0, 1).map(m => (
                  <span key={m.key} className={`flag ${m.flag[0]}`}>
                    {m.flag[1]}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

