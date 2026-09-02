import { notFound, redirect } from "next/navigation";

type LegacyMembershipApplyPageProps = {
  params: Promise<{ applySlug: string }>;
};

export default async function LegacyMembershipApplyPage({ params }: LegacyMembershipApplyPageProps) {
  const { applySlug } = await params;
  const match = /^apply(\d+)$/.exec(applySlug);
  if (!match) notFound();
  redirect(`/membership/apply/${Number(match[1])}`);
}
