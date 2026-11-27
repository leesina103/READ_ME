-- 기존 회원 화면과 운영 도구는 첫 질문의 답변을 계속 읽을 수 있다.
alter table public.session_answers rename to talk_question_answers;
alter table public.talk_question_answers add column question_number smallint not null default 1 check (question_number between 1 and 4);
alter table public.talk_question_answers drop constraint session_answers_cohort_week_number_user_id_key,
  add unique (cohort,week_number,user_id,question_number);
create view public.session_answers with (security_invoker=true) as
  select id,cohort,week_number,user_id,display_name,content,created_at,updated_at
  from public.talk_question_answers where question_number=1;
revoke all on public.session_answers from public,anon,authenticated;
grant select on public.session_answers to authenticated,service_role;

-- 각 기수의 첫 질문은 기존 주제 자료에서 가져온다. 나머지는 고정 번호로 관리한다.
create table public.talk_followup_questions (
  cohort text not null references public.cohorts(name) on update cascade on delete cascade,
  week_number smallint not null check (week_number between 1 and 8),
  question_number smallint not null check (question_number between 2 and 4),
  prompt text not null check (length(trim(prompt))>0),
  primary key(cohort,week_number,question_number)
);
alter table public.talk_followup_questions enable row level security;
revoke all on public.talk_followup_questions from public,anon,authenticated;
grant select on public.talk_followup_questions to authenticated,service_role;
create policy "참여 기수 질문 조회" on public.talk_followup_questions for select to authenticated
  using (public.can_staff_read_cohort(cohort) or (public.has_active_membership() and public.is_cohort_member(cohort)
    and (public.is_talk_week_open(cohort,week_number) or public.is_cohort_ended(cohort)
      or exists(select 1 from public.profiles p where p.id=auth.uid() and p.cohort is distinct from talk_followup_questions.cohort))));

create function private.seed_talk_questions(target_cohort text) returns void
language sql set search_path='' as $$
  insert into public.talk_followup_questions
  select target_cohort,w,n,case
    when w=7 and n=4 then '이번 기수의 책들을 함께 떠올려 보세요. 처음 모였을 때와 지금, 같은 질문에 다르게 답하고 싶은 부분이 있나요?'
    when w%2=1 and n=2 then '책을 읽으며 내 경험과 겹쳐 보인 대목이 있었나요? 어떤 장면이 떠올랐나요?'
    when w%2=1 and n=3 then '이번 모임에서 동료들에게 직접 묻고 싶은 질문은 무엇인가요?'
    when n=2 then '지난 모임에서 들은 동료의 이야기 중 아직 마음에 남아 있는 말은 무엇인가요?'
    else '모임 뒤 일상에서 그 이야기가 떠오른 순간이 있었나요? 해본 일이나 망설였던 일을 들려주세요.'
  end from generate_series(1,8) w cross join lateral generate_series(2,case when w=7 then 4 else 3 end) n;
$$;
select private.seed_talk_questions(name) from public.cohorts;

update public.talk_followup_questions set prompt=case week_number
  when 1 then '배려하려고 한 일이 상대에게는 간섭이었을 수도 있겠다고 느낀 적이 있나요? 책에서 떠오르는 대목과 함께 들려주세요.'
  when 3 then '누군가에게 인정받고 싶어서 내 뜻과 다른 선택을 했던 적이 있나요? 그때 무엇이 가장 마음에 걸렸나요?'
  when 5 then '상대의 말을 듣다가 내 대답을 먼저 준비했던 순간이 있나요? 책을 읽고 다시 떠올려 본 대화가 궁금해요.'
  when 7 then '가까운 사람에게도 혼자만의 시간이 필요하다고 느낀 적이 있나요? 그때 서로의 마음을 어떻게 확인했나요?'
end where cohort='1기' and week_number in (1,3,5,7) and question_number=2;
create function private.seed_new_cohort_questions() returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform private.seed_talk_questions(new.name);
  return new;
end;
$$;
create trigger seed_talk_questions after insert on public.cohorts for each row execute function private.seed_new_cohort_questions();
revoke all on function private.seed_new_cohort_questions(), private.seed_talk_questions(text) from public,anon,authenticated;

create function private.answered_talk_question(p_cohort text,p_week smallint,p_question smallint)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.talk_question_answers a where a.user_id=auth.uid()
    and a.cohort=p_cohort and a.week_number=p_week and a.question_number=p_question);
$$;
revoke all on function private.answered_talk_question(text,smallint,smallint) from public,anon;
grant execute on function private.answered_talk_question(text,smallint,smallint) to authenticated;
drop policy "답변을 남긴 활성 기수원만 같은 주차 답변 조회 가능" on public.talk_question_answers;
create policy "같은 질문에 답한 동료만 조회" on public.talk_question_answers for select to authenticated using (
  private.can_read_talk_author(cohort,week_number,user_id) and private.answered_talk_question(cohort,week_number,question_number));

