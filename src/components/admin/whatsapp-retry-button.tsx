"use client";

import { useState } from "react";

export function WhatsappRetryButton({ messageId }: { messageId: string }) {
  const [busy, setBusy] = useState(false);
  const retry = async () => {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/whatsapp/messages/${messageId}/retry`, { method: "POST" });
      if (!response.ok) throw new Error();
      window.location.reload();
    } finally { setBusy(false); }
  };
  return <button type="button" className="admin-button admin-button--secondary whatsapp-retry" disabled={busy} onClick={() => void retry()}>{busy ? "REINTENTANDO…" : "REINTENTAR"}</button>;
}
