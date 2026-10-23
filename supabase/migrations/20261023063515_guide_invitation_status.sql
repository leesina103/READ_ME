-- 링크를 가진 사람에게는 상태만 반환하고 가입자 개인정보는 공개하지 않습니다.
create function public.guide_invitation_status(p_token text) returns text
language sql stable security definer set search_path='' as $$
  select coalesce((select case
    when claimed_by is not null then 'used'
    when revoked_at is null and expires_at>now() then 'available'
    else 'unavailable' end
    from public.guide_invitations
    where p_token ~ '^[a-f0-9]{64}$'
      and token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex')),'unavailable');
$$;
revoke all on function public.guide_invitation_status(text) from public;
grant execute on function public.guide_invitation_status(text) to anon,authenticated;
