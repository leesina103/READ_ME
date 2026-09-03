-- 프로필 닉네임을 작성 당시 사본을 보관하는 회원 콘텐츠에도 동기화한다.
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

    update public.session_answers
    set display_name = new.display_name
    where user_id = new.id
      and display_name is distinct from new.display_name;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_profile_display_name() from public, anon, authenticated;

drop trigger if exists sync_profile_display_name on public.profiles;
create trigger sync_profile_display_name
  after update of display_name on public.profiles
  for each row execute procedure public.sync_profile_display_name();

-- 마이그레이션 적용 전에 작성된 글과 답변도 현재 프로필 닉네임으로 맞춘다.
update public.community_posts as post
set display_name = profile.display_name
from public.profiles as profile
where post.user_id = profile.id
  and post.display_name is distinct from profile.display_name;

update public.session_answers as answer
set display_name = profile.display_name
from public.profiles as profile
where answer.user_id = profile.id
  and answer.display_name is distinct from profile.display_name;
