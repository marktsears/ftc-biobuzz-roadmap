"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "./AppProvider";
import { CoachView } from "./CoachView";
import { KIND_ICON } from "./QuestCard";
import { LadderCard, StatusPill, doneSet, statusOf } from "./QuestStatus";
import { Task } from "./Task";
import { Tracker } from "./Tracker";
import { Cta, Icon, Shapes } from "./ui";
import { LADDERS, type Ladder } from "@/lib/data/ladders";
import { KIND_LABEL, questXp, type Quest } from "@/lib/data/quests";
import { PACE_COPY, daysTo, pace } from "@/lib/progress";
import { myTasks, openTasks } from "@/lib/pick";
import { fmt, pd, plural } from "@/lib/time";
import type { Assignment, Focus, Work } from "@/lib/types";
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
  const { flags } = useApp();
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
      {flags.week ? (
        <Link className="signin-peek" href={`/week/${week}`}>
          Look at this week’s plan
        </Link>
      ) : (
        <Link className="signin-peek" href="/quests">
          Look at the quests
        </Link>
      )}
    </section>
  );
}

function StudentHero({ count, stuck }: { count: number; stuck: number }) {
  const { person, team } = useApp();
  const first = person.split(" ")[0];
  const line =
    stuck > 0
      ? "Your coach can see where you’re stuck. Try a hint, or start another quest while you wait."
      : count > 0
        ? `Your coach picked ${plural(count, "quest")} for you this week.`
        : "Nothing from your coach yet this week. Pick a next step below.";
  return (
    <section className="page-hero home-hero">
      <Shapes variant="banner" />
      <div className="wrap">
        <div className="eyebrow light">BIOBUZZ · Team {team}</div>
        <h1>Hi {first}</h1>
        <p>{line}</p>
      </div>
    </section>
  );
}

interface Row {
  a: Assignment;
  q: Quest;
  w?: Work;
}

function AssignedRow({ a, q, w }: Row) {
  const { flags } = useApp();
  const s = statusOf(w);
  return (
    <li>
      <Link href={`/quests/${q.id}`} className={`arow s-${s}`} style={{ ["--tc" as string]: `var(--t-${q.track})` } as React.CSSProperties}>
        <span className="qc-ico">
          <Icon name={s === "checked" || s === "done" ? "check" : KIND_ICON[q.kind]} size={20} />
        </span>
        <span className="arow-main">
          <b>{q.title}</b>
          <small>
            {KIND_LABEL[q.kind]} · {q.mins} min{flags.xp ? ` · +${questXp(q)} XP` : ""}
          </small>
          {a.note && <em>“{a.note}” · {a.by}</em>}
          {w?.coach && <em className="coach">Coach: “{w.coach}”</em>}
        </span>
        <StatusPill w={w} />
        <Icon name="arrow" size={16} />
      </Link>
    </li>
  );
}

function MyQuests({ thisWeek, open, doneCount }: { thisWeek: Row[]; open: Row[]; doneCount: number }) {
  return (
    <section className="card my-quests" aria-labelledby="mq-h">
      <div className="strip-head">
        <h2 id="mq-h">Your quests</h2>
        {doneCount > 0 && <span className="muted small">{plural(doneCount, "quest")} done so far</span>}
      </div>
      {thisWeek.length === 0 && open.length === 0 ? (
        <p className="empty">Your coach hasn’t picked any quests for you yet. Start a ladder below, or ask what to work on.</p>
      ) : (
        <>
          {thisWeek.length > 0 && (
            <>
              <div className="label">This week</div>
              <ul className="arows">
                {thisWeek.map(r => (
                  <AssignedRow key={r.q.id} {...r} />
                ))}
              </ul>
            </>
          )}
          {open.length > 0 && (
            <>
              <div className="label">Still open from earlier</div>
              <ul className="arows">
                {open.map(r => (
                  <AssignedRow key={r.q.id} {...r} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}

function laddersToShow(focus: Focus, done: Set<string>): Ladder[] {
  const started = LADDERS.filter(l => l.steps.some(id => done.has(id)));
  if (started.length) return started.slice(0, 2);
  if (focus !== "all") return LADDERS.filter(l => l.track === focus).slice(0, 2);
  return LADDERS.filter(l => l.id === "onshape" || l.id === "code");
}

export function HomeView() {
  const { clock, person, flags, mine, questById, focus, admin } = useApp();
  const shown = clock.before ? 1 : clock.now;
  const rows = useMemo(
    () =>
      mine.assignments
        .filter(a => a.week <= shown)
        .flatMap((a): Row[] => {
          const q = questById(a.quest);
          return q ? [{ a, q, w: mine.work[a.quest] }] : [];
        }),
    [mine, questById, shown],
  );
  if (admin) return <CoachView />;
  if (!person) return <SignInGate week={shown} />;

  const thisWeek = rows.filter(r => r.a.week === shown);
  const open = rows.filter(r => r.a.week < shown && r.w?.status !== "done");
  const stuck = rows.filter(r => r.w?.status === "stuck").length;
  const doneCount = Object.values(mine.work).filter(w => w.status === "done").length;

  return (
    <>
      {flags.season ? (
        <>
          <Hero />
          <div className="wrap overlap">
            <Tracker selected={shown} />
          </div>
        </>
      ) : (
        <StudentHero count={thisWeek.length} stuck={stuck} />
      )}

      <div className={`wrap stack-lg ${flags.season ? "" : "pull"}`}>
        {flags.season && <PaceLine />}
        <MyQuests thisWeek={thisWeek} open={open} doneCount={doneCount} />

        {rows.some(r => r.w?.status !== "done") ? (
          <p className="muted">
            Want something else? <Link href="/quests">See all the quests and ladders</Link>
          </p>
        ) : (
          <section aria-labelledby="own-h">
            <div className="strip-head">
              <div>
                <h2 id="own-h" className="h-section">
                  Start here
                </h2>
                <p className="muted">Each ladder starts from zero. Do the next step.</p>
              </div>
              <Link className="btn sm" href="/quests">
                All quests →
              </Link>
            </div>
            <div className="ladders">
              {laddersToShow(focus, doneSet(mine.work)).map(l => (
                <LadderCard key={l.id} l={l} />
              ))}
            </div>
          </section>
        )}

        {flags.teamTasks && <NextMoves />}
      </div>
    </>
  );
}
