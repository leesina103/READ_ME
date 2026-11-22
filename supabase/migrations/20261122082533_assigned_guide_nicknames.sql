-- 내 모임의 담당 가이드 닉네임만 회원에게 전달합니다.
create function public.my_group_guide_name(p_group_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select nullif(btrim(p.display_name), '')
  from public.talk_group_members m
  join public.guide_assignments a on a.group_id = m.group_id
  join public.profiles p on p.id = a.user_id
  where m.user_id = (select auth.uid()) and m.group_id = p_group_id
$$;
revoke all on function public.my_group_guide_name(uuid) from public, anon;
grant execute on function public.my_group_guide_name(uuid) to authenticated;

create or replace function public.list_member_guides()
returns table(host_name text, host_style text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not public.has_active_membership() then
    raise exception 'active_membership_required';
  end if;
  return query
    select distinct btrim(p.display_name), btrim(g.host_style)
    from public.guide_assignments a
    join public.profiles p on p.id = a.user_id
    join public.talk_groups g on g.id = a.group_id
    where nullif(btrim(p.display_name), '') is not null
    order by 1, 2;
end;
$$;
