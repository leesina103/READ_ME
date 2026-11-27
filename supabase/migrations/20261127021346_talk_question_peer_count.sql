-- 답변을 쓰기 전에는 같은 질문에 답한 동료 수만 제공한다.
create function public.talk_question_peer_count(target_cohort text, target_week smallint, target_question smallint)
returns integer language sql stable security definer set search_path='' as $$
  select count(*)::integer from public.talk_question_answers a
  where a.cohort=target_cohort and a.week_number=target_week and a.question_number=target_question
    and a.user_id <> (select auth.uid())
    and public.has_active_membership() and public.is_cohort_member(target_cohort)
    and (public.is_talk_week_open(target_cohort,target_week) or public.is_cohort_ended(target_cohort)
      or exists (select 1 from public.profiles p where p.id=auth.uid() and p.cohort is distinct from target_cohort));
$$;
revoke all on function public.talk_question_peer_count(text,smallint,smallint) from public,anon;
grant execute on function public.talk_question_peer_count(text,smallint,smallint) to authenticated;
