create or replace function public.admin_missing_introductions(p_cohort text default null)
returns table (cohort text, member_id uuid, name text, display_name text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  return query
    select distinct on (p.cohort, p.id) p.cohort, p.id, i.name, p.display_name
    from public.profiles p
    join auth.users u on u.id = p.id
    join public.memberships m on m.user_id = p.id and m.status = 'active'
    join public.cohorts c on c.name = p.cohort
    left join public.member_invitations i on i.claimed_by = p.id
    where (p_cohort is null or p.cohort = p_cohort)
      and p.onboarding_completed_at is not null
      and (c.ends_at is null or c.ends_at > now())
      and coalesce(u.raw_app_meta_data ->> 'role', '') <> 'admin'
      and p.id <> 'fda730c9-a5d1-420f-8177-9a6e8fcd9f44'::uuid
      and lower(u.email) not in ('test@example.com', 'readmebook.team+signup-resume-1124@gmail.com',
        'readmebook.team+signup-test@gmail.com', 'readmebook.kr+signup-button-1124@gmail.com',
        'readmebook.kr+design-final-1124@gmail.com', 'readmebook.kr+design-confirm-1124@gmail.com')
      and not private.has_visible_member_introduction(p.id, p.introduction_word, p.bio, p.cohort_message)
    order by p.cohort, p.id, i.claimed_at desc nulls last;
end;
$$;

revoke all on function public.admin_missing_introductions(text) from public, anon;
grant execute on function public.admin_missing_introductions(text) to authenticated;
