"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useApp } from "./AppProvider";
import { Avatar, Icon, type IconName } from "./ui";
import { TRACKS } from "@/lib/data/core";
import { personalLevel } from "@/lib/xp";
import { fmtLong } from "@/lib/time";
import { TEAM_IDS, type Focus, type TeamId } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  match: (p: string) => boolean;
}

function useNav(): NavItem[] {
  const { clock } = useApp();
  const wk = clock.before ? 1 : clock.now;
  return [
    { href: "/", label: "Home", icon: "home", match: p => p === "/" },
    { href: `/week/${wk}`, label: "Week", icon: "week", match: p => p.startsWith("/week") },
    { href: "/quests", label: "Quests", icon: "quest", match: p => p.startsWith("/quests") },
    { href: "/season", label: "Season", icon: "map", match: p => p.startsWith("/season") },
    { href: "/robot", label: "Robot", icon: "robot", match: p => p.startsWith("/robot") },
    { href: "/playbook", label: "Playbook", icon: "book", match: p => p.startsWith("/playbook") },
    { href: "/hive", label: "Hive", icon: "hive", match: p => p.startsWith("/hive") },
  ];
}

export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="m24 11 11.3 6.5v13L24 37l-11.3-6.5v-13z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="4.5" fill="var(--gold)" />
    </svg>
  );
}

