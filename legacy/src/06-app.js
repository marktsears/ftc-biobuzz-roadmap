/* ============================================================
   APP
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? "" : v);
  }
  kids.flat(Infinity).forEach(c => { if (c == null || c === false) return; e.append(c.nodeType ? c : document.createTextNode(String(c))); });
  return e;
}

/* ---------- time ---------- */
const DAY = 86400000;
const sod = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const pd = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmt = d => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtLong = d => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const qs = new URLSearchParams(location.search);
const PREVIEW = /^\d{4}-\d{2}-\d{2}$/.test(qs.get("date") || "") ? qs.get("date") : null;
const TODAY = PREVIEW ? pd(PREVIEW) : sod(new Date());
const daysTo = d => Math.round((d - TODAY) / DAY);
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

const FIRST = pd(WEEKS[0].start);
const LAST = WEEKS[WEEKS.length - 1];
const LAST_END = addDays(pd(LAST.start), 6);
const BEFORE = TODAY < FIRST;
const AFTER = TODAY > LAST_END;
let NOWN = 1;
WEEKS.forEach(w => { if (pd(w.start) <= TODAY) NOWN = w.n; });

const COLS = WEEKS.reduce((n, w) => n + (w.brk ? 2 : 1), 0);
const startCol = {};
(() => { let c = 0; WEEKS.forEach(w => { startCol[w.n] = c; c += w.brk ? 2 : 1; }); })();
const centerPct = w => (startCol[w.n] + (w.brk ? 1 : 0.5)) / COLS * 100;
const wStart = w => pd(w.start);
const wEnd = w => addDays(pd(w.start), w.brk ? 13 : 6);
const phase = id => PHASES.find(p => p.id === id);
const MS_BY_WEEK = {};
MILESTONES.forEach(m => { (MS_BY_WEEK[m.week] = MS_BY_WEEK[m.week] || []).push(m); });

/* ---------- storage ---------- */
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};
const hs = s => { let x = 5381; for (let i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) | 0; return (x >>> 0).toString(36); };
const realISO = () => new Date().toISOString().slice(0, 10);

let team = "2827", role = "all", sel = 1, state = {}, budget = [];
{
  const s = LS.get("bb-team", "2827");
  team = s === "junior" ? "3587" : s === "3587" ? "3587" : "2827";
  const r = LS.get("bb3-role", "all");
  role = ["all", "B", "S", "D", "O"].includes(r) ? r : "all";
}
const stateKey = () => "bb3-progress-" + team;
const budgetKey = () => "bb3-budget-" + team;
function loadState() { try { state = JSON.parse(LS.get(stateKey(), "{}")) || {}; } catch (e) { state = {}; } }
function saveState() { LS.set(stateKey(), JSON.stringify(state)); }
function loadBudget() {
  try { const b = JSON.parse(LS.get(budgetKey(), "null")); budget = Array.isArray(b) ? b : BUDGET[team].map(r => r.slice()); }
  catch (e) { budget = BUDGET[team].map(r => r.slice()); }
}
const saveBudget = () => LS.set(budgetKey(), JSON.stringify(budget));

/* ---------- merge a week with this team's overrides ---------- */
const KIND_TR = { build: "B", motion: "S", scoring: "S", both: "S", drive: "D", outreach: "O", all: "A", done: "A", heads: "A", ahead: "A" };
const KIND_ID = { done: "demo" };
const LIST_KEYS = Object.keys(KIND_TR);
function mk(arr, tm, k, def) {
  return (arr || []).map(s => {
    const m = /^([BSDOA]):\s*([\s\S]*)$/.exec(s);
    return { tr: m ? m[1] : (def || KIND_TR[k]), t: m ? m[2] : s, tm, kind: KIND_ID[k] || k };
  });
}
function W(w) {
  const o = (w.t && w.t[team]) || {};
  const m = Object.assign({}, w);
  LIST_KEYS.forEach(k => {
    const base = o[k] ? mk(o[k], team, k) : mk(w[k], null, k);
    m[k] = mk(o[k + "Pre"], team, k).concat(base, mk(o[k + "Add"], team, k));
  });
  m.traps = [].concat(o.trap != null ? o.trap : (w.trap || []));
  m.learn = o.learn || w.learn || [];
  m.behind = o.behind || w.behind || "";
  m.gate = w.gate ? { name: w.gate.name, due: w.gate.due, items: mk(w.gate.items, null, "gate", "A").concat(mk(o.gateAdd, team, "gate", "A")) } : null;
  return m;
}
let WK = [];
const rebuildWeeks = () => { WK = WEEKS.map(W); };

