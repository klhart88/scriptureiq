"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

export default function LoginForm({ next, initialMode }: { next: string; initialMode: "signin" | "signup" }) {
  const [mode, setMode] = useState(initialMode);
  const [inState, inAction, inPending] = useActionState<AuthState, FormData>(signIn, {});
  const [upState, upAction, upPending] = useActionState<AuthState, FormData>(signUp, {});
  const state = mode === "signin" ? inState : upState;
  const pending = inPending || upPending;

  return (
    <div className="card">
      <div className="tabs">
        <a href="#" aria-current={mode === "signin" ? "page" : undefined} onClick={(e) => { e.preventDefault(); setMode("signin"); }}>Sign in</a>
        <a href="#" aria-current={mode === "signup" ? "page" : undefined} onClick={(e) => { e.preventDefault(); setMode("signup"); }}>Create account</a>
      </div>
      <form action={mode === "signin" ? inAction : upAction}>
        <input type="hidden" name="next" value={next} />
        {mode === "signup" && (
          <div className="field">
            <label htmlFor="name">Your name</label>
            <input id="name" name="name" autoComplete="name" required />
            <p className="small muted">Shown to members of groups you join.</p>
          </div>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={mode === "signup" ? 8 : undefined} required />
        </div>
        {state.error && <p className="error">{state.error}</p>}
        {state.notice && <p className="notice">{state.notice}</p>}
        <button className="btn block" disabled={pending}>{mode === "signin" ? "Sign in" : "Create account"}</button>
      </form>
    </div>
  );
}
