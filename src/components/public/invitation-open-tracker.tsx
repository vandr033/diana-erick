"use client";

import { useEffect } from "react";

export function InvitationOpenTracker({ token }: { token: string }) {
  useEffect(() => {
    void fetch(`/api/invitations/${token}/opened`, { method: "POST", keepalive: true });
  }, [token]);

  return null;
}
