"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useApp } from "./AppProvider";
import { Cta, Icon, Shapes, type IconName } from "./ui";
import { KIND_LABEL, LEVEL_LABEL, QUESTS, questXp, type Quest, type QuestKind } from "@/lib/data/quests";
import { TRACKS } from "@/lib/data/core";
import { iso } from "@/lib/time";
import { questCrew, questsDoneBy, rankQuests } from "@/lib/pick";
import type { Focus } from "@/lib/types";

export const KIND_ICON: Record<QuestKind, IconName> = { watch: "play", code: "code", design: "design", build: "build", plan: "plan", quiz: "quiz" };

export function QuestCard({ q, done, crew = 0 }: { q: Quest; done?: boolean; crew?: number }) {
  return (
    <Link href={`/quests/${q.id}`} className={`qcard ${done ? "done" : ""}`} style={{ ["--tc" as string]: `var(--t-${q.track})` } as React.CSSProperties}>
      <div className="qc-top">
        <span className="qc-ico">
          <Icon name={done ? "check" : KIND_ICON[q.kind]} size={20} />
        </span>
        <span className="qc-kind">{KIND_LABEL[q.kind]}</span>
        <span className="qc-xp">+{questXp(q)} XP</span>
      </div>
      <h3>{q.title}</h3>
      <p>{q.blurb}</p>
      <div className="qc-meta">
        <span>
          <Icon name="clock" size={14} /> {q.mins} min
        </span>
        <span>{LEVEL_LABEL[q.level]}</span>
        <span className="trtag">{TRACKS[q.track].short}</span>
        {q.helpsTeam && <span className="qc-help">Helps the team</span>}
        {crew > 0 && !done && (
          <span>
            <Icon name="users" size={14} /> {crew} done
          </span>
        )}
      </div>
    </Link>
  );
}

/** The "Not sure what to do? Bored?" callout. Shown on Home and at the bottom of every week. */
export function BoredBanner({ focus: focusIn, compact }: { focus?: Focus; compact?: boolean }) {
  const { focus: f, state, person, clock } = useApp();
  const router = useRouter();
  const focus = focusIn ?? f;
  const day = iso(clock.today);
  const done = useMemo(() => questsDoneBy(state, person), [state, person]);
  const picks = useMemo(() => rankQuests({ quests: QUESTS, done, focus, week: clock.now, seed: day, maxMins: 45 }).slice(0, compact ? 2 : 3), [done, focus, clock.now, day, compact]);

  const surprise = () => {
    const pool = rankQuests({ quests: QUESTS, done, focus: "all", week: clock.now, seed: String(Math.random()) });
    router.push(`/quests/${(pool[0] ?? QUESTS[0]).id}`);
  };

  return (
    <section className={`bored ${compact ? "compact" : ""}`} aria-labelledby="bored-h">
      <Shapes variant="banner" />
      <div className="bored-in">
        <div className="bored-copy">
          <div className="eyebrow">Not sure what to do? Bored?</div>
          <h2 id="bored-h">Start here. There’s always something useful to do.</h2>
          <p>
            Short quests, each one a video to watch, a little Onshape design or code challenge, a quiz, or a hands-on job. Do one and you’ll know more than you did ten minutes ago, and most of them help your team.
          </p>
          <div className="bored-cta">
            <Cta href="/quests" variant="solid">
              Open the Quest Board
            </Cta>
            <button type="button" className="ghost-btn" onClick={surprise}>
              <Icon name="shuffle" size={16} /> Surprise me
            </button>
          </div>
        </div>
        <div className="bored-picks">
          <div className="label">Picked for you today</div>
          {picks.map(q => (
            <Link key={q.id} href={`/quests/${q.id}`} className="bpick">
              <span className="qc-ico">
                <Icon name={KIND_ICON[q.kind]} size={18} />
              </span>
              <span>
                <b>{q.title}</b>
                <small>
                  {KIND_LABEL[q.kind]} · {q.mins} min · +{questXp(q)} XP
                </small>
              </span>
              <Icon name="arrow" size={16} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export { questCrew };
