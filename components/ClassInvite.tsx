"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { encode } from "uqr";
import { useApp } from "./AppProvider";
import { Icon } from "./ui";
import { isSchoolEmail, parsePaste, shortName } from "@/lib/roster";
import { plural } from "@/lib/time";
import { TEAM_IDS, type CoachState, type TeamId } from "@/lib/types";

type Post = (body: Record<string, unknown>) => Promise<boolean>;

const origin = () => (typeof window === "undefined" ? "" : window.location.origin);

export function Qr({ text }: { text: string }) {
  const { path, n } = useMemo(() => {
    const { data, size } = encode(text, { border: 2 });
    let d = "";
    data.forEach((row, y) => row.forEach((on, x) => on && (d += `M${x} ${y}h1v1h-1z`)));
    return { path: d, n: size };
  }, [text]);
  return (
    <svg className="qr" viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" role="img" aria-label={`QR code for ${text}`}>
      <rect width={n} height={n} fill="#fff" />
      <path d={path} fill="#14213d" />
    </svg>
  );
}

const inviteText = (url: string, coach: string) =>
  `Robotics: your quests are ready.

1. Go to ${url}
2. Sign in with your Trinity Google account.
3. Your first quests are on Home.

If you get stuck on one, press “I’m stuck” and I’ll see it.
${coach}`;

/** The message to paste into Classroom or an email, plus the QR code for class. */
export function InvitePanel() {
  const { person, toast } = useApp();
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [big, setBig] = useState(false);
  useEffect(() => {
    setUrl(origin());
    setText(inviteText(origin(), person));
  }, [person]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast("info", "Copied", "Paste it into Google Classroom or an email to the class.");
    } catch {
      toast("error", "Couldn’t copy", "Select the message and copy it yourself.");
    }
  };

  return (
    <div className="invite">
      <div className="invite-msg">
        <label className="field">
          <span>Send this from your own account</span>
          <textarea rows={9} value={text} onChange={e => setText(e.target.value)} />
        </label>
        <div className="invite-actions">
          <button type="button" className="cta solid" onClick={copy}>
            <span>Copy message</span>
            <i className="cta-dot" aria-hidden="true">
              <Icon name="copy" size={16} />
            </i>
          </button>
          <small className="muted">Post it in Google Classroom, or email it to the class. It comes from you, so it won’t land in spam.</small>
        </div>
      </div>
      {url && (
        <div className="invite-qr">
          <Qr text={url} />
          <button type="button" className="btn" onClick={() => setBig(true)}>
            Show on the projector
          </button>
          <small className="muted">In class, they scan it with a phone or type the address.</small>
        </div>
      )}
      {big && <Projector url={url} onClose={() => setBig(false)} />}
    </div>
  );
}

function Projector({ url, onClose }: { url: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog ref={ref} className="projector" onClose={onClose} onClick={onClose} aria-label="Join code for the class">
      <div className="pj-inner">
        <Qr text={url} />
        <div>
          <p className="pj-url">{url.replace(/^https?:\/\//, "")}</p>
          <p className="pj-how">Sign in with your Trinity Google account. Your quests are waiting.</p>
          <p className="pj-close">Click anywhere or press Esc to close</p>
        </div>
      </div>
    </dialog>
  );
}

export function InviteDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog ref={ref} className="dialog wide-dialog" onClose={onClose} onClick={e => e.target === ref.current && onClose()} aria-labelledby="invite-h">
      <div className="dialog-head">
        <div>
          <div className="eyebrow">Invite</div>
          <h2 id="invite-h">Tell your class</h2>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
          <Icon name="x" />
        </button>
      </div>
      <p className="muted">There’s nothing to accept. When a student you added signs in with their school Google account, their quests are already there.</p>
      <InvitePanel />
    </dialog>
  );
}

