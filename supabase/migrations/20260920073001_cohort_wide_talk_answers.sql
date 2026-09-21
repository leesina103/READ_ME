-- 1~8주차 답변은 같은 기수 전체와 공유한다. 본인 답변 선작성 조건은 기존 RLS에서 유지한다.
create or replace function private.can_read_talk_author(p_cohort text,p_week smallint,p_author uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and public.has_active_membership()
    and public.is_cohort_member(p_cohort) and p_week between 1 and 8;
$$;
revoke all on function private.can_read_talk_author(text,smallint,uuid) from public, anon;
grant execute on function private.can_read_talk_author(text,smallint,uuid) to authenticated;
