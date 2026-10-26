-- 가입 대기 명단만 삭제하며, 연결된 승인 신청은 취소 상태로 보관합니다.
create function private.delete_pending_member(p_invitation_id bigint, p_email text, p_cohort text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  invitation public.member_invitations%rowtype;
begin
  if not private.is_talk_admin() then raise exception 'admin_required'; end if;
  -- 승인 처리와 같은 순서로 신청을 먼저 잠급니다.
  perform 1 from public.membership_applications
    where lower(trim(email)) = lower(trim(p_email)) and cohort = p_cohort and status = 'approved'
    order by id for update;
  select * into invitation from public.member_invitations where id = p_invitation_id for update;
  if not found or lower(trim(invitation.email)) is distinct from lower(trim(p_email))
    or invitation.cohort is distinct from p_cohort then raise exception 'invitation_changed'; end if;
  if invitation.claimed_by is not null or invitation.claimed_at is not null
    then raise exception 'member_already_joined'; end if;
  update public.membership_applications set status = 'rejected', archived_at = now(),
    reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
    where lower(trim(email)) = lower(trim(invitation.email)) and cohort = invitation.cohort and status = 'approved';
  delete from public.member_invitations where id = invitation.id;
end;
$$;
revoke all on function private.delete_pending_member(bigint,text,text) from public, anon;
grant execute on function private.delete_pending_member(bigint,text,text) to authenticated;

create function public.admin_delete_pending_member(p_invitation_id bigint, p_email text, p_cohort text)
returns void language sql security invoker set search_path = '' as $$
  select private.delete_pending_member(p_invitation_id, p_email, p_cohort);
$$;
revoke all on function public.admin_delete_pending_member(bigint,text,text) from public, anon;
grant execute on function public.admin_delete_pending_member(bigint,text,text) to authenticated;
