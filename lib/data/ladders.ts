/* ============================================================
   LADDERS: quests in order, so a student who knows nothing
   can always see the next step. The top rung is real robot work.
   ============================================================ */
import type { TrackCode } from "../types";

export interface Ladder {
  id: string;
  name: string;
  track: TrackCode;
  blurb: string;
  steps: string[];
}

export const LADDERS: Ladder[] = [
  {
    id: "onshape",
    name: "Onshape from zero",
    track: "B",
    blurb: "From a free account to a part bolted on the robot.",
    steps: ["cad-account", "cad-first-part", "cad-bracket", "cad-assembly", "cad-starterbot-import", "cad-top-down", "cad-cube", "cad-pinpoint-pods", "cad-camera-mount", "cad-real-part"],
  },
  {
    id: "code",
    name: "Code from zero",
    track: "S",
    blurb: "From your first variable to a change on the real robot.",
    steps: ["code-java-warmup", "quiz-java", "code-first-opmode", "code-gamepad-motor", "code-git-pr", "code-mecanum-paper", "quiz-mecanum", "code-read-starterbot", "code-state-machine", "code-real-change"],
  },
  {
    id: "see",
    name: "Teach the robot to see",
    track: "S",
    blurb: "From what a tag tells you to finding a yellow pollen without being fooled.",
    steps: ["code-apriltag-read", "code-color-locator", "code-blob-round", "code-limelight-color"],
  },
  {
    id: "pedro",
    name: "Autonomous with Pedro Pathing",
    track: "S",
    blurb: "From knowing where the robot is to a tuned Auto that leaves and parks.",
    steps: ["code-odometry", "code-pedro-ready", "code-pedro-visualizer", "code-pedro-tune", "code-pedro-leave-park"],
  },
  {
    id: "tune",
    name: "Tune the shooter",
    track: "S",
    blurb: "See your numbers, learn what P and D do, then hold a flywheel steady.",
    steps: ["code-panels", "code-pid-intuition", "quiz-pid", "code-flywheel-hold"],
  },
  {
    id: "hands",
    name: "Hands on the robot",
    track: "B",
    blurb: "Learn what’s on the robot, then fix something real.",
    steps: ["build-motor-count", "quiz-gears", "build-starterbot-teardown", "build-gm0-intake", "build-wiring-audit", "build-cardboard", "build-corner-test", "build-real-fix"],
  },
  {
    id: "drive",
    name: "Drive and strategy",
    track: "D",
    blurb: "Learn the game, then drive it.",
    steps: ["drive-watch-game", "quiz-rules", "drive-auto-paper", "drive-skill-builder", "drive-driver-practice", "quiz-tips", "drive-strategy-page"],
  },
  {
    id: "story",
    name: "Tell the team’s story",
    track: "O",
    blurb: "Notes, portfolio and the pitch the judges hear.",
    steps: ["out-notes-entry", "out-study-portfolio", "out-pitch", "out-judging-practice"],
  },
];

export const LADDER_OF: Record<string, { ladder: Ladder; idx: number }> = Object.fromEntries(
  LADDERS.flatMap(l => l.steps.map((id, idx) => [id, { ladder: l, idx }])),
);

/** The first quest in a ladder you haven't finished, or null if you've done them all. */
export function nextRung(l: Ladder, done: Set<string>): string | null {
  return l.steps.find(id => !done.has(id)) ?? null;
}
