import { notFound, redirect } from "next/navigation";
import { InvitationV2Page } from "@/src/components/invitation-v2/invitation-page";
import { InvitationOpenTracker } from "@/src/components/public/invitation-open-tracker";
import { getInvitationGuest } from "@/src/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function PersonalSaturdayInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const guest = await getInvitationGuest(token);
  if (!guest) notFound();
  if (!guest.saturdayOnly) redirect(`/invitacion/${token}` as never);
  return <><InvitationOpenTracker token={token} /><InvitationV2Page saturdayOnly initialName={guest.name} /></>;
}