create or replace function public.save_talk_question_answer(target_cohort text, target_week smallint, target_question smallint, target_content text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := (select auth.uid());
  member_cohort text;
  member_display_name text;
  normalized_content text := trim(target_content);
begin
  if current_user_id is null or not public.has_active_membership() then
    raise exception 'active_membership_required' using errcode = '42501';
  end if;

  if target_week is null or target_week not between 1 and 8 then
    raise exception 'invalid_week' using errcode = '22023';
  end if;

  if normalized_content is null or char_length(normalized_content) not between 2 and 2000 then
    raise exception 'invalid_content_length' using errcode = '22023';
  end if;

  select profile.cohort, profile.display_name
  into member_cohort, member_display_name
  from public.profiles as profile
  where profile.id = current_user_id;

  if member_cohort is distinct from target_cohort or member_cohort is null or member_display_name is null then
    raise exception 'member_cohort_required' using errcode = '42501';
  end if;

  if public.is_cohort_ended(member_cohort) then
    raise exception 'cohort_ended' using errcode = '42501';
  end if;

  if not public.is_talk_week_open(member_cohort, target_week) then
    raise exception 'week_not_open' using errcode = '42501';
  end if;

  if target_question is null or (target_question <> 1 and not exists (
    select 1 from public.talk_followup_questions q where q.cohort=member_cohort
      and q.week_number=target_week and q.question_number=target_question for key share
  )) then
    raise exception 'invalid_question' using errcode='22023';
  end if;

  insert into public.talk_question_answers (
    question_number,
    cohort,
    week_number,
    user_id,
    display_name,
    content,
    updated_at
  )
  values (
    target_question,
    member_cohort,
    target_week,
    current_user_id,
    member_display_name,
    normalized_content,
    now()
  )
  on conflict (cohort, week_number, user_id, question_number)
  do update set
    display_name = excluded.display_name,
    content = excluded.content,
    updated_at = now();
end;
$$;

revoke all on function public.save_talk_question_answer(text, smallint, smallint, text) from public, anon;
grant execute on function public.save_talk_question_answer(text, smallint, smallint, text) to authenticated;

-- 이전 화면에서 보내는 답변은 계속 첫 질문에 연결한다.
create or replace function public.save_session_answer(target_week smallint,target_content text) returns void
language sql security definer set search_path='' as $$
  select public.save_talk_question_answer((select cohort from public.profiles where id=auth.uid()),target_week,1::smallint,target_content);
$$;

-- 모든 질문에 답한 주차만 운영 알림과 회원 서재에서 완료로 표시한다.
create view public.completed_talk_weeks with (security_invoker=true) as
  select a.user_id,a.cohort,a.week_number from public.talk_question_answers a
  group by a.user_id,a.cohort,a.week_number
  having count(*) = 1+(select count(*) from public.talk_followup_questions q where q.cohort=a.cohort and q.week_number=a.week_number);
revoke all on public.completed_talk_weeks from public,anon,authenticated;
grant select on public.completed_talk_weeks to service_role;
create or replace function public.my_talk_schedule(p_cohort text)
returns table(week_number integer,group_name text,meeting_at timestamptz,due_at timestamptz,opens_at timestamptz,answered boolean)
language plpgsql stable security definer set search_path='' as $$
begin
  if auth.uid() is null or not public.has_active_membership() or not public.is_cohort_member(p_cohort) then raise exception 'membership_required' using errcode='42501'; end if;
  return query select w,g.name,case when w%2=1 then s.starts_at else null::timestamptz end,
    public.talk_due_at(null,w,s.starts_at),public.talk_week_opens_at(p_cohort,w::smallint),
    exists(select 1 from public.completed_talk_weeks a where a.cohort=p_cohort and a.week_number=w and a.user_id=auth.uid())
    from public.cohorts c cross join generate_series(1,8) w
    left join public.talk_groups g on g.id=private.member_view_group(c.name)
    left join public.talk_meetings s on s.group_id=g.id and s.week_number=case when w%2=1 then w else w-1 end where c.name=p_cohort;
end;
$$;

create or replace function public.guide_group_answers(p_group uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.can_guide(p_group) then raise exception 'guide_required' using errcode='42501'; end if;
  return (
    select coalesce(jsonb_agg(jsonb_build_object('week', w.week, 'opens_at', w.opens_at, 'answers', (
      select coalesce(jsonb_agg(jsonb_build_object('question_number', a.question_number, 'nickname', p.display_name, 'content', a.content) order by a.question_number, a.created_at), '[]')
      from public.talk_question_answers a
      join public.talk_group_members tm on tm.user_id = a.user_id and tm.cohort = a.cohort
      join public.profiles p on p.id = a.user_id
      where tm.group_id = p_group and a.week_number = w.week
    )) order by w.week), '[]')
    from (select week, private.group_talk_week_opens_at(p_group, week) as opens_at
          from generate_series(1, 8) week) w
    where w.opens_at <= now()
  );
end;
$$;

create or replace function public.sync_profile_display_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.display_name is distinct from old.display_name then
    update public.community_posts
    set display_name = new.display_name
    where user_id = new.id
      and display_name is distinct from new.display_name;

    update public.talk_question_answers
    set display_name = new.display_name
    where user_id = new.id
      and display_name is distinct from new.display_name;
  end if;

  return new;
end;
$$;
