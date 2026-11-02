"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "./AppProvider";
import { KIND_ICON, QuestCard } from "./QuestCard";
import { PreviewBar, usePreviewEmail, usePreviewStudent } from "./preview";
import { LadderCard, doneSet, laddersFor } from "./QuestStatus";
import { Task } from "./Task";
import { Icon, Shapes } from "./ui";
import { nextRung } from "@/lib/data/ladders";
import { KIND_LABEL, LEVEL_LABEL, type Quest, type QuestKind, type QuestLevel } from "@/lib/data/quests";
import { TRACKS } from "@/lib/data/core";
import { iso } from "@/lib/time";
import { openTasks, questCrew, rankQuests } from "@/lib/pick";
import type { Focus } from "@/lib/types";

const TIMES: { label: string; max: number | undefined }[] = [
  { label: "Any time", max: undefined },
  { label: "Under 15 min", max: 15 },
  { label: "Under 30 min", max: 30 },
  { label: "Under 45 min", max: 45 },
];
const KINDS = Object.keys(KIND_LABEL) as QuestKind[];

export function QuestBoard() {
  const { state, person, focus, clock, weeks, mine, allQuests, flags, admin } = useApp();
  const previewEmail = usePreviewEmail();
  const preview = usePreviewStudent();
  const asCoach = admin && !previewEmail;
  const boardWork = preview.student ? preview.work : mine.work;
  const boardFocus = preview.student?.focus && preview.student.focus !== "all" ? preview.student.focus : previewEmail ? "all" : focus;
  const done = useMemo(() => doneSet(boardWork), [boardWork]);
  const day = iso(clock.today);
  const trackBase: Focus = asCoach ? "all" : boardFocus;

  const [maxMins, setMaxMins] = useState<number | undefined>(undefined);
  const [kind, setKind] = useState<QuestKind | "all">("all");
  const [level, setLevel] = useState<QuestLevel | "all">("all");
  const [track, setTrack] = useState<Focus>(trackBase);
  const [hideDone, setHideDone] = useState(false);
  const [query, setQuery] = useState("");
  const [more, setMore] = useState(false);
  const extraOn = (level !== "all" ? 1 : 0) + (track !== trackBase ? 1 : 0) + (!asCoach && hideDone ? 1 : 0);

  const ranked = useMemo(() => rankQuests({ quests: allQuests, done, focus: track, week: clock.now, seed: day, includeDone: true, stable: true }), [allQuests, done, track, clock.now, day]);
  const qtext = query.trim().toLowerCase();
  const shown = ranked.filter(q => (!maxMins || q.mins <= maxMins) && (kind === "all" || q.kind === kind) && (level === "all" || q.level === level) && (track === "all" || q.track === track) && (!hideDone || !done.has(q.id)) && (!qtext || `${q.title} ${q.blurb}`.toLowerCase().includes(qtext)));
  const suggestions = useMemo(() => {
    const out: Quest[] = [];
    for (const l of laddersFor(boardFocus)) {
      const id = nextRung(l, done);
      const q = id ? allQuests.find(x => x.id === id) : undefined;
      if (q) out.push(q);
      if (out.length === 3) break;
    }
    return out;
  }, [boardFocus, done, allQuests]);
  const mineDone = allQuests.filter(q => done.has(q.id)).length;
  const tasks = useMemo(() => (flags.teamTasks ? openTasks(weeks, state, focus, clock).slice(0, 5) : []), [flags.teamTasks, weeks, state, focus, clock]);

  if (previewEmail && !preview.student) {
    return (
      <>
        <PreviewBar />
        <p className="wrap">{preview.missing ? "That student isn’t on your class list." : "Loading their screen…"}</p>
      </>
    );
  }

  return (
    <>
      {preview.student && <PreviewBar name={preview.student.name} />}
      <section className="page-hero quest-hero">
        <Shapes variant="banner" />
        <div className="wrap">
          <div className="eyebrow light">Quests</div>
          <h1>{asCoach ? "Every quest" : "Not sure what to do?"}</h1>
          <p>
            {asCoach
              ? "Open one to read the steps, the time, and what a student has to show you. Assigning still happens from your class."
              : "Every quest is small enough to finish today. Pick a ladder and do the next step, or find one below."}
          </p>
          {(preview.student || (person && !asCoach)) && (
            <div className="quest-progress">
              <b>{mineDone}</b> of {allQuests.length} done
            </div>
          )}
        </div>
      </section>

      <div className="wrap stack-lg pull">
        <details className="card ladders-card">
          <summary id="ladders-h">Ladders</summary>
          <p className="muted small">{asCoach ? "Students climb these in order. Open a step to read it before you assign it." : "Each one starts from zero and ends with real robot work."}</p>
          <div className="ladders">
            {laddersFor(asCoach ? "all" : boardFocus).map(l => (
              <LadderCard key={l.id} l={l} coach={asCoach} done={preview.student ? done : undefined} as={previewEmail} />
            ))}
          </div>
        </details>

        {!asCoach && suggestions.length > 0 && (
          <section aria-labelledby="next-h">
            <h2 id="next-h" className="h-section">
              Next for you
            </h2>
            <div className="qgrid">
              {suggestions.map(q => (
                <QuestCard key={q.id} q={q} done={done.has(q.id)} as={previewEmail} />
              ))}
            </div>
          </section>
        )}

        <section className="filters card" aria-label="Find a quest">
          <label className="field">
            <span className="label">Search</span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search quests" aria-label="Search quests" />
          </label>
          <div className="f-row">
            <span className="label">How much time?</span>
            <div className="chips">
              {TIMES.map(t => (
                <button key={t.label} type="button" className={`chip ${maxMins === t.max ? "on" : ""}`} aria-pressed={maxMins === t.max} onClick={() => setMaxMins(t.max)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="f-row">
            <span className="label">{asCoach ? "Kind" : "What sounds good?"}</span>
            <div className="chips">
              <button type="button" className={`chip ${kind === "all" ? "on" : ""}`} aria-pressed={kind === "all"} onClick={() => setKind("all")}>
                Anything
              </button>
              {KINDS.map(k => (
                <button key={k} type="button" className={`chip ${kind === k ? "on" : ""}`} aria-pressed={kind === k} onClick={() => setKind(k)}>
                  <Icon name={KIND_ICON[k]} size={15} /> {KIND_LABEL[k]}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="link-btn" aria-expanded={more} onClick={() => setMore(m => !m)}>
            {more ? "Fewer filters" : `More filters${extraOn ? ` (${extraOn})` : ""}`}
          </button>
          {more && (
            <>
              <div className="f-row">
                <span className="label">{asCoach ? "Track" : "For"}</span>
                <div className="chips">
                  {(["all", "B", "S", "D", "O"] as Focus[]).map(t => (
                    <button key={t} type="button" className={`chip ${track === t ? "on" : ""}`} aria-pressed={track === t} onClick={() => setTrack(t)}>
                      {t === "all" ? "Everything" : TRACKS[t].short}
                    </button>
                  ))}
                </div>
              </div>
              <div className="f-row">
                <span className="label">Level</span>
                <div className="chips">
                  {(["all", 1, 2, 3] as (QuestLevel | "all")[]).map(l => (
                    <button key={l} type="button" className={`chip ${level === l ? "on" : ""}`} aria-pressed={level === l} onClick={() => setLevel(l)}>
                      {l === "all" ? "Any" : LEVEL_LABEL[l]}
                    </button>
                  ))}
                </div>
                {!asCoach && (
                  <label className="toggle">
                    <input type="checkbox" checked={hideDone} onChange={e => setHideDone(e.target.checked)} /> Hide the ones I’ve done
                  </label>
                )}
              </div>
            </>
          )}
        </section>

        <section aria-label="All quests">
          <div className="strip-head">
            <h2 className="h-section">
              {shown.length} {shown.length === 1 ? "quest" : "quests"}
            </h2>
          </div>
          {shown.length ? (
            <div className="qgrid">
              {shown.map(q => (
                <QuestCard key={q.id} q={q} done={asCoach ? false : done.has(q.id)} crew={asCoach ? 0 : questCrew(state, q.id).length} as={previewEmail} />
              ))}
            </div>
          ) : (
            <p className="empty">Nothing matches. Try “Anything” and “Any time”.</p>
          )}
        </section>

        {!asCoach && flags.teamTasks && (
          <section className="card" aria-labelledby="grab-h">
            <div className="strip-head">
              <div>
                <div className="eyebrow">Or help the team right now</div>
                <h2 id="grab-h">Open tasks nobody has grabbed</h2>
              </div>
              {flags.week && (
                <Link className="btn sm" href={`/week/${clock.before ? 1 : clock.now}`}>
                  See the week →
                </Link>
              )}
            </div>
            {tasks.length ? (
              <div className="tasks">
                {tasks.map(({ w, it }) => (
                  <Task key={it.id} it={it} showTrack weekLabel={`Week ${w.n}`} />
                ))}
              </div>
            ) : (
              <p className="empty">Everything is grabbed or done. Nice. Pick a quest.</p>
            )}
          </section>
        )}
      </div>
    </>
  );
}
