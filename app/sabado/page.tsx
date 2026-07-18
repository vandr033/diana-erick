import type { Metadata } from "next";
import { InvitationPage } from "@/src/components/public/invitation-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Diana & Erick | Sábado 10 de abril de 2027",
  description: "Confirma tu asistencia a la celebración del sábado de Diana y Erick.",
};

export default function SaturdayInvitationPage() { return <InvitationPage saturdayOnly />; }
