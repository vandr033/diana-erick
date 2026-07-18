import { handleRsvpSubmission } from "@/src/lib/rsvp-server";

export async function POST(request: Request) { return handleRsvpSubmission(request, "saturday"); }
