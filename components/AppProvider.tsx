"use client";

import { useSession } from "next-auth/react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { applyOp } from "@/lib/apply";
import { demoTally, gateTally } from "@/lib/progress";
import { EMPTY_STATE, TEAM_IDS, type BudgetRow, type Flags, type Focus, type MeState, type RemoteState, type TeamId, type WorkStatus, type WriteOp } from "@/lib/types";
import { pd, sod } from "@/lib/time";
import { clockOf, getIndex, getWeeks, type Clock } from "@/lib/weeks";
import { QUESTS, QUEST_BY_ID, questXp, type Quest } from "@/lib/data/quests";
import { DEFAULT_FLAGS } from "@/lib/flags";
import { computePeople, nameKey, normName, personalLevel, type Person } from "@/lib/xp";
import type { Week } from "@/lib/types";

export type ToastKind = "xp" | "level" | "badge" | "cheer" | "error" | "info";
export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  sub?: string;
}

export interface App {
  ready: boolean;
  /** true until NextAuth knows whether anyone is signed in */
  authLoading: boolean;
  team: TeamId;
  setTeam: (t: TeamId) => void;
  person: string;
  email: string;
  focus: Focus;
  setFocus: (f: Focus) => void;
  code: string;
  setCode: (c: string) => void;
  weeks: Week[];
  clock: Clock;
  preview: string | null;
  setPreview: (d: string | null) => void;

  state: RemoteState;
  loading: boolean;
  offline: boolean;
  people: Person[];
  me: Person | null;
  teamXp: number;

  tick: (id: string, on: boolean) => void;
  claim: (id: string, on: boolean) => void;
  quest: (id: string, on: boolean, note?: string) => void;
  saveBudget: (rows: BudgetRow[]) => void;
  refresh: () => void;

  /** your quests, the Labs switches, and whether you're an admin */
  mine: MeState;
  mineReady: boolean;
  flags: Flags;
  admin: boolean;
  /** built-in quests plus the ones the coach wrote */
  allQuests: Quest[];
  questById: (id: string) => Quest | undefined;
  /** status null clears it. Resolves true if it saved. */
  setWork: (quest: string, status: WorkStatus | null, text?: string) => Promise<boolean>;
  refreshMine: () => void;

  toasts: Toast[];
  toast: (kind: Toast["kind"], title: string, body?: string) => void;
  dismiss: (id: number) => void;
  profileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
}

const Ctx = createContext<App | null>(null);
export function useApp(): App {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside <AppProvider>");
  return v;
}

