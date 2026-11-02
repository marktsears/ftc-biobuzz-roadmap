import type { FlagKey, Flags } from "./types";

/** Everything starts off. The site is quests first; an admin can bring the team tools back from Labs. */
export const DEFAULT_FLAGS: Flags = {
  week: false,
  season: false,
  robot: false,
  playbook: false,
  hive: false,
  xp: false,
  teamTasks: false,
};

export const FLAG_INFO: { key: FlagKey; name: string; what: string }[] = [
  { key: "week", name: "Week plans", what: "The week-by-week team task lists, under Week in the menu." },
  { key: "season", name: "Season calendar", what: "The season page, plus the week number, milestone dates and calendar at the top of Home." },
  { key: "teamTasks", name: "Team tasks on Home", what: "“Your next moves” and grabbing team tasks from Home and the quest pages." },
  { key: "robot", name: "Robot snapshot", what: "The robot page: mechanisms, motor budget and risks." },
  { key: "playbook", name: "Playbook", what: "How the team runs a week, the roles and the rules of thumb." },
  { key: "hive", name: "Hive and leaderboard", what: "Team XP, levels and the leaderboard. Ranking students can work against the ones who are just starting." },
  { key: "xp", name: "XP points", what: "“+30 XP” on quests and the pop-ups when you finish one." },
];

export function readFlags(v: unknown): Flags {
  const out: Flags = { ...DEFAULT_FLAGS };
  if (v && typeof v === "object")
    for (const k of Object.keys(DEFAULT_FLAGS) as FlagKey[]) {
      const x = (v as Record<string, unknown>)[k];
      if (typeof x === "boolean") out[k] = x;
    }
  return out;
}

/** Any of the team tools on? Then the team switcher in the header is worth showing. */
export const anyTeamTools = (f: Flags) => f.week || f.season || f.robot || f.hive || f.teamTasks;
