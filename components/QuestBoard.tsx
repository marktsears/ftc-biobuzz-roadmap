"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "./AppProvider";
import { KIND_ICON, QuestCard } from "./QuestCard";
import { Task } from "./Task";
import { Cta, Icon, Shapes } from "./ui";
import { KIND_LABEL, LEVEL_LABEL, QUESTS, questXp, type QuestKind, type QuestLevel } from "@/lib/data/quests";
import { TRACKS } from "@/lib/data/core";
import { iso } from "@/lib/time";
import { openTasks, questCrew, questsDoneBy, rankQuests } from "@/lib/pick";
import type { Focus } from "@/lib/types";

const TIMES: { label: string; max: number | undefined }[] = [
  { label: "Any time", max: undefined },
  { label: "Under 15 min", max: 15 },
  { label: "Under 30 min", max: 30 },
  { label: "Under 45 min", max: 45 },
];
const KINDS = Object.keys(KIND_LABEL) as QuestKind[];

export function QuestBoard() {
  const { state, person, focus, clock, weeks } = useApp();
  const done = useMemo(() => questsDoneBy(state, person), [state, person]);
  const day = iso(clock.today);

  const [maxMins, setMaxMins] = useState<number | undefined>(undefined);
  const [kind, setKind] = useState<QuestKind | "all">("all");
  const [level, setLevel] = useState<QuestLevel | "all">("all");
  const [track, setTrack] = useState<Focus>(focus);
  const [hideDone, setHideDone] = useState(false);
  const [shuffle, setShuffle] = useState(0);

  const ranked = useMemo(() => rankQuests({ quests: QUESTS, done, focus: track, week: clock.now, seed: day, includeDone: true }), [done, track, clock.now, day]);
  const daily = useMemo(() => {
    const pool = rankQuests({ quests: QUESTS, done, focus, week: clock.now, seed: day, maxMins: 45 });
    return pool.length ? pool[shuffle % pool.length] : null;
  }, [done, focus, clock.now, day, shuffle]);

  const shown = ranked.filter(q => (!maxMins || q.mins <= maxMins) && (kind === "all" || q.kind === kind) && (level === "all" || q.level === level) && (track === "all" || q.track === track) && (!hideDone || !done.has(q.id)));
  const mineDone = QUESTS.filter(q => done.has(q.id)).length;
  const tasks = useMemo(() => openTasks(weeks, state, focus, clock).slice(0, 5), [weeks, state, focus, clock]);

  return (
    <>
      <section className="page-hero quest-hero">
        <Shapes variant="banner" />
        <div className="wrap">
          <div className="eyebrow light">Quest board</div>
          <h1>Not sure what to do? Bored?</h1>
          <p>Pick a quest. Watch something good, design a part, write a little code, take a quiz, or get your hands on the robot. Each one is small, finishable today, and gets you XP. Lots of them help your team right now.</p>
          <div className="quest-progress">
            <b>{mineDone}</b> of {QUESTS.length} quests done{person ? ` by ${person}` : ""}
          </div>
        </div>
      </section>

      <div className="wrap stack-lg pull">
        {daily && (
          <section className="qotd" aria-labelledby="qotd-h">
            <div className="qotd-arch" aria-hidden="true">
              <Icon name={KIND_ICON[daily.kind]} size={64} />
            </div>
            <div className="qotd-body">
              <div className="eyebrow">Quest of the day</div>
              <h2 id="qotd-h">{daily.title}</h2>
              <p>{daily.blurb}</p>
              <div className="qc-meta">
                <span>
                  <Icon name="clock" size={14} /> {daily.mins} min
                </span>
                <span>{KIND_LABEL[daily.kind]}</span>
                <span>{LEVEL_LABEL[daily.level]}</span>
                <span className="qc-xp">+{questXp(daily)} XP</span>
                {daily.helpsTeam && <span className="qc-help">Helps the team</span>}
              </div>
              <div className="qotd-cta">
                <Cta href={`/quests/${daily.id}`} variant="solid">
                  Start this quest
                </Cta>
                <button type="button" className="ghost-btn dark" onClick={() => setShuffle(s => s + 1)}>
                  <Icon name="shuffle" size={16} /> Show me another
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="filters card" aria-label="Find a quest">
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
            <span className="label">What sounds good?</span>
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
          <div className="f-row">
            <span className="label">For</span>
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
            <label className="toggle">
              <input type="checkbox" checked={hideDone} onChange={e => setHideDone(e.target.checked)} /> Hide the ones I’ve done
            </label>
          </div>
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
                <QuestCard key={q.id} q={q} done={done.has(q.id)} crew={questCrew(state, q.id).length} />
              ))}
            </div>
          ) : (
            <p className="empty">Nothing matches. Try “Anything” and “Any time”.</p>
          )}
        </section>

        <section className="card" aria-labelledby="grab-h">
          <div className="strip-head">
            <div>
              <div className="eyebrow">Or help the team right now</div>
              <h2 id="grab-h">Open tasks nobody has grabbed</h2>
            </div>
            <Link className="btn sm" href={`/week/${clock.before ? 1 : clock.now}`}>
              See the week →
            </Link>
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
      </div>
    </>
  );
}
