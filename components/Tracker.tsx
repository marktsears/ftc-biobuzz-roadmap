"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "./AppProvider";
import { Eyebrow } from "./ui";
import { weekFull, weekLate } from "@/lib/progress";
import { DAY, fmt, fmtLong } from "@/lib/time";
import { MILESTONES, layoutOf, phaseOf, wStart, wEnd } from "@/lib/weeks";

/** The season calendar. Week 1 is the week after the BIOBUZZ reveal. One stretch is open at a time. */
export function Tracker({ selected }: { selected?: number; compact?: boolean }) {
  const { weeks, clock, state } = useApp();
  const checks = state.checks;
  const scroll = useRef<HTMLDivElement>(null);

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

  const phaseOfWeek = (n: number) => weeks[n - 1]?.phase ?? stages[0]?.phase ?? "reveal";
  const [open, setOpen] = useState(() => phaseOfWeek(selected ?? clock.now));
  useEffect(() => {
    if (selected) setOpen(phaseOfWeek(selected));
    // Only follow navigation to a week, not a click on another stretch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const openWeeks = useMemo(() => weeks.filter(w => w.phase === open), [weeks, open]);
  const { cols, startCol } = useMemo(() => layoutOf(openWeeks), [openWeeks]);
  const openPhase = phaseOf(open);

  const centerPct = (n: number) => {
    const w = weeks[n - 1];
    return ((startCol[n] + (w.brk ? 1 : 0.5)) / cols) * 100;
  };
  const cur = weeks[clock.now - 1];
  const pin = (() => {
    if (!cur || startCol[cur.n] == null) return null;
    if (clock.before) return centerPct(openWeeks[0].n);
    const span = cur.brk ? 14 : 7;
    const di = Math.round((clock.today.getTime() - wStart(cur).getTime()) / DAY);
    const frac = Math.min(1, Math.max(0, (di + 0.5) / span));
    const colw = (100 / cols) * (cur.brk ? 2 : 1);
    return centerPct(cur.n) + (frac - 0.5) * 0.6 * colw;
  })();

  useEffect(() => {
    const el = scroll.current;
    if (!el || pin == null) return;
    const inner = el.firstElementChild as HTMLElement | null;
    if (!inner) return;
    el.scrollLeft = Math.max(0, (inner.scrollWidth * pin) / 100 - el.clientWidth / 2);
  }, [open, pin]);

  const msByWeek = useMemo(() => {
    const m: Record<number, (typeof MILESTONES)[number][]> = {};
    MILESTONES.forEach(x => (m[x.week] ||= []).push(x));
    return m;
  }, []);

  const gridCols = { ["--cols" as string]: cols } as React.CSSProperties;
  const behind = Math.max(0, clock.now - 1);

  return (
    <section className="tracker" aria-label="Where we are in the season">
      <div className="tr-head">
        <Eyebrow>Season calendar · open one stretch</Eyebrow>
        <span className="mono">Today {fmtLong(clock.today)}</span>
      </div>
      <p className="tr-note">
        Week 1 started {fmt(wStart(weeks[0]))}, the week after BIOBUZZ came out on Sept 12.
        {behind > 0 ? ` ${behind} ${behind === 1 ? "week has" : "weeks have"} already gone by.` : ""}
      </p>
      <div className="tr-phases" role="tablist" aria-label="Stretches of the season">
        {stages.map(s => {
          const ph = phaseOf(s.phase);
          const st = clock.before ? "next" : clock.after ? "done" : clock.now > s.to ? "done" : clock.now >= s.from ? "now" : "next";
          const range = s.from === s.to ? `Wk ${s.from}` : `Wk ${s.from}–${s.to}`;
          const on = s.phase === open;
          return (
            <button
              key={s.phase}
              type="button"
              role="tab"
              aria-selected={on}
              className={`stage ${st} ${on ? "open" : ""}`}
              style={{ ["--c" as string]: `var(${ph.color})` } as React.CSSProperties}
              onClick={() => setOpen(s.phase)}
            >
              <i />
              <div className="sn">{on ? ph.name : ph.short}</div>
              <div className="ss">
                {range}
                {st === "done" ? " · done" : st === "now" ? " · now" : ""}
              </div>
            </button>
          );
        })}
      </div>
      <p className="tr-focus" style={{ ["--c" as string]: `var(${openPhase.color})` } as React.CSSProperties}>
        <b>{openPhase.name}.</b> {openPhase.blurb}
      </p>
      <div className="tr-scroll" ref={scroll}>
        <div className="tr-inner" style={{ ...gridCols, ["--min" as string]: `${Math.max(520, cols * 78)}px` } as React.CSSProperties}>
          <div className="tr-rail" style={{ ["--p" as string]: `${pin ?? 0}%` } as React.CSSProperties}>
            <div className="tr-fill" style={pin == null ? { width: 0 } : undefined} />
            <div className="tr-cells" style={gridCols}>
              {openWeeks.map(w => {
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
            {pin != null && (
              <div className="pin" style={{ ["--p" as string]: `${pin}%` } as React.CSSProperties}>
                <b>{clock.before ? "STARTS MON" : clock.after ? "SEASON DONE" : "YOU ARE HERE"}</b>
              </div>
            )}
          </div>

          <div className="tr-row tr-dates" style={gridCols}>
            {openWeeks.map(w => (
              <div key={w.n} className="d" style={{ gridColumn: `span ${w.brk ? 2 : 1}` }} title={`${fmt(wStart(w))} – ${fmt(wEnd(w))}`}>
                {fmt(wStart(w))}
              </div>
            ))}
          </div>
          <div className="tr-row tr-flags" style={gridCols}>
            {openWeeks.map(w => (
              <div key={w.n} className="f" style={{ gridColumn: `span ${w.brk ? 2 : 1}` }}>
                {(msByWeek[w.n] || []).map(m => (
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
