alter table public.profiles add column introduction_published_at timestamptz;

-- 기존 소개에는 최초 작성 시각이 없어 빈 값으로 두고 기존 표시 순서를 유지한다.
create function private.stamp_introduction_publication()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if concat_ws('', new.introduction_word, new.bio, new.cohort_message) !~ '[^[:space:]]' then
    new.introduction_published_at := null;
  elsif tg_op = 'INSERT' then
    new.introduction_published_at := clock_timestamp();
  elsif concat_ws('', old.introduction_word, old.bio, old.cohort_message) ~ '[^[:space:]]' then
    new.introduction_published_at := old.introduction_published_at;
  else
    new.introduction_published_at := clock_timestamp();
  end if;
  return new;
end;
$$;
revoke all on function private.stamp_introduction_publication() from public, anon, authenticated;
create trigger stamp_introduction_publication
before insert or update of introduction_word, bio, cohort_message, introduction_published_at on public.profiles
for each row execute function private.stamp_introduction_publication();

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
  order by peer.introduction_published_at desc nulls last, peer.display_name, peer.id;
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
    order by p.introduction_published_at desc nulls last, p.display_name, p.id;
end;
$$;