export function Header() {
  const path = usePathname();
  const nav = useNav();
  const { team, setTeam, person, me, openProfile } = useApp();
  const lvl = personalLevel(me?.xp ?? 0);
  return (
    <header className="site-head">
      <div className="wrap head-in">
        <Link href="/" className="brand" aria-label="Trinity Robotics, home">
          <BrandMark />
          <span className="brand-text">
            <b>Trinity</b>
            <b>Robotics</b>
            <small>
              of <em>Trinity School</em> · Durham and Chapel Hill
            </small>
          </span>
        </Link>

        <nav className="top-nav" aria-label="Main">
          {nav.map(n => (
            <Link key={n.href} href={n.href} className={n.match(path) ? "on" : ""} aria-current={n.match(path) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="head-tools">
          <div className="seg" role="group" aria-label="Choose your team">
            {TEAM_IDS.map(t => (
              <button key={t} type="button" aria-pressed={team === t} onClick={() => setTeam(t as TeamId)}>
                {t}
              </button>
            ))}
          </div>
          <button type="button" className="me-chip" onClick={openProfile} aria-label={person ? `You are ${person}. Open your profile` : "Tell us who you are"}>
            {person ? (
              <>
                <Avatar name={person} size={30} />
                <span className="me-text">
                  <b>{person}</b>
                  <small>
                    {lvl.name} · {me?.xp ?? 0} XP
                  </small>
                </span>
              </>
            ) : (
              <span className="me-text">
                <b>Who’s buzzing?</b>
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const path = usePathname();
  const nav = useNav();
  const [more, setMore] = useState(false);
  const main = nav.filter(n => ["Home", "Week", "Quests", "Hive"].includes(n.label));
  const rest = nav.filter(n => !main.includes(n));
  useEffect(() => setMore(false), [path]);
  return (
    <>
      {more && (
        <div className="more-sheet" role="dialog" aria-label="More pages" onClick={() => setMore(false)}>
          <div onClick={e => e.stopPropagation()}>
            {rest.map(n => (
              <Link key={n.href} href={n.href} className={n.match(path) ? "on" : ""}>
                <Icon name={n.icon} />
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}
      <nav className="bottom-nav" aria-label="Main">
        {main.map(n => (
          <Link key={n.href} href={n.href} className={n.match(path) ? "on" : ""} aria-current={n.match(path) ? "page" : undefined}>
            <Icon name={n.icon} size={22} />
            <span>{n.label}</span>
          </Link>
        ))}
        <button type="button" className={rest.some(n => n.match(path)) || more ? "on" : ""} onClick={() => setMore(m => !m)} aria-expanded={more}>
          <Icon name="more" size={22} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}

export function PreviewBar() {
  const { preview, setPreview, clock } = useApp();
  if (!preview) return null;
  return (
    <div className="preview-bar" role="status">
      <div className="wrap">
        <span>
          Previewing the plan as if today is <b>{fmtLong(clock.today)}</b>.
        </span>
        <button type="button" onClick={() => setPreview(null)}>
          Back to today
        </button>
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts, dismiss } = useApp();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.kind}`} role="status" onClick={() => dismiss(t.id)}>
          <i className="toast-ico" aria-hidden="true">
            <Icon name={t.kind === "xp" ? "bolt" : t.kind === "level" ? "trophy" : t.kind === "badge" ? "quest" : t.kind === "cheer" ? "hive" : t.kind === "error" ? "x" : "check"} size={18} />
          </i>
          <div>
            <b>{t.title}</b>
            {t.sub && <small>{t.sub}</small>}
          </div>
          {(t.kind === "cheer" || t.kind === "level" || t.kind === "badge") && (
            <span className="burst" aria-hidden="true">
              {Array.from({ length: 10 }, (_, i) => (
                <i key={i} style={{ ["--a" as string]: `${i * 36}deg`, ["--d" as string]: `${i % 2 ? 34 : 24}px` }} />
              ))}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

const FOCUS: { code: Focus; label: string }[] = [
  { code: "all", label: "A bit of everything" },
  { code: "B", label: TRACKS.B.short },
  { code: "S", label: TRACKS.S.short },
  { code: "D", label: TRACKS.D.short },
  { code: "O", label: TRACKS.O.short },
];

export function ProfileDialog() {
  const { profileOpen, closeProfile, person, setPerson, team, setTeam, focus, setFocus, code, setCode, state, preview, setPreview, offline } = useApp();
  const ref = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(person);
  const [pv, setPv] = useState(preview ?? "");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (profileOpen && !d.open) {
      setName(person);
      setPv(preview ?? "");
      d.showModal();
    }
    if (!profileOpen && d.open) d.close();
  }, [profileOpen, person, preview]);

  const save = () => {
    if (name.trim()) setPerson(name);
    if (pv !== (preview ?? "")) setPreview(pv || null);
    closeProfile();
  };

  return (
    <dialog
      ref={ref}
      className="dialog"
      onClose={closeProfile}
      onClick={e => {
        if (e.target === ref.current) closeProfile();
      }}
      aria-labelledby="profile-title"
    >
      <form
        method="dialog"
        onSubmit={e => {
          e.preventDefault();
          save();
        }}
      >
        <div className="dialog-head">
          <div>
            <div className="eyebrow">Trinity Robotics</div>
            <h2 id="profile-title">{person ? `Hi, ${person}` : "Who’s buzzing?"}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={closeProfile} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <p className="muted">No account needed. Type your name so the team can see who did what. Your ticks count toward your XP.</p>

        <label className="field">
          <span>Your name (first name and last initial is fine)</span>
          <input value={name} onChange={e => setName(e.target.value)} maxLength={24} autoComplete="given-name" placeholder="Maya R" />
        </label>

        <div className="field">
          <span>Your team</span>
          <div className="seg wide" role="group" aria-label="Your team">
            {TEAM_IDS.map(t => (
              <button key={t} type="button" aria-pressed={team === t} onClick={() => setTeam(t)}>
                Team {t}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>What do you mostly work on?</span>
          <div className="chips">
            {FOCUS.map(f => (
              <button key={f.code} type="button" className={`chip ${focus === f.code ? "on" : ""}`} aria-pressed={focus === f.code} onClick={() => setFocus(f.code)}>
                {f.label}
              </button>
            ))}
          </div>
          <small className="muted">This only decides what we show first. You can see everything.</small>
        </div>

        {state.locked && (
          <label className="field">
            <span>
              <Icon name="lock" size={14} /> Team code
            </span>
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="Ask your coach" autoComplete="off" />
          </label>
        )}

        <details className="adv">
          <summary>Extras</summary>
          <label className="field">
            <span>Preview the plan as if today were…</span>
            <input type="date" value={pv} onChange={e => setPv(e.target.value)} />
          </label>
          <p className="muted small">
            {state.mode === "local" ? "Saving to this browser only." : state.mode === "file" ? "Saving to a file on this computer (development)." : "Saving to the team’s shared database."}
            {offline ? " Can’t reach the server right now." : ""}
          </p>
        </details>

        <div className="dialog-foot">
          <button type="button" className="link-btn" onClick={closeProfile}>
            Just looking
          </button>
          <button type="submit" className="cta solid">
            <span>Save</span>
            <i className="cta-dot" aria-hidden="true">
              <Icon name="arrow" size={16} />
            </i>
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function Footer() {
  const { state, team } = useApp();
  return (
    <footer className="site-foot">
      <div className="wrap">
        <div>
          <b>Trinity Robotics</b> · FTC 2026–27 · BIOBUZZ · Team {team}
          <p>Planned dates: robot to coders Sun 1 Nov 2026, NC scrimmage Sat 12 Dec, NC qualifier Sat 16 Jan 2027. Confirm event dates on the NC FTC calendar.</p>
          <p>Game facts come from the BIOBUZZ Competition Manual (TU05, Oct 15) and the one-page game description. Recheck Team Updates and Q&amp;A every Monday and before every event, including where the AprilTags are.</p>
          <p>
            {state.mode === "db" && "Progress is saved to the team’s shared database. "}
            {state.mode === "file" && "Development mode: progress is saved to a file on this computer. "}
            {state.mode === "local" && "Progress is saved in this browser only. "}
            Format inspired by Coach Brogan Pratt’s “Week N” plans. Not affiliated with FIRST.
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Show a calm placeholder until we know the date, team and who you are (avoids a flash of the wrong week). */
export function Ready({ children }: { children: ReactNode }) {
  const { ready } = useApp();
  if (!ready)
    return (
      <div className="wrap boot" role="status" aria-live="polite">
        <i className="boot-dot" />
        <span>Warming up the hive…</span>
      </div>
    );
  return <>{children}</>;
}
