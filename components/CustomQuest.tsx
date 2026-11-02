"use client";

import Link from "next/link";
import { useApp } from "./AppProvider";
import { QuestDetail } from "./QuestDetail";

/** A quest the coach wrote. It comes from the database, so it's looked up here. */
export function CustomQuest({ id }: { id: string }) {
  const { questById } = useApp();
  const q = questById(id);
  if (q) return <QuestDetail key={q.id} q={q} />;
  return (
    <div className="wrap stack-lg">
      <section className="card off-card">
        <h1>We can’t find that quest</h1>
        <p className="muted">It may have been archived.</p>
        <Link className="btn" href="/quests">
          See all quests
        </Link>
      </section>
    </div>
  );
}
