"use client";

import Link from "next/link";
import { useActionState } from "react";
import { changePassword, type PasswordState } from "@/app/(app)/settings/password/actions";

export default function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, {});
  if (state.notice) {
    return (
      <div className="card">
        <p className="notice">{state.notice}</p>
        <Link className="btn" href="/today">Go to today</Link>
      </div>
    );
  }
  return (
    <form action={action} className="card">
      <div className="field">
        <label htmlFor="password">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="field">
        <label htmlFor="confirm">Confirm new password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {state.error && <p className="error">{state.error}</p>}
      <button className="btn" disabled={pending}>Save new password</button>
    </form>
  );
}
