import { redirect } from "next/navigation";
import { currentMeeting } from "@/data/currentMeeting";
import { cohortNumberFromName } from "@/data/seasonWeeks";

export default function MembershipApplyIndexPage() {
  const cohortNumber = cohortNumberFromName(currentMeeting.cohort);
  redirect(cohortNumber ? `/membership/apply/${cohortNumber}` : "/meeting");
}
