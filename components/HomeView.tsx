"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "./AppProvider";
import { BoredBanner } from "./QuestCard";
import { Task } from "./Task";
import { Tracker } from "./Tracker";
import { Cta, Shapes } from "./ui";
import { PACE_COPY, daysTo, pace } from "@/lib/progress";
import { myTasks, openTasks } from "@/lib/pick";
import { fmt, pd, plural } from "@/lib/time";
import { MILESTONES, phaseOf, qualifier, wEnd, wStart } from "@/lib/weeks";
import { diffDays } from "@/lib/time";

export function Hero() {
  const { weeks, clock, team } = useApp();
  const w = weeks[clock.now - 1];
  const p = phaseOf(w.phase);
  const shown = clock.before ? 1 : clock.now;
  const next = MILESTONES.find(m => pd(m.date) >= clock.today);
  const scrimmage = MILESTONES.find(m => m.key === "scrim");
  const scrimDays = scrimmage ? daysTo(pd(scrimmage.date), clock) : -1;
  const qualDays = daysTo(pd(qualifier.date), clock);
  const facts = clock.after
    ? []
    : [
        next && next.key !== "scrim" && next.key !== "qual"
          ? {
              k: "Next",
              name: next.name,
              when:
                daysTo(pd(next.date), clock) === 0
                  ? "Today"
                  : `${fmt(pd(next.date))} · ${plural(daysTo(pd(next.date), clock), "day")}`,
            }
          : null,
        scrimmage && scrimDays >= 0
          ? {
              k: "Scrimmage",
              name: scrimDays === 0 ? "Today" : fmt(pd(scrimmage.date)),
              when: scrimDays === 0 ? scrimmage.name : plural(scrimDays, "day"),
            }
          : null,
        qualDays >= 0
          ? {
              k: "Qualifier",
              name: qualDays === 0 ? "Today" : fmt(pd(qualifier.date)),
              when: qualDays === 0 ? qualifier.name : plural(qualDays, "day"),
            }
          : null,
      ].filter((f): f is { k: string; name: string; when: string } => !!f);

  const lead = clock.before
    ? `Week 1 starts ${fmt(clock.first)}`
    : clock.after
      ? "Season complete"
      : p.name;
  const when = clock.before
    ? diffDays(clock.first, clock.today) === 1
      ? "Tomorrow"
      : `In ${plural(diffDays(clock.first, clock.today), "day")}`
    : clock.after
      ? "The dated plan has finished"
      : `${fmt(wStart(w))} – ${fmt(wEnd(w))}`;
  const note = clock.before
    ? "Do the short “Before Monday” list, then open Week 1."
    : clock.after
      ? "Use the debrief weeks again, or add the next event’s plan."
      : w.brk
        ? "Rest, or do the optional list."
        : `${w.title}.`;

  return (
    <section className="hero">
      <Shapes variant="hero" />
      <div className="wrap hero-in">
        <div className="eyebrow light">BIOBUZZ · Team {team}</div>
        <h1>
          <span className="wk">Week</span>
          <span className="big">{shown}</span>
          <span className="of">of {weeks.length}</span>
        </h1>
        {facts.length > 0 && (
          <dl className="hero-facts">
            {facts.map(f => (
              <div key={f.k}>
                <dt>{f.k}</dt>
                <dd>
                  <b>{f.name}</b>
                  <span>{f.when}</span>
                </dd>
              </div>
            ))}
          </dl>
        )}
        <p className="lede">
          <b>{lead}</b>
          <span>{when}</span>
        </p>
        <p className="hello">{note}</p>
        <div className="hero-actions">
          <Cta href={`/week/${shown}`} variant="light">
            Open this week’s plan
          </Cta>
          <Link className="ghost-link" href="/quests">
            Not sure what to do?
          </Link>
        </div>
      </div>
    </section>
  );
}

function NextMoves() {
  const { weeks, state, person, focus, clock, openProfile } = useApp();
  const mine = useMemo(() => myTasks(weeks, state, person).slice(0, 3), [weeks, state, person]);
  const open = useMemo(() => openTasks(weeks, state, focus, clock).slice(0, Math.max(0, 3 - mine.length)), [weeks, state, focus, clock, mine.length]);

  return (
    <section className="card moves" aria-labelledby="moves-h">
      <h2 id="moves-h">Your next moves</h2>
      {!person && (
        <p className="note">
          <button type="button" className="link-btn" onClick={openProfile}>
            Sign in
          </button>{" "}
          to grab a task.
        </p>
      )}
      {mine.length > 0 && (
        <div className="mv-block">
          <div className="label">You grabbed</div>
          {mine.map(({ w, it }) => (
            <Task key={it.id} it={it} showTrack weekLabel={`Week ${w.n}`} />
          ))}
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

function PaceLine() {
  const { weeks, state, clock } = useApp();
  const copy = PACE_COPY[pace(weeks, state.checks, clock).level];
  const shown = clock.before ? 1 : clock.now;
  return (
    <p className="pace-line">
      <b>{copy.title}.</b> {copy.line} <Link href={`/week/${shown}`}>Open this week</Link>
    </p>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.98 10.72A5.4 5.4 0 0 1 3.7 9c0-.6.1-1.18.28-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.02-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

/** The first thing a signed-out visitor sees. The plan stays one quiet link away. */
function SignInGate({ week }: { week: number }) {
  const [googleOn, setGoogleOn] = useState<boolean | null>(null);
  useEffect(() => {
    fetch("/api/auth/providers")
      .then(r => r.json())
      .then(p => setGoogleOn(!!p?.google))
      .catch(() => setGoogleOn(false));
  }, []);

  return (
    <section className="signin-gate">
      <Shapes variant="hero" />
      <div className="signin-card">
        <div className="eyebrow">BIOBUZZ</div>
        <h1>Sign in</h1>
        <p>Use the Google account Trinity School gave you. Next you’ll choose your team and what you work on.</p>
        <button type="button" className="google-btn" disabled={googleOn === false} onClick={() => signIn("google")}>
          <GoogleMark />
          Continue with Google
        </button>
        <p className="muted small center">Use your Trinity School Google account.</p>
        {googleOn === false && <p className="muted small center">Google sign-in isn’t configured on this server yet.</p>}
      </div>
      <Link className="signin-peek" href={`/week/${week}`}>
        Look at this week’s plan
      </Link>
    </section>
  );
}

export function HomeView() {
  const { clock, person } = useApp();
  const shown = clock.before ? 1 : clock.now;
  if (!person) return <SignInGate week={shown} />;
  return (
    <>
      <Hero />
      <div className="wrap overlap">
        <Tracker selected={shown} />
      </div>

      <div className="wrap stack-lg">
        <PaceLine />
        <BoredBanner />
        <NextMoves />
      </div>
    </>
  );
}
