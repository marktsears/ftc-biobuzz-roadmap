"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "./AppProvider";
import { Bar, Icon, Shapes } from "./ui";
import { BUDGET, SNAPSHOT, TEAMS, VISION, VISION_NOTE } from "@/lib/data/core";
import type { BudgetRow } from "@/lib/types";

export function RobotView() {
  const { team } = useApp();
  const t = TEAMS[team];
  return (
    <>
      <section className="page-hero">
        <Shapes variant="banner" />
        <div className="wrap">
          <div className="eyebrow light">Robot snapshot · Team {team}</div>
          <h1>The robot as designed today</h1>
          <p>What each team is building right now, and the numbers that can quietly break a plan: the 8-motor and 8-servo limits. When the design changes, change this page, and the plan follows.</p>
        </div>
      </section>

      <div className="wrap stack-lg pull">
        <div className="duo">
          <section className="card teamcard">
            <h2>Team {team}’s robot</h2>
            <p>
              <b>Plan: </b>
              {t.plan}
            </p>
            <ul className="facts">
              {t.facts.map(([k, v]) => (
                <li key={k}>
                  <b>{k}</b>
                  <span>{v}</span>
                </li>
              ))}
            </ul>
            <div className="sub-h">
              <div className="label">Build watch-list: what’s most likely to bite</div>
              <ul>
                {t.risks.map(r => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            <div className="sub-h">
              <div className="label">If the design changes</div>
              <ul>
                {t.changes.map(r => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            <a className="doc" href={SNAPSHOT[team]} target="_blank" rel="noopener noreferrer">
              Open the {team} design snapshot <Icon name="arrow" size={14} />
            </a>
          </section>
          <Budget />
        </div>

        <section className="card" aria-labelledby="vision-h">
          <h2 id="vision-h">Camera and vision plan, in five steps</h2>
          <p className="note">Build and software share this one: the camera mount has to be decided before the vision code means anything.</p>
          <ol className="vsteps">
            {VISION.map(([name, text, wk]) => {
              const n = typeof wk === "number" ? wk : wk[team];
              return (
                <li key={name}>
                  <div>
                    <b>{name}. </b>
                    {typeof text === "string" ? text : text[team]}
                    <span className="wkref"> · week {n}</span>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="note">{VISION_NOTE[team]}</p>
        </section>
      </div>
    </>
  );
}

function Budget() {
  const { team, state, saveBudget, loading } = useApp();
  const base = state.budget ?? BUDGET[team];
  const [rows, setRows] = useState<BudgetRow[]>(base);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // follow the shared copy unless this person is mid-edit
  useEffect(() => {
    if (!dirty.current) setRows((state.budget ?? BUDGET[team]).map(r => [...r] as BudgetRow));
  }, [state.budget, team]);
  useEffect(() => {
    dirty.current = false;
  }, [team]);

  const commit = (next: BudgetRow[]) => {
    dirty.current = true;
    setRows(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveBudget(next);
      dirty.current = false;
    }, 700);
  };
  const m = rows.reduce((n, r) => n + (+r[1] || 0), 0);
  const s = rows.reduce((n, r) => n + (+r[2] || 0), 0);
  const meter = (label: string, v: number) => (
    <div className={`bt ${v > 8 ? "over" : v === 8 ? "full" : ""}`}>
      <div className="label">{label}</div>
      <div className="v">{v} / 8</div>
      <Bar pct={(v / 8) * 100} />
      <div className="note">{v > 8 ? `${v - 8} over the limit` : v === 8 ? "At the limit" : `${8 - v} left`}</div>
    </div>
  );
  const set = (i: number, idx: 0 | 1 | 2, v: string) => commit(rows.map((r, j) => (j === i ? ((idx === 0 ? [v, r[1], r[2]] : idx === 1 ? [r[0], Math.max(0, +v || 0), r[2]] : [r[0], r[1], Math.max(0, +v || 0)]) as BudgetRow) : r)));

  return (
    <section className="card budget" aria-labelledby="bud-h">
      <h2 id="bud-h">Motor and servo budget</h2>
      <p className="note">R503 allows 8 motors and 8 servos. The starter numbers are guesses from the snapshot: correct them, and add a row before any new mechanism. Everyone on the team sees the same table.</p>
      <div className="bud-tot">
        {meter("Motors", m)}
        {meter("Servos", s)}
      </div>
      <table>
        <thead>
          <tr>
            <th>Mechanism</th>
            <th>Motors</th>
            <th>Servos</th>
            <th>
              <span className="sr">Remove</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>
                <input type="text" value={r[0]} onChange={e => set(i, 0, e.target.value)} aria-label="Mechanism name" maxLength={60} />
              </td>
              <td>
                <input type="number" min={0} max={8} value={r[1]} onChange={e => set(i, 1, e.target.value)} aria-label={`Motors for ${r[0]}`} />
              </td>
              <td>
                <input type="number" min={0} max={8} value={r[2]} onChange={e => set(i, 2, e.target.value)} aria-label={`Servos for ${r[0]}`} />
              </td>
              <td>
                <button type="button" className="x" aria-label={`Remove ${r[0]}`} onClick={() => commit(rows.filter((_, j) => j !== i))}>
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row-actions">
        <button type="button" className="btn sm" onClick={() => commit([...rows, ["New mechanism", 0, 0]])} disabled={loading}>
          + Add a mechanism
        </button>
        <button type="button" className="btn sm" onClick={() => commit(BUDGET[team].map(r => [...r] as BudgetRow))}>
          Reset to starter
        </button>
      </div>
      {team === "3587" && <p className="note">USB ports are for vision devices (R707). The Limelight and the webcam are the two this plan uses.</p>}
    </section>
  );
}
