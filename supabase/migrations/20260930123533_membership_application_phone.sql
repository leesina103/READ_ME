-- 기존 신청은 전화번호가 없어도 보존하고, 새 신청에는 전화번호를 필수로 받습니다.
-- 앱 배포와 함께 적용합니다. 기존 인자만 받는 신청 함수는 제거합니다.
alter table public.membership_applications add column phone text
  check (phone is null or phone ~ '^01(0|1|6|7|8|9)[0-9]{7,8}$');

drop function public.submit_membership_application(text,text,text,integer,uuid,text);
create function public.submit_membership_application(p_name text,p_email text,p_cohort text,p_birth_year integer,p_group_id uuid,p_phone text,p_message text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare
  normalized_phone text := regexp_replace(coalesce(p_phone,''), '[^0-9]', '', 'g');
begin
  if normalized_phone !~ '^01(0|1|6|7|8|9)[0-9]{7,8}$' then raise exception 'invalid_application_phone'; end if;
  if p_name is null or p_email is null or char_length(trim(p_name)) not between 2 and 30
    or char_length(trim(p_email)) not between 3 and 320
    or trim(p_email) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_birth_year is null or p_birth_year not between 1900 and extract(year from now())::integer
    or char_length(coalesce(p_message,''))>1000 then raise exception 'invalid_application_content'; end if;
  perform 1 from public.talk_groups where id=p_group_id for update;
  if p_group_id is null or not exists(select 1 from public.membership_group_options(p_cohort) where id=p_group_id)
    then raise exception 'application_group_unavailable'; end if;
  if exists(select 1 from public.membership_applications where lower(trim(email))=lower(trim(p_email))
    and cohort=p_cohort and status in ('pending','approved')) then raise exception 'application_already_submitted'; end if;
  insert into public.membership_applications(name,email,cohort,birth_year,group_id,phone,message)
    values(trim(p_name),lower(trim(p_email)),p_cohort,p_birth_year,p_group_id,normalized_phone,trim(coalesce(p_message,'')));
exception when unique_violation then raise exception 'application_already_submitted';
end;
$$;
revoke all on function public.submit_membership_application(text,text,text,integer,uuid,text,text) from public;
grant execute on function public.submit_membership_application(text,text,text,integer,uuid,text,text) to anon, authenticated;


drop function public.admin_list_membership_applications();
create function public.admin_list_membership_applications()
returns table(id bigint,name text,email text,phone text,cohort text,birth_year smallint,message text,status text,admin_note text,
  created_at timestamptz,reviewed_at timestamptz,group_id uuid,host_name text,venue text,duration_minutes integer,meetings jsonb)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_talk_admin() then raise exception 'admin_required'; end if;
  return query select a.id,a.name,a.email,a.phone,a.cohort,a.birth_year,a.message,a.status,a.admin_note,a.created_at,a.reviewed_at,
    a.group_id,g.host_name,g.venue,g.duration_minutes,
    (select jsonb_agg(jsonb_build_object('week_number',m.week_number,'starts_at',m.starts_at) order by m.week_number) from public.talk_meetings m where m.group_id=g.id)
    from public.membership_applications a left join public.talk_groups g on g.id=a.group_id
    where a.archived_at is null order by case a.status when 'pending' then 0 when 'approved' then 1 else 2 end,a.created_at desc;
end;
$$;
revoke all on function public.admin_list_membership_applications() from public,anon;
grant execute on function public.admin_list_membership_applications() to authenticated;

