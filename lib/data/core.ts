/* ============================================================
   DATA: tracks, links, teams, phases, milestones
   Weeks live in the next two files. Items starting with "B:", "S:", "D:", "O:" or "A:"
   are tagged to Build, Software, Drive & Strategy, Outreach & Awards or All hands.
   Progress IDs come from a hash of the item text, so editing a line resets its tick.
   ============================================================ */

import type { BudgetRow, Milestone, Phase, TeamId, TrackCode } from "../types";

export const TRACKS: Record<TrackCode, { name: string; short: string; sub: string }> = {
  B: {name:"Build & Design", short:"Build", sub:"mechanical + electrical"},
  S: {name:"Software", short:"Software", sub:"Motion + Scoring lanes"},
  D: {name:"Drive & Strategy", short:"Drive", sub:"drivers, scouting, game plan"},
  O: {name:"Outreach & Awards", short:"Outreach", sub:"portfolio, judging, community"},
  A: {name:"All hands", short:"All", sub:"everyone, together"},
};

export const LINKS: Record<string, [string, string]> = {
  onepage: ["BIOBUZZ one-page description", "https://ftc-resources.firstinspires.org/ftc/event/game-one-page"],
  manual: ["BIOBUZZ game manual", "https://ftc-resources.firstinspires.org/ftc/archive/2027/game"],
  walkthrough: ["Field walkthrough (video)", "https://www.youtube.com/watch?v=47X9sYnPijw"],
  animation: ["Game animation (video)", "https://www.youtube.com/watch?v=sUH3z5a5S9I"],
  rules: ["Searchable rule index (unofficial)", "https://biobuzz-ten.vercel.app/rulebook/"],
  pratt3: ["A week plan, as an example", "https://www.youtube.com/watch?v=v2Roi633ZkY"],
  openthread: ["Example open build thread", "https://www.chiefdelphi.com/t/ftc-12862-build-thread-2025-decode/505789"],
  gm0: ["gm0: Game Manual 0", "https://gm0.org/en/latest/"],
  revdocs: ["REV docs", "https://docs.revrobotics.com/"],
  ftcdocs: ["FTC Docs", "https://ftc-docs.firstinspires.org"],
  sdk: ["FTC SDK releases", "https://github.com/FIRST-Tech-Challenge/FtcRobotController/releases"],
  gm0mec: ["gm0: Mecanum drive", "https://game-manual-0.readthedocs.io/en/latest/docs/software/tutorials/mecanum-drive.html"],
  gm0ctrl: ["gm0: Control loops", "https://game-manual-0.readthedocs.io/en/latest/docs/software/concepts/control-loops.html"],
  gm0odo: ["gm0: Odometry", "https://game-manual-0.readthedocs.io/en/latest/docs/software/concepts/odometry.html"],
  gm0fsm: ["gm0: State machines", "https://game-manual-0.readthedocs.io/en/latest/docs/software/concepts/finite-state-machines.html"],
  gm0bulk: ["gm0: Bulk reads", "https://game-manual-0.readthedocs.io/en/latest/docs/software/tutorials/bulk-reads.html"],
  pratt: ["Learn Java for FTC (videos)", "https://www.youtube.com/playlist?list=PLRHdgFNRLyaPiZ5rvINwMmGMHEIL9usla"],
  ghflow: ["GitHub flow", "https://docs.github.com/en/get-started/using-github/github-flow"],
  ref: ["Our reference project", "https://github.com/marktsears/ftc-decode-reference"],
  pedro: ["Pedro Pathing docs", "https://pedropathing.com/"],
  pinpoint: ["goBILDA Pinpoint", "https://www.gobilda.com/pinpoint-odometry-computer-imu-sensor-fusion-for-2-wheel-odometry/"],
  ll: ["Limelight FTC setup", "https://docs.limelightvision.io/docs/docs-limelight/getting-started/FTC/setup"],
  llprog: ["Limelight FTC programming", "https://docs.limelightvision.io/docs/docs-limelight/apis/ftc-programming"],
  llcolor: ["Limelight color pipelines", "https://docs.limelightvision.io/docs/docs-limelight/pipeline-retro/retro-theory"],
  clusters: ["Limelight cluster pipeline (Rocket Robotics)", "https://github.com/pccsrocketrobotics/limelight-apriltag-clusters"],
  sdkclusters: ["SDK 12 AprilTag clusters", "https://ftc-docs.firstinspires.org/en/latest/tech_tips/tech-tips/tech-tip-apriltag-clusters/tech-tip-apriltag-clusters.html"],
  trcll: ["Limelight 3A pollen guide (TRC)", "https://irp.cdn-website.com/3a1d1852/files/uploaded/TRC_Limelight_Guide_BIOBUZZ.pdf"],
  tags: ["AprilTags in FTC", "https://ftc-docs.firstinspires.org/en/latest/apriltag/vision_portal/apriltag_intro/apriltag-intro.html"],
};

