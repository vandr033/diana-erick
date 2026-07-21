import type { Metadata } from "next";
import { InvitationV2Page } from "@/src/components/invitation-v2/invitation-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Diana & Erick | Sábado 10 de abril de 2027",
  description: "Confirma tu asistencia a la celebración del sábado de Diana y Erick.",
};

export default function SaturdayInvitationPage() { return <InvitationV2Page saturdayOnly />; }
