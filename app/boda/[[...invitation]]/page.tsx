import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationV2Page } from "@/src/components/invitation-v2/invitation-page";
import { InvitationOpenTracker } from "@/src/components/public/invitation-open-tracker";
import { getInvitationGuest } from "@/src/lib/invitation-guests";
import { getLatestWeddingResponse, toRsvpConfirmation } from "@/src/lib/rsvp-server";
import { isGuidePage } from "@/src/lib/wedding-guide";
import { WeddingGuidePage } from "@/src/components/public/wedding-guide-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Diana & Erick — Invitación a la boda",
  robots: { index: false, follow: false },
};

export default async function WeddingInvitationPage({ params }: { params: Promise<{ invitation?: string[] }> }) {
  const { invitation = [] } = await params;
  if (invitation.length > 2) notFound();
  const [segment, guide] = invitation;
  if (!guide && isGuidePage(segment)) return <WeddingGuidePage page={segment} invitationPath="/boda" />;
  if (!segment || segment === "sabado") {
    if (guide) {
      if (!isGuidePage(guide)) notFound();
      return <WeddingGuidePage page={guide} invitationPath="/boda/sabado" />;
    }
    return <InvitationV2Page phase="final" saturdayOnly={segment === "sabado"} />;
  }

  const guest = await getInvitationGuest(segment, "final");
  if (!guest) notFound();
  if (guide) {
    if (!isGuidePage(guide)) notFound();
    return <WeddingGuidePage page={guide} invitationPath={`/boda/${encodeURIComponent(guest.token)}`} />;
  }
  const existing = await getLatestWeddingResponse(guest.id);
  return <>
    <InvitationOpenTracker token={guest.token} />
    <InvitationV2Page phase="final" saturdayOnly={guest.saturdayOnly} initialName={guest.name} invitationToken={guest.token}
      companions={guest.companions} savedConfirmation={existing ? toRsvpConfirmation(existing) : undefined} />
  </>;
}