export const SNAPSHOT: Record<TeamId, string> = {
  "2827": "https://claude.ai/code/artifact/19d85788-7255-4c0d-83b7-cc5e9957b5b9",
  "3587": "https://claude.ai/code/artifact/fbdd724b-5734-4863-8173-9449feb186f6",
};

// Each team's robot as of the 17 Oct interviews (plus the 3587 camera update).
export interface TeamInfo {
  plan: string;
  facts: [string, string][];
  risks: string[];
  changes: string[];
}
export const TEAMS: Record<TeamId, TeamInfo> = {
  "2827": {
    plan: "Fast, accurate pollen cycles, plus defense. No Flowers.",
    facts: [
      ["Drive", "Butterfly: mecanum-style fast mode and a traction mode for shooting and defense."],
      ["Odometry", "Not chosen yet. Plan on Pinpoint with two pods; drive encoders can’t be trusted in two modes."],
      ["Shooter", "One turret shooter, pollen only, hood on a servo. Backspin wheel maybe."],
      ["Turret", "One motor if it fits in the 8, otherwise 2 servos. Zero method not chosen."],
      ["Balls", "Color sensors at intake and shooter. Reject all nectar; stop at 4."],
      ["Intake", "Servo deploys it at the start; runs in and out."],
      ["Camera", "Not decided. Recommended: Limelight on the turret, tilted up at the Hive cells. Charlotte’s ball-following exists."],
    ],
    risks: [
      "The turret decision (1 motor vs 2 servos) sets the whole port budget. Decide it in Week 6.",
      "The mode switch is a wear point. If the traction wheels drop, the Pinpoint pods must still touch the floor.",
      "Color sensors read ambient light as much as balls. Shield them and test with shadows.",
      "A camera on a turret needs a cable path through the full rotation.",
    ],
    changes: [
      "Nectar comes back: add a second preset table and copy 3587’s one-class, two-shooter pattern.",
      "Limelight goes on the chassis facing the floor: it becomes a ball camera like 3587’s, and a driver button says which cell is up.",
      "Turret ends up on 2 position servos: no homing needed, but check the angle range first.",
    ],
  },
  "3587": {
    plan: "Shoot both pollen and nectar and tip the Hive as often as possible. No Flowers.",
    facts: [
      ["Drive", "Mecanum."],
      ["Odometry", "Pinpoint (probably)."],
      ["Shooters", "Two turret shooters, one for nectar and one for pollen, hood on a servo each."],
      ["Turrets", "Servos through gears. Position servos know their angle, so no homing."],
      ["Transfer", "Passive sort: pollen drops through the nectar rails. One transfer motor, 2 gate servos."],
      ["Balls", "No sensors before the qualifier: drivers reverse out extras and opponent nectar."],
      ["Cameras", "Two. Limelight mounted down at the floor for ball detection, plus a regular USB webcam looking up at the Hive’s AprilTags."],
    ],
    risks: [
      "Motors are already 8 of 8. Every new motor costs an old one.",
      "Count servos with care: 2 hoods, the turret servos (a geared turret may use two) and 2 gates add up fast against 8.",
      "The passive sort is clever and will jam if balls arrive in a bad order. Test it with 20 mixed balls before anything is built around it.",
      "Both shooters spinning at once can sag the battery. Measure it before the shot test.",
      "Two cameras share the hub’s USB. Check which port the Limelight needs and run the webcam at a low resolution.",
    ],
    changes: [
      "Switch to one shooter: one Shooter object with a preset table per ball type.",
      "The webcam can’t see the tags well: move it, or fall back to Pinpoint-only aiming with a driver button for which cell is up.",
      "Motor list changes: you’re at 8 of 8 already, so every new motor costs an old one.",
    ],
  },
};

// Starter numbers from the snapshot. Teams edit these on the page.
export const BUDGET: Record<TeamId, BudgetRow[]> = {
  "2827": [["Drivetrain + mode switch (guess)",4,1],["Intake + deploy",1,1],["Flywheel",1,0],["Hood",0,1],["Turret (1-motor version)",1,0],["Feed / transfer (guess)",1,0]],
  "3587": [["Drivetrain",4,0],["Nectar flywheel",1,0],["Pollen flywheel",1,0],["Intake",1,0],["Transfer",1,0],["Hoods (2)",0,2],["Turrets (2, geared servos)",0,2],["Gates (2)",0,2]],
};