/* ---------- tiny localStorage helpers (they never throw) ---------- */
const LS = {
  get(k: string): string | null {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
  del(k: string) {
    try {
      localStorage.removeItem(k);
    } catch {}
  },
};
const loadLocal = (team: TeamId): RemoteState => {
  try {
    const raw = JSON.parse(LS.get("tr-local-" + team) || "null");
    if (raw && typeof raw === "object") return { ...EMPTY_STATE, ...raw, mode: "local", locked: false };
  } catch {}
  return { ...EMPTY_STATE };
};
const saveLocal = (team: TeamId, s: RemoteState) => LS.set("tr-local-" + team, JSON.stringify({ checks: s.checks, claims: s.claims, quests: s.quests, budget: s.budget }));

const POLL_MS = 20000;
let toastSeq = 1;
const EMPTY_ME: MeState = { db: false, admin: false, flags: DEFAULT_FLAGS, assignments: [], work: {}, custom: [], profile: null, needs: 0 };

export function AppProvider({ children }: { children: ReactNode }) {
  const [booted, setBooted] = useState(false);
  const { data: session, status } = useSession();
  const person = status === "authenticated" ? normName(session?.user?.name || "") : "";
  const email = status === "authenticated" ? session?.user?.email || "" : "";
  const [team, setTeamS] = useState<TeamId>("2827");
  const [focus, setFocusS] = useState<Focus>("all");
  const [code, setCodeS] = useState("");
  const [todayD, setTodayD] = useState<Date>(() => pd("2026-10-19")); // fixed for SSR; the real date is set on mount
  const [preview, setPreviewS] = useState<string | null>(null);
  const [state, setState] = useState<RemoteState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mine, setMine] = useState<MeState>(EMPTY_ME);
  const [mineReady, setMineReady] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;
  const loadingRef = useRef(true);
  loadingRef.current = loading;
  const pending = useRef(0);
  const readSeq = useRef(0);
  const writeSeq = useRef(0);

  /* ----- boot: restore who/what, and any preview date ----- */
  useEffect(() => {
    const t = LS.get("tr-team");
    if (t && (TEAM_IDS as string[]).includes(t)) setTeamS(t as TeamId);
    const f = LS.get("tr-focus");
    if (f && ["all", "B", "S", "D", "O"].includes(f)) setFocusS(f as Focus);
    setCodeS(LS.get("tr-code") || "");

    let pv: string | null = null;
    try {
      const q = new URLSearchParams(window.location.search).get("date");
      if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) {
        pv = q;
        sessionStorage.setItem("tr-preview", q);
      } else pv = sessionStorage.getItem("tr-preview");
    } catch {}
    if (pv && /^\d{4}-\d{2}-\d{2}$/.test(pv)) {
      setPreviewS(pv);
      setTodayD(pd(pv));
    } else setTodayD(sod(new Date()));
    setBooted(true);
  }, []);

  /* ----- keep "today" fresh while the tab stays open ----- */
  useEffect(() => {
    if (preview) return;
    const id = setInterval(() => {
      const n = sod(new Date());
      setTodayD(prev => (prev.getTime() === n.getTime() ? prev : n));
    }, 60000);
    return () => clearInterval(id);
  }, [preview]);

  const weeks = useMemo(() => getWeeks(team), [team]);
  const clock = useMemo(() => clockOf(weeks, todayD), [weeks, todayD]);

  /* ----- toasts ----- */
  const dismiss = useCallback((id: number) => setToasts(t => t.filter(x => x.id !== id)), []);
  const toast = useCallback(
    (kind: ToastKind, title: string, sub?: string) => {
      const id = toastSeq++;
      setToasts(t => [...t.slice(-3), { id, kind, title, sub }]);
      setTimeout(() => dismiss(id), kind === "error" ? 6000 : kind === "xp" ? 2800 : 4500);
    },
    [dismiss],
  );

  /* ----- load + poll the shared state ----- */
  const load = useCallback(async (t: TeamId, showSpinner = false) => {
    const seq = ++readSeq.current;
    if (showSpinner) setLoading(true);
    try {
      const r = await fetch(`/api/state?team=${t}`, { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      const d = (await r.json()) as RemoteState;
      if (seq !== readSeq.current || pending.current > 0) return;
      setOffline(false);
      setState(d.mode === "local" ? loadLocal(t) : d);
    } catch {
      if (seq !== readSeq.current) return;
      setOffline(true);
      // first load failed: still let people work from this browser's copy
      setState(s => (s.mode === "local" && !Object.keys(s.checks).length ? loadLocal(t) : s));
    } finally {
      if (seq === readSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!booted) return;
    setState({ ...EMPTY_STATE });
    void load(team, true);
  }, [team, booted, load]);

  /* ----- your quests and the Labs switches ----- */
  const emailRef = useRef(email);
  emailRef.current = email;
  const syncedRef = useRef("");
  const [syncedFor, setSyncedFor] = useState("");
  const loadMine = useCallback(async () => {
    try {
      const r = await fetch("/api/me", { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      const data = (await r.json()) as MeState;
      setMine(data);
      /* this browser may have last been used by someone else, so the saved team and focus win at sign-in */
      const p = data.profile;
      const who = emailRef.current;
      if (who && syncedRef.current !== who && (p ? p.email === who : !data.db)) {
        syncedRef.current = who;
        if (p?.team) {
          LS.set("tr-team", p.team);
          setTeamS(p.team);
        }
        if (p?.focus) {
          LS.set("tr-focus", p.focus);
          setFocusS(p.focus);
        }
        setSyncedFor(who);
      }
    } catch {
      // keep what we had; the defaults hide the team tools
    } finally {
      setMineReady(true);
    }
  }, []);

  useEffect(() => {
    if (!booted || status === "loading") return;
    void loadMine();
  }, [booted, status, email, loadMine]);

  /* tell the server your team and focus, so the coach's roster knows */
  useEffect(() => {
    if (!booted || !person || !mine.db || !email || syncedFor !== email) return;
    void fetch("/api/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "profile", team, focus }) }).catch(() => undefined);
  }, [booted, person, mine.db, email, syncedFor, team, focus]);

  /* After Google returns, ask for team and focus once per account, unless the coach already put them on a team. */
  const setupAsked = useRef(false);
  const coachTeam = mine.profile?.team ?? null;
  useEffect(() => {
    if (!booted || status !== "authenticated" || !email || syncedFor !== email || setupAsked.current) return;
    const key = "tr-setup:" + email.toLowerCase();
    try {
      if (localStorage.getItem(key)) return;
      setupAsked.current = true;
      if (coachTeam) localStorage.setItem(key, "1");
      else setProfileOpen(true);
    } catch {}
  }, [booted, status, email, syncedFor, coachTeam]);

  useEffect(() => {
    if (!booted) return;
    const poll = () => {
      if (document.visibilityState !== "visible") return;
      if (pending.current === 0) void load(team);
      void loadMine();
    };
    const id = setInterval(poll, POLL_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [team, booted, load, loadMine]);

  const allQuests = useMemo(() => [...QUESTS, ...mine.custom.filter(c => !QUEST_BY_ID[c.id])], [mine.custom]);
  const questMap = useMemo(() => Object.fromEntries(allQuests.map(q => [q.id, q])) as Record<string, Quest>, [allQuests]);

  const setWork = useCallback(
    async (quest: string, st: WorkStatus | null, text?: string) => {
      if (!person) {
        setProfileOpen(true);
        return false;
      }
      if (!mine.db) {
        toast("error", "Can’t save yet", "The site isn’t connected to its database.");
        return false;
      }
      try {
        const r = await fetch("/api/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "work", quest, status: st, text }) });
        const data = (await r.json().catch(() => ({}))) as MeState & { error?: string };
        if (!r.ok) throw new Error(data.error || "Couldn’t save");
        setMine(data);
        const q = questMap[quest];
        if (st === "done") toast("xp", mine.flags.xp && q ? `+${questXp(q)} XP` : "Nice work", "Your coach can see it now.");
        else if (st === "stuck") toast("info", "Your coach can see you’re stuck", "Try a hint while you wait.");
        else if (st === "doing") toast("info", "Started", "It’s on your list on Home.");
        void load(team);
        return true;
      } catch (e) {
        toast("error", "Didn’t save", e instanceof Error ? e.message : "Try again.");
        return false;
      }
    },
    [person, mine.db, mine.flags.xp, questMap, toast, load, team],
  );

  /* ----- derived: people, XP, me ----- */
  const people = useMemo(() => computePeople(state, team, clock.now), [state, team, clock.now]);
  const me = useMemo(() => (person ? people.find(p => p.key === nameKey(person)) ?? null : null), [people, person]);
  const teamXp = useMemo(() => people.reduce((n, p) => n + p.xp, 0), [people]);

  /* ----- writes ----- */
  const write = useCallback(
    async (op: WriteOp) => {
      if (!person) {
        setProfileOpen(true);
        toast("info", "Sign in first", "Use your Trinity Google account.");
        return;
      }
      if (loadingRef.current) {
        toast("info", "One second…", "Still loading the team’s progress.");
        return;
      }
      const prev = stateRef.current;
      const at = new Date().toISOString();
      const next = applyOp(prev, op, person, at);
      setState(next);
      stateRef.current = next;
      celebrate(prev, next, op);

      if (prev.mode === "local") {
        saveLocal(team, next);
        return;
      }
      const mine = ++writeSeq.current;
      pending.current++;
      let failed = false;
      try {
        const r = await fetch("/api/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ team, code, ...op }),
        });
        const data = (await r.json().catch(() => ({}))) as RemoteState & { error?: string };
        if (!r.ok) throw new Error(data.error || "Couldn’t save");
        setOffline(false);
        if (mine === writeSeq.current) {
          setState(data);
          stateRef.current = data;
        }
      } catch (e) {
        failed = true;
        toast("error", "Didn’t save", e instanceof Error ? e.message : "Try again.");
      } finally {
        pending.current = Math.max(0, pending.current - 1);
      }
      // undo the optimistic change by re-reading what the server really has
      if (failed) void load(team);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [person, team, code, toast, load, clock.now],
  );

  /** XP, level-ups, badges and "week done" cheers for the person who just acted */
  function celebrate(prev: RemoteState, next: RemoteState, op: WriteOp) {
    const before = computePeople(prev, team, clock.now).find(p => p.key === nameKey(person));
    const after = computePeople(next, team, clock.now).find(p => p.key === nameKey(person));
    if (!after) return;
    const xpB = before?.xp ?? 0;
    const gain = after.xp - xpB;
    const lb = personalLevel(xpB);
    const la = personalLevel(after.xp);
    if (la.idx > lb.idx && mine.flags.xp) {
      toast("level", `Level up: ${la.name}`, "Nice work.");
    } else if (op.op === "check" && op.on && gain > 0 && mine.flags.xp) {
      toast("xp", `+${gain} XP`);
    } else if (op.op === "claim" && op.on) {
      toast("info", "It’s yours", "Tick it off when it’s done.");
    }

    if (op.op === "check" && op.on) {
      const e = getIndex(team).get(op.id);
      const w = e && weeks[e.week - 1];
      if (w && e) {
        const [db, dtb] = demoTally(w, prev.checks);
        const [da, dta] = demoTally(w, next.checks);
        if (e.kind === "demo" && dta > 0 && da === dta && db < dtb) toast("cheer", `Week ${w.n} demo: all done`, "Everyone showed their stuff.");
        const [gb, gtb] = gateTally(w, prev.checks);
        const [ga, gta] = gateTally(w, next.checks);
        if (e.kind === "gate" && gta > 0 && ga === gta && gb < gtb) toast("cheer", `${w.gate!.name}: cleared`, "The whole team is through.");
      }
    }
  }

  // once the page has shown, a background session refresh must not swap it for the placeholder
  const wasReady = useRef(false);
  if (booted && status !== "loading" && mineReady) wasReady.current = true;

  const value: App = {
    ready: wasReady.current,
    authLoading: status === "loading",
    team,
    setTeam: t => {
      LS.set("tr-team", t);
      setTeamS(t);
    },
    person,
    email,
    focus,
    setFocus: f => {
      LS.set("tr-focus", f);
      setFocusS(f);
    },
    code,
    setCode: c => {
      LS.set("tr-code", c);
      setCodeS(c);
    },
    weeks,
    clock,
    preview,
    setPreview: d => {
      try {
        if (d) sessionStorage.setItem("tr-preview", d);
        else sessionStorage.removeItem("tr-preview");
      } catch {}
      setPreviewS(d);
      setTodayD(d ? pd(d) : sod(new Date()));
      if (!d) {
        try {
          const u = new URL(window.location.href);
          if (u.searchParams.has("date")) {
            u.searchParams.delete("date");
            window.history.replaceState(null, "", u.pathname + u.search + u.hash);
          }
        } catch {}
      }
    },
    state,
    loading,
    offline,
    people,
    me,
    teamXp,
    tick: (id, on) => void write({ op: "check", id, on }),
    claim: (id, on) => void write({ op: "claim", id, on }),
    quest: (id, on, note) => void write({ op: "quest", quest: id, on, note }),
    saveBudget: rows => void write({ op: "budget", rows }),
    refresh: () => void load(team),
    mine,
    mineReady,
    flags: mine.flags,
    admin: mine.admin,
    allQuests,
    questById: id => questMap[id],
    setWork,
    refreshMine: () => void loadMine(),
    toasts,
    toast,
    dismiss,
    profileOpen,
    openProfile: () => setProfileOpen(true),
    closeProfile: () => setProfileOpen(false),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
