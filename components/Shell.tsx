"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useApp } from "./AppProvider";
import { Avatar, Icon, type IconName } from "./ui";
import { TRACKS } from "@/lib/data/core";
import { signIn, signOut } from "next-auth/react";
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
  const { team, setTeam, person, openProfile } = useApp();
  const gate = !person && path === "/";
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

        {!gate && (
          <nav className="top-nav" aria-label="Main">
            {nav.map(n => (
              <Link key={n.href} href={n.href} className={n.match(path) ? "on" : ""} aria-current={n.match(path) ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="head-tools">
          {person && (
            <div className="seg" role="group" aria-label="Choose your team">
              {TEAM_IDS.map(t => (
                <button key={t} type="button" aria-pressed={team === t} onClick={() => setTeam(t as TeamId)}>
                  {t}
                </button>
              ))}
            </div>
          )}
          {!gate && (
          <button type="button" className={person ? "me-chip" : "signin-cta"} onClick={openProfile} aria-label={person ? "Open your account" : "Sign in with Google"}>
            {person ? (
              <>
                <Avatar name={person} size={30} />
                <span className="me-text">
                  <b>{person}</b>
                </span>
              </>
            ) : (
              "Sign in"
            )}
          </button>
          )}
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const path = usePathname();
  const nav = useNav();
  const { person } = useApp();
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [path]);
  if (!person && path === "/") return null;
  const main = nav.filter(n => ["Home", "Week", "Quests", "Hive"].includes(n.label));
  const rest = nav.filter(n => !main.includes(n));
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

export function SignInBar() {
  const path = usePathname();
  const { person, openProfile } = useApp();
  if (person || path === "/") return null;
  return (
    <div className="signin-bar">
      <div className="wrap">
        <p>Sign in with your Trinity Google account to tick tasks and do quests.</p>
        <button type="button" onClick={openProfile}>
          Sign in
        </button>
      </div>
    </div>
  );
}

export function PreviewBar() {
  const path = usePathname();
  const { preview, setPreview, clock, person } = useApp();
  if (!preview || (!person && path === "/")) return null;
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

function setupKey(email: string) {
  return "tr-setup:" + email.toLowerCase();
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

export function ProfileDialog() {
  const { profileOpen, closeProfile, person, email, team, setTeam, focus, setFocus, code, setCode, state, preview, setPreview, offline } = useApp();
  const ref = useRef<HTMLDialogElement>(null);
  const [pv, setPv] = useState(preview ?? "");
  const [googleOn, setGoogleOn] = useState<boolean | null>(null);
  const [setupDone, setSetupDone] = useState(true);

  useEffect(() => {
    if (!email) {
      setSetupDone(true);
      return;
    }
    try {
      setSetupDone(localStorage.getItem(setupKey(email)) === "1");
    } catch {
      setSetupDone(false);
    }
  }, [email, profileOpen]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (profileOpen && !d.open) {
      setPv(preview ?? "");
      d.showModal();
      if (!person) {
        fetch("/api/auth/providers")
          .then(r => r.json())
          .then(p => setGoogleOn(!!p?.google))
          .catch(() => setGoogleOn(false));
      }
    }
    if (!profileOpen && d.open) d.close();
  }, [profileOpen, preview, person]);

  const finishSetup = () => {
    if (email) {
      try {
        localStorage.setItem(setupKey(email), "1");
      } catch {}
    }
    setSetupDone(true);
    closeProfile();
  };

  const saveAccount = () => {
    if (pv !== (preview ?? "")) setPreview(pv || null);
    closeProfile();
  };

  const mode = !person ? "signin" : setupDone ? "account" : "setup";

  return (
    <dialog
      ref={ref}
      className={`dialog ${mode === "signin" ? "signin" : ""}`}
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
          if (mode === "setup") finishSetup();
          else if (mode === "account") saveAccount();
        }}
      >
        <div className="dialog-head">
          <div>
            <div className="eyebrow">{mode === "account" ? "Your account" : mode === "setup" ? "Step 2 of 2" : "Step 1 of 2"}</div>
            <h2 id="profile-title">{mode === "signin" ? "Sign in" : mode === "setup" ? `Hi, ${person}` : person}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={closeProfile} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>

        {mode === "signin" && (
          <>
            <p className="muted">Use the Google account Trinity School gave you. Next you’ll choose your team.</p>
            <button type="button" className="google-btn" disabled={googleOn === false} onClick={() => signIn("google")}>
              <GoogleMark />
              Continue with Google
            </button>
            <p className="muted small center">Use your Trinity School Google account.</p>
            {googleOn === false && <p className="muted small">Google sign-in isn’t configured on this server yet.</p>}
          </>
        )}

        {mode === "setup" && (
          <>
            <p className="muted">{email ? `Signed in as ${email}. ` : ""}Which team are you on?</p>
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
              <small className="muted">This only changes what we show first. You can still see everything.</small>
            </div>
            <div className="dialog-foot end">
              <button type="submit" className="cta solid">
                <span>Continue</span>
                <i className="cta-dot" aria-hidden="true">
                  <Icon name="arrow" size={16} />
                </i>
              </button>
            </div>
          </>
        )}

        {mode === "account" && (
          <>
            {email && <p className="muted">{email}</p>}
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
              <summary>Preview a date</summary>
              <label className="field">
                <span>Show the plan as if today were…</span>
                <input type="date" value={pv} onChange={e => setPv(e.target.value)} />
              </label>
              <p className="muted small">
                {state.mode === "local" ? "Saving to this browser only." : state.mode === "file" ? "Saving to a file on this computer (development)." : "Saving to the team’s shared database."}
                {offline ? " Can’t reach the server right now." : ""}
              </p>
            </details>
            <div className="dialog-foot">
              <button type="button" className="link-btn" onClick={() => signOut()}>
                Sign out
              </button>
              <button type="submit" className="cta solid">
                <span>Done</span>
                <i className="cta-dot" aria-hidden="true">
                  <Icon name="arrow" size={16} />
                </i>
              </button>
            </div>
          </>
        )}
      </form>
    </dialog>
  );
}

export function Footer() {
  const path = usePathname();
  const { state, team, person } = useApp();
  if (!person && path === "/") return null;
  return (
    <footer className="site-foot">
      <div className="wrap">
        <div>
          <b>Trinity Robotics</b> · FTC 2026–27 · BIOBUZZ · Team {team}
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
