-- 기존 배포의 신청도 유지하면서 새 신청서에서는 유입 경로를 필수로 검증합니다.
alter table public.membership_applications
  add column referral_sources text[],
  add column referral_other text,
  add constraint membership_referral_valid check (
    (referral_sources is null and referral_other is null) or
    (referral_sources is not null and cardinality(referral_sources) between 1 and 5
      and array_position(referral_sources,null) is null
      and referral_sources <@ array['인스타그램','에브리타임','지인 소개','블로그','기타']::text[]
      and case when '기타'=any(referral_sources)
        then referral_other is not null and char_length(trim(referral_other)) between 1 and 200
        else referral_other is null end)
  );

create function public.submit_membership_application_with_referral(
  p_name text,p_email text,p_cohort text,p_birth_year integer,p_group_id uuid,p_phone text,
  p_message text,p_referral_sources text[],p_referral_other text
) returns void language plpgsql security definer set search_path='' as $$
begin
  if p_referral_sources is null or cardinality(p_referral_sources) not between 1 and 5
    or array_position(p_referral_sources,null) is not null
    or not (p_referral_sources <@ array['인스타그램','에브리타임','지인 소개','블로그','기타']::text[])
    or ('기타'=any(p_referral_sources) and char_length(trim(coalesce(p_referral_other,''))) not between 1 and 200)
    then raise exception 'invalid_application_referral'; end if;
  -- 신청과 경로 저장은 같은 트랜잭션에서 실행합니다. 기존 신청은 갱신하지 않습니다.
  perform public.submit_membership_application(p_name,p_email,p_cohort,p_birth_year,p_group_id,p_phone,p_message);
  update public.membership_applications
    set referral_sources=array(select distinct source from unnest(p_referral_sources) as source),
        referral_other=case when '기타'=any(p_referral_sources) then trim(p_referral_other) else null end
    where email=lower(trim(p_email)) and cohort=p_cohort and status='pending';
end;
$$;
revoke all on function public.submit_membership_application_with_referral(text,text,text,integer,uuid,text,text,text[],text) from public;
grant execute on function public.submit_membership_application_with_referral(text,text,text,integer,uuid,text,text,text[],text) to anon,authenticated;

drop function public.admin_list_membership_applications();
create function public.admin_list_membership_applications()
returns table(id bigint,name text,email text,phone text,cohort text,birth_year smallint,message text,status text,admin_note text,
  created_at timestamptz,reviewed_at timestamptz,group_id uuid,host_name text,venue text,duration_minutes integer,meetings jsonb,referral_sources text[],referral_other text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_talk_admin() then raise exception 'admin_required'; end if;
  return query select a.id,a.name,a.email,a.phone,a.cohort,a.birth_year,a.message,a.status,a.admin_note,a.created_at,a.reviewed_at,
    a.group_id,g.host_name,g.venue,g.duration_minutes,
    (select jsonb_agg(jsonb_build_object('week_number',m.week_number,'starts_at',m.starts_at) order by m.week_number) from public.talk_meetings m where m.group_id=g.id),a.referral_sources,a.referral_other
    from public.membership_applications a left join public.talk_groups g on g.id=a.group_id
    where a.archived_at is null order by case a.status when 'pending' then 0 when 'approved' then 1 else 2 end,a.created_at desc;
end;
$$;
revoke all on function public.admin_list_membership_applications() from public,anon;
grant execute on function public.admin_list_membership_applications() to authenticated;

