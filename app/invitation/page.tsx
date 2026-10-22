import { notFound, redirect } from "next/navigation";
import { membershipInvitations } from "@/data/membershipInvitation";

export default function InvitationEntryPage() {
  const latestCohort = Object.keys(membershipInvitations)
    .filter((cohort) => /^[1-9]\d*$/.test(cohort))
    .sort((a, b) => Number(b) - Number(a))[0];

  if (!latestCohort) notFound();
  redirect(`/invitation/${latestCohort}`);
}
