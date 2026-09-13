alter table public.cohorts
  add column if not exists application_open boolean not null default false;

-- 현재 공개 중인 신청서와 DB의 접수 상태를 맞춥니다.
update public.cohorts
set application_open = true
where name = '1기';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'membership_applications_email_format_check'
      and conrelid = 'public.membership_applications'::regclass
  ) then
    alter table public.membership_applications
      add constraint membership_applications_email_format_check
      check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
      not valid;
  end if;
end;
$$;

create or replace function public.submit_membership_application(
  p_name text,
  p_email text,
  p_cohort text,
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

  insert into public.membership_applications (name, email, cohort, message)
  values (trim(p_name), lower(trim(p_email)), trim(p_cohort), trim(coalesce(p_message, '')));
exception
  when unique_violation then
    null;
end;
$$;

revoke all on function public.submit_membership_application(text, text, text, text) from public;
grant execute on function public.submit_membership_application(text, text, text, text) to anon, authenticated;
