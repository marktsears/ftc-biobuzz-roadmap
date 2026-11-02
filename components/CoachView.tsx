"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "./AppProvider";
import { AddStudents, InviteDialog } from "./ClassInvite";
import { KIND_ICON } from "./kindIcon";
import { StatusPill, statusOf } from "./QuestStatus";
import { Avatar, Icon, Shapes } from "./ui";
import { carryForward, ladderById, needsAttention, nextUnassigned } from "@/lib/coach";
import { CUSTOM_TRACKS, EMPTY_DRAFT, questToDraft, type QuestDraft } from "@/lib/customQuest";
import { TRACKS } from "@/lib/data/core";
import { LADDERS, LADDER_OF } from "@/lib/data/ladders";
import { KIND_LABEL, LEVEL_LABEL, type Quest, type QuestKind } from "@/lib/data/quests";
import { FLAG_INFO } from "@/lib/flags";
import { ago, plural } from "@/lib/time";
import { type CoachState, type FlagKey, type Student, type Work } from "@/lib/types";

type Tab = "class" | "bank" | "labs";
type Post = (body: Record<string, unknown>) => Promise<boolean>;

export function CoachView() {
  const { admin, person, toast, refreshMine } = useApp();
  const params = useSearchParams();
  const router = useRouter();
  const tab = (["class", "bank", "labs"].includes(params.get("tab") || "") ? params.get("tab") : "class") as Tab;
  const [data, setData] = useState<CoachState | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/coach", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Couldn’t load");
      setData(d as CoachState);
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn’t load");
    }
  }, []);

  useEffect(() => {
    if (!admin) return;
    void load();
    const id = setInterval(() => document.visibilityState === "visible" && void load(), 20000);
    return () => clearInterval(id);
  }, [admin, load]);

  const post: Post = useCallback(
    async body => {
      try {
        const r = await fetch("/api/coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Couldn’t save");
        setData(d as CoachState);
        if (body.op === "flags" || body.op === "saveQuest" || body.op === "archiveQuest" || body.op === "admins") refreshMine();
        return true;
      } catch (e) {
        toast("error", "Didn’t save", e instanceof Error ? e.message : "Try again.");
        return false;
      }
    },
    [toast, refreshMine],
  );

  if (!person || !admin)
    return (
      <div className="wrap stack-lg">
        <section className="card off-card">
          <h1>This page is for coaches</h1>
          <p className="muted">Your quests are on Home.</p>
          <Link className="btn" href="/">
            Go to Home
          </Link>
        </section>
      </div>
    );

  const needs = data ? data.work.filter(w => w.status === "stuck" || (w.status === "done" && !w.checkedBy)).length : 0;

  return (
    <>
      <section className="page-hero coach-hero">
        <Shapes variant="banner" />
        <div className="wrap">
          <div className="eyebrow light">Coach</div>
          <h1>Your class</h1>
          <p>Pick quests for each student. They see them when they sign in, and you see when they’re stuck or done.</p>
        </div>
      </section>

      <div className="coach-tabbar">
        <div className="wrap">
          <nav className="coach-tabs" aria-label="Coach pages">
            {(
              [
                ["class", needs ? `Class · ${needs} need you` : "Class"],
                ["bank", "Your quests"],
                ["labs", "Labs"],
              ] as [Tab, string][]
            ).map(([t, label]) => (
              <button key={t} type="button" aria-pressed={tab === t} onClick={() => router.replace(t === "class" ? "/" : `/?tab=${t}`, { scroll: false })}>
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="wrap stack-lg pull">
        {err && <p className="card error-card">{err}</p>}
        {!data && !err && <p className="card muted">Loading the class…</p>}
        {data && tab === "class" && <ClassTab data={data} post={post} />}
        {data && tab === "bank" && <BankTab data={data} post={post} />}
        {data && tab === "labs" && <LabsTab data={data} post={post} />}
      </div>
    </>
  );
}

/* ====================== Class ====================== */

function ClassTab({ data, post }: { data: CoachState; post: Post }) {
  const { clock, questById, toast, weeks } = useApp();
  const router = useRouter();
  const lastWeek = Math.max(1, weeks.length);
  const [week, setWeek] = useState(Math.min(lastWeek, Math.max(1, clock.before ? 1 : clock.now)));
  const [who, setWho] = useState<"all" | "attention" | "empty" | "waiting">("all");
  const [find, setFind] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [assignTo, setAssignTo] = useState<string[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [carryAsk, setCarryAsk] = useState(false);
  const [goodAsk, setGoodAsk] = useState(false);

  useEffect(() => {
    setPicked(new Set());
    setConfirmRemove(false);
    setCarryAsk(false);
  }, [find, who]);

  const listed = data.students.filter(s => s.listed);
  const unlisted = data.students.filter(s => !s.listed);
  const waiting = listed.filter(s => !s.seen);

  const byEmail = useMemo(() => {
    const m: Record<string, { work: Record<string, Work>; assigned: CoachState["assignments"] }> = {};
    for (const s of data.students) m[s.email] = { work: {}, assigned: [] };
    for (const w of data.work) if (m[w.email]) m[w.email].work[w.quest] = w;
    for (const a of data.assignments) if (m[a.email]) m[a.email].assigned.push(a);
    return m;
  }, [data]);

  const students = listed.filter(s => {
    if (find.trim() && !`${s.name} ${s.email}`.toLowerCase().includes(find.trim().toLowerCase())) return false;
    const info = byEmail[s.email];
    if (who === "attention") return Object.values(info.work).some(needsAttention);
    if (who === "empty") return !info.assigned.some(a => a.week === week);
    if (who === "waiting") return !s.seen;
    return true;
  });
  const allShown = students.length > 0 && students.every(s => picked.has(s.email));
  const pickedList = [...picked];
  const bulk = async (body: Record<string, unknown>, done: string) => {
    if (await post({ ...body, emails: pickedList })) {
      toast("info", done);
      setPicked(new Set());
      setConfirmRemove(false);
    }
  };
  const copyWaiting = async () => {
    try {
      await navigator.clipboard.writeText(waiting.map(s => s.email).join(", "));
      toast("info", `Copied ${plural(waiting.length, "email")}`, "Paste them into the To: line of a reminder.");
    } catch {
      toast("error", "Couldn’t copy", waiting.map(s => s.email).join(", "));
    }
  };
  const nameOf = (email: string) => data.students.find(s => s.email === email)?.name ?? email;

  const needs = data.work
    .filter(needsAttention)
    .sort((a, b) => (a.status === "stuck" ? 0 : 1) - (b.status === "stuck" ? 0 : 1) || b.at.localeCompare(a.at));
  const stuckNeeds = needs.filter(w => w.status === "stuck");
  const readyNeeds = needs.filter(w => w.status !== "stuck");
  const carryEmails = picked.size ? pickedList : students.map(s => s.email);
  const carryCount = week < lastWeek ? carryForward(data.assignments, data.work, carryEmails, week, week + 1).length : 0;

  const toggle = (email: string) =>
    setPicked(p => {
      const n = new Set(p);
      if (n.has(email)) n.delete(email);
      else n.add(email);
      return n;
    });

  return (
    <>
      <section className="card needs" aria-labelledby="needs-h">
        <div className="strip-head">
          <h2 id="needs-h">Needs you</h2>
          <span className="muted small">{needs.length ? plural(needs.length, "thing") : "All caught up"}</span>
        </div>
        {needs.length === 0 ? (
          <p className="empty">Nobody is stuck, and there’s nothing waiting to be checked.</p>
        ) : (
          <>
            {stuckNeeds.length > 0 && (
              <>
                <div className="label">Stuck</div>
                <ul className="need-list">
                  {stuckNeeds.map(w => (
                    <NeedRow key={w.email + w.quest} w={w} name={nameOf(w.email)} q={questById(w.quest)} post={post} />
                  ))}
                </ul>
              </>
            )}
            {readyNeeds.length > 0 && (
              <>
                <div className="strip-head">
                  <div className="label">Ready to check</div>
                  {goodAsk ? (
                    <span className="need-actions">
                      <span className="muted small">Mark {plural(readyNeeds.length, "quest")} checked?</span>
                      <button type="button" className="link-btn" onClick={() => setGoodAsk(false)}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn ok-btn"
                        onClick={async () => {
                          const list = readyNeeds.map(w => ({ email: w.email, quest: w.quest }));
                          for (const w of list) {
                            if (!(await post({ op: "review", email: w.email, quest: w.quest, ok: true }))) return;
                          }
                          toast("info", `Checked ${plural(list.length, "quest")}`);
                          setGoodAsk(false);
                        }}
                      >
                        <Icon name="check" size={16} /> Looks good
                      </button>
                    </span>
                  ) : (
                    <button type="button" className="btn sm" onClick={() => setGoodAsk(true)}>
                      Looks good for all
                    </button>
                  )}
                </div>
                <ul className="need-list">
                  {readyNeeds.map(w => (
                    <NeedRow key={w.email + w.quest} w={w} name={nameOf(w.email)} q={questById(w.quest)} post={post} />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>

      <section className="card roster" aria-labelledby="roster-h">
        <div className="strip-head wrap-row">
          <h2 id="roster-h">Students{listed.length ? ` · ${listed.length}` : ""}</h2>
          <div className="roster-add">
            <button type="button" className="btn" onClick={() => setInviting(true)}>
              Invite
            </button>
            <button type="button" className="cta solid" onClick={() => setAdding(true)}>
              <span>Add students</span>
              <i className="cta-dot" aria-hidden="true">
                <Icon name="plus" size={16} />
              </i>
            </button>
          </div>
        </div>

        {listed.length === 0 ? (
          <div className="roster-empty">
            <Icon name="users" size={28} />
            <div>
              <b>Start with your class list</b>
              <p className="muted">Paste their school emails. You can give them quests right away, before anyone signs in. When they sign in with Google, everything is already there.</p>
            </div>
            <button type="button" className="cta solid" onClick={() => setAdding(true)}>
              <span>Add students</span>
              <i className="cta-dot" aria-hidden="true">
                <Icon name="plus" size={16} />
              </i>
            </button>
          </div>
        ) : (
          <>
            {waiting.length > 0 && (
              <div className="waiting-note">
                <span>
                  <b>{plural(waiting.length, "student")}</b> {waiting.length === 1 ? "hasn’t" : "haven’t"} signed in yet.
                </span>
                <button type="button" className="link-btn" onClick={copyWaiting}>
                  Copy their emails
                </button>
                <button type="button" className="link-btn" onClick={() => setInviting(true)}>
                  See the invite
                </button>
              </div>
            )}
            <div className="roster-tools">
              <div className="week-pick" role="group" aria-label="Week to assign for">
                <button type="button" className="icon-btn" onClick={() => setWeek(w => Math.max(1, w - 1))} aria-label="Previous week">
                  <Icon name="left" size={16} />
                </button>
                <span>
                  Week {week}
                  {week === clock.now ? " · this week" : ""}
                </span>
                <button type="button" className="icon-btn" disabled={week >= lastWeek} onClick={() => setWeek(w => Math.min(lastWeek, w + 1))} aria-label="Next week">
                  <Icon name="arrow" size={16} />
                </button>
              </div>
              <div className="chips">
                {(
                  [
                    ["all", "Everyone"],
                    ["attention", "Needs attention"],
                    ["empty", "Nothing this week"],
                    ["waiting", "Hasn’t signed in"],
                  ] as const
                ).map(([id, label]) => (
                  <button key={id} type="button" className={`chip ${who === id ? "on" : ""}`} aria-pressed={who === id} onClick={() => setWho(id)}>
                    {label}
                  </button>
                ))}
              </div>
              <input className="find" value={find} onChange={e => setFind(e.target.value)} placeholder="Find a student" aria-label="Find a student" />
              <label className="toggle">
                <input type="checkbox" checked={allShown} onChange={() => setPicked(allShown ? new Set() : new Set(students.map(s => s.email)))} />
                {allShown ? "Clear" : `Select all ${students.length}`}
              </label>
              {week < lastWeek && (
                <button type="button" className="link-btn" onClick={() => setCarryAsk(true)}>
                  Move unfinished to Week {week + 1}
                </button>
              )}
            </div>

              <ul className="roster-list">
                {students.map(s => (
                  <RosterRow
                    key={s.email}
                    s={s}
                    week={week}
                    info={byEmail[s.email]}
                    picked={picked.has(s.email)}
                    onPick={() => toggle(s.email)}
                    open={open === s.email}
                    onOpen={() => setOpen(o => (o === s.email ? null : s.email))}
                    onAssign={() => setAssignTo([s.email])}
                    onSee={() => router.push(`/?as=${encodeURIComponent(s.email)}`)}
                    post={post}
                  />
                ))}
                {students.length === 0 && <p className="empty">Nobody matches. Clear the search.</p>}
              </ul>
          </>
        )}
      </section>

      {unlisted.length > 0 && (
        <section className="card" aria-labelledby="unlisted-h">
          <div className="strip-head">
            <div>
              <h2 id="unlisted-h">Not on your list</h2>
              <p className="muted small">They signed in on their own. Add them to see them with your class.</p>
            </div>
            {unlisted.length > 1 && (
              <button type="button" className="btn" onClick={() => post({ op: "listStudents", emails: unlisted.map(s => s.email) })}>
                Add all {unlisted.length}
              </button>
            )}
          </div>
          <ul className="admin-list">
            {unlisted.map(s => (
              <li key={s.email}>
                <span>
                  <b>{s.name}</b>{" "}
                  <small className="muted">
                    {s.email} · {s.team ? `Team ${s.team}` : "no team"}
                    {s.seen ? ` · seen ${ago(s.seen)}` : ""}
                  </small>
                </span>
                <button type="button" className="btn sm" onClick={() => post({ op: "listStudents", emails: [s.email] })}>
                  Add to class
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {carryAsk && (
        <div className="card" role="region" aria-label="Move unfinished quests">
          <p>
            {carryCount
              ? `Move ${plural(carryCount, "unfinished quest")} for ${plural(carryEmails.length, "student")} from Week ${week} to Week ${week + 1}. They leave this week and show up next week.`
              : "Nothing unfinished to move."}
          </p>
          <div className="need-actions">
            <button type="button" className="link-btn" onClick={() => setCarryAsk(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              disabled={!carryCount}
              onClick={async () => {
                const ok = await post({ op: "carryOver", emails: carryEmails, fromWeek: week });
                if (ok) {
                  toast("info", `Moved ${plural(carryCount, "quest")} to Week ${week + 1}`);
                  setCarryAsk(false);
                  setPicked(new Set());
                }
              }}
            >
              Move them
            </button>
          </div>
        </div>
      )}

      {picked.size > 0 && (
        <div className="bulk-bar" role="region" aria-label="Selected students">
          {confirmRemove ? (
            <>
              <span>{removeLine(pickedList.map(e => data.students.find(s => s.email === e)))}</span>
              <button type="button" className="link-btn light" onClick={() => setConfirmRemove(false)}>
                Cancel
              </button>
              <button type="button" className="btn danger" onClick={() => bulk({ op: "removeStudents" }, `Removed ${plural(picked.size, "student")}`)}>
                Remove
              </button>
            </>
          ) : (
            <>
              <span>{plural(picked.size, "student")} picked</span>
              <button type="button" className="link-btn light" onClick={() => setPicked(new Set())}>
                Clear
              </button>
              <button type="button" className="link-btn light" onClick={() => setConfirmRemove(true)}>
                Remove
              </button>
              {week < lastWeek && (
                <button type="button" className="link-btn light" onClick={() => setCarryAsk(true)}>
                  Move unfinished
                </button>
              )}
              <button type="button" className="cta solid" onClick={() => setAssignTo(pickedList)}>
                <span>Assign quests</span>
                <i className="cta-dot" aria-hidden="true">
                  <Icon name="plus" size={16} />
                </i>
              </button>
            </>
          )}
        </div>
      )}

      {adding && <AddStudents data={data} post={post} team={null} onClose={() => setAdding(false)} />}
      {inviting && <InviteDialog onClose={() => setInviting(false)} />}

      {assignTo && (
        <QuestPicker
          emails={assignTo}
          names={assignTo.map(nameOf)}
          week={week}
          data={data}
          onClose={() => setAssignTo(null)}
          onAssign={async (quests, note) => {
            const ok = await post({ op: "assign", emails: assignTo, quests, week, note });
            if (ok) {
              toast("info", `Assigned for Week ${week}`, `${plural(quests.length, "quest")} for ${assignTo.length === 1 ? nameOf(assignTo[0]) : plural(assignTo.length, "student")}.`);
              setAssignTo(null);
              setPicked(new Set());
            }
            return ok;
          }}
          onNext={async ladder => {
            const spec = ladderById(ladder);
            if (!spec) return false;
            const getting = assignTo.filter(email => {
              const done = new Set(data.work.filter(w => w.email === email && w.status === "done").map(w => w.quest));
              const assigned = new Set(data.assignments.filter(a => a.email === email).map(a => a.quest));
              return !!nextUnassigned(spec.steps, done, assigned);
            });
            if (!getting.length) {
              toast("info", "Nothing new to assign", "Each of them already has the next step, or has finished this ladder.");
              return false;
            }
            const ok = await post({ op: "assignNext", emails: assignTo, ladder, week });
            if (ok) {
              toast("info", `Next step for Week ${week}`, `${plural(getting.length, "student")}.`);
              setAssignTo(null);
              setPicked(new Set());
            }
            return ok;
          }}
        />
      )}
    </>
  );
}

const isUrl = (s: string) => /^https?:\/\/\S+$/.test(s.trim());

function removeLine(list: (Student | undefined)[]) {
  const who = plural(list.length, "student");
  const signedIn = list.filter(s => s?.seen).length;
  if (!signedIn) return `Remove ${who}? They haven’t signed in, so nothing is lost.`;
  if (signedIn === list.length) return `Take ${who} off your list? Their progress is kept, under Not on your list.`;
  return `Remove ${who}? Anyone who hasn’t signed in is deleted. The others keep their progress, under Not on your list.`;
}

function NeedRow({ w, name, q, post }: { w: Work & { email: string }; name: string; q?: Quest; post: Post }) {
  const [reply, setReply] = useState<"none" | "open">("none");
  const [text, setText] = useState("");
  const stuck = w.status === "stuck";
  const said = stuck ? w.stuck : w.proof;
  return (
    <li className={`need ${stuck ? "is-stuck" : "is-done"}`}>
      <Avatar name={name} size={34} />
      <div className="need-main">
        <div className="need-top">
          <b>{name}</b>
          <span className={`spill ${stuck ? "s-stuck" : "s-done"}`}>{stuck ? "Stuck" : "Done"}</span>
          <small>{ago(w.at)}</small>
        </div>
        <Link href={`/quests/${w.quest}`} className="need-q">
          {q?.title ?? w.quest}
        </Link>
        {said &&
          (isUrl(said) ? (
            <a className="need-said" href={said.trim()} target="_blank" rel="noopener noreferrer">
              {said.trim()}
            </a>
          ) : (
            <p className="need-said">“{said}”</p>
          ))}
        {reply === "open" ? (
          <form
            className="need-reply"
            onSubmit={async e => {
              e.preventDefault();
              if (await post({ op: "review", email: w.email, quest: w.quest, ok: false, note: text })) setReply("none");
            }}
          >
            <textarea rows={2} value={text} onChange={e => setText(e.target.value)} aria-label={`Reply to ${name}`} placeholder={stuck ? "Come find me at the start of class." : "Add a photo of it on the robot."} autoFocus />
            <div className="need-actions">
              <button type="submit" className="btn" disabled={!text.trim()}>
                Send
              </button>
              <button type="button" className="link-btn" onClick={() => setReply("none")}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="need-actions">
            {stuck ? (
              <button type="button" className="btn" onClick={() => setReply("open")}>
                Reply
              </button>
            ) : (
              <>
                <button type="button" className="btn ok-btn" onClick={() => post({ op: "review", email: w.email, quest: w.quest, ok: true })}>
                  <Icon name="check" size={16} /> Looks good
                </button>
                <button type="button" className="link-btn" onClick={() => setReply("open")}>
                  Needs more work
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

function RosterRow({
  s,
  week,
  info,
  picked,
  onPick,
  open,
  onOpen,
  onAssign,
  onSee,
  post,
}: {
  s: Student;
  week: number;
  info: { work: Record<string, Work>; assigned: CoachState["assignments"] };
  picked: boolean;
  onPick: () => void;
  open: boolean;
  onOpen: () => void;
  onAssign: () => void;
  onSee: () => void;
  post: Post;
}) {
  const { questById } = useApp();
  const thisWeek = info.assigned.filter(a => a.week === week);
  const doneCount = Object.values(info.work).filter(w => w.status === "done").length;
  const stuck = Object.values(info.work).some(w => w.status === "stuck");
  const others = Object.values(info.work).filter(w => !info.assigned.some(a => a.quest === w.quest));
  return (
    <li className={`rrow ${open ? "open" : ""} ${stuck ? "has-stuck" : ""} ${s.seen ? "" : "waiting"}`}>
      <div className="rrow-top">
        <label className="rpick">
          <input type="checkbox" checked={picked} onChange={onPick} aria-label={`Pick ${s.name}`} />
        </label>
        <button type="button" className="rwho" onClick={onOpen} aria-expanded={open}>
          <Avatar name={s.name} size={32} />
          <span>
            <b>{s.name}</b>
            <small>
              {s.team ? `Team ${s.team}` : "No team yet"}
              {s.focus && s.focus !== "all" ? ` · ${TRACKS[s.focus].short}` : ""}
              {s.seen ? ` · ${plural(doneCount, "quest")} done · seen ${ago(s.seen)}` : ""}
            </small>
            {!s.seen && <span className="not-yet">Hasn’t signed in yet</span>}
          </span>
        </button>
        <div className="rweek">
          {thisWeek.length === 0 ? (
            <span className="muted small">Nothing for Week {week}</span>
          ) : (
            <>
              {thisWeek.slice(0, 2).map(a => (
                <span key={a.quest} className={`qchip s-${statusOf(info.work[a.quest])}`} title={`${questById(a.quest)?.title ?? a.quest}: ${statusOf(info.work[a.quest])}`}>
                  {questById(a.quest)?.title ?? a.quest}
                </span>
              ))}
              {thisWeek.length > 2 && <span className="qchip">+{thisWeek.length - 2}</span>}
            </>
          )}
        </div>
        <div className="racts">
          <button type="button" className="link-btn" onClick={onSee}>
            See their Home
          </button>
          <button type="button" className="btn sm" onClick={onAssign}>
            <Icon name="plus" size={14} /> Assign
          </button>
        </div>
      </div>

      {open && (
        <div className="rdetail">
          <div className="muted small">{s.email}</div>
          <div className="label">Assigned</div>
          {info.assigned.length === 0 ? (
            <p className="empty">Nothing assigned yet.</p>
          ) : (
            <ul className="rlist">
              {[...info.assigned]
                .sort((a, b) => b.week - a.week)
                .map(a => {
                  const w = info.work[a.quest];
                  return (
                    <li key={a.quest}>
                      <span className="rl-week">Wk {a.week}</span>
                      <Link href={`/quests/${a.quest}`}>{questById(a.quest)?.title ?? a.quest}</Link>
                      <StatusPill w={w} />
                      {w?.proof && <em>“{w.proof}”</em>}
                      <button type="button" className="icon-btn" aria-label="Remove" title="Remove" onClick={() => post({ op: "unassign", email: s.email, quest: a.quest })}>
                        <Icon name="x" size={14} />
                      </button>
                    </li>
                  );
                })}
            </ul>
          )}
          {others.length > 0 && (
            <>
              <div className="label">Picked on their own</div>
              <ul className="rlist">
                {others.map(w => (
                  <li key={w.quest}>
                    <Link href={`/quests/${w.quest}`}>{questById(w.quest)?.title ?? w.quest}</Link>
                    <StatusPill w={w} />
                    {w.proof && <em>“{w.proof}”</em>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </li>
  );
}

function QuestPicker({
  emails,
  names,
  week,
  data,
  onClose,
  onAssign,
  onNext,
  starter,
}: {
  emails: string[];
  names: string[];
  week: number;
  data: CoachState;
  onClose: () => void;
  onAssign: (quests: string[], note: string) => Promise<boolean>;
  /** give each student their own next unfinished, unassigned step on a ladder */
  onNext?: (ladderId: string) => Promise<boolean>;
  /** pick the starter set instead of assigning */
  starter?: string[];
}) {
  const { allQuests, person } = useApp();
  const ref = useRef<HTMLDialogElement>(null);
  const [find, setFind] = useState("");
  const [sel, setSel] = useState<string[]>(starter ?? []);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [closed, setClosed] = useState<Record<string, boolean>>({ "More quests": true });

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const doneBy = (id: string) => data.work.filter(w => w.quest === id && w.status === "done" && emails.includes(w.email)).length;
  const already = (id: string) => data.assignments.filter(a => a.quest === id && emails.includes(a.email)).length;
  const match = (q: Quest) => !find.trim() || `${q.title} ${q.blurb} ${KIND_LABEL[q.kind]} ${TRACKS[q.track].short}`.toLowerCase().includes(find.trim().toLowerCase());
  const recent: Quest[] = [];
  const seenRecent = new Set<string>();
  for (const a of [...data.assignments].filter(a => a.by === person).sort((a, b) => b.at.localeCompare(a.at))) {
    if (seenRecent.has(a.quest)) continue;
    const q = allQuests.find(q => q.id === a.quest);
    if (!q || !match(q)) continue;
    seenRecent.add(a.quest);
    recent.push(q);
    if (recent.length === 8) break;
  }
  const groups: { name: string; ladder?: string; quests: Quest[] }[] = [
    ...(recent.length ? [{ name: "Recent", quests: recent }] : []),
    ...LADDERS.map(l => ({ name: l.name, ladder: l.id, quests: l.steps.map(id => allQuests.find(q => q.id === id)).filter((q): q is Quest => !!q) })),
    { name: "Quests you wrote", quests: data.custom },
    { name: "More quests", quests: allQuests.filter(q => !LADDER_OF[q.id] && !q.id.startsWith("c-")) },
  ]
    .map(g => ({ ...g, quests: g.quests.filter(match) }))
    .filter(g => g.quests.length);

  const flip = (id: string) => setSel(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  const who = names.length === 1 ? names[0] : plural(names.length, "student");

  return (
    <dialog ref={ref} className="dialog picker" onClose={onClose} onClick={e => e.target === ref.current && onClose()} aria-labelledby="picker-h">
      <form
        method="dialog"
        onSubmit={async e => {
          e.preventDefault();
          setBusy(true);
          await onAssign(sel, note);
          setBusy(false);
        }}
      >
        <div className="dialog-head">
          <div>
            <div className="eyebrow">{starter ? "Every new student gets these" : `Week ${week}`}</div>
            <h2 id="picker-h">{starter ? "Starter quests" : `Quests for ${who}`}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <input className="find" value={find} onChange={e => setFind(e.target.value)} placeholder="Search quests" aria-label="Search quests" autoFocus />
        <div className="picker-list">
          {groups.map(g => (
            <div key={g.name} className="pk-group">
              <div className="pk-head">
                <button type="button" className="label pk-toggle" aria-expanded={!closed[g.name]} onClick={() => setClosed(c => ({ ...c, [g.name]: !c[g.name] }))}>
                  {closed[g.name] ? "▸" : "▾"} {g.name}
                </button>
                {g.ladder && onNext && !starter && (
                  <button
                    type="button"
                    className="link-btn"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      await onNext(g.ladder!);
                      setBusy(false);
                    }}
                  >
                    Assign next step
                  </button>
                )}
              </div>
              {!closed[g.name] && g.quests.map(q => {
                const d = doneBy(q.id);
                const a = already(q.id);
                return (
                  <label key={q.id} className={`pk-row ${sel.includes(q.id) ? "on" : ""}`} style={{ ["--tc" as string]: `var(--t-${q.track})` } as React.CSSProperties}>
                    <input type="checkbox" checked={sel.includes(q.id)} onChange={() => flip(q.id)} />
                    <span className="qc-ico">
                      <Icon name={KIND_ICON[q.kind]} size={16} />
                    </span>
                    <span className="pk-main">
                      <b>{q.title}</b>
                      <small>
                        {LEVEL_LABEL[q.level]} · {q.mins} min
                        {d > 0 ? ` · done by ${emails.length === 1 ? "them" : d}` : ""}
                        {a > 0 ? ` · already assigned${emails.length > 1 ? ` to ${a}` : ""}` : ""}
                      </small>
                    </span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
        {!starter && (
          <label className="field">
            <span>A note for {names.length === 1 ? "them" : "everyone"} (optional)</span>
            <input value={note} onChange={e => setNote(e.target.value)} maxLength={200} placeholder="Start with this one. Bring it to me when you’re done." />
          </label>
        )}
        <div className="dialog-foot">
          <span className="muted small">{sel.length ? `${plural(sel.length, "quest")} picked${starter && sel.length > 3 ? ". Two or three is plenty for a first day." : ""}` : "Pick one or more"}</span>
          <button type="submit" className="cta solid" disabled={(!starter && !sel.length) || busy}>
            <span>{starter ? "Save" : "Assign"}</span>
            <i className="cta-dot" aria-hidden="true">
              <Icon name="check" size={16} />
            </i>
          </button>
        </div>
      </form>
    </dialog>
  );
}

/* ====================== Your quests ====================== */

const KINDS = Object.keys(KIND_LABEL) as QuestKind[];

/** one from each ladder a beginner can finish on day one */
const SUGGESTED_STARTER = ["drive-watch-game", "cad-account", "code-java-warmup"];

function StarterCard({ data, post }: { data: CoachState; post: Post }) {
  const { questById, toast } = useApp();
  const [picking, setPicking] = useState(false);
  const ids = data.settings.starter;
  const save = async (quests: string[]) => {
    const ok = await post({ op: "starter", quests });
    if (ok) toast("info", quests.length ? "Starter quests saved" : "No starter quests", quests.length ? "New students get these from now on." : "New students start with an empty list.");
    return ok;
  };
  return (
    <section className="card starter" aria-labelledby="starter-h">
      <div className="strip-head">
        <div>
          <h2 id="starter-h">Starter quests</h2>
          <p className="muted small">Every new student gets these on day one, whether you add them or they sign in on their own. Students who are already here don’t get them again.</p>
        </div>
        <button type="button" className="btn" onClick={() => setPicking(true)}>
          {ids.length ? "Change" : "Pick quests"}
        </button>
      </div>
      {ids.length ? (
        <ol className="starter-list">
          {ids.map(id => (
            <li key={id}>
              <Link href={`/quests/${id}`}>{questById(id)?.title ?? id}</Link>
              <button type="button" className="icon-btn" aria-label="Take it out" title="Take it out" onClick={() => save(ids.filter(x => x !== id))}>
                <Icon name="x" size={14} />
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="starter-empty">
          <p className="muted">None yet, so new students start with an empty Home.</p>
          <button type="button" className="link-btn" onClick={() => save(SUGGESTED_STARTER.filter(id => questById(id)))}>
            Use a first-day set: {SUGGESTED_STARTER.map(id => questById(id)?.title).filter(Boolean).join(", ")}
          </button>
        </div>
      )}
      {picking && (
        <QuestPicker
          emails={[]}
          names={[]}
          week={1}
          data={data}
          starter={ids}
          onClose={() => setPicking(false)}
          onAssign={async quests => {
            const ok = await save(quests);
            if (ok) setPicking(false);
            return ok;
          }}
        />
      )}
    </section>
  );
}

function BankTab({ data, post }: { data: CoachState; post: Post }) {
  const [draft, setDraft] = useState<QuestDraft | null>(null);
  return (
    <>
      <StarterCard data={data} post={post} />
      <section className="card">
        <div className="strip-head">
          <div>
            <h2>Quests you wrote</h2>
            <p className="muted small">They join the built-in quests, so you can assign them and students can find them.</p>
          </div>
          {!draft && (
            <button type="button" className="cta solid" onClick={() => setDraft({ ...EMPTY_DRAFT })}>
              <span>Write a quest</span>
              <i className="cta-dot" aria-hidden="true">
                <Icon name="plus" size={16} />
              </i>
            </button>
          )}
        </div>
        {draft && (
          <QuestForm
            draft={draft}
            setDraft={setDraft}
            onSave={async () => {
              if (await post({ op: "saveQuest", quest: draft })) setDraft(null);
            }}
          />
        )}
        {data.custom.length === 0 && !draft ? (
          <p className="empty">None yet. Write one for something you teach that isn’t on the list.</p>
        ) : (
          <ul className="bank-list">
            {data.custom.map(q => (
              <li key={q.id}>
                <Link href={`/quests/${q.id}`}>{q.title}</Link>
                <small>
                  {KIND_LABEL[q.kind]} · {TRACKS[q.track].short} · {LEVEL_LABEL[q.level]} · {q.mins} min
                </small>
                <button type="button" className="link-btn" onClick={() => setDraft(questToDraft(q))}>
                  Edit
                </button>
                <button type="button" className="link-btn" onClick={() => post({ op: "archiveQuest", id: q.id, archived: true })}>
                  Archive
                </button>
              </li>
            ))}
          </ul>
        )}
        {data.archived.length > 0 && (
          <details className="adv">
            <summary>Archived ({data.archived.length})</summary>
            <ul className="bank-list">
              {data.archived.map(q => (
                <li key={q.id}>
                  <span>{q.title}</span>
                  <button type="button" className="link-btn" onClick={() => post({ op: "archiveQuest", id: q.id, archived: false })}>
                    Bring back
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>
      <p className="muted">
        The built-in quests are on the <Link href="/quests">Quests page</Link>.
      </p>
    </>
  );
}

function QuestForm({ draft, setDraft, onSave }: { draft: QuestDraft; setDraft: (d: QuestDraft | null) => void; onSave: () => void }) {
  const set = <K extends keyof QuestDraft>(k: K, v: QuestDraft[K]) => setDraft({ ...draft, [k]: v });
  return (
    <form
      className="qform"
      onSubmit={e => {
        e.preventDefault();
        onSave();
      }}
    >
      <label className="field">
        <span>Title</span>
        <input value={draft.title} onChange={e => set("title", e.target.value)} maxLength={90} placeholder="Wire a servo and make it move" autoFocus />
      </label>
      <div className="qform-row">
        <label className="field">
          <span>Kind</span>
          <select value={draft.kind} onChange={e => set("kind", e.target.value as QuestKind)}>
            {KINDS.map(k => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>For</span>
          <select value={draft.track} onChange={e => set("track", e.target.value as QuestDraft["track"])}>
            {CUSTOM_TRACKS.map(t => (
              <option key={t} value={t}>
                {TRACKS[t].short}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Level</span>
          <select value={draft.level} onChange={e => set("level", Number(e.target.value) as QuestDraft["level"])}>
            {([1, 2, 3] as const).map(l => (
              <option key={l} value={l}>
                {LEVEL_LABEL[l]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Minutes</span>
          <input type="number" min={5} max={240} value={draft.mins} onChange={e => set("mins", Number(e.target.value))} />
        </label>
      </div>
      <label className="field">
        <span>One line that makes them want to do it</span>
        <input value={draft.blurb} onChange={e => set("blurb", e.target.value)} maxLength={240} />
      </label>
      <label className="field">
        <span>Steps, one per line</span>
        <textarea rows={5} value={draft.steps} onChange={e => set("steps", e.target.value)} placeholder={"Find a servo and a servo cable.\nPlug it into port 0 on the hub.\n…"} />
      </label>
      <label className="field">
        <span>Links, one per line (optional)</span>
        <textarea rows={2} value={draft.links} onChange={e => set("links", e.target.value)} placeholder="Servo basics | https://…" />
      </label>
      <label className="field">
        <span>How they show it’s done</span>
        <input value={draft.proof} onChange={e => set("proof", e.target.value)} maxLength={240} placeholder="Show me the servo moving from the gamepad." />
      </label>
      <label className="field">
        <span>Why it matters (optional)</span>
        <input value={draft.why} onChange={e => set("why", e.target.value)} maxLength={300} />
      </label>
      <label className="toggle">
        <input type="checkbox" checked={draft.helpsTeam} onChange={e => set("helpsTeam", e.target.checked)} /> It makes something the team needs
      </label>
      <div className="dialog-foot">
        <button type="button" className="link-btn" onClick={() => setDraft(null)}>
          Cancel
        </button>
        <button type="submit" className="cta solid">
          <span>{draft.id ? "Save changes" : "Save quest"}</span>
          <i className="cta-dot" aria-hidden="true">
            <Icon name="check" size={16} />
          </i>
        </button>
      </div>
    </form>
  );
}

/* ====================== Labs ====================== */

function LabsTab({ data, post }: { data: CoachState; post: Post }) {
  const [add, setAdd] = useState("");
  const flags = data.settings.flags;
  return (
    <>
      <section className="card labs" aria-labelledby="labs-h">
        <h2 id="labs-h">Labs</h2>
        <p className="muted">Turn parts of the site on or off for everyone. Off parts are hidden from students. You can still open them.</p>
        <ul className="flag-list">
          {FLAG_INFO.map(f => (
            <li key={f.key}>
              <label className="flag-row">
                <input type="checkbox" checked={flags[f.key]} onChange={e => post({ op: "flags", flags: { [f.key as FlagKey]: e.target.checked } })} />
                <span className="switch" aria-hidden="true" />
                <span>
                  <b>{f.name}</b>
                  <small>{f.what}</small>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-labelledby="admins-h">
        <h2 id="admins-h">Coaches</h2>
        <p className="muted">Coaches see this page and can assign quests. They sign in with Google like everyone else.</p>
        <ul className="admin-list">
          {data.fixedAdmins.map(e => (
            <li key={e}>
              <span>{e}</span>
              <small className="muted">always a coach</small>
            </li>
          ))}
          {data.settings.admins.map(e => (
            <li key={e}>
              <span>{e}</span>
              <button type="button" className="link-btn" onClick={() => post({ op: "admins", admins: data.settings.admins.filter(x => x !== e) })}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        <form
          className="admin-add"
          onSubmit={async e => {
            e.preventDefault();
            if (await post({ op: "admins", admins: [...data.settings.admins, add] })) setAdd("");
          }}
        >
          <input value={add} onChange={e => setAdd(e.target.value)} placeholder="jhicks@tsdch.org" aria-label="Coach email" />
          <button type="submit" className="btn" disabled={!add.includes("@")}>
            Add coach
          </button>
        </form>
      </section>
    </>
  );
}
