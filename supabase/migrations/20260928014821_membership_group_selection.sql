-- 신청자는 모임 하나를 선택하고, 운영자 승인 후 가입 시 같은 모임에 연결됩니다.
alter table public.talk_groups
  add column host_name text not null default '' check (char_length(host_name) <= 80),
  add column host_style text not null default '' check (char_length(host_style) <= 600),
  add column venue text not null default '' check (char_length(venue) <= 200),
  add column duration_minutes integer not null default 180 check (duration_minutes between 30 and 480),
  add column application_open boolean not null default false;
alter table public.membership_applications add column group_id uuid;
alter table public.membership_applications add constraint application_group_cohort_fk
  foreign key (group_id, cohort) references public.talk_groups(id, cohort);
alter table public.member_invitations add column group_id uuid;
alter table public.member_invitations add constraint invitation_group_cohort_fk
  foreign key (group_id, cohort) references public.talk_groups(id, cohort);
create index membership_application_group_idx on public.membership_applications(group_id);
create index member_invitation_group_idx on public.member_invitations(group_id);

create function private.talk_reserved_count(p_group uuid)
returns integer language sql stable security definer set search_path = '' as $$
  select ((select count(*) from public.talk_group_members where group_id=p_group)
    + (select count(*) from public.member_invitations where group_id=p_group and claimed_by is null))::integer;
$$;
revoke all on function private.talk_reserved_count(uuid) from public, anon, authenticated;

-- 공개 신청서에는 모집 중인 모임의 안내만 제공하며 회원 명단은 제공하지 않습니다.
create function public.membership_group_options(p_cohort text)
returns table(id uuid, host_name text, host_style text, venue text, duration_minutes integer, meetings jsonb)
language sql stable security definer set search_path = '' as $$
  select g.id,g.host_name,g.host_style,g.venue,g.duration_minutes,
    (select jsonb_agg(jsonb_build_object('week_number',m.week_number,'starts_at',m.starts_at) order by m.week_number)
      from public.talk_meetings m where m.group_id=g.id)
  from public.talk_groups g join public.cohorts c on c.name=g.cohort
  where g.cohort=p_cohort and g.application_open and c.application_open
    and (c.ends_at is null or c.ends_at>now())
    and trim(g.host_name)<>'' and trim(g.host_style)<>'' and trim(g.venue)<>''
    and (select count(*) from public.talk_meetings m where m.group_id=g.id and m.starts_at>now())=4
    and private.talk_reserved_count(g.id)<6
  order by (select min(m.starts_at) from public.talk_meetings m where m.group_id=g.id),g.host_name,g.id;
$$;
revoke all on function public.membership_group_options(text) from public;
grant execute on function public.membership_group_options(text) to anon, authenticated;

drop function public.submit_membership_application(text,text,text,integer,text);
create function public.submit_membership_application(p_name text,p_email text,p_cohort text,p_birth_year integer,p_group_id uuid,p_message text default '')
returns void language plpgsql security definer set search_path = '' as $$
begin
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
  insert into public.membership_applications(name,email,cohort,birth_year,group_id,message)
    values(trim(p_name),lower(trim(p_email)),p_cohort,p_birth_year,p_group_id,trim(coalesce(p_message,'')));
exception when unique_violation then raise exception 'application_already_submitted';
end;
$$;
revoke all on function public.submit_membership_application(text,text,text,integer,uuid,text) from public;
grant execute on function public.submit_membership_application(text,text,text,integer,uuid,text) to anon, authenticated;

-- 승인 후 아직 가입하지 않은 사람의 자리도 정원에 포함합니다.
create or replace function private.check_talk_group_capacity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.talk_groups where id=new.group_id for update;
  if (select count(*) from public.talk_group_members where group_id=new.group_id and user_id<>new.user_id)
    + (select count(*) from public.member_invitations where group_id=new.group_id and claimed_by is null)>=6
    then raise exception 'talk_group_full'; end if;
  if not exists(select 1 from public.profiles where id=new.user_id and cohort=new.cohort)
    then raise exception 'current_cohort_required'; end if;
  return new;
end;
$$;

