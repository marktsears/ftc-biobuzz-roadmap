"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useApp } from "./AppProvider";
import { QuestCard } from "./QuestCard";
import { TrackRings } from "./Social";
import { Task } from "./Task";
import { Cta, Icon, Pill, Shapes } from "./ui";
import { LINKS, TRACKS } from "@/lib/data/core";
import { QUESTS } from "@/lib/data/quests";
import { carryOver, daysTo, demoTally, gateOverdue, gateTally, isOn, taskTally, trackTally, weekLate } from "@/lib/progress";
import { questCrew, questsDoneBy, rankQuests } from "@/lib/pick";
import { fmt, fmtLong, pd, plural } from "@/lib/time";
import { phaseOf, wEnd, wStart } from "@/lib/weeks";
import type { Item, TrackCode, Week } from "@/lib/types";

type Tab = "overview" | "build" | "software" | "drive" | "outreach" | "gate";
const TABS: { id: Tab; label: string; code?: TrackCode }[] = [
  { id: "overview", label: "Overview" },
  { id: "build", label: "Build", code: "B" },
  { id: "software", label: "Software", code: "S" },
  { id: "drive", label: "Drive", code: "D" },
  { id: "outreach", label: "Outreach", code: "O" },
  { id: "gate", label: "Demo & Gate" },
];
const FOCUS_TAB: Record<string, Tab> = { all: "overview", B: "build", S: "software", D: "drive", O: "outreach" };

function List({ items, emptyText = "Nothing new this week." }: { items: Item[]; emptyText?: string }) {
  return items.length ? (
    <div className="tasks">
      {items.map(it => (
        <Task key={it.id} it={it} />
      ))}
    </div>
  ) : (
    <p className="empty">{emptyText}</p>
  );
}

export function WeekView({ n }: { n: number }) {
  const { weeks, clock, state, focus, team } = useApp();
  const router = useRouter();
  const sp = useSearchParams();
  const w = weeks[Math.min(Math.max(n, 1), weeks.length) - 1];
  const p = phaseOf(w.phase);
  const asked = sp.get("tab") as Tab | null;
  const [local, setLocal] = useState<Tab | null>(null);
  const tab: Tab = (TABS.some(t => t.id === asked) ? asked : local) ?? FOCUS_TAB[focus] ?? "overview";
  const setTab = (t: Tab) => {
    setLocal(t);
    router.replace(`/week/${w.n}?tab=${t}`, { scroll: false });
  };

  const checks = state.checks;
  const isNow = !clock.before && !clock.after && w.n === clock.now;
  const tag = clock.before ? (w.n === 1 ? "Up next" : "Ahead") : w.n < clock.now || clock.after ? "Past" : w.n === clock.now ? "This week" : "Ahead";
  const [dc, dt] = demoTally(w, checks);
  const late = weekLate(w, checks, clock);
  const countFor = (t: (typeof TABS)[number]) => {
    if (t.id === "gate") {
      const [gc, gt] = gateTally(w, checks);
      return `${dc + gc}/${dt + gt}`;
    }
    if (!t.code) return null;
    const items = t.id === "software" ? w.motion.concat(w.scoring, w.both) : t.id === "build" ? w.build : t.id === "drive" ? w.drive : w.outreach;
    const c = items.filter(i => isOn(checks, i.id)).length;
    return items.length ? `${c}/${items.length}` : "–";
  };

  const sel = (to: number) => router.push(`/week/${to}${asked ? `?tab=${asked}` : ""}`);
  const jump = clock.before ? 1 : clock.now;

  return (
    <div className="weekpage" style={{ ["--c" as string]: `var(${p.color})` } as React.CSSProperties}>
      <section className="wk-hero">
        <Shapes variant="banner" />
        <div className="wrap">
          <div className="wv-nav">
            <div className="pos">
              <span className="eyebrow light">
                Week {w.n} of {weeks.length}
              </span>
              <span className={`tag ${tag === "This week" || tag === "Up next" ? "now" : tag === "Past" ? "past" : "ahead"}`}>{tag}</span>
              {w.n !== jump && (
                <Link className="btn sm light" href={`/week/${jump}`}>
                  {clock.before ? "Back to Week 1" : "Back to this week"}
                </Link>
              )}
            </div>
            <div className="wv-steps">
              <select aria-label="Jump to a week" value={w.n} onChange={e => sel(+e.target.value)}>
                {weeks.map(x => (
                  <option key={x.n} value={x.n}>
                    Week {x.n}: {x.title}
                  </option>
                ))}
              </select>
              {w.n > 1 ? (
                <Link className="btn light" href={`/week/${w.n - 1}${asked ? `?tab=${asked}` : ""}`}>
                  ← <span className="hide-sm">Week </span>
                  {w.n - 1}
                </Link>
              ) : null}
              {w.n < weeks.length ? (
                <Link className="btn light" href={`/week/${w.n + 1}${asked ? `?tab=${asked}` : ""}`}>
                  <span className="hide-sm">Week </span>
                  {w.n + 1} →
                </Link>
              ) : null}
            </div>
          </div>

          <header className={`wv-head ${w.brk ? "brk" : ""}`}>
            <div className="big" aria-hidden="true">
              {w.n}
            </div>
            <div>
              <div className="eyebrow light">
                {fmt(wStart(w))} – {fmt(wEnd(w))} · {p.name}
                {w.short ? ` · ${w.short}` : ""}
              </div>
              <h1>{w.title}</h1>
              <p className="goal">{w.goal}</p>
            </div>
          </header>
        </div>
      </section>

      <div className="wrap stack-lg">
        <div className="tabs" role="tablist" aria-label="Week sections">
          {TABS.map(t => (
            <button key={t.id} role="tab" type="button" className={`tab ${tab === t.id ? "on" : ""}`} aria-selected={tab === t.id} onClick={() => setTab(t.id)} style={t.code ? ({ ["--tc" as string]: `var(--t-${t.code})` } as React.CSSProperties) : undefined}>
              {t.label}
              {countFor(t) && <Pill tone={t.id === "gate" && late ? "late" : undefined}>{countFor(t)}</Pill>}
            </button>
          ))}
        </div>

        {tab === "overview" && <Overview w={w} />}
        {tab === "build" && <TrackTab w={w} code="B" lanes={[["", w.build]]} />}
        {tab === "software" && (
          <TrackTab
            w={w}
            code="S"
            lanes={[
              ["Motion", w.motion],
              ["Scoring", w.scoring],
              ["Both lanes", w.both],
            ]}
          />
        )}
        {tab === "drive" && <TrackTab w={w} code="D" lanes={[["", w.drive]]} />}
        {tab === "outreach" && <TrackTab w={w} code="O" lanes={[["", w.outreach]]} />}
        {tab === "gate" && <DemoGate w={w} />}

        <div className="wk-bottom">
          <StatusActions w={w} />
        </div>
        {isNow && <p className="muted small">Team {team} · {fmtLong(clock.today)}</p>}
      </div>
    </div>
  );
}

