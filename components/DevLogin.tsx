"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

const PEOPLE = [
  { email: "msears@gmail.com", name: "Mark S", note: "admin" },
  { email: "maya.test@tsdch.org", name: "Maya T", note: "student" },
  { email: "leo.test@tsdch.org", name: "Leo R", note: "student" },
];

export function DevLogin() {
  const [email, setEmail] = useState(PEOPLE[1].email);
  const [name, setName] = useState(PEOPLE[1].name);
  return (
    <div className="wrap stack-lg">
      <section className="card">
        <h1>Test sign-in</h1>
        <p className="muted">Only on this computer, under next dev. Pick someone, or type any @tsdch.org address.</p>
        <div className="chips">
          {PEOPLE.map(p => (
            <button
              key={p.email}
              type="button"
              className={`chip ${email === p.email ? "on" : ""}`}
              onClick={() => {
                setEmail(p.email);
                setName(p.name);
              }}
            >
              {p.name} · {p.note}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Email</span>
          <input value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={e => setName(e.target.value)} />
        </label>
        <button type="button" className="cta solid" onClick={() => signIn("dev", { email, name, callbackUrl: "/" })}>
          <span>Sign in</span>
        </button>
      </section>
    </div>
  );
}