create function private.connect_invitation_talk_group()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.group_id is not null then
    perform 1 from public.talk_groups where id=new.group_id for update;
    if new.claimed_by is null then
      if (select count(*) from public.talk_group_members where group_id=new.group_id)
        + (select count(*) from public.member_invitations where group_id=new.group_id and claimed_by is null and id<>new.id)>=6
        then raise exception 'talk_group_full'; end if;
    else
      insert into public.talk_group_members(user_id,cohort,group_id) values(new.claimed_by,new.cohort,new.group_id)
        on conflict(user_id,cohort) do update set group_id=excluded.group_id;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.connect_invitation_talk_group() from public, anon, authenticated;
create trigger connect_invitation_talk_group after insert or update of group_id,claimed_by on public.member_invitations
  for each row execute function private.connect_invitation_talk_group();

create or replace function public.review_membership_application(p_application_id bigint,p_decision text,p_admin_note text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare
  application public.membership_applications%rowtype;
  invitation public.member_invitations%rowtype;
begin
  if not private.is_talk_admin() then raise exception 'admin_required'; end if;
  if p_decision is null or p_decision not in ('approved','rejected') or char_length(coalesce(p_admin_note,''))>1000
    then raise exception 'invalid_review_content'; end if;
  select * into application from public.membership_applications where id=p_application_id for update;
  if not found then raise exception 'application_not_found'; end if;
  if application.status<>'pending' then raise exception 'application_already_reviewed'; end if;
  if p_decision='approved' then
    -- 기존 선택 없는 신청은 종전처럼 승인할 수 있습니다. 신규 신청은 저장 단계에서 필수입니다.
    if application.group_id is not null then
      perform 1 from public.talk_groups g join public.cohorts c on c.name=g.cohort
        where g.id=application.group_id and (c.ends_at is null or c.ends_at>now()) for update of g;
      if not found then raise exception 'application_group_unavailable'; end if;
    end if;
    select * into invitation from public.member_invitations where lower(trim(email))=lower(trim(application.email)) for update;
    if found then
      if invitation.claimed_by is not null then
        update public.profiles set cohort=application.cohort where id=invitation.claimed_by;
        if not found then raise exception 'member_profile_not_found'; end if;
      elsif invitation.claimed_at is not null then raise exception 'invitation_claim_invalid'; end if;
      update public.member_invitations set name=application.name,cohort=application.cohort,group_id=application.group_id where id=invitation.id;
    else
      insert into public.member_invitations(name,email,cohort,group_id) values(application.name,application.email,application.cohort,application.group_id);
    end if;
  end if;
  update public.membership_applications set status=p_decision,admin_note=trim(coalesce(p_admin_note,'')),
    reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=application.id;
end;
$$;

drop function public.admin_list_membership_applications();
create function public.admin_list_membership_applications()
returns table(id bigint,name text,email text,cohort text,birth_year smallint,message text,status text,admin_note text,
  created_at timestamptz,reviewed_at timestamptz,group_id uuid,host_name text,venue text,duration_minutes integer,meetings jsonb)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_talk_admin() then raise exception 'admin_required'; end if;
  return query select a.id,a.name,a.email,a.cohort,a.birth_year,a.message,a.status,a.admin_note,a.created_at,a.reviewed_at,
    a.group_id,g.host_name,g.venue,g.duration_minutes,
    (select jsonb_agg(jsonb_build_object('week_number',m.week_number,'starts_at',m.starts_at) order by m.week_number) from public.talk_meetings m where m.group_id=g.id)
    from public.membership_applications a left join public.talk_groups g on g.id=a.group_id
    where a.archived_at is null order by case a.status when 'pending' then 0 when 'approved' then 1 else 2 end,a.created_at desc;
end;
$$;
revoke all on function public.admin_list_membership_applications() from public,anon;
grant execute on function public.admin_list_membership_applications() to authenticated;

create function public.admin_talk_group_capacity(p_cohort text)
returns table(group_id uuid,reserved_count integer)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_talk_admin() then raise exception 'admin_required'; end if;
  return query select g.id,private.talk_reserved_count(g.id) from public.talk_groups g where g.cohort=p_cohort;
end;
$$;
revoke all on function public.admin_talk_group_capacity(text) from public,anon;
grant execute on function public.admin_talk_group_capacity(text) to authenticated;
