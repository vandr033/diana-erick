import type { Metadata } from "next";
import { InvitationV2Page } from "@/src/components/invitation-v2/invitation-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Diana & Erick | Abril 10",
  description: "Confirma tu asistencia a la celebración del sábado de Diana y Erick.",
  openGraph: {
    title: "Diana & Erick | Abril 10",
    description: "Confirma tu asistencia a la celebración del sábado de Diana y Erick.",
  },
};

export default function SaturdayInvitationPage() { return <InvitationV2Page saturdayOnly />; }
