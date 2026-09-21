-- 운영 데이터는 변경하지 않는다. 모든 검증용 모임·신청은 마지막에 롤백한다.
begin;
do $$
declare
  admin_id uuid; member_id uuid; peer_id uuid; outsider_id uuid;
  a uuid; b uuid; r uuid; r2 uuid; draft_id uuid; payload jsonb; n integer;
begin
  select id into admin_id from auth.users where raw_app_meta_data->>'role'='admin' limit 1;
  select u.id into member_id from auth.users u join public.memberships m on m.user_id=u.id join public.profiles p on p.id=u.id
    where coalesce(u.raw_app_meta_data->>'role','') <> 'admin' and m.status='active' and p.onboarding_completed_at is not null limit 1;
  select u.id into peer_id from auth.users u join public.memberships m on m.user_id=u.id join public.profiles p on p.id=u.id
    where coalesce(u.raw_app_meta_data->>'role','') <> 'admin' and u.id<>member_id and m.status='active' and p.onboarding_completed_at is not null limit 1;
  select u.id into outsider_id from auth.users u where not exists(select 1 from public.memberships m where m.user_id=u.id and m.status='active') limit 1;
  assert admin_id is not null and member_id is not null and peer_id is not null and outsider_id is not null, '검증 계정 조건 부족';
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
  payload := jsonb_build_object('host_name','검증 가이드','kind','gatherings','title','롤백 검증 모임','description','검증 후 되돌릴 모임입니다.',
    'starts_at',now()+interval '7 days','closes_at',now()+interval '6 days','location','검증 장소','capacity',1,'fee',3000,
    'book_title','','reading_scope','','included','모집과 신청 관리','extra_cost','없음','contact','운영자 문의','status','open',
    'bank_info','검증 계좌','chat_url','https://open.kakao.com/o/TESTONLY','chat_password','검증 비밀번호');
  a := public.save_activity(null,payload || '{"chat_url":""}'::jsonb);
  assert (select chat_url='' from public.activity_chat_details where activity_id=a), '채팅 링크 없이 개설 실패';
  draft_id := public.save_activity(null,payload || '{"status":"draft"}'::jsonb);
  begin
    perform public.register_activity(a,'가이드',true);
    raise exception '가이드 신청 차단 실패';
  exception when others then if sqlerrm <> 'host_exempt' then raise; end if; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
  assert not exists(select 1 from public.activities where id=draft_id), '작성 중 모임 노출';
  assert not exists(select 1 from public.activity_chat_details where activity_id=a), '미신청 채팅 노출';
  begin
    perform public.save_activity(null,payload);
    raise exception '일반 회원 개설 차단 실패';
  exception when others then if sqlerrm <> 'admin_required' then raise; end if; end;
  begin
    perform public.register_activity(a,'회원',false);
    raise exception '환불 동의 차단 실패';
  exception when others then if sqlerrm <> 'policy_required' then raise; end if; end;
  r := public.register_activity(a,'검증 회원',true);
  assert (select reserved_count=1 from public.activities where id=a), '정원 예약 실패';
  assert exists(select 1 from public.activity_payment_details where activity_id=a), '입금 안내 누락';
  assert not exists(select 1 from public.activity_chat_details where activity_id=a), '대기 중 채팅 노출';
  begin
    update public.activity_registrations set status='confirmed' where id=r;
    raise exception '직접 상태 변경 차단 실패';
  exception when insufficient_privilege then null; end;
  begin
    perform public.review_activity_registration(r,'confirm_payment');
    raise exception '회원 입금 확인 차단 실패';
  exception when others then if sqlerrm <> 'admin_required' then raise; end if; end;
  begin
    perform public.register_activity(a,'검증 회원',true);
    raise exception '중복 신청 차단 실패';
  exception when others then if sqlerrm <> 'already_registered' then raise; end if; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',peer_id,'role','authenticated')::text,true);
  assert not exists(select 1 from public.activity_registrations where id=r), '타인 신청 노출';
  begin
    perform public.cancel_activity_registration(r);
    raise exception '타인 취소 차단 실패';
  exception when others then if sqlerrm <> 'registration_missing' then raise; end if; end;
  begin
    perform public.register_activity(a,'다른 회원',true);
    raise exception '정원 초과 차단 실패';
  exception when others then if sqlerrm <> 'activity_full' then raise; end if; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
  begin
    perform public.save_activity(a,payload || '{"fee":3500}'::jsonb);
    raise exception '신청 후 가격 변경 차단 실패';
  exception when others then if sqlerrm <> 'registered_details_locked' then raise; end if; end;
  perform public.save_activity(a,payload || '{"chat_url":"입장 안내는 추후 공지"}'::jsonb);
  assert (select chat_url='입장 안내는 추후 공지' from public.activity_chat_details where activity_id=a), '신청 후 자유 형식 안내 저장 실패';
  perform public.save_activity(a,payload);
  perform public.review_activity_registration(r,'confirm_payment');
  perform public.review_activity_registration(r,'confirm_payment');
  perform set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
  assert exists(select 1 from public.activity_chat_details where activity_id=a), '확정 후 채팅 조회 실패';
  perform public.cancel_activity_registration(r);
  perform public.cancel_activity_registration(r);
  assert not exists(select 1 from public.activity_chat_details where activity_id=a), '취소 후 채팅 노출';
  assert (select refund_status='pending' and refund_amount=3000 from public.activity_registrations where id=r), '7일 경계 전액 환불 실패';
  assert (select reserved_count=0 from public.activities where id=a), '취소 정원 복구 실패';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
  perform public.review_activity_registration(r,'refund');
  perform public.review_activity_registration(r,'refund');
  assert (select refund_status='completed' from public.activity_registrations where id=r), '환불 완료 실패';
  begin
    perform public.save_activity(null,payload || '{"kind":"book-club","fee":29000,"book_title":"검증 책","reading_scope":"전체"}'::jsonb);
    raise exception '북토의 가격 범위 차단 실패';
  exception when check_violation then null; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
  r2 := public.register_activity(a,'재신청 회원',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
  perform public.review_activity_registration(r2,'unpaid');
  perform public.review_activity_registration(r2,'unpaid');
  assert (select reserved_count=0 from public.activities where id=a), '미입금 중복 처리 정원 오류';
  assert (select status='cancelled' and refund_status='none' from public.activity_registrations where id=r2), '미입금 취소 오류';
  b := public.save_activity(null,payload || jsonb_build_object('starts_at',now()+interval '7 days'-interval '1 second','closes_at',now()+interval '1 day','capacity',2));
  perform set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
  r := public.register_activity(b,'검증 회원',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
  perform public.review_activity_registration(r,'confirm_payment');
  perform set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
  perform public.cancel_activity_registration(r);
  assert (select refund_status='not_due' and refund_amount=0 from public.activity_registrations where id=r), '7일 이후 환불 차단 실패';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',peer_id,'role','authenticated')::text,true);
  r2 := public.register_activity(b,'다른 회원',true);
  perform public.cancel_activity_registration(r2);
  assert (select refund_status='check_payment' from public.activity_registrations where id=r2), '취소 후 미확인 입금 누락';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
  perform public.cancel_activity(b);
  perform public.review_activity_registration(r2,'confirm_payment');
  assert (select refund_status='pending' and refund_amount=3000 from public.activity_registrations where id=r), '운영 취소 전액 환불 실패';
  assert (select refund_status='pending' and refund_amount=3000 from public.activity_registrations where id=r2), '늦게 확인한 입금 환불 실패';
  perform public.cancel_activity(b);
  assert (select reserved_count=0 from public.activities where id=b), '운영 취소 정원 실패';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
  perform public.submit_activity_proposal('검증 제안','검토 후 되돌릴 제안');
  select count(*) into n from public.activity_proposals where user_id=member_id;
  assert n>0, '제안 저장 실패';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',peer_id,'role','authenticated')::text,true);
  assert not exists(select 1 from public.activity_proposals where user_id=member_id), '타인 제안 노출';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',outsider_id,'role','authenticated')::text,true);
  assert not exists(select 1 from public.activities where id=a), '비회원 모임 조회 차단 실패';
  begin
    perform public.register_activity(a,'비회원',true);
    raise exception '비회원 신청 차단 실패';
  exception when others then if sqlerrm <> 'membership_required' then raise; end if; end;
  execute 'set local role anon';
  begin
    perform 1 from public.activity_chat_details;
    raise exception '비로그인 채팅 조회 차단 실패';
  exception when insufficient_privilege then null; end;
  begin
    perform public.register_activity(a,'비로그인',true);
    raise exception '비로그인 신청 차단 실패';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
end;
$$;
select '모임 권한·정원·신청·입금·취소·환불 경계·제안 검증 통과' as result;
rollback;
