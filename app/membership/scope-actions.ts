"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireActiveMembership } from "@/lib/membership/access";

export async function selectMembershipCohort(form: FormData) {
  const member = await requireActiveMembership();
  const cohort = String(form.get("cohort") ?? "");
  if (!member.selectableCohorts.includes(cohort)) redirect("/membership");
  (await cookies()).set("membership-cohort", cohort, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  revalidatePath("/membership", "layout");
  redirect("/membership");
}
