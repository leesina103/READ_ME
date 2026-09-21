-- 삭제 직전에도 인원을 확인해 동시 배정 중인 그룹이 함께 지워지는 것을 막는다.
create function private.guard_talk_group_deletion()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists(select 1 from public.talk_group_members where group_id = old.id) then
    raise exception 'talk_group_not_empty' using errcode = '23503';
  end if;
  return old;
end;
$$;
revoke all on function private.guard_talk_group_deletion() from public, anon, authenticated;
create trigger guard_talk_group_deletion before delete on public.talk_groups
  for each row execute function private.guard_talk_group_deletion();