function Overview({ w }: { w: Week }) {
  const { clock, state } = useApp();
  return (
    <div className="tab-panel">
      <p className="why">
        <b>Why this week: </b>
        {w.why}
      </p>
      {w.event && (
        <div className="event">
          <Icon name="flag" size={18} />
          <span>
            <b>On the calendar: </b>
            {w.event}
          </span>
        </div>
      )}
      <section className="card ringsec" aria-label="Progress this week">
        <TrackRings weekN={w.n} />
      </section>

      {w.all.length > 0 && (
        <section className="card" aria-labelledby="all-h">
          <h3 id="all-h">
            All hands <small>{TRACKS.A.sub}</small>
          </h3>
          <List items={w.all} />
        </section>
      )}
      {w.heads.length > 0 && (
        <section className="card" aria-labelledby="hd-h">
          <h3 id="hd-h">Don’t forget this week</h3>
          <div className="tasks">
            {w.heads.map(it => (
              <Task key={it.id} it={it} showTrack claimable={false} />
            ))}
          </div>
        </section>
      )}

      <div className="notes">
        {w.behind && (
          <section className="card behind">
            <h3>If you’re behind</h3>
            <p className="note">{w.behind}</p>
          </section>
        )}
        {w.ahead.length > 0 && (
          <section className="card ahead">
            <h3>If you’re ahead</h3>
            <ul className="plain">
              {w.ahead.map(a => (
                <li key={a.id}>
                  {a.t}
                  {a.tm && <em className="tt">{a.tm} only</em>}
                </li>
              ))}
            </ul>
          </section>
        )}
        {w.sat && (
          <section className="card">
            <h3>Saturday</h3>
            <p className="note">{w.sat}</p>
          </section>
        )}
        {w.traps.length > 0 && (
          <section className="card trap">
            <h3>Watch out</h3>
            <ul className="plain">
              {w.traps.map(t => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {w.learn.length > 0 && (
        <section aria-label="Learn and research">
          <div className="label">Learn and research</div>
          <div className="learn">
            {w.learn.map(k =>
              LINKS[k] ? (
                <a key={k} href={LINKS[k][1]} target="_blank" rel="noopener noreferrer">
                  {LINKS[k][0]}
                </a>
              ) : null,
            )}
          </div>
        </section>
      )}
      {!clock.before && w.n < clock.now && carryOver([w], state.checks, "all", clock).length > 0 && (
        <p className="muted small">Some demos from this week are still open. Check the Demo & Gate tab.</p>
      )}
    </div>
  );
}

function TrackTab({ w, code, lanes }: { w: Week; code: TrackCode; lanes: [string, Item[]][] }) {
  const { state, clock } = useApp();
  const [a, t] = trackTally(w, code, state.checks);
  const track = TRACKS[code];
  return (
    <div className="tab-panel" style={{ ["--tc" as string]: `var(--t-${code})` } as React.CSSProperties}>
      <section className="card track">
        <div className="track-head">
          <h3>
            {track.name} <small>{track.sub}</small>
          </h3>
          <Pill tone={t > 0 && a === t ? "full" : undefined}>{t ? `${a}/${t} this week` : "–"}</Pill>
        </div>
        {lanes.map(([label, items]) =>
          label ? (
            <div key={label} className="lane">
              <h4>
                <span className={`lane-chip chip-${label.split(" ")[0].toLowerCase()}`}>{label}</span>
              </h4>
              <List items={items} />
            </div>
          ) : (
            <List key="all" items={items} />
          ),
        )}
      </section>
      <QuestStrip code={code} week={clock.before ? 1 : w.n} />
    </div>
  );
}

function QuestStrip({ code, week }: { code: TrackCode; week: number }) {
  const { state, person } = useApp();
  const done = useMemo(() => questsDoneBy(state, person), [state, person]);
  const picks = useMemo(() => rankQuests({ quests: QUESTS.filter(q => q.track === code), done, focus: "all", week, seed: "w" + week, includeDone: false }).slice(0, 2), [code, done, week]);
  if (!picks.length) return null;
  return (
    <section aria-label="Quests for this track">
      <div className="strip-head">
        <div>
          <div className="eyebrow">Stuck, or done early?</div>
          <h3>Try a {TRACKS[code].short.toLowerCase()} quest</h3>
        </div>
        <Cta href="/quests">All quests</Cta>
      </div>
      <div className="qgrid two">
        {picks.map(q => (
          <QuestCard key={q.id} q={q} crew={questCrew(state, q.id).length} />
        ))}
      </div>
    </section>
  );
}

function DemoGate({ w }: { w: Week }) {
  const { state, clock } = useApp();
  const [dc, dt] = demoTally(w, state.checks);
  const [gc, gt] = gateTally(w, state.checks);
  const late = weekLate(w, state.checks, clock);
  const dd = w.gate ? daysTo(pd(w.gate.due), clock) : 0;
  return (
    <div className="tab-panel two">
      <section className="card demo">
        <div className="gh">
          <div className="label">{w.brk ? "Optional · tick what you did" : "Thursday demo · done when · tick only what you showed"}</div>
          <Pill tone={dt > 0 && dc === dt ? "full" : late ? "late" : undefined}>
            {dc}/{dt}
          </Pill>
        </div>
        {w.done.length ? (
          <div className="tasks">
            {w.done.map(it => (
              <Task key={it.id} it={it} showTrack claimable={false} />
            ))}
          </div>
        ) : (
          <p className="empty">No demo items this week.</p>
        )}
      </section>
      {w.gate && (
        <section className="card gate">
          <div className="gh">
            <h3>Gate: {w.gate.name}</h3>
            <span className="gdue">
              due {fmtLong(pd(w.gate.due))} · {dd > 0 ? plural(dd, "day") + " away" : dd === 0 ? "today" : "was " + plural(-dd, "day") + " ago"}
            </span>
          </div>
          <p className="note">A gate is a checkpoint across every track. Nobody’s done until the gate is.</p>
          <div className="gbar" aria-hidden="true">
            <i style={{ width: `${gt ? (100 * gc) / gt : 0}%` }} />
          </div>
          <div className="tasks">
            {w.gate.items.map(it => (
              <Task key={it.id} it={it} showTrack claimable={false} />
            ))}
          </div>
          <Pill tone={gt > 0 && gc === gt ? "full" : gateOverdue(w, clock) ? "late" : undefined}>
            {gc}/{gt} ready
          </Pill>
        </section>
      )}
    </div>
  );
}

function StatusActions({ w }: { w: Week }) {
  const { state, team, clock, weeks } = useApp();
  const [msg, setMsg] = useState("");
  const text = () => {
    const mark = (it: Item) => (isOn(state.checks, it.id) ? "[x]" : "[ ]");
    const [c, t] = demoTally(w, state.checks);
    const [tc, tt] = taskTally(w, state.checks);
    const lines = [`Team ${team} · Week ${w.n}: ${w.title} (${tc}/${tt} tasks, ${c}/${t} demos)`];
    w.done.forEach(it => lines.push(`${mark(it)} [${TRACKS[it.tr].short}] ${it.t}`));
    if (w.gate) {
      const [gc, gt] = gateTally(w, state.checks);
      lines.push("", `${w.gate.name} (due ${fmtLong(pd(w.gate.due))}): ${gc}/${gt}`);
      w.gate.items.forEach(it => lines.push(`${mark(it)} [${TRACKS[it.tr].short}] ${it.t}`));
    }
    const carry = carryOver(weeks, state.checks, "all", clock);
    if (carry.length) lines.push("", `Carried over: ${carry.length} (oldest from Week ${carry[0].w.n})`);
    return lines.join("\n");
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text());
      setMsg("Copied");
    } catch {
      setMsg("Couldn’t copy. Your browser blocked it.");
    }
    setTimeout(() => setMsg(""), 3000);
  };
  return (
    <div className="row-actions">
      <button type="button" className="btn" onClick={copy}>
        <Icon name="copy" size={16} /> Copy status for team chat
      </button>
      <button type="button" className="btn" onClick={() => window.print()}>
        <Icon name="print" size={16} /> Print this week
      </button>
      <span className="copied" aria-live="polite">
        {msg}
      </span>
    </div>
  );
}

