-- 로그인한 회원이 현재 기수의 열린 질문에 남긴 자신의 답변만 삭제한다.
create function public.delete_my_talk_answer(target_cohort text, target_week smallint, target_question smallint)
returns void language plpgsql security definer set search_path='' as $$
declare
  member_id uuid := auth.uid();
begin
  if member_id is null or not public.has_active_membership() or not exists (
    select 1 from public.profiles where id=member_id and cohort=target_cohort
  ) then
    raise exception 'active_membership_required' using errcode='42501';
  end if;
  if public.is_cohort_ended(target_cohort) then
    raise exception 'cohort_ended' using errcode='42501';
  end if;
  if not public.is_talk_week_open(target_cohort,target_week) then
    raise exception 'week_not_open' using errcode='42501';
  end if;
  delete from public.talk_question_answers
  where user_id=member_id and cohort=target_cohort and week_number=target_week and question_number=target_question;
end;
$$;
revoke all on function public.delete_my_talk_answer(text,smallint,smallint) from public,anon;
grant execute on function public.delete_my_talk_answer(text,smallint,smallint) to authenticated;
