-- 가입 신청서에서 출생연도를 받아 운영자가 기수 연령 구성을 참고할 수 있게 합니다.
alter table public.membership_applications
  add column if not exists birth_year smallint
  check (birth_year between 1900 and 2100);

-- 신청 저장 함수: 출생연도 인자를 추가하고 이전 서명은 제거합니다.
drop function if exists public.submit_membership_application(text, text, text, text);

create or replace function public.submit_membership_application(
  p_name text,
  p_email text,
  p_cohort text,
  p_birth_year integer,
  p_message text default ''
)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if char_length(trim(p_name)) not between 2 and 30
    or char_length(trim(p_email)) not between 3 and 320
    or trim(p_email) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_birth_year is null
    or p_birth_year not between 1900 and extract(year from now())::integer
    or char_length(coalesce(p_message, '')) > 1000 then
    raise exception 'invalid_application_content';
  end if;

  if not exists (
    select 1
    from public.cohorts as cohort
    where cohort.name = trim(p_cohort)
      and cohort.application_open
  ) then
    raise exception 'membership_application_closed';
  end if;

  insert into public.membership_applications (name, email, cohort, birth_year, message)
  values (trim(p_name), lower(trim(p_email)), trim(p_cohort), p_birth_year, trim(coalesce(p_message, '')));
exception
  when unique_violation then
    null;
end;
$$;

revoke all on function public.submit_membership_application(text, text, text, integer, text) from public;
grant execute on function public.submit_membership_application(text, text, text, integer, text) to anon, authenticated;

-- 관리자 목록 조회: 반환 컬럼이 바뀌므로 함수를 다시 만듭니다.
drop function if exists public.admin_list_membership_applications();

create function public.admin_list_membership_applications()
returns table (
  id bigint,
  name text,
  email text,
  cohort text,
  birth_year smallint,
  message text,
  status text,
  admin_note text,
  created_at timestamptz,
  reviewed_at timestamptz
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
    application.id,
    application.name,
    application.email,
    application.cohort,
    application.birth_year,
    application.message,
    application.status,
    application.admin_note,
    application.created_at,
    application.reviewed_at
  from public.membership_applications as application
  where application.archived_at is null
  order by
    case application.status when 'pending' then 0 when 'approved' then 1 else 2 end,
    application.created_at desc;
end;
$$;

revoke all on function public.admin_list_membership_applications() from public, anon;
grant execute on function public.admin_list_membership_applications() to authenticated;
