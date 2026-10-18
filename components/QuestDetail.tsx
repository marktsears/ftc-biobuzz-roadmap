"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "./AppProvider";
import { KIND_ICON, QuestCard } from "./QuestCard";
import { Avatar, Icon, Shapes } from "./ui";
import { KIND_LABEL, LEVEL_LABEL, QUESTS, questXp, type Quest } from "@/lib/data/quests";
import { TRACKS } from "@/lib/data/core";
import { ago } from "@/lib/time";
import { questCrew, questsDoneBy, rankQuests } from "@/lib/pick";
import { nameKey } from "@/lib/xp";

export function QuestDetail({ q }: { q: Quest }) {
  const { state, person, quest, openProfile, focus, clock } = useApp();
  const done = useMemo(() => questsDoneBy(state, person), [state, person]);
  const crew = questCrew(state, q.id);
  const mine = crew.find(c => !!person && nameKey(c.by) === nameKey(person));
  const [steps, setSteps] = useState<boolean[]>(() => q.steps.map(() => false));
  const [note, setNote] = useState("");

  const next = useMemo(
    () => rankQuests({ quests: QUESTS.filter(x => x.id !== q.id), done, focus, week: clock.now, seed: "next" + q.id, maxMins: 45 }).slice(0, 2),
    [q.id, done, focus, clock.now],
  );
  const stepsDone = steps.filter(Boolean).length;

  return (
    <>
      <section className="page-hero quest-hero" style={{ ["--tc" as string]: `var(--t-${q.track})` } as React.CSSProperties}>
        <Shapes variant="banner" />
        <div className="wrap">
          <Link href="/quests" className="back-link">
            <Icon name="left" size={16} /> Quest board
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
            <span className="xp">+{questXp(q)} XP</span>
            {q.helpsTeam && <span className="help">Helps the team</span>}
          </div>
        </div>
      </section>

      <div className="wrap qd-grid pull">
        <div className="qd-main">
          <section className="card">
            <div className="label">Why it matters</div>
            <p className="why-line">{q.why}</p>
          </section>

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
              <p className="muted small">These boxes are just for you while you work. The button on the right is what counts.</p>
            </section>
          )}

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

          {q.hints && q.hints.length > 0 && (
            <details className="card hints">
              <summary>Stuck? Open a hint</summary>
              <ul className="plain">
                {q.hints.map(h => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <p className="muted small">Still stuck? Ask a teammate who’s done this quest (see the list on the right) or the coach.</p>
            </details>
          )}
        </div>

        <aside className="qd-side">
          <section className="card claim">
            {q.quiz ? (
              <Quiz q={q} />
            ) : (
              <>
                <div className="label">Show it</div>
                <p>{q.proof}</p>
                {mine ? (
                  <div className="doneblock">
                    <Icon name="check" size={20} />
                    <div>
                      <b>You finished this {ago(mine.at)}.</b>
                      {mine.note && <small>“{mine.note}”</small>}
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="field">
                      <span>One line about what you made or learned (optional)</span>
                      <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={280} rows={3} placeholder="I learned that…" />
                    </label>
                    <button
                      type="button"
                      className="cta solid block"
                      onClick={() => {
                        if (!person) return openProfile();
                        quest(q.id, true, note.trim() || undefined);
                      }}
                    >
                      <span>I did it · +{questXp(q)} XP</span>
                      <i className="cta-dot" aria-hidden="true">
                        <Icon name="check" size={16} />
                      </i>
                    </button>
                  </>
                )}
                {mine && (
                  <button type="button" className="link-btn" onClick={() => quest(q.id, false)}>
                    Undo
                  </button>
                )}
              </>
            )}
          </section>

          <section className="card crew">
            <div className="label">Who’s done this</div>
            {crew.length === 0 ? (
              <p className="empty">Nobody yet. Be the first.</p>
            ) : (
              <ul>
                {crew.map(c => (
                  <li key={c.by}>
                    <Avatar name={c.by} size={28} />
                    <span>
                      <b>{c.by}</b> <small>{ago(c.at)}</small>
                      {c.note && <em>“{c.note}”</em>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {next.length > 0 && (
        <div className="wrap stack-lg">
          <section>
            <div className="strip-head">
              <h2 className="h-section">What next?</h2>
            </div>
            <div className="qgrid two">
              {next.map(x => (
                <QuestCard key={x.id} q={x} done={done.has(x.id)} crew={questCrew(state, x.id).length} />
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function Quiz({ q }: { q: Quest }) {
  const { quest, person, openProfile, state } = useApp();
  const qs = q.quiz!;
  const [picks, setPicks] = useState<(number | null)[]>(() => qs.map(() => null));
  const [round, setRound] = useState(0);
  const answered = picks.filter(p => p !== null).length;
  const score = picks.reduce<number>((n, p, i) => n + (p === qs[i].answer ? 1 : 0), 0);
  const need = Math.ceil(qs.length * 0.8);
  const finished = answered === qs.length;
  const passed = finished && score >= need;
  const already = !!person && state.quests.some(c => c.id === q.id && nameKey(c.by) === nameKey(person));

  const choose = (i: number, a: number) => {
    if (picks[i] !== null) return;
    const next = picks.map((p, j) => (j === i ? a : p));
    setPicks(next);
    const fin = next.every(p => p !== null);
    const sc = next.reduce<number>((n, p, k) => n + (p === qs[k].answer ? 1 : 0), 0);
    if (fin && sc >= need && !already) {
      if (!person) openProfile();
      else quest(q.id, true, `Quiz ${sc}/${qs.length}`);
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
          <span>{passed ? (already ? "Already counted." : `+${questXp(q)} XP`) : "Read the explanations and try again."}</span>
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
