import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationV2Page } from "@/src/components/invitation-v2/invitation-page";
import { InvitationOpenTracker } from "@/src/components/public/invitation-open-tracker";
import { getInvitationGuest } from "@/src/lib/invitation-guests";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Diana & Erick — Invitación a la boda",
  robots: { index: false, follow: false },
};

export default async function WeddingInvitationPage({ params }: { params: Promise<{ invitation?: string[] }> }) {
  const { invitation = [] } = await params;
  if (invitation.length > 1) notFound();
  const [segment] = invitation;
  if (!segment || segment === "sabado") {
    return <InvitationV2Page phase="final" saturdayOnly={segment === "sabado"} />;
  }

  const guest = await getInvitationGuest(segment, "final");
  if (!guest) notFound();
  return <>
    <InvitationOpenTracker token={guest.token} />
    <InvitationV2Page phase="final" saturdayOnly={guest.saturdayOnly} initialName={guest.name} invitationToken={guest.token} companions={guest.companions} />
  </>;
}
