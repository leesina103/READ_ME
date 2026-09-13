update public.community_posts
set external_url = null
where external_url is not null
  and (
    category <> 'writing'
    or char_length(external_url) > 1000
    or external_url !~* '^https?://[^[:space:]]+$'
  );

alter table public.community_posts
  drop constraint if exists community_posts_external_url_check;

alter table public.community_posts
  add constraint community_posts_external_url_check
  check (
    external_url is null
    or (
      category = 'writing'
      and char_length(external_url) <= 1000
      and external_url ~* '^https?://[^[:space:]]+$'
    )
  );

create or replace function public.create_community_post(
  p_category text,
  p_title text,
  p_content text,
  p_book_title text,
  p_book_author text,
  p_external_url text
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := (select auth.uid());
  member_display_name text;
  member_cohort text;
  normalized_category text := trim(coalesce(p_category, ''));
  normalized_title text := trim(coalesce(p_title, ''));
  normalized_content text := trim(coalesce(p_content, ''));
  normalized_book_title text := nullif(trim(coalesce(p_book_title, '')), '');
  normalized_book_author text := nullif(trim(coalesce(p_book_author, '')), '');
  normalized_external_url text := nullif(trim(coalesce(p_external_url, '')), '');
  created_post_id bigint;
begin
  if current_user_id is null or not public.has_active_membership() then
    raise exception 'active_membership_required' using errcode = '42501';
  end if;

  if normalized_category not in ('books', 'writing')
    or char_length(normalized_title) not between 2 and 120
    or char_length(normalized_content) not between 2 and 5000 then
    raise exception 'invalid_post_content' using errcode = '22023';
  end if;

  if normalized_category = 'books'
    and (
      char_length(coalesce(normalized_book_title, '')) not between 1 and 160
      or char_length(coalesce(normalized_book_author, '')) not between 1 and 100
    ) then
    raise exception 'book_information_required' using errcode = '22023';
  end if;

  if normalized_category = 'writing'
    and normalized_external_url is not null
    and (char_length(normalized_external_url) > 1000 or normalized_external_url !~* '^https?://[^[:space:]]+$') then
    raise exception 'invalid_external_url' using errcode = '22023';
  end if;

  select profile.display_name, profile.cohort
  into member_display_name, member_cohort
  from public.profiles as profile
  where profile.id = current_user_id;

  if member_display_name is null or member_cohort is null then
    raise exception 'member_profile_required' using errcode = '42501';
  end if;

  insert into public.community_posts (
    user_id, display_name, cohort, category, title, content,
    book_title, book_author, external_url
  ) values (
    current_user_id, member_display_name, member_cohort, normalized_category,
    normalized_title, normalized_content,
    case when normalized_category = 'books' then normalized_book_title else null end,
    case when normalized_category = 'books' then normalized_book_author else null end,
    case when normalized_category = 'writing' then normalized_external_url else null end
  )
  returning id into created_post_id;

  return created_post_id;
end;
$$;

create or replace function public.update_community_post(
  p_post_id bigint,
  p_category text,
  p_title text,
  p_content text,
  p_book_title text,
  p_book_author text,
  p_external_url text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := (select auth.uid());
  normalized_category text := trim(coalesce(p_category, ''));
  normalized_title text := trim(coalesce(p_title, ''));
  normalized_content text := trim(coalesce(p_content, ''));
  normalized_book_title text := nullif(trim(coalesce(p_book_title, '')), '');
  normalized_book_author text := nullif(trim(coalesce(p_book_author, '')), '');
  normalized_external_url text := nullif(trim(coalesce(p_external_url, '')), '');
begin
  if current_user_id is null or not public.has_active_membership() then
    raise exception 'active_membership_required' using errcode = '42501';
  end if;

  if normalized_category not in ('books', 'writing')
    or char_length(normalized_title) not between 2 and 120
    or char_length(normalized_content) not between 2 and 5000 then
    raise exception 'invalid_post_content' using errcode = '22023';
  end if;

  if normalized_category = 'books'
    and (
      char_length(coalesce(normalized_book_title, '')) not between 1 and 160
      or char_length(coalesce(normalized_book_author, '')) not between 1 and 100
    ) then
    raise exception 'book_information_required' using errcode = '22023';
  end if;

  if normalized_category = 'writing'
    and normalized_external_url is not null
    and (char_length(normalized_external_url) > 1000 or normalized_external_url !~* '^https?://[^[:space:]]+$') then
    raise exception 'invalid_external_url' using errcode = '22023';
  end if;

  update public.community_posts
  set category = normalized_category,
      title = normalized_title,
      content = normalized_content,
      book_title = case when normalized_category = 'books' then normalized_book_title else null end,
      book_author = case when normalized_category = 'books' then normalized_book_author else null end,
      external_url = case when normalized_category = 'writing' then normalized_external_url else null end,
      updated_at = now()
  where id = p_post_id and user_id = current_user_id;

  if not found then
    raise exception 'post_not_found_or_forbidden' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.create_community_post(text, text, text, text, text, text) from public, anon;
revoke all on function public.update_community_post(bigint, text, text, text, text, text, text) from public, anon;
grant execute on function public.create_community_post(text, text, text, text, text, text) to authenticated;
grant execute on function public.update_community_post(bigint, text, text, text, text, text, text) to authenticated;
