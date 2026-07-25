import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationV2Page } from "@/src/components/invitation-v2/invitation-page";
import { InvitationOpenTracker } from "@/src/components/public/invitation-open-tracker";
import { getInvitationGuest } from "@/src/lib/invitation-guests";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Diana & Erick | 10 de abril de 2027",
  description: "Confirma tu asistencia a la celebración del sábado de Diana y Erick.",
  openGraph: {
    title: "Diana & Erick | 10 de abril de 2027",
    description: "Confirma tu asistencia a la celebración del sábado de Diana y Erick.",
  },
};

export default async function PersonalSaturdayInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const guest = await getInvitationGuest(token);
  if (!guest) notFound();
  return <><InvitationOpenTracker token={token} /><InvitationV2Page saturdayOnly initialName={guest.name} /></>;
}
