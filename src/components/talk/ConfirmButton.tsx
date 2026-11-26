"use client";

/** A form button that asks before running a server action (leave, delete, remove). */
export default function ConfirmButton({ action, message, children, className = "btn ghost" }: {
  action: () => Promise<void>; message: string; children: React.ReactNode; className?: string;
}) {
  return (
    <form action={action} onSubmit={(e) => { if (!confirm(message)) e.preventDefault(); }} style={{ display: "inline" }}>
      <button className={className}>{children}</button>
    </form>
  );
}
