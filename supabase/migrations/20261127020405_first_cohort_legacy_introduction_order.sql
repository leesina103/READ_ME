-- 최초 작성 시각이 없는 1기 소개 중 첫 작성자로 확인된 회원만 마지막에 둔다.
create or replace function public.list_member_directory()
returns table (cohort text, user_id uuid, display_name text, bio text, cohort_message text, introduction_word text)
language sql stable security definer set search_path = ''
as $$
  select peer.cohort, peer.id, peer.display_name, peer.bio, peer.cohort_message, peer.introduction_word
  from public.profiles mine
  join public.profiles peer on peer.cohort = mine.cohort
  where mine.id = (select auth.uid()) and public.has_active_membership()
    and mine.onboarding_completed_at is not null and peer.onboarding_completed_at is not null
    and private.has_visible_member_introduction(peer.id, peer.introduction_word, peer.bio, peer.cohort_message)
  order by peer.introduction_published_at desc nulls last,
    (peer.introduction_published_at is null and peer.cohort = '1기' and peer.id = '6284cf4d-0166-4345-8ca7-50804a01d5b3'::uuid), peer.display_name, peer.id;
$$;

create or replace function public.staff_member_directory(p_cohort text)
returns table (cohort text, user_id uuid, display_name text, bio text, cohort_message text, introduction_word text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.staff_cohort(p_cohort) then
    raise exception 'cohort_access_required' using errcode='42501';
  end if;
  return query
    select p.cohort, p.id, p.display_name, p.bio, p.cohort_message, p.introduction_word
    from public.profiles p
    where p.cohort = p_cohort and p.onboarding_completed_at is not null
      and private.has_visible_member_introduction(p.id, p.introduction_word, p.bio, p.cohort_message)
    order by p.introduction_published_at desc nulls last,
    (p.introduction_published_at is null and p.cohort = '1기' and p.id = '6284cf4d-0166-4345-8ca7-50804a01d5b3'::uuid), p.display_name, p.id;
end;
$$;
