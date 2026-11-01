"use client";
import { useState } from "react";

export default function MailBackup() {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/admin/sauvegarde", { method: "POST" });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    setMsg(r.ok && d.ok ? `Envoyée ! (${d.ko} Ko) Regarde ta boîte e-mail.` : d.error || "Aucun administrateur avec un compte.");
  }
  return (
    <span className="mail-backup">
      <button type="button" className="ghost small" onClick={go} disabled={busy}>{busy ? "Envoi…" : "M'envoyer une sauvegarde par e-mail"}</button>
      {msg && <span className="muted small">{msg}</span>}
    </span>
  );
}
