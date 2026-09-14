-- 운영자용 기수 일정 관리.
-- 기수 목록(시작일·종료일·신청 접수 여부·참여 회원 수)을 조회하고, 기수를 추가하거나 일정을 수정한다.
create or replace function public.admin_list_cohorts()
returns table (
  name text,
  starts_at timestamptz,
  ends_at timestamptz,
  application_open boolean,
  member_count integer
)
language plpgsql
stable
security definer set search_path = ''
as $$
begin
  if coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') <> 'admin' then
    raise exception 'admin_required';
  end if;

  return query
  select
    cohort.name,
    cohort.starts_at,
    cohort.ends_at,
    cohort.application_open,
    (
      select count(*)::integer
      from public.member_cohorts as history
      where history.cohort = cohort.name
    )
  from public.cohorts as cohort
  order by cohort.starts_at, cohort.name;
end;
$$;

revoke all on function public.admin_list_cohorts() from public, anon;
grant execute on function public.admin_list_cohorts() to authenticated;

-- 기수 이름은 "2기"처럼 숫자 + 기 형식만 허용한다(앱이 이 형식으로 기수 번호를 읽는다).
-- 이미 있는 기수면 일정만 갱신하고, 없으면 새로 만든다.
create or replace function public.admin_save_cohort(
  p_name text,
  p_starts_at timestamptz,
  p_ends_at timestamptz default null,
  p_application_open boolean default false
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  normalized_name text := regexp_replace(coalesce(p_name, ''), '\s+', '', 'g');
begin
  if coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') <> 'admin' then
    raise exception 'admin_required';
  end if;

  if normalized_name !~ '^[0-9]+기$' then
    raise exception 'invalid_cohort_name';
  end if;

  if p_starts_at is null or (p_ends_at is not null and p_ends_at < p_starts_at) then
    raise exception 'invalid_cohort_schedule';
  end if;

  insert into public.cohorts (name, starts_at, ends_at, application_open)
  values (normalized_name, p_starts_at, p_ends_at, coalesce(p_application_open, false))
  on conflict (name) do update set
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    application_open = excluded.application_open;
end;
$$;

revoke all on function public.admin_save_cohort(text, timestamptz, timestamptz, boolean) from public, anon;
grant execute on function public.admin_save_cohort(text, timestamptz, timestamptz, boolean) to authenticated;
