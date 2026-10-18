"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useApp } from "./AppProvider";
import { BoredBanner } from "./QuestCard";
import { HeadsUp, RailsCard } from "./Rails";
import { ActivityFeed, HiveMini, MeCard, PaceCard, TrackRings } from "./Social";
import { Task } from "./Task";
import { Tracker } from "./Tracker";
import { Cta, Shapes } from "./ui";
import { daysTo } from "@/lib/progress";
import { myTasks, openTasks } from "@/lib/pick";
import { fmt, pd, plural } from "@/lib/time";
import { phaseOf, qualifier, wEnd, wStart } from "@/lib/weeks";
import { diffDays } from "@/lib/time";

export function Hero() {
  const { weeks, clock, team, person } = useApp();
  const w = weeks[clock.now - 1];
  const p = phaseOf(w.phase);
  const dq = daysTo(pd(qualifier.date), clock);
  const shown = clock.before ? 1 : clock.now;

  let sub: React.ReactNode;
  if (clock.before) {
    const d = diffDays(clock.first, clock.today);
    sub = (
      <>
        <b>Week 1 starts Monday {fmt(clock.first)}</b> ({d === 1 ? "tomorrow" : "in " + plural(d, "day")}). Do the short “Before Monday” list below, then open Week 1.
      </>
    );
  } else if (clock.after) {
    sub = "The planned season is complete. Use the debrief and improvement weeks again, or add the next event’s plan.";
  } else if (w.brk) {
    sub = (
      <>
        <b>{p.name}</b> · {fmt(wStart(w))} – {fmt(wEnd(w))}. Rest, or do the optional list.
      </>
    );
  } else {
    const di = clock.dow;
    const demo = di < 3 ? `Demo day is Thursday, in ${plural(3 - di, "day")}.` : di === 3 ? "Today is demo day." : "Demo day has passed. Whatever isn’t ticked carries over.";
    sub = (
      <>
        <b>{p.name}</b> · {fmt(wStart(w))} – {fmt(wEnd(w))} · {demo}
      </>
    );
  }

  return (
    <section className="hero">
      <Shapes variant="hero" />
      <div className="wrap hero-in">
        <div className="hero-copy">
          <div className="eyebrow light">Trinity Robotics · FTC 2026–27 · BIOBUZZ · Team {team}</div>
          <h1>
            <span className="wk">Week</span>
            <span className="big">{shown}</span>
            <span className="of">of {weeks.length}</span>
          </h1>
          <p className="sub">{sub}</p>
          <p className="hello">{person ? `Hi ${person}. ` : ""}{w.title}.</p>
          <div className="hero-actions">
            <Cta href={`/week/${shown}`} variant="light">
              Open this week’s plan
            </Cta>
            <Link className="ghost-link" href="/quests">
              Not sure what to do?
            </Link>
          </div>
        </div>
        <div className="hero-side" aria-label="Countdown to the qualifier">
          <div className="countdown">
            <b>{dq > 0 ? dq : dq === 0 ? "Today" : Math.abs(dq)}</b>
            <small>{dq > 0 ? (dq === 1 ? "day to the qualifier" : "days to the qualifier") : dq === 0 ? "is qualifier day" : "days since the qualifier"}</small>
          </div>
        </div>
      </div>
    </section>
  );
}

function NextMoves() {
  const { weeks, state, person, focus, clock, openProfile } = useApp();
  const mine = useMemo(() => myTasks(weeks, state, person), [weeks, state, person]);
  const open = useMemo(() => openTasks(weeks, state, focus, clock).slice(0, mine.length >= 3 ? 0 : 4 - Math.min(mine.length, 2)), [weeks, state, focus, clock, mine.length]);

  return (
    <section className="card moves" aria-labelledby="moves-h">
      <h2 id="moves-h">Your next moves</h2>
      {!person && (
        <p className="note">
          <button type="button" className="link-btn" onClick={openProfile}>
            Add your name
          </button>{" "}
          to grab tasks and earn XP.
        </p>
      )}
      {mine.length > 0 && (
        <div className="mv-block">
          <div className="label">You grabbed</div>
          {mine.slice(0, 5).map(({ w, it }) => (
            <Task key={it.id} it={it} showTrack weekLabel={`Week ${w.n}`} />
          ))}
          {mine.length > 5 && <p className="note">…and {mine.length - 5} more.</p>}
        </div>
      )}
      {open.length > 0 && (
        <div className="mv-block">
          <div className="label">{mine.length ? "Room for one more?" : "Nobody’s on these yet. Grab one."}</div>
          {open.map(({ w, it }) => (
            <Task key={it.id} it={it} showTrack weekLabel={`Week ${w.n}`} />
          ))}
        </div>
      )}
      {mine.length === 0 && open.length === 0 && <p className="note">Everything open is grabbed or done. Try a quest, or help a teammate.</p>}
    </section>
  );
}

export function HomeView() {
  const { clock } = useApp();
  const shown = clock.before ? 1 : clock.now;
  return (
    <>
      <Hero />
      <div className="wrap overlap">
        <Tracker selected={shown} />
      </div>

      <div className="wrap stack-lg">
        <BoredBanner />

        <div className="home-grid">
          <div className="col">
            <NextMoves />
            <section className="card glance" aria-labelledby="glance-h">
              <div className="glance-head">
                <h2 id="glance-h">{clock.before ? "Week 1" : "This week"} at a glance</h2>
                <Link href={`/week/${shown}`} className="btn sm">
                  Open the plan →
                </Link>
              </div>
              <TrackRings weekN={shown} />
            </section>
            <ActivityFeed />
          </div>
          <div className="col">
            <MeCard />
            <PaceCard />
            <RailsCard />
            <HeadsUp />
            <HiveMini />
          </div>
        </div>
      </div>
    </>
  );
}
