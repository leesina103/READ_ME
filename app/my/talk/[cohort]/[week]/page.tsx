import { redirect } from "next/navigation";

type LegacyTalkPageProps = { params: Promise<{ cohort: string; week: string }> };

export default async function LegacyTalkPage({ params }: LegacyTalkPageProps) {
  const { cohort, week } = await params;
  redirect(`/membership/talk/${cohort}/${week}`);
}
