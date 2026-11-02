/* ============================================================
   QUEST KIT: types, labels, and every resource a quest can link to.

   HOW TO WRITE A GOOD QUEST (read this before adding one)
   1. Start from a real team problem. The title is a challenge or a
      question the robot actually has, not a topic.
   2. One finishable thing. Small: 15 to 25 min. Medium: 30 to 45.
      Large: 60, and it ends on the real robot.
   3. Five or six steps, one action each. Say exactly where to look:
      link the page, the section or the video time, right in the step
      with L("key", "words to click", "#section" or seconds).
   4. Make thinking visible: predict first, then measure, then change
      ONE thing, then compare. Add an `ok` line to any step where
      people usually get lost: how they know it worked.
   5. The proof is something a teammate can look at. The reflection is
      one sentence about what they would do differently.
   6. Add `needs` (accounts, parts, a coach) and `careful` (battery,
      eyes, test bench only) so nobody gets stuck or hurt.
   7. Give early finishers a `stretch`. Keep hints as a ladder: a nudge
      first, the answer last.
   8. Use only checked links and checked rule numbers. Videos: confirm
      with the YouTube oEmbed URL, not a plain request (a removed video
      still answers 200). Rules: check the current manual version.
   Plain language, short sentences, no dashes for pauses.
   ============================================================ */
import type { TrackCode } from "../types";

export type QuestKind = "watch" | "code" | "design" | "build" | "plan" | "quiz";
export type QuestLevel = 1 | 2 | 3;

export interface Resource {
  label: string;
  url: string;
  /** what to look for in it */
  note?: string;
}
export interface QuizQ {
  q: string;
  options: string[];
  answer: number;
  /** shown after answering; may contain [links](https://…) */
  why: string;
  /** where to read more, shown after answering */
  more?: Resource;
}
/** A step is plain text, or text plus how you know it worked. Text may contain [links](url), **bold** and `code`. */
export type Step = string | { t: string; ok?: string };

export interface Quest {
  id: string;
  title: string;
  kind: QuestKind;
  track: TrackCode;
  level: QuestLevel;
  mins: number;
  /** the challenge, in a sentence or two (shown on cards, so no links) */
  blurb: string;
  /** how finishing this helps the team (links allowed) */
  why: string;
  /** quests worth doing first */
  before?: string[];
  /** what you need: accounts, parts, a coach, a place */
  needs?: string[];
  /** a safety or care note, shown in a highlighted box */
  careful?: string;
  steps: Step[];
  resources: Resource[];
  /** what to show a teammate or the coach to count it as done */
  proof: string;
  /** one sentence to add when you finish */
  reflect?: string;
  /** for people who finish early */
  stretch?: string;
  /** a ladder: a nudge first, the answer last */
  hints?: string[];
  /** weeks where this is most useful: [from, to] */
  weeks?: [number, number];
  quiz?: QuizQ[];
  /** a quest that directly produces something the team needs */
  helpsTeam?: boolean;
}

export const KIND_LABEL: Record<QuestKind, string> = {
  watch: "Watch & learn",
  code: "Code",
  design: "Design in Onshape",
  build: "Hands-on",
  plan: "Think & plan",
  quiz: "Quiz",
};
export const LEVEL_LABEL: Record<QuestLevel, string> = { 1: "Starter", 2: "Builder", 3: "Stretch" };
export const LEVEL_XP: Record<QuestLevel, number> = { 1: 15, 2: 30, 3: 50 };
export const questXp = (q: Quest) => LEVEL_XP[q.level];

