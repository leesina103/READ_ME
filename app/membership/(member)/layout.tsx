import type { ReactNode } from "react";
import { MembershipNav } from "@/components/MembershipNav";
import { requireActiveMembership } from "@/lib/membership/access";

export default async function MemberLayout({ children }: { children: ReactNode }) {
  const member = await requireActiveMembership();
  return <><MembershipNav cohortNumber={member.cohortNumber} />{children}</>;
}
