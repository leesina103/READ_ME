export type GuideGroup = { id: string; name: string; cohort: string; venue: string; ended: boolean; first_meeting_at?: string | null };
export type GuideDetails = { host_name: string; host_style: string; venue: string; duration_minutes: number; meetings: { week_number: number; starts_at: string }[] };
export type GuideAuditGroup = { id: string; name: string; cohort: string; first_meeting_at: string | null; duration_minutes: number };
export type GuideAudit = { action?: string; target_id?: string; actor: string; created_at: string; before_value: GuideDetails | null; after_value: GuideDetails | null; context?: { name?: string; nickname?: string; before_groups?: GuideAuditGroup[]; after_groups?: GuideAuditGroup[]; historical_approx?: boolean } };
export type GuideDetail = GuideGroup & GuideDetails & { members: { name: string; nickname: string }[]; pending: number; audit: GuideAudit[] };
export type GuideOverview = {
  people: { id: string; member_id: number | null; name: string; nickname: string; email: string; ready: boolean; status: string | null; groups: string[] }[];
  groups: (GuideGroup & { guide_id: string | null })[];
  invitations: { id: string; expires_at: string; created_at?: string; claimed: boolean; revoked: boolean; can_reveal?: boolean; claimed_name?: string | null; claimed_nickname?: string | null }[];
  audit: GuideAudit[];
};