/* ---------- reusable resources ---------- */
export const R = {
  /* ---- Onshape ---- */
  onshapeBeginner: { label: "Onshape Tutorial for Absolute Beginners (10 min)", url: "https://www.youtube.com/watch?v=2utLjjkXpIg", note: "Aviv Makes Robots. Chapters: planes, extrude, remove, edit sketch, fillet, revolve." },
  onshapeAssemble: { label: "How to assemble parts on Onshape to build a basic FTC robot (Micah Yeung)", url: "https://www.youtube.com/watch?v=vs0Bo0mnHKM", note: "A whole FTC robot in one assembly." },
  onshapeFasten: { label: "Onshape Assemblies Ep. 1: Basics & the Fasten Mate (11 min)", url: "https://www.youtube.com/watch?v=xyqypvNhAEU", note: "Chapters for creating an assembly, moving parts, and mates." },
  ptc: { label: "FTC Docs: free Onshape for FIRST teams", url: "https://ftc-docs.firstinspires.org/en/latest/cad_resources/ptc/ptc.html", note: "Sign up for a free Education account; the training videos are inside." },
  onshapeFirst: { label: "Onshape for FIRST Robotics", url: "https://www.onshape.com/en/education/first-robotics", note: "Field models, parts libraries and tips for FTC teams." },
  fdBest: { label: "FTCDesign: CAD best practices (5 short articles)", url: "https://www.ftcdesign.org/best-practices.html", note: "Document setup, layout sketches, variables and mates. Read in order." },
  fdCourse: { label: "FTCDesign: learning course", url: "https://www.ftcdesign.org/learn.html", note: "Four stages from first sketch to designing a whole robot." },
  nemc: { label: "Onshape Best Practices for FIRST Teams (59 min, Onshape staff)", url: "https://www.youtube.com/watch?v=LwarpLrvQkA", note: "Long. Use the chapters and watch only the part you need." },
  partsLib: { label: "FTC parts library for Onshape (Team 2901)", url: "https://ftconshape.com/introduction-to-the-ftc-parts-library/", note: "Real goBILDA, REV and other parts, so you never re-model a motor." },
  gm0cad: { label: "gm0: CAD tutorials", url: "https://gm0.org/en/latest/docs/design-skills/cad-tutorials.html", note: "Part 1 drivetrain in an hour, Part 2 pocketing, Part 3 custom pulleys." },
  gm0dead: { label: "gm0: Dead wheels", url: "https://gm0.org/en/latest/docs/common-mechanisms/dead-wheels.html", note: "Two and three wheel pods, design, and spring tensioning." },
  pinpoint: { label: "goBILDA Pinpoint odometry computer", url: "https://www.gobilda.com/pinpoint-odometry-computer-imu-sensor-fusion-for-2-wheel-odometry/" },

  /* ---- Java and TeleOp ---- */
  javaBasics: { label: "FTC Java Basics (playlist)", url: "https://www.youtube.com/playlist?list=PLydXT_JlkbqGj1NjZBdUQSigsQXSiAdVJ", note: "Short videos made for students new to Java." },
  learnJava: { label: "Learn Java for FTC (free book)", url: "https://github.com/alan412/LearnJavaForFTC", note: "A free PDF for students who haven’t used Java before." },
  oracleJava: { label: "The Java Tutorials (Oracle)", url: "https://docs.oracle.com/javase/tutorial/" },
  onbot: { label: "FTC Docs: OnBot Java tutorial", url: "https://ftc-docs.firstinspires.org/programming_resources/onbot_java/OnBot-Java-Tutorial.html" },
  pacTeleop: { label: "FTC Programming 2: TeleOp program structure (10 min)", url: "https://www.youtube.com/watch?v=HurIL-iAeNc", note: "Brandon Pacewic’s FTC series." },
  pacMotor: { label: "FTC Programming 3: DcMotorSimple (3 min)", url: "https://www.youtube.com/watch?v=-5n-uBSMpQM" },
  pacHw: { label: "FTC Programming 4: hardwareMap (3 min)", url: "https://www.youtube.com/watch?v=qb0cmBP1rPk" },
  pacGamepad: { label: "FTC Programming 5: gamepad (4 min)", url: "https://www.youtube.com/watch?v=NbxXf26Urp8" },
  pacTelemetry: { label: "FTC Programming 13: telemetry (5 min)", url: "https://www.youtube.com/watch?v=c5YIUqTCyq8" },
  pacMecanum: { label: "FTC Programming 7: Mecanum drive (6 min)", url: "https://www.youtube.com/watch?v=4y9H8SnfVDI" },
  pacScale: { label: "FTC Programming 8: Drive power scaling (4 min)", url: "https://www.youtube.com/watch?v=CkzCgtoeUMs" },
  pacImu: { label: "FTC Programming 10: IMU (9 min)", url: "https://www.youtube.com/watch?v=X-osmWpKnaE" },
  pacField: { label: "FTC Programming 11: Field centric drive (10 min)", url: "https://www.youtube.com/watch?v=4rG5G9Mjw-g", note: "Chapters: introduction, IMU configuration, the math, testing." },
  pacAuto: { label: "FTC Programming 14: Autonomous program structure (6 min)", url: "https://www.youtube.com/watch?v=Dd0fWPSWPMM", note: "Why timing-based Autos fail when the battery drops." },
  prattMecanum: { label: "How To Program a Mecanum Drivetrain (26 min)", url: "https://www.youtube.com/watch?v=sFCO4du5IZk", note: "Chapters let you jump to the part you need." },
  prattTags: { label: "FTC AprilTags: get distance and angle with a webcam (18 min)", url: "https://www.youtube.com/watch?v=OZt33z-lyYo", note: "What a tag is, and how to read its ID, range and angle." },
  deadwheel: { label: "The Ultimate Guide to FTC Deadwheel Odometry (9 min)", url: "https://www.youtube.com/watch?v=RoDBoqOMc5A", note: "Chapters show the common pod layouts." },
  simpleOdo: { label: "SimplifiedOdometry (code + short videos)", url: "https://github.com/gearsincorg/SimplifiedOdometry" },
  pidf: { label: "PIDF Loops & Arm Control (KookyBotz 16379, 9 min)", url: "https://www.youtube.com/watch?v=E6H6Nqe6qJo", note: "Watch the intro for the idea of error, then the tuning chapter." },
  pid14840: { label: "Team 14840 coding lessons (playlist, lesson 10 is PID)", url: "https://www.youtube.com/playlist?list=PLk0Txcb6V-c1jjxuJNHcx57UrIbyjVtPy" },
  ghflow: { label: "GitHub flow", url: "https://docs.github.com/en/get-started/using-github/github-flow", note: "Short. Branch, change, pull request, review, merge." },

  /* ---- gm0 (Game Manual 0) ---- */
  gm0: { label: "gm0: Game Manual 0", url: "https://gm0.org/en/latest/", note: "The free guide to FTC design, build and code that most top teams start from." },
  gm0mec: { label: "gm0: Mecanum drive", url: "https://gm0.org/en/latest/docs/software/tutorials/mecanum-drive.html", note: "Physics, the control equations, then field-centric." },
  gm0ctrl: { label: "gm0: Control loops", url: "https://gm0.org/en/latest/docs/software/concepts/control-loops.html", note: "Error, P, D, I, tuning, then feedforward." },
  gm0odo: { label: "gm0: Odometry", url: "https://gm0.org/en/latest/docs/software/concepts/odometry.html", note: "What a pose is and how it updates." },
  gm0fsm: { label: "gm0: State machines", url: "https://gm0.org/en/latest/docs/software/concepts/finite-state-machines.html" },
  gm0intake: { label: "gm0: Principles of an intake", url: "https://gm0.org/en/latest/docs/common-mechanisms/active-intake/principles-of-an-intake.html", note: "Four principles: reliability, consistency, controllability, efficiency." },
  gm0intakeTypes: { label: "gm0: Types of intakes", url: "https://gm0.org/en/latest/docs/common-mechanisms/active-intake/types-of-intakes.html" },
  gm0turret: { label: "gm0: Turrets", url: "https://gm0.org/en/latest/docs/common-mechanisms/turrets/index.html" },
  gm0fullTurret: { label: "gm0: Full turrets", url: "https://gm0.org/en/latest/docs/common-mechanisms/turrets/full-turret.html", note: "Lazy susan, bearing stack and center bearing turrets." },
  gm0miniTurret: { label: "gm0: Mini turrets", url: "https://gm0.org/en/latest/docs/common-mechanisms/turrets/mini-turret.html" },
  gm0gears: { label: "gm0: Gears", url: "https://gm0.org/en/latest/docs/common-mechanisms/power-transmission/gears.html" },
  gm0motor: { label: "gm0: Choosing a motor", url: "https://gm0.org/en/latest/docs/power-and-electronics/motor-guide/choosing-motor.html", note: "Legal motors and gearboxes." },
  gm0wiring: { label: "gm0: Wiring", url: "https://gm0.org/en/latest/docs/power-and-electronics/wiring.html", note: "General advice, then module power, motors, servos, USB and sensors." },
  gm0judging: { label: "gm0: The judging process and presentation", url: "https://gm0.org/en/latest/docs/awards/judging-presentation.html", note: "Overall tips, the presentation, the Q&A period and pit judging." },
  gm0portfolio: { label: "gm0: Engineering portfolio", url: "https://gm0.org/en/latest/docs/awards/portfolio.html" },
  gm0resources: { label: "gm0: Useful resources (starred ones are the best)", url: "https://gm0.org/en/latest/docs/useful-resources.html", note: "General, strategy, CAD, part libraries, calculators, programming and electronics." },

  /* ---- the game ---- */
  onepage: { label: "BIOBUZZ one-page description", url: "https://ftc-resources.firstinspires.org/ftc/event/game-one-page", note: "One sheet: scoring, ranking points and the field." },
  manual: { label: "BIOBUZZ competition manual (all sections)", url: "https://ftc-resources.firstinspires.org/ftc/archive/2027/game", note: "The official source. Check the version date: it gets updates." },
  manArena: { label: "Manual Section 9: the ARENA (Hive, Flowers, AprilTags)", url: "https://ftc-resources.firstinspires.org/ftc/archive/2027/game/manual-09", note: "9.6 Hive, 9.7 Flower, 9.8 scoring elements, 9.9 AprilTags." },
  manDetails: { label: "Manual Section 10: game details and scoring", url: "https://ftc-resources.firstinspires.org/ftc/archive/2027/game/manual-10", note: "10.3 setup, 10.4 match periods, 10.5 scoring and point values." },
  manGame: { label: "Manual Section 11: game rules (G rules)", url: "https://ftc-resources.firstinspires.org/ftc/archive/2027/game/manual-11" },
  manRobot: { label: "Manual Section 12: robot construction rules (R rules)", url: "https://ftc-resources.firstinspires.org/ftc/archive/2027/game/manual-12" },
  manChat: { label: "FIRST’s Competition Manual chatbot", url: "https://ftc-cmchatbot.firstinspires.org/", note: "Ask a rules question in plain words. It can be wrong, so always confirm in the manual." },
  walkthrough: { label: "BIOBUZZ field walkthrough (video)", url: "https://www.youtube.com/watch?v=47X9sYnPijw" },
  animation: { label: "BIOBUZZ game animation (video)", url: "https://www.youtube.com/watch?v=sUH3z5a5S9I" },
  rules: { label: "Searchable rule index (unofficial)", url: "https://biobuzz-ten.vercel.app/rulebook/", note: "Quick to search, but not official. Confirm in the manual." },
  preview: { label: "FIRST game preview: what robots will need to do", url: "https://community.firstinspires.org/game-preview-field-elements", note: "Walls, corners, lines and piles of pollen." },
  skillBuilders: { label: "FIRST Skill Builders (seven pollen mini-games)", url: "https://training.firstinspires.org/courses/ftc-skill-builders-26-27", note: "Free on FIRST Training. Needs a FIRST Dashboard login (age 13 and up)." },
  skillBuildersAbout: { label: "What Skill Builders are and what’s in them", url: "https://community.firstinspires.org/introducing-first-tech-challenge-skill-builders" },
  sbOverview: { label: "goBILDA StarterBot overview for BIOBUZZ (7 min)", url: "https://www.youtube.com/watch?v=UXOh-F85t0o", note: "The designer explains the choices. Chapters: ground intake, hopper, framework, customizing." },
  sbGuide: { label: "goBILDA StarterBot resource guide", url: "https://www.gobilda.com/ftc-starter-bot-resource-guide-2026-2027-season/", note: "Downloads: STEP file (CAD), assembly instructions and example code." },

  /* ---- mechanisms (videos) ---- */
  bsShoot: { label: "Tips and Tricks: shooting mechanisms (5 min)", url: "https://www.youtube.com/watch?v=6OW-YfxOt1Y", note: "Team 8644. Older game, but the ideas hold. Chapters: dual flywheel, slingshot, popper." },
  bsIntake: { label: "Tips and Tricks: intake mechanisms (5 min)", url: "https://www.youtube.com/watch?v=RCfMzZY3lC0", note: "Team 8644. Older game, but the ideas hold. Has a chapter on wide and corner intakes." },
  bsGears: { label: "Tips and Tricks: gears and chains (3 min)", url: "https://www.youtube.com/watch?v=4ExHRRYXqJ0" },
  bsStatic: { label: "Tips and Tricks: preventing dropouts and static (2 min)", url: "https://www.youtube.com/watch?v=r2HpYOJistU" },
  ftcWiring: { label: "FTC Docs: robot wiring guide", url: "https://ftc-docs.firstinspires.org/en/latest/robot_building/wiring_guide/wiring-guide.html", note: "Includes ways to stop static from disconnecting the robot." },
  pratt3: { label: "FTC Week 3 plan for success (9 min)", url: "https://www.youtube.com/watch?v=v2Roi633ZkY", note: "Watch the Build & Design chapter: how a team tests more than one idea before committing." },

  /* ---- vision ---- */
  tags: { label: "FTC Docs: AprilTags", url: "https://ftc-docs.firstinspires.org/en/latest/apriltag/vision_portal/apriltag_intro/apriltag-intro.html" },
  tagValues: { label: "FTC Docs: understanding AprilTag values", url: "https://ftc-docs.firstinspires.org/en/latest/apriltag/understanding_apriltag_detection_values/understanding-apriltag-detection-values.html", note: "What range, bearing, elevation, pitch, roll and yaw mean." },
  colorDiscover: { label: "FTC Docs: Color Locator (Discover)", url: "https://ftc-docs.firstinspires.org/en/latest/color_processing/color-locator-discover/color-locator-discover.html", note: "Official. Works with any USB webcam." },
  colorExplore: { label: "FTC Docs: Color Locator (Explore)", url: "https://ftc-docs.firstinspires.org/en/latest/color_processing/color-locator-explore/color-locator-explore.html", note: "Target color, region of interest and size filters." },
  colorRound: { label: "FTC Docs: Color Locator (Round Blobs)", url: "https://ftc-docs.firstinspires.org/en/latest/color_processing/color-locator-round-blobs/color-locator-round-blobs.html", note: "How to tell a ball from a rectangle." },
  colorSpaces: { label: "FTC Docs: Color Spaces", url: "https://ftc-docs.firstinspires.org/en/latest/color_processing/color-spaces/color-spaces.html" },
  ll: { label: "Limelight 3A: quick start", url: "https://docs.limelightvision.io/docs/docs-limelight/getting-started/limelight-3a" },
  llprog: { label: "Limelight: FTC Java programming", url: "https://docs.limelightvision.io/docs/docs-limelight/apis/ftc-programming" },
  llcolor: { label: "Limelight: color pipelines", url: "https://docs.limelightvision.io/docs/docs-limelight/pipeline-retro/retro-theory" },

  /* ---- Pedro Pathing 3, in the order a team needs it ---- */
  pedroPrereq: { label: "Pedro Pathing: prerequisites", url: "https://pedropathing.com/docs/pathing/prerequisites", note: "Holonomic drive, a localizer, and Android Studio." },
  pedro3: { label: "Pedro Pathing: what’s new in Pedro 3", url: "https://pedropathing.com/docs/pathing/pedro3", note: "Older videos and blog posts use Pedro 2 code. Trust the docs." },
  pedroInstall: { label: "Pedro Pathing: installation", url: "https://pedropathing.com/docs/pathing/installation" },
  pedroTune: { label: "Pedro Pathing: tuning", url: "https://pedropathing.com/docs/pathing/tuning", note: "Drivetrain, then localizer, then Foresight." },
  pedroLoc: { label: "Pedro Pathing: tune the localizer", url: "https://pedropathing.com/docs/pathing/tuning/localization" },
  pedroPoses: { label: "Pedro Pathing: creating poses", url: "https://pedropathing.com/docs/pathing/guide/pose-creation" },
  pedroPaths: { label: "Pedro Pathing: creating paths", url: "https://pedropathing.com/docs/pathing/guide/path-creation" },
  pedroBezier: { label: "Pedro Pathing: Bézier curves", url: "https://pedropathing.com/docs/pathing/reference/beziercurves" },
  pedroCoords: { label: "Pedro Pathing: coordinates", url: "https://pedropathing.com/docs/pathing/reference/coordinates" },
  pedroAuto: { label: "Pedro Pathing: setting up your autonomous", url: "https://pedropathing.com/docs/pathing/guide/setting-up-auto" },
  pedroViz: { label: "Pedro Pathing: web path visualizer", url: "https://visualizer.pedropathing.com/", note: "Draw a path with the mouse. No robot needed." },
  pedroQuick: { label: "Pedro Pathing Quickstart (GitHub)", url: "https://github.com/Pedro-Pathing/Quickstart" },

  /* ---- seeing inside the robot, and control loops ---- */
  panels: { label: "Panels: live graphs and tuning for FTC", url: "https://panels.bylazar.com/", note: "Already inside the Pedro Quickstart. Open it at 192.168.43.1:8001 on the robot’s Wi-Fi." },
  ftcDash: { label: "FTC Dashboard (an alternative to Panels)", url: "https://github.com/acmerobotics/ftc-dashboard" },
  caftClosed: { label: "CTRL ALT FTC: closed loop control", url: "https://www.ctrlaltftc.com/introduction-to-closed-loop-control", note: "A free control theory guide written by FTC teams." },
  caftPid: { label: "CTRL ALT FTC: the PID controller", url: "https://www.ctrlaltftc.com/the-pid-controller" },
  caftTune: { label: "CTRL ALT FTC: tuning a PID controller", url: "https://www.ctrlaltftc.com/the-pid-controller/tuning-methods-of-a-pid-controller" },
  caftFF: { label: "CTRL ALT FTC: feedforward control", url: "https://www.ctrlaltftc.com/feedforward-control" },
  ftcPidf: { label: "FTC Docs: changing PIDF coefficients", url: "https://ftc-docs.firstinspires.org/en/latest/programming_resources/shared/pidf_coefficients/pidf-coefficients.html" },

  /* ---- judging, notes and where to look ---- */
  portfolios: { label: "Award-winning FTC portfolios to study", url: "https://fc-robotics.org/award-winning-documents/", note: "Look at layout, voice and how much detail the winners use." },
  portfolioLib: { label: "Engineering Portfolio Library (community)", url: "https://portfolios.hivemindrobotics.net/", note: "A big collection of past winners, kept up by the community." },
  judgeQs: { label: "FIRST sample judges’ questions", url: "https://ftc-resources.firstinspires.org/ftc/archive/2027/event/question-bank" },
  funEssentials: { label: "DECODE Essential Resources for FTC Teams (9 min)", url: "https://www.youtube.com/watch?v=YEhCZJgFCcE", note: "Made for last season, but the list of places to look still holds. Each resource has its own chapter." },
} satisfies Record<string, Resource>;

export type RKey = keyof typeof R;

/** Add a section (#anchor) or a video time (seconds) to a resource link. */
function withAt(url: string, at?: string | number): string {
  if (at === undefined) return url;
  if (typeof at === "number") return `${url}${url.includes("?") ? "&" : "?"}t=${at}s`;
  return `${url.split("#")[0]}${at.startsWith("#") ? at : `#${at}`}`;
}

/** Inline link for a step: L("gm0cad", "gm0’s drivetrain tutorial", "#cad-tutorial-part-1-drivetrain-in-an-hour") */
export const L = (key: RKey, text?: string, at?: string | number) => `[${text ?? R[key].label}](${withAt(R[key].url, at)})`;

/** A plain link to any address, for pages that are not in R. */
export const link = (text: string, url: string) => `[${text}](${url})`;

/** The same resource, but pointing at one section or video time, with its own note. */
export function deep(key: RKey, at: string | number, note: string, label?: string): Resource {
  const base: Resource = R[key];
  return { label: label ?? base.label, url: withAt(base.url, at), note };
}
