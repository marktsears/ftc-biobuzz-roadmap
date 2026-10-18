"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useApp } from "./AppProvider";
import { ActivityFeed, MeCard, PaceCard } from "./Social";
import { Avatar, Bar, Icon, Ring, Shapes } from "./ui";
import { BADGES, XP, badgesOf, hiveLevel, personalLevel } from "@/lib/xp";
import { weekTally } from "@/lib/progress";
import { ago } from "@/lib/time";

export function HiveView() {
  const { team, teamXp, people, me, weeks, clock, state, person } = useApp();
  const lvl = hiveLevel(teamXp, team);
  const mine = new Set(badgesOf(me));
  const crew = useMemo(() => [...people].sort((a, b) => (a.last < b.last ? 1 : -1)), [people]);
  const rows = [weeks.slice(0, 8), weeks.slice(8)];

  return (
    <>
      <section className="page-hero">
        <Shapes variant="banner" />
        <div className="wrap">
          <div className="eyebrow light">The Hive · Team {team}</div>
          <h1>
            {lvl.name} <span className="lvl-n">level {lvl.idx + 1} of 8</span>
          </h1>
          <p>Every box ticked and quest finished adds to the hive. It grows because of all of you, not one person.</p>
        </div>
      </section>

      <div className="wrap stack-lg pull">
        <div className="hive-top">
          <section className="card hive-card">
            <Ring pct={lvl.pct} size={132} stroke={12} color="var(--gold)" track="var(--ice)" label={`${Math.round(lvl.pct)}% to the next level`}>
              <b className="big-n">{teamXp}</b>
              <small>team XP</small>
            </Ring>
            <div>
              <div className="hexrow lg" aria-label={`Level ${lvl.idx + 1} of 8`}>
                {Array.from({ length: 8 }, (_, i) => (
                  <i key={i} className={`hexcell ${i <= lvl.idx ? "on" : ""}`} />
                ))}
              </div>
              <p className="note">{lvl.next ? `${lvl.next - teamXp} XP to the next level.` : "The hive is at the top level. Keep it humming."}</p>
              <p className="note">{people.length ? `${people.length} ${people.length === 1 ? "person has" : "people have"} added to it.` : "Nobody has added to it yet. You could be first."}</p>
            </div>
          </section>
          <div className="col">
            <MeCard />
            <PaceCard compact />
          </div>
        </div>

        <section aria-labelledby="comb-h">
          <h2 id="comb-h" className="h-section">
            The honeycomb
          </h2>
          <p className="muted">One cell for each week. A cell fills with gold as the team ticks off that week’s list.</p>
          <div className="honey" role="list">
            {rows.map((row, ri) => (
              <div key={ri} className={`honey-row ${ri % 2 ? "off" : ""}`}>
                {row.map(w => {
                  const [d, t] = weekTally(w, state.checks);
                  const pct = t ? (100 * d) / t : 0;
                  const isNow = !clock.before && w.n === clock.now;
                  const future = !clock.before ? w.n > clock.now : w.n > 1;
                  return (
                    <Link key={w.n} role="listitem" href={`/week/${w.n}`} className={`hex ${isNow ? "now" : ""} ${future && pct === 0 ? "future" : ""} ${pct === 100 ? "full" : ""}`} style={{ ["--fill" as string]: `${pct}%` } as React.CSSProperties} title={`Week ${w.n}: ${d} of ${t}`} aria-label={`Week ${w.n}: ${d} of ${t} done`}>
                      <span>{w.n}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <section className="card" aria-labelledby="badges-h">
          <div className="strip-head">
            <h2 id="badges-h">{person ? `${person}’s badges` : "Badges"}</h2>
            <span className="mono">
              {mine.size} of {BADGES.length}
            </span>
          </div>
          <ul className="badges">
            {BADGES.map(b => (
              <li key={b.id} className={mine.has(b.id) ? "got" : ""}>
                <i className="badge-ico" aria-hidden="true">
                  <Icon name={mine.has(b.id) ? "quest" : "lock"} size={20} />
                </i>
                <span>
                  <b>{b.name}</b>
                  <small>{b.desc}</small>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="crew-h">
          <h2 id="crew-h" className="h-section">
            The crew
          </h2>
          <p className="muted">Everybody who’s added to Team {team}’s hive, most recent first. There’s no ranking here. Different jobs, different amounts, all of it counts.</p>
          {crew.length === 0 ? (
            <p className="empty">Nobody yet.</p>
          ) : (
            <div className="crew-grid">
              {crew.map(p => {
                const l = personalLevel(p.xp);
                return (
                  <div key={p.key} className={`card person ${person && p.key === person.toLowerCase() ? "me" : ""}`}>
                    <div className="pr-top">
                      <Avatar name={p.name} size={40} />
                      <div>
                        <b>{p.name}</b>
                        <small>
                          {l.name} · {p.xp} XP
                        </small>
                      </div>
                    </div>
                    <Bar pct={l.pct} className="gold" />
                    <div className="pr-stats">
                      <span>
                        <b>{p.ticks}</b> ticks
                      </span>
                      <span>
                        <b>{p.quests}</b> quests
                      </span>
                      <span>
                        <b>{badgesOf(p).length}</b> badges
                      </span>
                      <span>
                        <b>{p.streak}</b> wk streak
                      </span>
                    </div>
                    {p.last && <small className="muted">Last active {ago(p.last)}</small>}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="duo">
          <ActivityFeed limit={10} />
          <section className="card xp-how">
            <h3>How XP works</h3>
            <table className="t">
              <tbody>
                <tr>
                  <td>Tick a task or a heads-up item</td>
                  <td className="n">+{XP.task}</td>
                </tr>
                <tr>
                  <td>Show a Thursday demo item</td>
                  <td className="n">+{XP.demo}</td>
                </tr>
                <tr>
                  <td>Clear a gate item</td>
                  <td className="n">+{XP.gate}</td>
                </tr>
                <tr>
                  <td>Finish a task you grabbed</td>
                  <td className="n">+{XP.claimBonus}</td>
                </tr>
                <tr>
                  <td>Finish a quest</td>
                  <td className="n">+15 to +50</td>
                </tr>
              </tbody>
            </table>
            <p className="note">XP is just a way to see effort add up. The real score is the robot working on Thursday.</p>
          </section>
        </div>
      </div>
    </>
  );
}
