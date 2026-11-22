-- 기존 블로그 응답과 이전 버전 신청서도 저장할 수 있게 유지합니다.
alter table public.membership_applications
  drop constraint membership_referral_valid,
  add constraint membership_referral_valid check (
    (referral_sources is null and referral_other is null) or
    (referral_sources is not null and cardinality(referral_sources) between 1 and 9
      and array_position(referral_sources,null) is null
      and referral_sources <@ array['인스타그램','에브리타임','지인 소개','블로그','교보문고 VORA 블로그','북카페 블로그','그믐','온오프믹스','젤록','기타']::text[]
      and case when '기타'=any(referral_sources)
        then referral_other is not null and char_length(trim(referral_other)) between 1 and 200
        else referral_other is null end)
  );

create or replace function public.submit_membership_application_with_referral(
  p_name text,p_email text,p_cohort text,p_birth_year integer,p_group_id uuid,p_phone text,
  p_message text,p_referral_sources text[],p_referral_other text
) returns void language plpgsql security definer set search_path='' as $$
begin
  if p_referral_sources is null or cardinality(p_referral_sources) not between 1 and 9
    or array_position(p_referral_sources,null) is not null
    or not (p_referral_sources <@ array['인스타그램','에브리타임','지인 소개','블로그','교보문고 VORA 블로그','북카페 블로그','그믐','온오프믹스','젤록','기타']::text[])
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
