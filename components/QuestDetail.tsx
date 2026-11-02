"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "./AppProvider";
import { KIND_ICON, QuestCard } from "./QuestCard";
import { StatusPill, doneSet, statusOf } from "./QuestStatus";
import { Avatar, Icon, Shapes } from "./ui";
import { KIND_LABEL, LEVEL_LABEL, questXp, type Quest } from "@/lib/data/quests";
import { LADDER_OF } from "@/lib/data/ladders";
import { TRACKS } from "@/lib/data/core";
import { ago } from "@/lib/time";
import { questCrew, rankQuests } from "@/lib/pick";

export function QuestDetail({ q }: { q: Quest }) {
  const { state, mine, focus, clock, flags, allQuests, questById } = useApp();
  const done = useMemo(() => doneSet(mine.work), [mine.work]);
  const crew = questCrew(state, q.id);
  const [steps, setSteps] = useState<boolean[]>(() => q.steps.map(() => false));
  const rung = LADDER_OF[q.id];
  const assigned = mine.assignments.find(a => a.quest === q.id);

  const next = useMemo(() => {
    if (rung) {
      const after = rung.ladder.steps.slice(rung.idx + 1).find(id => !done.has(id));
      const nq = after && questById(after);
      if (nq) return [nq];
    }
    return rankQuests({ quests: allQuests.filter(x => x.id !== q.id), done, focus, week: clock.now, seed: "next" + q.id, maxMins: 45 }).slice(0, 2);
  }, [rung, done, questById, allQuests, q.id, focus, clock.now]);
  const stepsDone = steps.filter(Boolean).length;

  return (
    <>
      <section className="page-hero quest-hero" style={{ ["--tc" as string]: `var(--t-${q.track})` } as React.CSSProperties}>
        <Shapes variant="banner" />
        <div className="wrap">
          <Link href="/quests" className="back-link">
            <Icon name="left" size={16} /> Quests
          </Link>
          <div className="qd-kind">
            <span className="qc-ico lg">
              <Icon name={KIND_ICON[q.kind]} size={26} />
            </span>
            <span className="eyebrow light">
              {KIND_LABEL[q.kind]} · {TRACKS[q.track].name}
            </span>
          </div>
          <h1>{q.title}</h1>
          <p>{q.blurb}</p>
          <div className="qd-meta">
            <span>
              <Icon name="clock" size={15} /> {q.mins} min
            </span>
            <span>{LEVEL_LABEL[q.level]}</span>
            {flags.xp && <span className="xp">+{questXp(q)} XP</span>}
            {q.helpsTeam && <span className="help">Helps the team</span>}
            {rung && (
              <span>
                {rung.ladder.name} · step {rung.idx + 1} of {rung.ladder.steps.length}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="wrap qd-grid pull">
        <div className="qd-main">
          {assigned && (
            <section className="card assigned-note">
              <Icon name="flag" size={18} />
              <p>
                <b>{assigned.by} picked this for you</b> for Week {assigned.week}.{assigned.note ? ` “${assigned.note}”` : ""}
              </p>
            </section>
          )}

          {q.why && (
            <section className="card">
              <div className="label">Why it matters</div>
              <p className="why-line">{q.why}</p>
            </section>
          )}

          {!q.quiz && (
            <section className="card">
              <div className="strip-head">
                <h2>Do this</h2>
                <span className="mono">
                  {stepsDone}/{q.steps.length}
                </span>
              </div>
              <ol className="steps">
                {q.steps.map((s, i) => (
                  <li key={i} className={steps[i] ? "on" : ""}>
                    <label>
                      <input type="checkbox" checked={steps[i]} onChange={e => setSteps(a => a.map((v, j) => (j === i ? e.target.checked : v)))} />
                      <span className="box" aria-hidden="true">
                        <Icon name="check" size={14} />
                      </span>
                      <span>{s}</span>
                    </label>
                  </li>
                ))}
              </ol>
              <p className="muted small">These boxes are just for you while you work.</p>
            </section>
          )}

          {q.resources.length > 0 && (
            <section className="card">
              <h2>Learn from</h2>
              <ul className="res">
                {q.resources.map(r => (
                  <li key={r.url}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer">
                      <span className="res-ico">
                        <Icon name={r.url.includes("youtube.com") ? "play" : "link"} size={18} />
                      </span>
                      <span>
                        <b>{r.label}</b>
                        {r.note && <small>{r.note}</small>}
                      </span>
                      <Icon name="arrow" size={16} />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {q.hints && q.hints.length > 0 && (
            <details className="card hints">
              <summary>Open a hint</summary>
              <ul className="plain">
                {q.hints.map(h => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </details>
          )}
        </div>

        <aside className="qd-side">
          <section className="card claim">{q.quiz ? <Quiz q={q} /> : <WorkPanel q={q} />}</section>

          {crew.length > 0 && (
            <section className="card crew">
              <div className="label">Who’s done this</div>
              <ul>
                {crew.map(c => (
                  <li key={c.by}>
                    <Avatar name={c.by} size={28} />
                    <span>
                      <b>{c.by}</b> <small>{ago(c.at)}</small>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="muted small">Stuck? Ask one of them.</p>
            </section>
          )}
        </aside>
      </div>

      {next.length > 0 && (
        <div className="wrap stack-lg">
          <section>
            <div className="strip-head">
              <h2 className="h-section">{rung && next.length === 1 ? `Next in ${rung.ladder.name}` : "What next?"}</h2>
            </div>
            <div className="qgrid two">
              {next.map(x => (
                <QuestCard key={x.id} q={x} done={done.has(x.id)} />
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

/** Start it, say you're stuck, or finish it and show what you made. */
function WorkPanel({ q }: { q: Quest }) {
  const { person, openProfile, mine, setWork } = useApp();
  const w = mine.work[q.id];
  const s = statusOf(w);
  const [mode, setMode] = useState<"stuck" | "done" | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (st: "doing" | "stuck" | "done" | null, t?: string) => {
    if (!person) return openProfile();
    setBusy(true);
    const ok = await setWork(q.id, st, t);
    setBusy(false);
    if (ok) {
      setMode(null);
      setText("");
    }
  };

  return (
    <div className="work">
      <div className="strip-head">
        <div className="label">Your progress</div>
        <StatusPill w={w} />
      </div>

      {w?.coach && (
        <p className="coach-note">
          <b>Coach:</b> “{w.coach}”
        </p>
      )}
      {s === "stuck" && w?.stuck && (
        <p className="muted small">
          You said: “{w.stuck}”. Your coach can see this.
        </p>
      )}
      {(s === "done" || s === "checked") && (
        <div className="doneblock">
          <Icon name="check" size={20} />
          <div>
            <b>{s === "checked" ? `Checked by ${w!.checkedBy}` : "Done. Your coach will check it."}</b>
            {w?.proof && <small>“{w.proof}”</small>}
          </div>
        </div>
      )}

      {mode === null && s !== "done" && s !== "checked" && (
        <>
          <p className="show-it">
            <b>To finish:</b> {q.proof}
          </p>
          <div className="work-actions">
            <button type="button" className="cta solid block" disabled={busy} onClick={() => setMode("done")}>
              <span>I finished it</span>
              <i className="cta-dot" aria-hidden="true">
                <Icon name="check" size={16} />
              </i>
            </button>
            {s === "none" && (
              <button type="button" className="btn" disabled={busy} onClick={() => save("doing")}>
                Start it
              </button>
            )}
            <button type="button" className="btn stuck-btn" disabled={busy} onClick={() => setMode("stuck")}>
              I’m stuck
            </button>
          </div>
        </>
      )}

      {mode === "done" && (
        <form
          className="work-form"
          onSubmit={e => {
            e.preventDefault();
            void save("done", text);
          }}
        >
          <label className="field">
            <span>Show what you made: paste a link (Onshape, GitHub, a photo) or write one sentence.</span>
            <textarea value={text} onChange={e => setText(e.target.value)} maxLength={500} rows={3} placeholder="https://cad.onshape.com/… or: I learned that…" autoFocus />
          </label>
          <div className="work-actions row">
            <button type="submit" className="cta solid" disabled={busy || !text.trim()}>
              <span>Send to my coach</span>
            </button>
            <button type="button" className="link-btn" onClick={() => setMode(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "stuck" && (
        <form
          className="work-form"
          onSubmit={e => {
            e.preventDefault();
            void save("stuck", text);
          }}
        >
          <label className="field">
            <span>What’s got you stuck? One sentence is enough.</span>
            <textarea value={text} onChange={e => setText(e.target.value)} maxLength={500} rows={3} placeholder="I can’t find where to…" autoFocus />
          </label>
          <div className="work-actions row">
            <button type="submit" className="cta solid" disabled={busy || !text.trim()}>
              <span>Tell my coach</span>
            </button>
            <button type="button" className="link-btn" onClick={() => setMode(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {s !== "none" && mode === null && (
        <button type="button" className="link-btn" disabled={busy} onClick={() => save(s === "doing" ? null : "doing")}>
          {s === "stuck" ? "I’m not stuck anymore" : s === "doing" ? "Undo" : "Not finished after all"}
        </button>
      )}
    </div>
  );
}

function Quiz({ q }: { q: Quest }) {
  const { person, openProfile, mine, setWork, flags } = useApp();
  const qs = q.quiz!;
  const [picks, setPicks] = useState<(number | null)[]>(() => qs.map(() => null));
  const [round, setRound] = useState(0);
  const answered = picks.filter(p => p !== null).length;
  const score = picks.reduce<number>((n, p, i) => n + (p === qs[i].answer ? 1 : 0), 0);
  const need = Math.ceil(qs.length * 0.8);
  const finished = answered === qs.length;
  const passed = finished && score >= need;
  const already = mine.work[q.id]?.status === "done";

  const choose = (i: number, a: number) => {
    if (picks[i] !== null) return;
    const next = picks.map((p, j) => (j === i ? a : p));
    setPicks(next);
    const fin = next.every(p => p !== null);
    const sc = next.reduce<number>((n, p, k) => n + (p === qs[k].answer ? 1 : 0), 0);
    if (fin && sc >= need && !already) {
      if (!person) openProfile();
      else void setWork(q.id, "done", `Quiz ${sc}/${qs.length}`);
    }
  };

  return (
    <div className="quiz" key={round}>
      <div className="strip-head">
        <div className="label">The quiz</div>
        <span className="mono">
          {answered}/{qs.length}
        </span>
      </div>
      <p className="muted small">
        You need {need} of {qs.length} to pass. Retake as often as you like.
      </p>
      {qs.map((item, i) => (
        <fieldset key={i} className="qq">
          <legend>
            {i + 1}. {item.q}
          </legend>
          {item.options.map((o, a) => {
            const picked = picks[i] === a;
            const reveal = picks[i] !== null;
            const cls = reveal ? (a === item.answer ? "right" : picked ? "wrong" : "") : "";
            return (
              <button key={a} type="button" className={`opt ${picked ? "picked" : ""} ${cls}`} onClick={() => choose(i, a)} disabled={reveal} aria-pressed={picked}>
                {o}
              </button>
            );
          })}
          {picks[i] !== null && <p className={`why-a ${picks[i] === item.answer ? "ok" : "no"}`}>{picks[i] === item.answer ? "Right. " : "Not quite. "}{item.why}</p>}
        </fieldset>
      ))}
      {finished && (
        <div className={`quiz-result ${passed ? "pass" : "retry"}`}>
          <b>{passed ? `You passed: ${score} of ${qs.length}` : `${score} of ${qs.length}. So close.`}</b>
          <span>{passed ? (already ? "Already counted." : flags.xp ? `+${questXp(q)} XP` : "Your coach can see it.") : "Read the explanations and try again."}</span>
          {!passed && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setPicks(qs.map(() => null));
                setRound(r => r + 1);
              }}
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