/* ---------- progress helpers ---------- */
const iid = (w, it) => `w${w.n}.${it.kind}.${hs(it.t)}`;
const on = id => !!state[id];
const vis = it => role === "all" || it.tr === role || it.tr === "A";
function tally(w, items) { const v = items.filter(vis); return [v.filter(it => on(iid(w, it))).length, v.length]; }
const demoTally = w => tally(w, w.done);
const gateTally = w => w.gate ? tally(w, w.gate.items) : [0, 0];
function overall() {
  let d = 0, t = 0;
  WK.forEach(w => { const a = demoTally(w), g = gateTally(w); d += a[0] + g[0]; t += a[1] + g[1]; });
  return [d, t];
}
const gateOverdue = w => w.gate && pd(w.gate.due) < TODAY;
function weekPast(w) { return !BEFORE && w.n < NOWN; }
function carryOver() {
  const out = [];
  if (BEFORE) return out;
  WK.forEach(w => {
    if (w.n < NOWN) w.done.filter(vis).forEach(it => { if (!on(iid(w, it))) out.push({ w, it, label: "demo" }); });
    if (gateOverdue(w)) w.gate.items.filter(vis).forEach(it => { if (!on(iid(w, it))) out.push({ w, it, label: "gate" }); });
  });
  return out.sort((a, b) => a.w.n - b.w.n);
}
const weekLate = w => weekPast(w) && (demoTally(w)[0] < demoTally(w)[1] || (gateOverdue(w) && gateTally(w)[0] < gateTally(w)[1]));
function nextGate() { return WK.find(w => w.gate && pd(w.gate.due) >= TODAY) || null; }

/* ============================================================
   RENDER: top bar
   ============================================================ */