export const VISION: [string, string | Record<TeamId, string>, number | Record<TeamId, number>][] = [
  ["Bench", {"2827":"Tag pipeline reads our alliance’s Hive cluster IDs; a color pipeline finds yellow pollen. Export both pipelines into the repo.", "3587":"Limelight: a color pipeline finds yellow pollen. Webcam: the SDK’s AprilTag processor reads tag IDs, range and bearing. Export the Limelight pipeline into the repo."}, 2],
  ["Give each camera one job", {"2827":"On the turret, tilted up at the Hive cells: aiming and which cell is up. Ball-finding needs Charlotte’s camera or waits.", "3587":"Limelight tilted down at the floor: finding balls. Webcam tilted up at the Hive: reading its tags. Neither camera does the other’s job."}, 2],
  ["See the Hive or the balls", {"2827":"Range, bearing and roll to the up cell’s center from its 4-tag cluster. Roll tells you which cell is up.", "3587":"Webcam: each cell has its own 4 tag IDs, so the IDs say which cell is up, and the SDK’s cluster support gives one pose from the 4 tags. Limelight: yellow pollen first, then our nectar color; log false hits on tape and shirts."}, 6],
  ["Aim, with odometry first", {"2827":"Pinpoint aims the turret. The tag bearing trims it only when the cell has settled and 2 or more tags are seen.", "3587":"Pinpoint aims both turrets. The webcam’s tag bearing trims them only when the cell has settled and 2 or more tags are seen. A corner-reset button fixes drift, and a driver button overrides which cell is up if the webcam is blinded."}, 7],
  ["Find balls in Auto", {"2827":"Bring in Charlotte’s ball-following for the last few feet of a pickup, behind an off switch.", "3587":"Limelight steers the last few feet to pollen and skips opponent nectar. It’s already on the floor, so start earlier if you’re ahead."}, {"2827":9, "3587":13}],
];
export const VISION_NOTE: Record<TeamId, string> = {
  "2827": "One camera runs one pipeline at a time. Switching takes a few frames, so never switch pipelines in the middle of a shot.",
  "3587": "Each camera keeps one job, so no pipeline switching. The two cameras share the hub’s USB: set the webcam’s exposure by hand, keep its resolution low, and check which Control Hub port the Limelight needs.",
};

// Stages of the season (the pizza-tracker steps).
export const PHASES: Phase[] = [
  {id:"reveal", name:"Since the reveal", short:"Reveal", color:"--p-reveal", blurb:"BIOBUZZ came out Sept 12. These five weeks already happened. The written plan starts Oct 19."},
  {id:"sprint", name:"Sprint to Robot Day", short:"Sprint", color:"--p-sprint", blurb:"The target for Sunday Nov 1 is a wood robot that drives, intakes and shoots, handed to software. A part that works in wood gets cut in aluminum. If the wood robot slips, software keeps going on the test robot."},
  {id:"bring", name:"Bring-up", short:"Bring-up", color:"--p-bring", blurb:"Drivers on the wood robot as soon as it drives. Mechanisms that proved themselves in wood get cut in aluminum one at a time, not all on one day."},
  {id:"aim", name:"Aim and integrate", short:"Aim", color:"--p-aim", blurb:"Turret, camera and one-button scoring come together. Accuracy from fixed spots must already work."},
  {id:"scrim", name:"Scrimmage", short:"Scrimmage", color:"--p-scrim", blurb:"The dress rehearsal. Play full matches, find every failure, fix the top three, tag a release candidate before break."},
  {id:"break", name:"Winter break", short:"Break", color:"--p-break", blurb:"Optional. rc1 is tagged and the robot has a home. Rest, write the portfolio, or study top teams."},
  {id:"qual", name:"Qualifier push", short:"Qualifier", color:"--p-qual", blurb:"Fixes only, then freeze on Jan 8. Qualifier week is for driver practice, judging practice and packing."},
  {id:"post", name:"After the qualifier", short:"After", color:"--p-post", blurb:"Improve from match data: ball-finding vision, a second Auto cycle, then speed. Every change has a test and a rollback."},
];

// Dates that matter. "week" is where the flag sits on the tracker.
export const MILESTONES: Milestone[] = [
  {key:"robot", name:"Robot Day", date:"2026-11-01", week:7, flag:["robot","ROBOT DAY"]},
  {key:"scrim", name:"NC scrimmage", date:"2026-12-12", week:13, flag:["scrim","SCRIMMAGE"]},
  {key:"rc1", name:"Release candidate", date:"2026-12-18", week:14, flag:["gate","RC1"]},
  {key:"freeze", name:"Freeze", date:"2027-01-08", week:16, flag:["gate","FREEZE"]},
  {key:"qual", name:"NC qualifier", date:"2027-01-16", week:17, flag:["","QUALIFIER"]},
];

// A short list for the weekend before Week 1.
export const PRE: string[] = [
  "A: Open this app together, type your first name, and pick your team. Everyone’s ticks are shared with the team.",
  "A: Put Monday’s 10-minute kickoff on the calendar and decide who runs it.",
  "D: Everyone on the drive team watches the field walkthrough and the game animation.",
  "S: Both coders clone the reference project and make sure it builds.",
  "O: Ask the event organizers for the qualifier’s portfolio deadline and interview schedule.",
  "B: Each team’s build lead reads the Robot Day Gate on the Week 7 page and says out loud what’s at risk.",
];
