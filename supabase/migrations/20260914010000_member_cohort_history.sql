-- 회원이 참여한 기수 이력.
-- 프로필의 cohort는 "현재 기수"로 그대로 두고, 지난 기수 대화방은 이 표를 기준으로 읽기만 허용한다.
-- 답변 저장(save_session_answer)은 기존처럼 프로필의 현재 기수에만 가능하다.
create table if not exists public.member_cohorts (
  user_id uuid not null references auth.users(id) on delete cascade,
  cohort text not null references public.cohorts(name) on update cascade,
  joined_at timestamptz not null default now(),
  primary key (user_id, cohort)
);

alter table public.member_cohorts enable row level security;
revoke all on table public.member_cohorts from anon, authenticated;
grant select on table public.member_cohorts to authenticated;

drop policy if exists "회원은 자신의 참여 기수를 조회할 수 있음" on public.member_cohorts;
create policy "회원은 자신의 참여 기수를 조회할 수 있음"
on public.member_cohorts for select
to authenticated
using ((select auth.uid()) = user_id);

-- 기존 회원의 현재 기수를 이력으로 채운다.
insert into public.member_cohorts (user_id, cohort, joined_at)
select profile.id, profile.cohort, coalesce(profile.onboarding_completed_at, profile.created_at, now())
from public.profiles as profile
where profile.cohort is not null
  and exists (select 1 from public.cohorts as cohort where cohort.name = profile.cohort)
on conflict (user_id, cohort) do nothing;

-- 가입(프로필 생성)과 재참여 승인(프로필 기수 변경) 모두 이력에 자동으로 쌓인다.
create or replace function public.sync_member_cohort_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.cohort is not null
    and (tg_op = 'INSERT' or new.cohort is distinct from old.cohort)
    and exists (select 1 from public.cohorts as cohort where cohort.name = new.cohort) then
    insert into public.member_cohorts (user_id, cohort, joined_at)
    values (new.id, new.cohort, now())
    on conflict (user_id, cohort) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_member_cohort_from_profile() from public, anon, authenticated;

drop trigger if exists sync_profile_member_cohort on public.profiles;
create trigger sync_profile_member_cohort
  after insert or update of cohort on public.profiles
  for each row execute procedure public.sync_member_cohort_from_profile();

-- 요청자가 참여했던 기수인지 확인한다. 정책 안에서 이력 표를 조회할 때 사용한다.
create or replace function public.is_cohort_member(target_cohort text)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.member_cohorts as member_cohort
    where member_cohort.user_id = (select auth.uid())
      and member_cohort.cohort = target_cohort
  );
$$;

revoke all on function public.is_cohort_member(text) from public, anon;
grant execute on function public.is_cohort_member(text) to authenticated;

-- 답변 개수: 현재 기수뿐 아니라 참여했던 기수라면 확인할 수 있다.
create or replace function public.session_answer_count(target_cohort text, target_week smallint)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  answer_count integer;
begin
  if (select auth.uid()) is null
    or not public.has_active_membership()
    or not public.is_cohort_member(target_cohort) then
    return 0;
  end if;

  select count(*)::integer
  into answer_count
  from public.session_answers
  where cohort = target_cohort
    and week_number = target_week;

  return answer_count;
end;
$$;

revoke all on function public.session_answer_count(text, smallint) from public, anon;
grant execute on function public.session_answer_count(text, smallint) to authenticated;

-- 동료 답변 조회: 답변을 남긴 주차에 한해, 참여했던 기수의 답변을 읽을 수 있다.
drop policy if exists "답변을 남긴 활성 기수원만 같은 주차 답변 조회 가능" on public.session_answers;
create policy "답변을 남긴 활성 기수원만 같은 주차 답변 조회 가능"
on public.session_answers for select
to authenticated
using (
  public.has_active_membership()
  and public.has_answered(cohort, week_number)
  and public.is_cohort_member(cohort)
);
