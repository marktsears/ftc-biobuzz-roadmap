"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useApp } from "./AppProvider";
import { Avatar, Bar, Icon, Ring } from "./ui";
import { QUEST_BY_ID } from "@/lib/data/quests";
import { TRACKS } from "@/lib/data/core";
import { PACE_COPY, pace, trackTally, weekTally } from "@/lib/progress";
import { ago } from "@/lib/time";
import { getIndex } from "@/lib/weeks";
import { hiveLevel, personalLevel } from "@/lib/xp";
import type { TrackCode } from "@/lib/types";

/* ---------- pace: ahead / on / behind, at a glance ---------- */
export function PaceCard({ compact }: { compact?: boolean }) {
  const { weeks, clock, state, focus } = useApp();
  const p = pace(weeks, state.checks, clock, focus);
  const copy = PACE_COPY[p.level];
  // marker: 40% of plan → far left, 130% → far right
  const pos = p.level === "pre" ? 50 : Math.max(2, Math.min(98, ((p.ratio - 0.4) / 0.9) * 100));
  return (
    <section className={`card pace ${p.level} ${compact ? "compact" : ""}`} aria-labelledby="pace-h">
      <div className="pace-top">
        <div>
          <div className="eyebrow">Season pace{focus !== "all" ? ` · ${TRACKS[focus].short}` : ""}</div>
          <h3 id="pace-h">{copy.title}</h3>
        </div>
        {p.level !== "pre" && (
          <div className="pace-num" aria-label={`${p.done} done, ${Math.round(p.expected)} expected`}>
            <b>{p.delta > 0 ? `+${p.delta}` : p.delta}</b>
            <small>vs plan</small>
          </div>
        )}
      </div>
      <div className="pace-scale" aria-hidden="true">
        <span style={{ left: "0%" }}>Behind</span>
        <span style={{ left: "38%" }}>On pace</span>
        <span style={{ left: "88%" }}>Ahead</span>
        <i className="pace-mark" style={{ left: `${pos}%` }} />
      </div>
      {!compact && <p className="note">{copy.line}</p>}
    </section>
  );
}

/* ---------- ring per track for a week ---------- */
const TAB_FOR: Record<TrackCode, string> = { B: "build", S: "software", D: "drive", O: "outreach", A: "overview" };
export function TrackRings({ weekN }: { weekN: number }) {
  const { weeks, state } = useApp();
  const w = weeks[weekN - 1];
  const [dc, dt] = weekTally(w, state.checks);
  const codes = (["B", "S", "D", "O", "A"] as TrackCode[]).filter(c => trackTally(w, c, state.checks)[1] > 0);
  return (
    <div className="rings">
      <Link href={`/week/${weekN}`} className="ring-card total">
        <Ring pct={dt ? (100 * dc) / dt : 0} size={84} stroke={9} color="var(--gold)" track="rgba(255,255,255,.18)" label={`Whole week: ${dc} of ${dt}`}>
          <b>{dt ? Math.round((100 * dc) / dt) : 0}%</b>
        </Ring>
        <span>Whole week</span>
        <small>
          {dc} of {dt}
        </small>
      </Link>
      {codes.map(c => {
        const [a, t] = trackTally(w, c, state.checks);
        return (
          <Link key={c} href={`/week/${weekN}?tab=${TAB_FOR[c]}`} className="ring-card" style={{ ["--tc" as string]: `var(--t-${c})` } as React.CSSProperties}>
            <Ring pct={t ? (100 * a) / t : 0} size={64} stroke={7} color="var(--tc)" label={`${TRACKS[c].short}: ${a} of ${t}`}>
              <b>{a}</b>
            </Ring>
            <span>{TRACKS[c].short}</span>
            <small>
              {a} of {t}
            </small>
          </Link>
        );
      })}
    </div>
  );
}

/* ---------- team hive level ---------- */
export function HiveMini() {
  const { team, teamXp, people } = useApp();
  const lvl = hiveLevel(teamXp, team);
  return (
    <Link href="/hive" className="card hivemini">
      <div className="hm-top">
        <div className="hexrow" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} className={`hexcell ${i <= lvl.idx ? "on" : ""}`} />
          ))}
        </div>
        <span className="mono">{people.length} buzzing</span>
      </div>
      <div className="eyebrow">Team {team}’s hive</div>
      <h3>
        {lvl.name} <small>level {lvl.idx + 1}</small>
      </h3>
      <Bar pct={lvl.pct} className="gold" />
      <p className="note">
        {teamXp} XP{lvl.next ? ` · ${lvl.next - teamXp} to the next level` : " · top level"}
      </p>
    </Link>
  );
}

/* ---------- who did what lately ---------- */
export function ActivityFeed({ limit = 8 }: { limit?: number }) {
  const { state, team } = useApp();
  const items = useMemo(() => {
    const index = getIndex(team);
    const rows: { key: string; by: string; at: string; verb: string; what: string; quest?: boolean }[] = [];
    for (const [id, rec] of Object.entries(state.checks)) {
      const e = index.get(id);
      if (e) rows.push({ key: id, by: rec.by, at: rec.at, verb: e.kind === "demo" ? "showed" : e.kind === "gate" ? "cleared" : "finished", what: e.t });
    }
    for (const q of state.quests) {
      const d = QUEST_BY_ID[q.id];
      if (d) rows.push({ key: "q" + q.id + q.by, by: q.by, at: q.at, verb: "finished the quest", what: d.title, quest: true });
    }
    return rows.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, limit);
  }, [state, team, limit]);

  return (
    <section className="card feed" aria-labelledby="feed-h">
      <h3 id="feed-h">Lately on Team {team}</h3>
      {items.length === 0 ? (
        <p className="empty">Nothing yet. The first tick is yours.</p>
      ) : (
        <ul>
          {items.map(r => (
            <li key={r.key}>
              <Avatar name={r.by} size={28} />
              <span>
                <b>{r.by}</b> {r.verb} <span className={r.quest ? "q" : ""}>{r.what.length > 90 ? r.what.slice(0, 88) + "…" : r.what}</span>
                <small>{ago(r.at)}</small>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- me: XP + level ---------- */
export function MeCard() {
  const { me, person, openProfile } = useApp();
  if (!person)
    return (
      <div className="card mecard empty-me">
        <h3>Sign in</h3>
        <p className="note">Use your Trinity Google account to grab tasks and earn XP.</p>
        <button type="button" className="btn" onClick={openProfile}>
          Sign in
        </button>
      </div>
    );
  const xp = me?.xp ?? 0;
  const lvl = personalLevel(xp);
  return (
    <div className="card mecard">
      <div className="me-row">
        <Avatar name={person} size={46} />
        <div>
          <b>{person}</b>
          <small>
            {lvl.name} · {xp} XP
          </small>
        </div>
        <span className="streak" title="Weeks in a row you did something">
          <Icon name="bolt" size={14} /> {me?.streak ?? 0} wk streak
        </span>
      </div>
      <Bar pct={lvl.pct} className="gold" />
      <p className="note">{lvl.next ? `${lvl.next - xp} XP to ${personalLevel(lvl.next).name}` : "Top level. Go help someone else level up."}</p>
    </div>
  );
}