/** Paste a class list, check it, add everyone, then tell them. */
export function AddStudents({ data, post, team: startTeam, onClose }: { data: CoachState; post: Post; team: TeamId | null; onClose: () => void }) {
  const { questById } = useApp();
  const ref = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState("");
  const [team, setTeam] = useState<TeamId | null>(startTeam);
  const [starter, setStarter] = useState(true);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<number | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const known = useMemo(() => new Map(data.students.map(s => [s.email, s])), [data.students]);
  const { add, already, bad } = useMemo(() => {
    const coaches = new Set([...data.fixedAdmins, ...data.settings.admins]);
    const rows = parsePaste(text).filter(r => !coaches.has(r.email));
    return {
      add: rows.filter(r => isSchoolEmail(r.email) && !known.get(r.email)?.listed),
      already: rows.filter(r => isSchoolEmail(r.email) && known.get(r.email)?.listed),
      bad: rows.filter(r => !isSchoolEmail(r.email)),
    };
  }, [text, data, known]);

  const starterTitles = data.settings.starter.map(id => questById(id)?.title).filter(Boolean) as string[];

  const submit = async () => {
    setBusy(true);
    const ok = await post({ op: "addStudents", students: add.map(r => ({ email: r.email, name: r.name })), team, starter });
    setBusy(false);
    if (ok) setAdded(add.length);
  };

  return (
    <dialog ref={ref} className="dialog wide-dialog" onClose={onClose} onClick={e => e.target === ref.current && onClose()} aria-labelledby="add-h">
      <div className="dialog-head">
        <div>
          <div className="eyebrow">{added === null ? "Step 1 of 2" : "Step 2 of 2"}</div>
          <h2 id="add-h">{added === null ? "Add students" : `Added ${plural(added, "student")}`}</h2>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
          <Icon name="x" />
        </button>
      </div>

      {added === null ? (
        <form
          onSubmit={e => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="field">
            <span>Paste their school email addresses</span>
            <textarea
              rows={6}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={"mtorres@tsdch.org\nLeo Rivera <lrivera@tsdch.org>\n…"}
              autoFocus
            />
            <small className="muted">From a spreadsheet, an email’s To: line, or one per line. Names are optional. Each student’s Google name fills in when they sign in.</small>
          </label>

          {text.trim() && (
            <div className="paste-check" aria-live="polite">
              {add.length > 0 && (
                <div>
                  <div className="label">{add.length} to add</div>
                  <ul className="paste-names">
                    {add.map(r => (
                      <li key={r.email} title={r.email}>
                        {known.get(r.email)?.name ?? (r.name ? shortName(r.name, r.email) : r.email)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {already.length > 0 && <p className="muted small">{plural(already.length, "student")} already on your list. They stay as they are.</p>}
              {bad.length > 0 && (
                <p className="paste-bad small">
                  Can’t sign in: {bad.map(r => r.email).join(", ")}. Only @tsdch.org Google accounts can use the site.
                </p>
              )}
              {!add.length && !already.length && !bad.length && <p className="muted small">No email addresses in that yet.</p>}
            </div>
          )}

          <div className="field">
            <span>Team</span>
            <div className="seg wide" role="group" aria-label="Team">
              {TEAM_IDS.map(t => (
                <button key={t} type="button" aria-pressed={team === t} onClick={() => setTeam(t)}>
                  Team {t}
                </button>
              ))}
              <button type="button" aria-pressed={team === null} onClick={() => setTeam(null)}>
                They choose
              </button>
            </div>
            {team && <small className="muted">They won’t be asked their team when they sign in.</small>}
          </div>

          {starterTitles.length > 0 ? (
            <label className="toggle">
              <input type="checkbox" checked={starter} onChange={e => setStarter(e.target.checked)} /> Give them the starter quests: {starterTitles.join(", ")}
            </label>
          ) : (
            <p className="muted small">No starter quests yet. Set them under Your quests, and new students never start with an empty Home.</p>
          )}

          <div className="dialog-foot">
            <span className="muted small">You can assign quests before they sign in.</span>
            <button type="submit" className="cta solid" disabled={!add.length || busy}>
              <span>{add.length ? `Add ${plural(add.length, "student")}` : "Add students"}</span>
              <i className="cta-dot" aria-hidden="true">
                <Icon name="check" size={16} />
              </i>
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="muted">They’re on your roster now, marked “hasn’t signed in yet”. Next, tell them where to go.</p>
          <InvitePanel />
          <div className="dialog-foot end">
            <button type="button" className="btn" onClick={onClose}>
              Done
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
