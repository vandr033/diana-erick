import type { Metadata } from "next";
import { InvitationV2Page } from "@/src/components/invitation-v2/invitation-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Diana & Erick — Invitación",
  robots: {
    index: false,
    follow: false,
  },
};

export default function V2Page() { return <InvitationV2Page />; }
