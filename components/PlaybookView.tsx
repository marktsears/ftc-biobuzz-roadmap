"use client";

import { useState, type ReactNode } from "react";
import { Shapes } from "./ui";
import { LINKS } from "@/lib/data/core";

const TABS = [
  { id: "game", label: "BIOBUZZ on one screen" },
  { id: "win", label: "How we win" },
  { id: "rails", label: "How the rails work" },
  { id: "vision", label: "Vision lessons" },
  { id: "origin", label: "Where this comes from" },
  { id: "links", label: "Link library" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

export function PlaybookView() {
  const [tab, setTab] = useState<TabId>("game");
  return (
    <>
      <section className="page-hero">
        <Shapes variant="banner" />
        <div className="wrap">
          <div className="eyebrow light">Playbook</div>
          <h1>Keep these open</h1>
          <p>The cheat sheets: the game, the strategy, how a week works, and what other teams are learning.</p>
        </div>
      </section>

      <div className="wrap stack-lg pull">
        <div className="tabs scroll" role="tablist" aria-label="Playbook sections">
          {TABS.map(t => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "game" && <Game />}
        {tab === "win" && <Win />}
        {tab === "rails" && <Rails />}
        {tab === "vision" && <Vision />}
        {tab === "origin" && <Origin />}
        {tab === "links" && <Links />}
      </div>
    </>
  );
}

function Game() {
  return (
    <div className="tab-panel">
      <section className="card prose">
        <div className="cols2">
          <div>
            <table className="t">
              <thead>
                <tr>
                  <th>Score</th>
                  <th>Auto</th>
                  <th>TeleOp</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Leave the start</td>
                  <td className="n">3</td>
                  <td className="n">–</td>
                </tr>
                <tr>
                  <td>Park in the Loading Zone</td>
                  <td className="n">5</td>
                  <td className="n">5</td>
                </tr>
                <tr>
                  <td>Hive tip (also unlocks one nectar)</td>
                  <td className="n">20</td>
                  <td className="n">20</td>
                </tr>
                <tr>
                  <td>Bottom nectar bonus (Flower)</td>
                  <td className="n">–</td>
                  <td className="n">5</td>
                </tr>
                <tr>
                  <td>Element in your Garden</td>
                  <td className="n">–</td>
                  <td className="n">1</td>
                </tr>
              </tbody>
            </table>
            <p className="note">Points for elements left in the Hive and for owning a Flower are in manual section 10. Check the manual before you build a plan around them.</p>
          </div>
          <ul>
            <li>
              <b>Match:</b> 30 s Auto, then 2:00 TeleOp. Flowers open for scoring in the last 60 seconds.
            </li>
            <li>
              <b>Tipping a Hive:</b> about 8 pollen, or 5 nectar, or a mix like 3 + 3. Only launching elements into the up-cell can tip it. Pushing or grabbing it is a foul.
            </li>
            <li>
              <b>Ranking points:</b> Win 3, Tie 1. At non-championship events: Swarm at 16 points of Leave and Park, Pollinator 1 at 4 tips, Pollinator 2 at 7 tips (from the one-page description, confirm in the manual).
            </li>
            <li>
              <b>The Swarm math (our reading, confirm in the manual):</b> Leave 3 + Park 5 = 8 per robot. Two robots = 16, which matches the Swarm threshold. If that’s right, a partner who can leave and park in Auto is worth a ranking point before anyone scores.
            </li>
          </ul>
        </div>
        <div className="cols2">
          <ul>
            <li>
              <b>Size:</b> start inside an 18-inch cube (R102). No weight limit (R104).
            </li>
            <li>
              <b>Parts:</b> up to 8 motors and 8 servos (R503). USB is for vision only (R707).
            </li>
            <li>
              <b>Start:</b> touching the perimeter wall, holding up to 4 pollen. Not in the Loading Zone, not touching a Flower.
            </li>
            <li>
              <b>Signs:</b> at least two robot signs with alliance color and team number (R401–R403).
            </li>
          </ul>
          <ul>
            <li>
              <b>Holding limit:</b> no more than 4 elements at a time (G407).
            </li>
            <li>
              <b>Opponent nectar:</b> don’t control it (G408). Nectar goes into Flowers only in the last minute (G410).
            </li>
            <li>
              <b>Human player:</b> nectar enters only through the Loading Zone, and only after a tip unlocks it (G426, G427).
            </li>
            <li>
              <b>Don’t meddle</b> with the Hive or the Flowers (G417, G418).
            </li>
          </ul>
        </div>
        <div className="learn">
          <A href={LINKS.onepage[1]}>One-page game description</A>
          <A href={LINKS.manual[1]}>Manual, Team Updates, Q&amp;A</A>
          <A href={LINKS.rules[1]}>Searchable rule index (unofficial)</A>
          <A href={LINKS.walkthrough[1]}>Field walkthrough</A>
          <A href={LINKS.animation[1]}>Game animation</A>
        </div>
      </section>
    </div>
  );
}

function Win() {
  return (
    <div className="tab-panel">
      <section className="card prose">
        <ul>
          <li>
            <b>1. Never lose a ranking point to Auto.</b> Leave and park, every match, from every start spot. It’s 8 points per robot and, if we’re reading the Swarm rule right, a ranking point when both robots do it.
          </li>
          <li>
            <b>2. Tips are the game.</b> 20 points each, each one unlocks another nectar, and tip counts decide two more ranking points. Measure: how many seconds from first pickup to a tip?
          </li>
          <li>
            <b>3. Accuracy over speed.</b> A missed shot wastes an element that someone else can tip with. Hit rate from fixed spots comes before cycle time.
          </li>
          <li>
            <b>4. Don’t hand points away.</b> Four-element limit, no opponent nectar, no early nectar. Drivers know these cold before the scrimmage.
          </li>
          <li>
            <b>5. Expect friendly defense.</b> The game is highly interactive. Practice with a teammate defending, and decide what each team does about it (2827’s traction mode exists for this).
          </li>
          <li>
            <b>6. Flowers are optional.</b> Both teams are skipping them for now. Revisit after the qualifier with real match data, not hunches.
          </li>
        </ul>
      </section>
    </div>
  );
}

function Rails() {
  return (
    <div className="tab-panel">
      <div className="cols2">
        <section className="card">
          <h3>A week: 4 × 50 min + Saturday</h3>
          <ul className="rhythm">
            <li>
              <b>Monday</b>
              <span>10-minute all-hands. Read this week’s page out loud, put a name next to every task, check for a new Team Update or Q&amp;A answer.</span>
            </li>
            <li>
              <b>Tue–Wed</b>
              <span>Work. Builders are on call for coders; coders tell builders what they find. Everything touched goes in the notes. Not sure what to do? Open the Quest Board.</span>
            </li>
            <li>
              <b>Thursday</b>
              <span>
                <b>Demo day.</b> Show every “Done when” box. Tick only what you showed. Triage the driver wish list. Each team shares one thing it learned with the other team.
              </span>
            </li>
            <li>
              <b>Friday</b>
              <span>Five minutes: check the heads-up list, update the notes, use “Copy status” to post the week in team chat.</span>
            </li>
            <li>
              <b>Saturday</b>
              <span>Optional, 3 hours: the deep-work task, plus driver practice. Never the only chance to get something done.</span>
            </li>
          </ul>
        </section>
        <section className="card">
          <h3>The catch-up ladder</h3>
          <ol className="plain">
            <li>
              <b>Carry-over first.</b> Unticked demos from earlier weeks come before new work, unless the week page says they can be cut.
            </li>
            <li>
              <b>Cut from the “If you’re behind” line.</b> Every week names what to drop and what never to drop.
            </li>
            <li>
              <b>Borrow people.</b> Builders can run drive tests, coders can wire, drivers can build the practice field.
            </li>
            <li>
              <b>Protect three things:</b> drivers’ time on the robot, the next gate, and a release that installs without Wi-Fi.
            </li>
          </ol>
          <p className="note">Drifting is normal. Staying quiet about it isn’t. Say it Monday, not on the day of the event.</p>
        </section>
      </div>
      <section className="card">
        <h3>Rules that never change</h3>
        <div className="cols3">
          <div>
            <div className="label">Whole team</div>
            <ul className="rule-list">
              <li>
                <b>If it isn’t written down, it didn’t happen.</b> A notes entry every session. That’s the portfolio.
              </li>
              <li>
                <b>Change one thing at a time</b> and write down what happened.
              </li>
              <li>
                <b>Eye protection</b> whenever a shooter runs. Nobody stands in front of a flywheel.
              </li>
              <li>
                <b>Batteries</b> are labeled, rotated and never charged unattended.
              </li>
            </ul>
          </div>
          <div>
            <div className="label">Build &amp; drive</div>
            <ul className="rule-list">
              <li>
                <b>Drivers get the robot before anyone polishes it.</b>
              </li>
              <li>
                <b>Accurate beats fast:</b> 4 of 4 in 3 s beats 2 of 4 in 1 s.
              </li>
              <li>
                <b>Mechanical mods need four lines:</b> what, why, how we’ll test it, how we roll it back. If it can’t roll back before the next event, don’t.
              </li>
              <li>
                <b>Seven days before an event:</b> repairs only. No new mechanisms, no new features.
              </li>
            </ul>
          </div>
          <div>
            <div className="label">Code</div>
            <ul className="rule-list">
              <li>
                <b>Code ends every session on the robot.</b>
              </li>
              <li>
                <b>No waiting in robot code.</b> A robot that waits can’t steer.
              </li>
              <li>
                <b>Every PR says what you didn’t test.</b>
              </li>
              <li>
                <b>Every release installs offline</b> and can be rolled back by a second person.
              </li>
            </ul>
          </div>
        </div>
      </section>
      <div className="catchup">
        <b>Why the season is shaped this way.</b> Robot Day is Sunday Nov 1, so the first two weeks are a sprint to a working v1. The scrimmage on Dec 12 is the dress rehearsal, and winter break sits between it and the qualifier. So we tag a release candidate on <b>Friday Dec 18</b>, use the first week of January only to fix what full matches show, and freeze on <b>Friday Jan 8</b>. Qualifier week is for driver practice, judging practice and packing. Ball-finding vision, a second Auto cycle and speed come after.
      </div>
    </div>
  );
}

function Vision() {
  return (
    <div className="tab-panel">
      <section className="card prose">
        <ul>
          <li>
            <b>The tags move.</b> Each Hive cell has a 4-tag cluster on its underside, facing down, and it tips with the Hive (manual 9.6, 9.9). The tags can’t be fixed landmarks the way they were in past seasons.
          </li>
          <li>
            <b>Odometry does the localizing.</b> On Chief Delphi most teams use Pinpoint for position and keep tags for aiming and for telling which cell is up. One team reports Pinpoint back within about 1 in after random driving.
          </li>
          <li>
            <b>A wrong fix is worse than a late one.</b> Mona Shores only corrects the pose from a cell that has settled, and pauses corrections during a tip.
          </li>
          <li>
            <b>Limelight’s full-field pose is fragile here.</b> All 8 pipelines share one field map, you need a red and a blue map, and there’s no filter for upside-down tags. Rocket Robotics (21615) published a Python cluster pipeline instead, which gives range, bearing and roll to the cell’s center.
          </li>
          <li>
            <b>Cheap drift fix.</b> Several teams suggest a driver button that resets the pose when the robot is pushed into a known corner.
          </li>
          <li>
            <b>Balls: color first.</b> A color pipeline runs at about 90 fps on a Limelight 3A; a trained detector at about 11 fps. Yellow pollen is the easiest to find. Red nectar gets confused with tape, panels and skin, and shadows hurt the simple color filter most.
          </li>
          <li>
            <b>One tilt, one job.</b> Tags hang above and face down; balls sit on the floor. Pick what each camera is for. (3587 is doing it with two cameras.)
          </li>
        </ul>
        <div className="learn">
          <A href="https://www.chiefdelphi.com/t/idea-about-ftc-biobuzz-localization/524104">CD: BIOBUZZ localization</A>
          <A href="https://www.chiefdelphi.com/t/ftc-biobuzz-limelight-settings-fmap/524110">CD: Limelight field map</A>
          <A href="https://github.com/Mona-Shores-FTC-Robotics/biobuzz/issues/82">Mona Shores: localization plan</A>
          <A href="https://github.com/pccsrocketrobotics/limelight-apriltag-clusters">Rocket Robotics: cluster pipeline</A>
          <A href="https://github.com/SASApantheon5193/biobuzz-pollen-vision">Pollen vision (color vs neural)</A>
          <A href="https://github.com/Mona-Shores-FTC-Robotics/biobuzz/issues/139">Mona Shores: HSV vs Lab colors</A>
        </div>
      </section>
    </div>
  );
}

function Origin() {
  return (
    <div className="tab-panel">
      <section className="card prose">
        <p>
          The “Week N plan for success” idea is borrowed from <b>Coach Brogan Pratt’s</b> DECODE series: each week gets one plan, split into build &amp; design, programming and outreach. We added drive &amp; strategy, gates, a rails check, and a quest board for when you’re not sure what to do.
        </p>
        <ul>
          <li>
            <b>Test several ideas before committing.</b> His Week 3 plan pushes quick prototypes of more than one intake and launcher before anyone falls for the first thing that works. Same idea here: nothing gets cut in final parts until it’s been tested in cardboard or quick-build.
          </li>
          <li>
            <b>Programming runs on a test robot early,</b> with pathing and driver automations coming together before the real robot is finished. That’s why code is written before Robot Day.
          </li>
          <li>
            <b>Outreach and documentation are part of the plan, not a scramble in January.</b> Written goals, a master season-notes document, and portfolio pages that grow every week.
          </li>
        </ul>
        <div className="learn">
          <A href={LINKS.pratt3[1]}>Pratt: Week 3 plan for success</A>
          <A href="https://www.youtube.com/@BroganMPratt/videos">Pratt’s channel</A>
          <A href={LINKS.openthread[1]}>Example: an open build thread</A>
        </div>
      </section>
    </div>
  );
}

function Links() {
  return (
    <div className="tab-panel">
      <section className="card">
        <h3>Everything we link to, in one place</h3>
        <ul className="linklist">
          {Object.entries(LINKS).map(([k, [label, url]]) => (
            <li key={k}>
              <A href={url}>{label}</A>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