function renderBar() {
  $$("#teamseg button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.team === team)));
  $$("#roleseg button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.role === role)));
  const [d, t] = overall();
  $("#overall-text").textContent = `${d} of ${t} checks done`;
  $("#overall-bar").style.width = (t ? 100 * d / t : 0) + "%";
}

/* ============================================================
   RENDER: hero + pizza tracker
   ============================================================ */
function stagesList() {
  const out = [];
  WEEKS.forEach(w => {
    const last = out[out.length - 1];
    if (last && last.phase === w.phase) { last.to = w.n; last.span += w.brk ? 2 : 1; }
    else out.push({ phase: w.phase, from: w.n, to: w.n, span: w.brk ? 2 : 1, col: startCol[w.n] });
  });
  return out;
}
function pinPosition() {
  const cur = WEEKS[NOWN - 1];
  if (BEFORE) return centerPct(WEEKS[0]);
  if (AFTER) return centerPct(LAST);
  const span = cur.brk ? 14 : 7;
  const frac = Math.min(1, Math.max(0, (Math.round((TODAY - wStart(cur)) / DAY) + 0.5) / span));
  const colw = 100 / COLS * (cur.brk ? 2 : 1);
  return centerPct(cur) + (frac - 0.5) * 0.6 * colw;
}

function renderHero() {
  const root = $("#hero");
  const oldScroll = $(".tr-scroll", root);
  const keep = oldScroll ? oldScroll.scrollLeft : null;
  root.replaceChildren();
  const w = WK[NOWN - 1], p = phase(w.phase);
  const qual = pd(MILESTONES.find(m => m.key === "qual").date);
  const dq = daysTo(qual);
  const pct = Math.min(100, Math.max(0, 100 * (TODAY - FIRST) / (qual - FIRST)));

  let sub;
  if (BEFORE) {
    const d = daysTo(FIRST);
    sub = [h("b", null, "Week 1 starts Monday " + fmt(FIRST)), ` (${d === 1 ? "tomorrow" : "in " + plural(d, "day")}). Do the short “Before Monday” list below, then open Week 1.`];
  } else if (AFTER) {
    sub = ["The planned season is complete. Use the debrief and improvement weeks again, or add the next event’s plan."];
  } else if (w.brk) {
    sub = [h("b", null, p.name), ` · ${fmt(wStart(w))} – ${fmt(wEnd(w))}. Rest, or do the optional list.`];
  } else {
    const di = Math.round((TODAY - wStart(w)) / DAY);
    const demo = di < 3 ? `Demo day is Thursday, in ${plural(3 - di, "day")}.` : di === 3 ? "Today is demo day." : "Demo day has passed. Whatever isn’t ticked carries over.";
    sub = [h("b", null, p.name), ` · ${fmt(wStart(w))} – ${fmt(wEnd(w))} · ${demo}`];
  }
  const shown = BEFORE ? 1 : NOWN;
  root.append(
    h("div", { class: "hero-top" },
      h("div", null,
        h("div", { class: "label" }, "Trinity Robotics · FTC 2026–27 · BIOBUZZ · Team " + team),
        h("h1", null, h("span", { class: "wk" }, "Week"), h("span", { class: "big" }, shown), h("span", { class: "of" }, "of " + WEEKS.length)),
        h("p", { class: "sub" }, sub)),
      h("div", { class: "hero-side" },
        h("div", { class: "num" }, dq > 0 ? dq : dq === 0 ? "Today" : Math.abs(dq), h("small", null, dq > 0 ? (dq === 1 ? "day to the qualifier" : "days to the qualifier") : dq === 0 ? "is qualifier day" : "days since the qualifier")),
        h("div", { class: "bar2", "aria-hidden": "true" }, h("i", { style: `width:${pct}%` })),
        h("div", { class: "note" }, `${Math.round(pct)}% of the way from Week 1 to the qualifier`))),
    buildTracker(),
    buildMiles());
  const sc = $(".tr-scroll", root);
  if (sc) {
    if (keep != null) sc.scrollLeft = keep;
    else requestAnimationFrame(() => { const inner = $(".tr-inner", sc); sc.scrollLeft = Math.max(0, inner.scrollWidth * pinPosition() / 100 - sc.clientWidth / 2); });
  }
}

function buildTracker() {
  const pin = pinPosition();
  const stg = stagesList();
  const cols = `--cols:${COLS}`;
  const stageRow = h("div", { class: "tr-row tr-stages", style: cols }, stg.map(s => {
    const ph = phase(s.phase);
    const st = BEFORE ? "next" : AFTER ? "done" : NOWN > s.to ? "done" : NOWN >= s.from ? "now" : "next";
    const range = s.from === s.to ? `Wk ${s.from}` : `Wk ${s.from}–${s.to}`;
    return h("div", { class: "stage " + st, style: `grid-column:span ${s.span};--c:var(${ph.color})` },
      h("i"), h("div", { class: "sn" }, ph.name), h("div", { class: "ss" }, `${range}${st === "done" ? " · done" : st === "now" ? " · now" : ""}`));
  }));
  const cells = h("div", { class: "tr-cells", style: cols }, WK.map(w => {
    const ph = phase(w.phase);
    const past = weekPast(w) || (AFTER && w.n <= NOWN);
    const isNow = !BEFORE && w.n === NOWN && !AFTER;
    const [dc, dt] = demoTally(w);
    const cls = ["node", w.brk ? "brk" : "", past ? "past" : "", isNow ? "now" : "", w.n === sel ? "sel" : "", past && dt && dc === dt ? "full" : "", weekLate(w) ? "late" : ""].filter(Boolean).join(" ");
    const b = h("button", { class: cls, type: "button", style: `--c:var(${ph.color})`, "aria-label": `Week ${w.n}: ${w.title}${isNow ? " (this week)" : ""}`, title: `Week ${w.n}: ${w.title}`, onclick: () => selectWeek(w.n, true) }, w.brk ? "break" : w.n);
    if (isNow) b.setAttribute("aria-current", "step");
    return h("div", { class: "nw", style: `grid-column:span ${w.brk ? 2 : 1}` }, isNow ? h("span", { class: "ring" }) : null, b);
  }));
  const rail = h("div", { class: "tr-rail", style: `--p:${BEFORE ? 0 : pin}%` },
    h("div", { class: "tr-fill" }), cells,
    h("div", { class: "pin", style: `--p:${pin}%` }, h("b", null, BEFORE ? "STARTS MON" : AFTER ? "SEASON DONE" : "YOU ARE HERE")));
  const dates = h("div", { class: "tr-row tr-dates", style: cols }, WEEKS.map(w => h("div", { class: "d", style: `grid-column:span ${w.brk ? 2 : 1}` }, fmt(wStart(w)))));
  const flags = h("div", { class: "tr-row tr-flags", style: cols }, WEEKS.map(w => h("div", { class: "f", style: `grid-column:span ${w.brk ? 2 : 1}` },
    (MS_BY_WEEK[w.n] || []).slice(0, 1).map(m => h("span", { class: "flag " + m.flag[0] }, m.flag[1])))));
  return h("div", { class: "tracker" },
    h("div", { class: "tr-head" }, h("div", { class: "label" }, "Season tracker · tap a week"), h("div", { class: "note mono" }, `Today ${fmtLong(TODAY)}`)),
    h("div", { class: "tr-scroll" }, h("div", { class: "tr-inner", style: `--min:${Math.max(900, COLS * 54)}px` }, stageRow, rail, dates, flags)));
}

function buildMiles() {
  const next = MILESTONES.find(m => pd(m.date) >= TODAY);
  return h("div", { class: "miles" }, MILESTONES.map(m => {
    const d = pd(m.date), n = daysTo(d), w = WK[m.week - 1];
    const gw = m.key === "robot" ? WK[1] : m.key === "scrim" ? WK[7] : m.key === "rc1" ? WK[8] : m.key === "freeze" ? WK[10] : WK[11];
    const [gd, gt] = gateTally(gw);
    const gName = gw.gate ? gw.gate.name : "";
    return h("button", { type: "button", class: "mile" + (n < 0 ? " past" : "") + (next && next.key === m.key ? " next" : ""), onclick: () => selectWeek(gw.n, true) },
      h("span", { class: "mn" }, m.name),
      h("span", { class: "md" }, fmtLong(d)),
      h("span", { class: "mc" }, n > 0 ? n : n === 0 ? "Today" : "Done", n > 0 ? h("small", null, n === 1 ? "day" : "days") : null),
      gt ? h("span", { class: "mg" }, `${gName}: ${gd}/${gt}`) : h("span", { class: "mg" }, " "),
      gt ? h("span", { class: "mgb" }, h("i", { style: `width:${100 * gd / gt}%` })) : null);
  }));
}

/* ============================================================
   RENDER: rails check + heads-up
   ============================================================ */
function chk(w, it, opts) {
  opts = opts || {};
  const id = iid(w, it);
  const cb = h("input", { type: "checkbox", "data-id": id });
  cb.checked = on(id);
  cb.addEventListener("change", () => setTick(id, cb.checked));
  return h("label", { class: "chk", style: `--tc:var(--t-${it.tr})` }, cb,
    h("span", null,
      opts.tag ? h("span", { class: "trtag", style: `--tc:var(--t-${it.tr})` }, TRACKS[it.tr].short) : null,
      it.t,
      it.tm ? h("em", { class: "tt" }, it.tm) : null));
}

function renderDash() {
  const root = $("#dash"); root.replaceChildren();
  const carry = carryOver();
  const rl = role === "all" ? "" : ` · ${TRACKS[role].name} track`;
  let status = "on", title = "On the rails", msg = "Nothing carried over from earlier weeks. Keep ticking this week’s demos.";
  if (BEFORE) { status = "pre"; title = "Ready to start"; msg = `Week 1 begins Monday ${fmt(FIRST)}. These take about ten minutes, and make Monday’s kickoff easy.`; }
  else if (carry.length) {
    const oldest = carry[0].w.n;
    const gap = NOWN - oldest;
    if (carry.length <= 3 && gap <= 1) { status = "drift"; title = "Drifting"; msg = `${plural(carry.length, "item")} from earlier weeks ${carry.length === 1 ? "isn’t" : "aren’t"} ticked. Clear ${carry.length === 1 ? "it" : "them"} before starting new work.`; }
    else { status = "off"; title = "Off the rails"; msg = `${plural(carry.length, "item")} overdue, going back to Week ${oldest}. Say so on Monday, then work the catch-up ladder.`; }
  }
  const rails = h("div", { class: "card rails " + status });
  rails.append(h("div", { class: "st" }, h("span", { class: "dot" }), h("h2", null, title), h("span", { class: "tag" }, "Rails check" + rl)), h("p", { class: "note" }, msg));
  if (BEFORE) {
    rails.append(h("div", { class: "carry" }, PRE_ITEMS.filter(vis).map(it => chk(PRE_W, it, { tag: true }))));
  } else if (carry.length) {
    const shown = carry.slice(0, 8);
    rails.append(h("div", { class: "carry" }, shown.map(c => h("div", null, chk(c.w, c.it, { tag: true }),
      h("button", { class: "btn sm", type: "button", style: "margin:0 0 4px 29px", onclick: () => selectWeek(c.w.n, true) }, `Week ${c.w.n}${c.label === "gate" ? " gate" : ""} →`)))));
    if (carry.length > shown.length) rails.append(h("p", { class: "note" }, `…and ${carry.length - shown.length} more. Open the older weeks from the tracker.`));
  }
  const ng = nextGate();
  if (ng) {
    const [gd, gt] = gateTally(ng), dd = daysTo(pd(ng.gate.due));
    if (gt) rails.append(h("div", { class: "nextgate" },
      h("div", { class: "ngr" }, h("b", null, "Next gate: " + ng.gate.name), h("span", { class: "mono" }, `${fmtLong(pd(ng.gate.due))} · ${dd > 0 ? plural(dd, "day") : dd === 0 ? "today" : "overdue"}`)),
      h("div", { class: "gb" }, h("i", { style: `width:${100 * gd / gt}%` })),
      h("div", { class: "ngr" }, h("span", null, `${gd} of ${gt} ready`), h("button", { class: "btn sm", type: "button", onclick: () => selectWeek(ng.n, true) }, "Open the gate →"))));
  }
  const lad = h("details", { class: "ladder" }, h("summary", null, "The catch-up ladder"),
    h("ol", null,
      h("li", null, h("b", null, "Carry-over first."), " Unticked demos come before new work, unless the week page says they can be cut."),
      h("li", null, h("b", null, "Cut from “If you’re behind”."), " Every week names what to drop and what never to drop."),
      h("li", null, h("b", null, "Borrow people."), " Builders can run drive tests, coders can wire, drivers can build the practice field."),
      h("li", null, h("b", null, "Protect three things:"), " drivers’ time on the robot, the next gate, and a release that installs offline.")));
  rails.append(lad);
  root.append(rails);

  // heads-up
  const lo = BEFORE ? 1 : NOWN, hi = lo + 2;
  const rows = [];
  WK.forEach(w => w.heads.filter(vis).forEach(it => {
    const done = on(iid(w, it));
    const over = weekPast(w) && !done;
    if (over || (w.n >= lo && w.n <= hi)) rows.push({ w, it, over });
  }));
  rows.sort((a, b) => (b.over - a.over) || (a.w.n - b.w.n));
  const open = rows.filter(r => !on(iid(r.w, r.it))).length;
  root.append(h("div", { class: "card heads" },
    h("h3", null, "Heads-up: don’t forget", h("span", { class: "pill" + (open ? "" : " full") }, open ? `${open} open` : "all clear")),
    h("p", { class: "note" }, "Things with lead time: orders, registrations, deadlines, logistics. Showing this week and the next two."),
    h("div", { class: "hl" }, rows.length ? rows.map(r => h("div", { class: r.over ? "over" : "" }, chk(r.w, r.it, { tag: true }), h("span", { class: "wkb2", style: "margin:-2px 0 4px 29px;display:block" }, r.over ? `Week ${r.w.n} · overdue` : `Week ${r.w.n}`))) : h("p", { class: "empty" }, "Nothing with lead time in the next three weeks."))));
}
const PRE_W = { n: 0 };
const PRE_ITEMS = mk(PRE, null, "all");

/* ============================================================
   RENDER: the week view
   ============================================================ */
let counters = [];
function renderWeek() {
  const w = WK[sel - 1], p = phase(w.phase);
  const root = $("#weekview");
  root.replaceChildren(); counters = [];
  root.style.setProperty("--c", `var(${p.color})`);
  const tagText = BEFORE ? (w.n === 1 ? "Up next" : "Ahead") : AFTER ? "Past" : w.n < NOWN ? "Past" : w.n === NOWN ? "This week" : "Ahead";
  const tagCls = tagText === "This week" || tagText === "Up next" ? "now" : tagText === "Past" ? "past" : "ahead";

  root.append(h("div", { class: "wv-nav" },
    h("div", { class: "pos" }, h("span", { class: "label" }, `Viewing week ${w.n} of ${WK.length}`), h("span", { class: "tag " + tagCls }, tagText),
      sel !== (BEFORE ? 1 : NOWN) ? h("button", { class: "btn sm", type: "button", onclick: () => selectWeek(BEFORE ? 1 : NOWN) }, BEFORE ? "Back to Week 1" : "Back to this week") : null),
    h("select", { "aria-label": "Jump to a week", onchange: e => selectWeek(+e.target.value) }, WK.map(x => h("option", { value: x.n, selected: x.n === sel }, `Week ${x.n}: ${x.title}`))),
    sel > 1 ? h("button", { class: "btn", type: "button", onclick: () => selectWeek(sel - 1) }, "← Week " + (sel - 1)) : null,
    sel < WK.length ? h("button", { class: "btn", type: "button", onclick: () => selectWeek(sel + 1) }, "Week " + (sel + 1) + " →") : null));

  root.append(h("header", { class: "wv-head" + (w.brk ? " brk" : "") },
    h("div", { class: "big", "aria-hidden": "true" }, w.n),
    h("div", null,
      h("div", { class: "label" }, `${fmt(wStart(w))} – ${fmt(wEnd(w))} · ${p.name}${w.short ? " · " + w.short : ""}`),
      h("h2", null, w.title),
      h("p", { class: "goal" }, w.goal))));
  root.append(h("p", { class: "why" }, h("b", null, "Why this week: "), w.why));
  if (w.event) root.append(h("div", { class: "event" }, h("b", null, "On the calendar: "), w.event));

  // tracks
  const tracks = h("div", { class: "tracks" });
  const card = (code, bodyEls, items, wide) => {
    const focus = role === "all" || role === code;
    const d = h("details", { class: "trk" + (wide ? " wide" : "") + (focus ? "" : " dim"), style: `--tc:var(--t-${code})` });
    d.open = focus;
    const pill = h("span", { class: "pill" });
    counters.push(() => { const c = items.filter(it => on(iid(w, it))).length; pill.textContent = items.length ? `${c}/${items.length}` : "–"; pill.classList.toggle("full", items.length > 0 && c === items.length); });
    d.append(h("summary", null, h("h3", null, TRACKS[code].name, h("small", null, TRACKS[code].sub)), pill), h("div", { class: "tb" }, bodyEls));
    return d;
  };
  const list = items => items.length ? items.map(it => chk(w, it)) : [h("p", { class: "empty" }, "Nothing new this week.")];
  tracks.append(card("B", list(w.build), w.build));
  tracks.append(card("D", list(w.drive), w.drive));
  const lane = (title, cls, items) => h("div", { class: "box" }, h("h4", null, h("span", { class: "lane-chip " + cls }, title)), items.length ? items.map(it => chk(w, it)) : h("p", { class: "empty" }, "Nothing new this week."));
  const sw = [h("div", { class: "lanes" }, lane("Motion", "chip-motion", w.motion), lane("Scoring", "chip-scoring", w.scoring))];
  if (w.both.length) sw.push(lane("Both", "chip-both", w.both));
  tracks.append(card("S", sw, w.motion.concat(w.scoring, w.both), true));
  tracks.append(card("O", list(w.outreach), w.outreach, !w.all.length));
  if (w.all.length) tracks.append(card("A", list(w.all), w.all));
  root.append(tracks);

  // demo + gate
  const demos = w.done.filter(vis);
  const dpill = h("span", { class: "pill" });
  counters.push(() => { const [c, t] = demoTally(w); dpill.textContent = `${c}/${t}`; dpill.classList.toggle("full", t > 0 && c === t); dpill.classList.toggle("late", weekLate(w)); });
  const demoCard = h("section", { class: "card demo" },
    h("div", { class: "gh", style: "display:flex;justify-content:space-between;align-items:baseline;gap:8px" }, h("div", { class: "label" }, w.brk ? "Optional · tick what you did" : "Thursday demo · done when · tick only what you showed"), dpill),
    h("div", { style: "margin-top:8px" }, demos.length ? demos.map(it => chk(w, it, { tag: true })) : h("p", { class: "empty" }, "No demo items for this track this week.")));
  const two = h("div", { class: "two" + (w.gate ? "" : " one") }, demoCard);
  if (w.gate) {
    const gi = w.gate.items.filter(vis);
    const gbar = h("i"), gct = h("span", { class: "pill" });
    counters.push(() => { const [c, t] = gateTally(w); gct.textContent = `${c}/${t}`; gct.classList.toggle("full", t > 0 && c === t); gbar.style.width = (t ? 100 * c / t : 0) + "%"; });
    const dd = daysTo(pd(w.gate.due));
    two.append(h("section", { class: "card gate" },
      h("div", { class: "gh" }, h("h3", null, "Gate: " + w.gate.name), h("span", { class: "gdue" }, `due ${fmtLong(pd(w.gate.due))} · ${dd > 0 ? plural(dd, "day") + " away" : dd === 0 ? "today" : "was " + plural(-dd, "day") + " ago"}`)),
      h("p", { class: "note" }, "A gate is a checkpoint across every track. Nobody’s done until the gate is."),
      h("div", { class: "gbar" }, gbar),
      h("div", null, gi.length ? gi.map(it => chk(w, it, { tag: true })) : h("p", { class: "empty" }, "No gate items for this track.")),
      h("div", { style: "margin-top:6px" }, gct)));
  }
  root.append(two);

  // heads-up for this week
  const hd = w.heads.filter(vis);
  if (hd.length) root.append(h("section", { class: "card", style: "margin-top:14px" }, h("h3", null, "Don’t forget this week"), h("div", null, hd.map(it => chk(w, it, { tag: true })))));

  // notes
  const notes = h("div", { class: "notes" });
  if (w.behind) notes.append(h("section", { class: "card behind" }, h("h3", null, "If you’re behind"), h("p", { class: "note" }, w.behind)));
  if (w.ahead.length) notes.append(h("section", { class: "card ahead" }, h("h3", null, "If you’re ahead"), h("ul", { class: "plain" }, w.ahead.map(a => h("li", null, a.t, a.tm ? h("em", { class: "tt" }, a.tm) : null)))));
  if (w.sat) notes.append(h("section", { class: "card" }, h("h3", null, "Saturday"), h("p", { class: "note" }, w.sat)));
  if (w.traps.length) notes.append(h("section", { class: "card trap" }, h("h3", null, "Watch out"), h("ul", { class: "plain" }, w.traps.map(t => h("li", null, t)))));
  if (notes.children.length) root.append(notes);

  if (w.learn.length) root.append(h("section", { style: "margin-top:14px" }, h("div", { class: "label", style: "margin-bottom:8px" }, "Learn and research"),
    h("div", { class: "learn" }, w.learn.map(k => { const [label, url] = LINKS[k]; return h("a", { href: url, target: "_blank", rel: "noopener" }, label); }))));

  const msg = h("span", { class: "copied", "aria-live": "polite" });
  root.append(h("div", { class: "row-actions" },
    h("button", { class: "btn", type: "button", onclick: async () => {
      const text = statusText(w);
      try { await navigator.clipboard.writeText(text); msg.textContent = "Copied"; }
      catch (e) { const ta = h("textarea", { rows: 8, style: "width:100%" }); ta.value = text; root.append(ta); ta.select(); msg.textContent = "Select and copy the text below"; }
      setTimeout(() => { msg.textContent = ""; }, 3000);
    } }, "Copy status for team chat"),
    h("button", { class: "btn", type: "button", onclick: () => window.print() }, "Print this week"), msg));
  updateCounters();
}
const updateCounters = () => counters.forEach(f => f());

function statusText(w) {
  const mark = it => on(iid(w, it)) ? "[x]" : "[ ]";
  const demos = w.done.filter(vis), [c, t] = demoTally(w);
  const lines = [`Team ${team} · Week ${w.n}: ${w.title} (${c}/${t} demos${role === "all" ? "" : ", " + TRACKS[role].short + " track"})`];
  demos.forEach(it => lines.push(`${mark(it)} [${TRACKS[it.tr].short}] ${it.t}`));
  if (w.gate) {
    const [gc, gt] = gateTally(w);
    lines.push("", `${w.gate.name} (due ${fmtLong(pd(w.gate.due))}): ${gc}/${gt}`);
    w.gate.items.filter(vis).forEach(it => lines.push(`${mark(it)} [${TRACKS[it.tr].short}] ${it.t}`));
  }
  const carry = carryOver();
  if (carry.length) lines.push("", `Carried over: ${carry.length} (oldest from Week ${carry[0].w.n})`);
  return lines.join("\n");
}

/* ============================================================
   RENDER: robot snapshot, budget, vision
   ============================================================ */
function renderSnapshot() {
  const t = TEAMS[team];
  $("#snap-title").textContent = `Team ${team}: the robot as designed today`;
  const c = $("#teamcard"); c.replaceChildren();
  c.append(h("h3", null, `Team ${team}’s robot`), h("p", { style: "margin-bottom:10px" }, h("b", null, "Plan: "), t.plan),
    h("ul", { class: "facts" }, t.facts.map(([k, v]) => h("li", null, h("b", null, k), h("span", null, v)))),
    h("div", { class: "sub-h" }, h("div", { class: "label" }, "Build watch-list: what’s most likely to bite"), h("ul", null, t.risks.map(r => h("li", null, r)))),
    h("div", { class: "sub-h" }, h("div", { class: "label" }, "If the design changes"), h("ul", null, t.changes.map(r => h("li", null, r)))),
    h("a", { class: "doc", href: SNAPSHOT[team], target: "_blank", rel: "noopener" }, `Open the ${team} design snapshot ↗`));
  const vs = $("#vsteps"); vs.replaceChildren();
  VISION.forEach(([name, text, wk]) => {
    const n = typeof wk === "number" ? wk : wk[team];
    vs.append(h("li", null, h("div", null, h("b", null, name + ". "), typeof text === "string" ? text : text[team], h("span", { class: "wkref" }, ` · week ${n}`))));
  });
  $("#vnote").textContent = VISION_NOTE[team];
}

function renderBudget() {
  const root = $("#budget"); root.replaceChildren();
  const totals = h("div", { class: "bud-tot" });
  const tm = h("div", { class: "bt" }), ts = h("div", { class: "bt" });
  totals.append(tm, ts);
  const tbody = h("tbody");
  const upd = () => {
    const m = budget.reduce((n, r) => n + (+r[1] || 0), 0), s = budget.reduce((n, r) => n + (+r[2] || 0), 0);
    [[tm, "Motors", m], [ts, "Servos", s]].forEach(([el, name, v]) => {
      el.className = "bt" + (v > 8 ? " over" : v === 8 ? " full" : "");
      el.replaceChildren(h("div", { class: "label" }, name), h("div", { class: "v" }, `${v} / 8`), h("div", { class: "b" }, h("i", { style: `width:${Math.min(100, v / 8 * 100)}%` })),
        h("div", { class: "note", style: "font-size:12.5px;margin-top:3px" }, v > 8 ? `${v - 8} over the limit` : v === 8 ? "At the limit" : `${8 - v} left`));
    });
  };
  const rows = () => {
    tbody.replaceChildren();
    budget.forEach((r, i) => {
      const mk_ = (idx) => { const inp = h("input", { type: "number", min: 0, max: 8, value: r[idx], "aria-label": (idx === 1 ? "Motors for " : "Servos for ") + r[0] }); inp.addEventListener("input", () => { r[idx] = Math.max(0, +inp.value || 0); saveBudget(); upd(); }); return inp; };
      const name = h("input", { type: "text", value: r[0], "aria-label": "Mechanism name" }); name.addEventListener("input", () => { r[0] = name.value; saveBudget(); });
      tbody.append(h("tr", null, h("td", null, name), h("td", null, mk_(1)), h("td", null, mk_(2)),
        h("td", null, h("button", { class: "x", type: "button", "aria-label": "Remove " + r[0], onclick: () => { budget.splice(i, 1); saveBudget(); rows(); upd(); } }, "×"))));
    });
  };
  root.append(h("h3", null, "Motor and servo budget"),
    h("p", { class: "note" }, "R503 allows 8 motors and 8 servos. The starter numbers are guesses from the snapshot: correct them, and add a row before any new mechanism."),
    totals,
    h("table", null, h("thead", null, h("tr", null, h("th", null, "Mechanism"), h("th", null, "Motors"), h("th", null, "Servos"), h("th", null, h("span", { class: "sr" }, "Remove")))), tbody),
    h("div", { class: "row-actions" }, h("button", { class: "btn sm", type: "button", onclick: () => { budget.push(["New mechanism", 0, 0]); saveBudget(); rows(); upd(); } }, "+ Add a mechanism"),
      h("button", { class: "btn sm", type: "button", onclick: () => { budget = BUDGET[team].map(r => r.slice()); saveBudget(); renderBudget(); } }, "Reset to starter")),
    team === "3587" ? h("p", { class: "note", style: "margin-top:10px" }, "USB ports are for vision devices (R707). The Limelight and the webcam are the two this plan uses.") : null);
  rows(); upd();
}

/* ============================================================
   RENDER: season outline
   ============================================================ */
function renderOutline() {
  const root = $("#phases"); root.replaceChildren();
  PHASES.forEach(p => {
    const ws = WK.filter(w => w.phase === p.id); if (!ws.length) return;
    const rows = h("div", { class: "rows" }, ws.map(w => {
      const [dc, dt] = demoTally(w), [gc, gt] = gateTally(w);
      const isNow = !BEFORE && w.n === NOWN;
      const late = weekLate(w);
      return h("button", { type: "button", class: "row" + (w.brk ? " brk" : "") + (isNow ? " now" : "") + (w.n === sel ? " sel" : ""), style: `--c:var(${p.color})`, onclick: () => selectWeek(w.n, true) },
        h("div", { class: "n", "aria-hidden": "true" }, w.n),
        h("div", null, h("div", { class: "d" }, `Week ${w.n} · ${fmt(wStart(w))} – ${fmt(wEnd(w))}${w.short ? " · " + w.short : ""}${isNow ? " · this week" : ""}`), h("div", { class: "t" }, w.title), h("div", { class: "g" }, w.goal)),
        h("div", { class: "pp" },
          gt ? h("span", { class: "pill" + (gc === gt ? " full" : "") }, `Gate ${gc}/${gt}`) : null,
          h("span", { class: "pill" + (dt && dc === dt ? " full" : late ? " late" : "") }, `${dc}/${dt} demos`)));
    }));
    root.append(h("div", { class: "ph", style: `--c:var(${p.color})` }, h("div", { class: "ph-h" }, h("div", { class: "sw" }), h("div", null, h("h3", null, p.name), h("p", null, p.blurb))), rows));
  });
}

/* ============================================================
   Actions
   ============================================================ */
function setTick(id, v) { if (v) state[id] = realISO(); else delete state[id]; saveState(); updateLive(); }
function syncChecks() { $$("input[data-id]").forEach(cb => { cb.checked = on(cb.dataset.id); }); }
function updateLive() {
  const a = document.activeElement, id = a && a.dataset && a.dataset.id;
  syncChecks(); renderBar(); renderHero(); renderDash(); renderOutline(); updateCounters();
  if (id && a.closest && a.closest("#dash")) { const el = $(`#dash input[data-id="${CSS.escape(id)}"]`); if (el) el.focus(); }
}
function selectWeek(n, scroll) {
  sel = Math.max(1, Math.min(WK.length, n));
  try { history.replaceState(null, "", location.pathname + location.search + "#week-" + sel); } catch (e) {}
  renderWeek(); renderHero(); renderOutline();
  if (scroll) $("#weekview").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}
function setTeam(t) {
  team = t; LS.set("bb-team", t);
  loadState(); loadBudget(); rebuildWeeks(); renderAll();
}
function setRole(r) { role = r; LS.set("bb3-role", r); renderAll(); }
function renderAll() { renderBar(); renderHero(); renderDash(); renderWeek(); renderSnapshot(); renderBudget(); renderOutline(); }

/* ---------- footer tools ---------- */
function toolMsg(t) { const m = $("#toolmsg"); m.textContent = t; setTimeout(() => { m.textContent = ""; }, 3500); }
$("#export").addEventListener("click", async () => {
  const code = btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, team, state, budget }))));
  try { await navigator.clipboard.writeText(code); toolMsg("Progress code copied"); }
  catch (e) { $("#importbox").hidden = false; $("#importtext").value = code; $("#importtext").select(); toolMsg("Copy the code from the box"); }
});
$("#import").addEventListener("click", () => { const b = $("#importbox"); b.hidden = !b.hidden; if (!b.hidden) $("#importtext").focus(); });
$("#importgo").addEventListener("click", () => {
  try {
    const d = JSON.parse(decodeURIComponent(escape(atob($("#importtext").value.trim()))));
    if (!d || !["2827", "3587"].includes(d.team)) throw new Error("bad");
    const key = "bb3-progress-" + d.team;
    let cur = {}; try { cur = JSON.parse(LS.get(key, "{}")) || {}; } catch (e) {}
    LS.set(key, JSON.stringify(Object.assign({}, cur, d.state || {})));
    if (Array.isArray(d.budget)) LS.set("bb3-budget-" + d.team, JSON.stringify(d.budget));
    $("#importbox").hidden = true; $("#importtext").value = "";
    setTeam(d.team); toolMsg(`Loaded progress for team ${d.team}`);
  } catch (e) { toolMsg("That code didn’t work. Copy it again in full."); }
});
$("#reset").addEventListener("click", () => {
  if (!confirm(`Clear every check for team ${team} in this browser?`)) return;
  state = {}; saveState(); updateLive(); toolMsg("Cleared");
});
$("#previewdate").addEventListener("change", e => { if (e.target.value) location.search = "?date=" + e.target.value + location.hash; });

$$("#teamseg button").forEach(b => b.addEventListener("click", () => setTeam(b.dataset.team)));
$$("#roleseg button").forEach(b => b.addEventListener("click", () => setRole(b.dataset.role)));
window.addEventListener("hashchange", () => { const m = /^#week-(\d+)$/.exec(location.hash); if (m && +m[1] !== sel) selectWeek(+m[1], true); });

/* ---------- go ---------- */
if (PREVIEW) {
  const pv = $("#preview"); pv.hidden = false;
  $(".wrap", pv).append(h("span", null, `Previewing the plan as if today is ${fmtLong(TODAY)}.`), h("a", { href: location.pathname + location.hash }, "Back to today"));
  $("#previewdate").value = PREVIEW;
}
{
  const m = /^#week-(\d+)$/.exec(location.hash);
  sel = m ? Math.max(1, Math.min(WEEKS.length, +m[1])) : (BEFORE ? 1 : NOWN);
}
setTeam(team);
