-- 두 소개 화면은 작성된 소개만 읽고, 미작성 현황은 운영자 명단에서 따로 다룬다.
create or replace function private.has_visible_member_introduction(
  member_id uuid, introduction_word text, bio text, cohort_message text
) returns boolean
language sql immutable set search_path = ''
as $$
  select member_id <> 'fda730c9-a5d1-420f-8177-9a6e8fcd9f44'::uuid
    and concat_ws('', introduction_word, bio, cohort_message) ~ '[^[:space:]]';
$$;
revoke all on function private.has_visible_member_introduction(uuid,text,text,text) from public, anon, authenticated;

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
  order by peer.display_name, peer.id;
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
    order by p.display_name, p.id;
end;
$$;
