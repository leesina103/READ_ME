-- 그룹 배정은 운영자만, 요일 희망은 회원 본인만 변경한다.
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_talk_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from auth.users where id = auth.uid() and raw_app_meta_data ->> 'role' = 'admin'
  );
$$;
revoke all on function private.is_talk_admin() from public, anon;
grant execute on function private.is_talk_admin() to authenticated;

create table public.talk_groups (
  id uuid primary key default gen_random_uuid(),
  cohort text not null references public.cohorts(name) on update cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  unique (id, cohort), unique (cohort, name)
);
create table public.talk_group_members (
  user_id uuid not null,
  cohort text not null,
  group_id uuid not null,
  primary key (user_id, cohort),
  foreign key (user_id, cohort) references public.member_cohorts(user_id, cohort) on update cascade on delete cascade,
  foreign key (group_id, cohort) references public.talk_groups(id, cohort) on update cascade on delete cascade
);
create index talk_group_members_group_idx on public.talk_group_members(group_id);
create table public.talk_meetings (
  group_id uuid not null references public.talk_groups(id) on delete cascade,
  week_number smallint not null check (week_number in (1,3,5,7)),
  starts_at timestamptz not null,
  primary key (group_id, week_number)
);
create table public.talk_day_preferences (
  user_id uuid not null,
  cohort text not null,
  weekday smallint not null check (weekday between 0 and 6),
  primary key (user_id, cohort),
  foreign key (user_id, cohort) references public.member_cohorts(user_id, cohort) on update cascade on delete cascade
);

alter table public.talk_groups enable row level security;
alter table public.talk_group_members enable row level security;
alter table public.talk_meetings enable row level security;
alter table public.talk_day_preferences enable row level security;
revoke all on public.talk_groups, public.talk_group_members, public.talk_meetings, public.talk_day_preferences from anon, authenticated;
grant select, insert, update, delete on public.talk_groups, public.talk_group_members, public.talk_meetings to authenticated;
grant select, insert, update on public.talk_day_preferences to authenticated;

create policy "운영자 그룹 관리" on public.talk_groups for all to authenticated
  using ((select private.is_talk_admin())) with check ((select private.is_talk_admin()));
create policy "운영자 배정 관리" on public.talk_group_members for all to authenticated
  using ((select private.is_talk_admin())) with check ((select private.is_talk_admin()));
create policy "본인 그룹 배정 조회" on public.talk_group_members for select to authenticated
  using (user_id = (select auth.uid()) and (select public.has_active_membership()));
create policy "본인 그룹 조회" on public.talk_groups for select to authenticated
  using (exists (select 1 from public.talk_group_members m where m.group_id = talk_groups.id and m.user_id = (select auth.uid())));
create policy "운영자 모임 관리" on public.talk_meetings for all to authenticated
  using ((select private.is_talk_admin())) with check ((select private.is_talk_admin()));
create policy "본인 모임 조회" on public.talk_meetings for select to authenticated
  using (exists (select 1 from public.talk_group_members m where m.group_id = talk_meetings.group_id and m.user_id = (select auth.uid())));
create policy "본인 희망 요일 조회" on public.talk_day_preferences for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_talk_admin()));
create policy "본인 희망 요일 추가" on public.talk_day_preferences for insert to authenticated
  with check (user_id = (select auth.uid()) and public.has_active_membership() and not public.is_cohort_ended(cohort)
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.cohort = talk_day_preferences.cohort));
create policy "본인 희망 요일 수정" on public.talk_day_preferences for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.has_active_membership() and not public.is_cohort_ended(cohort)
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.cohort = talk_day_preferences.cohort));

-- 동시 배정에서도 최대 6명을 넘지 않도록 그룹 행을 잠근다. 구성 중에는 4명 미만도 허용한다.
create function private.check_talk_group_capacity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.talk_groups where id = new.group_id for update;
  if (select count(*) from public.talk_group_members where group_id = new.group_id and user_id <> new.user_id) >= 6 then
    raise exception 'talk_group_full';
  end if;
  if not exists (select 1 from public.profiles where id = new.user_id and cohort = new.cohort) then
    raise exception 'current_cohort_required';
  end if;
  return new;
end;
$$;
revoke all on function private.check_talk_group_capacity() from public, anon, authenticated;
create trigger check_talk_group_capacity before insert or update on public.talk_group_members
  for each row execute function private.check_talk_group_capacity();

-- 날짜 경계는 모두 한국 시간이다. 일요일은 0일, 월요일은 6일을 더한다.
create function public.talk_due_at(p_starts_at timestamptz, p_week integer, p_meeting_at timestamptz)
returns timestamptz language sql immutable set search_path = '' as $$
  select case when p_week % 2 = 1 then
    ((p_meeting_at at time zone 'Asia/Seoul')::date - 2 + time '23:59') at time zone 'Asia/Seoul'
  else
    ((p_starts_at at time zone 'Asia/Seoul')::date + (p_week - 1) * 7
      + ((7 - extract(dow from p_starts_at at time zone 'Asia/Seoul')::integer) % 7)
      + time '23:59') at time zone 'Asia/Seoul'
  end;
