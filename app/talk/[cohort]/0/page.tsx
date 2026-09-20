import { notFound, redirect } from "next/navigation";

export default async function FirstMeetingShortcut({ params }: { params: Promise<{ cohort: string }> }) {
  const { cohort } = await params;
  const number = Number(cohort);
  if (!Number.isInteger(number) || number < 1 || number > 99) notFound();
  redirect(`/membership/talk/${number}/0`);
}
