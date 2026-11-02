"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "./AppProvider";
import { KIND_ICON, QuestCard } from "./QuestCard";
import { StatusPill, doneSet, statusOf } from "./QuestStatus";
import { RichText } from "./RichText";
import { Avatar, Icon, Shapes } from "./ui";
import { QUIZ_CHECKER } from "@/lib/coach";
import { KIND_LABEL, LEVEL_LABEL, questXp, type Quest, type Step } from "@/lib/data/quests";

const stepText = (s: Step) => (typeof s === "string" ? s : s.t);
const stepOk = (s: Step) => (typeof s === "string" ? undefined : s.ok);
const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};
import { LADDER_OF } from "@/lib/data/ladders";
import { TRACKS } from "@/lib/data/core";
import { ago } from "@/lib/time";
import { questCrew, rankQuests } from "@/lib/pick";

export function QuestDetail({ q }: { q: Quest }) {
  const { state, mine, focus, clock, flags, allQuests, questById, email, person, setWork, admin } = useApp();
  const done = useMemo(() => doneSet(mine.work), [mine.work]);
  const crew = questCrew(state, q.id);
  const stepKey = `tr-steps:${email}:${q.id}`;
  const [steps, setSteps] = useState<boolean[]>(() => q.steps.map(() => false));
  const markedDoing = useRef(false);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(stepKey) || "null") as unknown;
      if (Array.isArray(raw) && raw.length === q.steps.length && raw.every(x => typeof x === "boolean")) setSteps(raw as boolean[]);
    } catch {}
  }, [stepKey, q.steps.length]);
  const rung = LADDER_OF[q.id];
  const assigned = mine.assignments.find(a => a.quest === q.id);

  const next = useMemo(() => {
    if (rung) {
      const after = admin ? rung.ladder.steps[rung.idx + 1] : rung.ladder.steps.slice(rung.idx + 1).find(id => !done.has(id));
      const nq = after && questById(after);
      if (nq) return [nq];
      if (admin) return [];
    }
    if (admin) return [];
    return rankQuests({ quests: allQuests.filter(x => x.id !== q.id), done, focus, week: clock.now, seed: "next" + q.id, maxMins: 45 }).slice(0, 2);
  }, [rung, done, questById, allQuests, q.id, focus, clock.now, admin]);
  const stepsDone = steps.filter(Boolean).length;
  const prereqs = (q.before ?? []).map(id => questById(id)).filter((x): x is Quest => !!x);

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
          {assigned && !admin && (
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
              <p className="why-line">
                <RichText text={q.why} />
              </p>
            </section>
          )}

          {(prereqs.length > 0 || (q.needs && q.needs.length > 0) || q.careful) && (
            <section className="card getready">
              {prereqs.length > 0 && (
                <div className="gr-block">
                  <div className="label">{admin ? "They should do these first" : "Do these first"}</div>
                  <ul className="prereq">
                    {prereqs.map(p => (
                      <li key={p.id}>
                        <Link href={`/quests/${p.id}`} className={done.has(p.id) ? "on" : ""}>
                          <Icon name={done.has(p.id) ? "check" : KIND_ICON[p.kind]} size={15} />
                          <span>{p.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {q.needs && q.needs.length > 0 && (
                <div className="gr-block">
                  <div className="label">{admin ? "They’ll need" : "You’ll need"}</div>
                  <ul className="plain gr-needs">
                    {q.needs.map(n => (
                      <li key={n}>
                        <RichText text={n} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {q.careful && (
                <p className="careful">
                  <Icon name="flag" size={18} />
                  <span>
                    <b>Be careful.</b> <RichText text={q.careful} />
                  </span>
                </p>
              )}
            </section>
          )}

          {!q.quiz && (
            <section className="card">
              <div className="strip-head">
                <h2>{admin ? "What they do" : "Do this"}</h2>
                {!admin && (
                  <span className="mono">
                    {stepsDone}/{q.steps.length}
                  </span>
                )}
              </div>
              {admin ? (
                <ol className="steps preview">
                  {q.steps.map((s, i) => {
                    const ok = stepOk(s);
                    return (
                      <li key={i}>
                        <RichText text={stepText(s)} />
                        {ok && (
                          <p className="step-ok">
                            <b>It worked when</b> <RichText text={ok} />
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <ol className="steps">
                  {q.steps.map((s, i) => {
                    const ok = stepOk(s);
                    return (
                      <li key={i} className={steps[i] ? "on" : ""}>
                        <label>
                          <input
                            type="checkbox"
                            checked={steps[i]}
                            onChange={e => {
                              const next = steps.map((v, j) => (j === i ? e.target.checked : v));
                              setSteps(next);
                              try {
                                localStorage.setItem(stepKey, JSON.stringify(next));
                              } catch {}
                              if (e.target.checked && !markedDoing.current && statusOf(mine.work[q.id]) === "none" && person) {
                                markedDoing.current = true;
                                void setWork(q.id, "doing");
                              }
                            }}
                          />
                          <span className="box" aria-hidden="true">
                            <Icon name="check" size={14} />
                          </span>
                          <span>
                            <RichText text={stepText(s)} />
                          </span>
                        </label>
                        {ok && (
                          <p className="step-ok">
                            <b>You’ll know it worked when</b> <RichText text={ok} />
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
              {!admin && <p className="muted small">These boxes stay on this computer. They are just for you while you work.</p>}
            </section>
          )}

          {q.resources.length > 0 && (
            <section className="card">
              <h2>Learn from</h2>
              <ul className="res">
                {q.resources.map((r, i) => (
                  <li key={r.url}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer">
                      <span className="res-ico">
                        <Icon name={r.url.includes("youtube.com") ? "play" : "link"} size={18} />
                      </span>
                      <span>
                        {i === 0 && q.resources.length > 1 && <em className="start-tag">Start here</em>}
                        <b>{r.label}</b>
                        {r.note && <small>{r.note}</small>}
                        <small className="res-host">{hostOf(r.url)}</small>
                      </span>
                      <Icon name="arrow" size={16} />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {q.stretch && (
            <section className="card stretch">
              <div className="label">{admin ? "If they finish early" : "Finished early? Want more?"}</div>
              <p>
                <RichText text={q.stretch} />
              </p>
            </section>
          )}

          {q.hints && q.hints.length > 0 && (
            <details className="card hints">
              <summary>{admin ? "Hints they can open" : "Open a hint"}</summary>
              <ul className="plain">
                {q.hints.map(h => (
                  <li key={h}>
                    <RichText text={h} />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        <aside className="qd-side">
          {admin ? (
            <>
              <section className="card claim">
                <CoachGlance q={q} />
              </section>
              {q.quiz && (
                <section className="card claim">
                  <Quiz q={q} preview />
                </section>
              )}
            </>
          ) : (
            <section className="card claim">{q.quiz ? <Quiz q={q} /> : <WorkPanel q={q} />}</section>
          )}

          {!admin && crew.length > 0 && (
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
                <QuestCard key={x.id} q={x} done={admin ? false : done.has(x.id)} />
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

/** What the coach is asking a student to show. Opening the quest does not assign it. */
function CoachGlance({ q }: { q: Quest }) {
  const need = q.quiz ? Math.ceil(q.quiz.length * 0.8) : 0;
  return (
    <div className="work">
      <div className="label">What they have to show you</div>
      <p className="show-it">
        <RichText text={q.proof} />
      </p>
      {q.reflect && (
        <p className="show-it reflect">
          <b>Then they answer:</b> <RichText text={q.reflect} />
        </p>
      )}
      {q.quiz && (
        <p className="muted small">
          It’s a quiz. They need {need} of {q.quiz.length}. A pass shows up on your class page. Trying the questions here doesn’t count.
        </p>
      )}
    </div>
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
            <b>{w?.checkedBy === QUIZ_CHECKER ? "Passed" : s === "checked" ? `Checked by ${w!.checkedBy}` : "Done. Your coach will check it."}</b>
            {w?.proof && <small>“{w.proof}”</small>}
          </div>
        </div>
      )}

      {mode === null && s !== "done" && s !== "checked" && (
        <>
          <p className="show-it">
            <b>To finish:</b> <RichText text={q.proof} />
          </p>
          {q.reflect && (
            <p className="show-it reflect">
              <b>Then think:</b> <RichText text={q.reflect} />
            </p>
          )}
          <div className="work-actions">
            {s === "none" ? (
              <button type="button" className="cta solid block" disabled={busy} onClick={() => save("doing")}>
                <span>Start it</span>
                <i className="cta-dot" aria-hidden="true">
                  <Icon name="arrow" size={16} />
                </i>
              </button>
            ) : null}
            <button type="button" className={s === "none" ? "btn" : "cta solid block"} disabled={busy} onClick={() => setMode("done")}>
              <span>I finished it</span>
              {s !== "none" && (
                <i className="cta-dot" aria-hidden="true">
                  <Icon name="check" size={16} />
                </i>
              )}
            </button>
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
            <span>
              Show what you made: paste a link (Onshape, GitHub, a photo) or write one sentence.
              {q.reflect ? ` Then answer in a sentence: ${q.reflect}` : ""}
            </span>
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

function mix(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return h;
}

function Quiz({ q, preview }: { q: Quest; preview?: boolean }) {
  const { person, openProfile, mine, setWork, flags } = useApp();
  const qs = q.quiz!;
  const [picks, setPicks] = useState<(number | null)[]>(() => qs.map(() => null));
  const [round, setRound] = useState(0);
  const [justPassed, setJustPassed] = useState(false);
  const answered = picks.filter(p => p !== null).length;
  const score = picks.reduce<number>((n, p, i) => n + (p === qs[i].answer ? 1 : 0), 0);
  const need = Math.ceil(qs.length * 0.8);
  const finished = answered === qs.length;
  const passed = finished && score >= need;
  const already = mine.work[q.id]?.status === "done";
  const order = useMemo(
    () =>
      qs.map((item, i) => {
        const idx = item.options.map((_, a) => a);
        if (round === 0) return idx;
        return [...idx].sort((a, b) => mix(`${q.id}:${round}:${i}:${a}`) - mix(`${q.id}:${round}:${i}:${b}`));
      }),
    [qs, round, q.id],
  );

  const choose = (i: number, a: number) => {
    if (picks[i] !== null) return;
    const next = picks.map((p, j) => (j === i ? a : p));
    setPicks(next);
    const fin = next.every(p => p !== null);
    const sc = next.reduce<number>((n, p, k) => n + (p === qs[k].answer ? 1 : 0), 0);
    if (fin && sc >= need && !already && !preview) {
      setJustPassed(true);
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
        {preview ? "Nothing you click here is saved. A student’s pass shows up on your class page." : `You need ${need} of ${qs.length} to pass. Retake as often as you like.`}
      </p>
      {qs.map((item, i) => (
        <fieldset key={i} className="qq">
          <legend>
            {i + 1}. {item.q}
          </legend>
          {order[i].map(a => {
            const o = item.options[a];
            const picked = picks[i] === a;
            const reveal = picks[i] !== null;
            const cls = reveal ? (a === item.answer ? "right" : picked ? "wrong" : "") : "";
            return (
              <button key={a} type="button" className={`opt ${picked ? "picked" : ""} ${cls}`} onClick={() => choose(i, a)} disabled={reveal} aria-pressed={picked}>
                {o}
              </button>
            );
          })}
          {picks[i] !== null && (
            <p className={`why-a ${picks[i] === item.answer ? "ok" : "no"}`}>
              {picks[i] === item.answer ? "Right. " : "Not quite. "}
              <RichText text={item.why} />
              {item.more && (
                <>
                  {" "}
                  <a href={item.more.url} target="_blank" rel="noopener noreferrer" className="rich-link">
                    Read more: {item.more.label}
                  </a>
                </>
              )}
            </p>
          )}
        </fieldset>
      ))}
      {finished && (
        <div className={`quiz-result ${passed ? "pass" : "retry"}`}>
          <b>{passed ? `You passed: ${score} of ${qs.length}` : `${score} of ${qs.length}. So close.`}</b>
          <span>{passed ? (preview ? "That’s a passing score. It isn’t saved." : already && !justPassed ? "Already counted." : flags.xp ? `+${questXp(q)} XP` : "Passed. Your coach can see it.") : "Read the explanations and try again."}</span>
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