$$;
revoke all on function public.talk_due_at(timestamptz, integer, timestamptz) from public, anon;
grant execute on function public.talk_due_at(timestamptz, integer, timestamptz) to authenticated;

-- 월요일·화요일 모임도 D-2에 작성할 수 있도록 사전 질문은 모임 7일 전까지 공개한다.
create or replace function public.talk_week_opens_at(target_cohort text, target_week smallint)
returns timestamptz language sql stable security definer set search_path = '' as $$
  select least(c.starts_at + (target_week - 1) * interval '7 days',
    (select s.starts_at - interval '7 days' from public.talk_group_members m
      join public.talk_meetings s on s.group_id = m.group_id
      where m.user_id = auth.uid() and m.cohort = target_cohort and s.week_number = target_week))
  from public.cohorts c where c.name = target_cohort and public.is_cohort_member(target_cohort);
$$;
revoke all on function public.talk_week_opens_at(text, smallint) from public, anon;
grant execute on function public.talk_week_opens_at(text, smallint) to authenticated;

create function public.my_talk_schedule(p_cohort text)
returns table(week_number integer, group_name text, meeting_at timestamptz, due_at timestamptz, opens_at timestamptz, answered boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.has_active_membership() or not public.is_cohort_member(p_cohort) then
    raise exception 'membership_required' using errcode = '42501';
  end if;
  return query
  select w, g.name, s.starts_at, public.talk_due_at(c.starts_at,w,s.starts_at),
    public.talk_week_opens_at(p_cohort,w::smallint),
    exists(select 1 from public.session_answers a where a.cohort=p_cohort and a.week_number=w and a.user_id=auth.uid())
  from public.cohorts c cross join generate_series(1,8) w
  left join public.talk_group_members m on m.cohort=c.name and m.user_id=auth.uid()
  left join public.talk_groups g on g.id=m.group_id
  left join public.talk_meetings s on s.group_id=g.id and s.week_number=w
  where c.name=p_cohort;
end;
$$;
revoke all on function public.my_talk_schedule(text) from public, anon;
grant execute on function public.my_talk_schedule(text) to authenticated;

-- 프로필 표의 본인 조회 정책은 그대로 두고 배정에 필요한 항목만 운영자에게 반환한다.
create function public.admin_talk_members(p_cohort text)
returns table(user_id uuid, display_name text, weekday smallint, group_id uuid)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_talk_admin() then raise exception 'admin_required' using errcode='42501'; end if;
  return query select p.id,p.display_name,d.weekday,m.group_id from public.profiles p
    left join public.talk_day_preferences d on d.user_id=p.id and d.cohort=p.cohort
    left join public.talk_group_members m on m.user_id=p.id and m.cohort=p.cohort
    where p.cohort=p_cohort and p.onboarding_completed_at is not null order by p.display_name,p.id;
end;
$$;
revoke all on function public.admin_talk_members(text) from public, anon;
grant execute on function public.admin_talk_members(text) to authenticated;

-- 그룹이 있는 기수의 사전 질문만 그룹 단위로 공유한다. OUTPUT과 기존 무그룹 기수는 기수 단위다.
create function private.can_read_talk_author(p_cohort text,p_week smallint,p_author uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and public.has_active_membership() and public.is_cohort_member(p_cohort) and (
    p_author=auth.uid() or p_week % 2=0
    or not exists(select 1 from public.talk_groups where cohort=p_cohort)
    or exists(select 1 from public.talk_group_members mine join public.talk_group_members peer
      on peer.group_id=mine.group_id and peer.cohort=mine.cohort
      where mine.user_id=auth.uid() and mine.cohort=p_cohort and peer.user_id=p_author)
  );
$$;
revoke all on function private.can_read_talk_author(text,smallint,uuid) from public, anon;
grant execute on function private.can_read_talk_author(text,smallint,uuid) to authenticated;
drop policy if exists "답변을 남긴 활성 기수원만 같은 주차 답변 조회 가능" on public.session_answers;
create policy "답변을 남긴 활성 기수원만 같은 주차 답변 조회 가능" on public.session_answers for select to authenticated
  using (public.has_answered(cohort,week_number) and private.can_read_talk_author(cohort,week_number,user_id));
create or replace function public.session_answer_count(target_cohort text,target_week smallint)
returns integer language sql stable security definer set search_path = '' as $$
  select count(*)::integer from public.session_answers a where a.cohort=target_cohort and a.week_number=target_week
    and private.can_read_talk_author(a.cohort,a.week_number,a.user_id);
$$;
revoke all on function public.session_answer_count(text,smallint) from public,anon;
grant execute on function public.session_answer_count(text,smallint) to authenticated;
