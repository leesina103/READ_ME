-- 모임의 상세 정보는 공개하지 않고 회원에게 가이드 소개만 전달합니다.
create function public.list_member_guides()
returns table(host_name text, host_style text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not public.has_active_membership() then
    raise exception 'active_membership_required';
  end if;
  return query
    select distinct trim(g.host_name), trim(g.host_style)
    from public.talk_groups g
    where trim(g.host_name) <> ''
    order by 1, 2;
end;
$$;
revoke all on function public.list_member_guides() from public, anon;
grant execute on function public.list_member_guides() to authenticated;
