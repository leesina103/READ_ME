create or replace function public.review_membership_application(
  p_application_id bigint,
  p_decision text,
  p_admin_note text default ''
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  application public.membership_applications%rowtype;
  invitation public.member_invitations%rowtype;
begin
  if coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') <> 'admin' then
    raise exception 'admin_required';
  end if;

  if p_decision not in ('approved', 'rejected')
    or char_length(coalesce(p_admin_note, '')) > 1000 then
    raise exception 'invalid_review_content';
  end if;

  select candidate.*
  into application
  from public.membership_applications as candidate
  where candidate.id = p_application_id
  for update;

  if not found then
    raise exception 'application_not_found';
  end if;

  if application.status <> 'pending' then
    raise exception 'application_already_reviewed';
  end if;

  if p_decision = 'approved' then
    select candidate.*
    into invitation
    from public.member_invitations as candidate
    where lower(trim(candidate.email)) = lower(trim(application.email))
    for update;

    if found then
      if invitation.claimed_by is not null then
        update public.member_invitations
        set name = application.name,
            cohort = application.cohort
        where id = invitation.id;

        update public.profiles
        set cohort = application.cohort
        where id = invitation.claimed_by;

        if not found then
          raise exception 'member_profile_not_found';
        end if;
      elsif invitation.claimed_at is not null then
        raise exception 'invitation_claim_invalid';
      else
        update public.member_invitations
        set name = application.name,
            cohort = application.cohort
        where id = invitation.id;
      end if;
    else
      insert into public.member_invitations (name, email, cohort)
      values (application.name, application.email, application.cohort);
    end if;
  end if;

  update public.membership_applications
  set status = p_decision,
      admin_note = trim(coalesce(p_admin_note, '')),
      reviewed_by = (select auth.uid()),
      reviewed_at = now(),
      updated_at = now()
  where id = application.id;
end;
$$;

revoke all on function public.review_membership_application(bigint, text, text) from public, anon;
grant execute on function public.review_membership_application(bigint, text, text) to authenticated;
