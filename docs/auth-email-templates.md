# 인증 메일과 브라우저 전환

가입·재설정 메일은 `token_hash`를 `/auth/callback`에서 `verifyOtp`로 검증합니다. 인스타그램에서 요청하고 다른 브라우저에서 메일을 열어도 요청 당시 쿠키가 필요하지 않습니다. 기존에 발송한 `code` 링크도 계속 처리하지만 같은 브라우저에서 열어야 합니다.

## 운영 적용 순서

1. 전화번호 마이그레이션과 새 인증 콜백을 포함한 소스를 배포합니다.
2. Supabase의 Authentication → Email Templates에서 Confirm signup 본문을 `supabase/templates/confirmation.html`, Reset password 본문을 `supabase/templates/recovery.html` 내용으로 변경합니다. **콜백 배포 전에 메일 템플릿부터 바꾸면 인증이 실패합니다.**
3. 배포 환경의 `NEXT_PUBLIC_SITE_URL`과 Supabase Redirect URLs에 실제 사용할 사이트 주소가 등록되어 있는지 확인합니다. 템플릿의 `RedirectTo`는 앱이 전달하는 `/auth/callback?next=...` 주소를 사용합니다.
4. 승인된 테스트 계정으로 가입을 요청하고 별도 브라우저에서 새 메일 링크를 열어 `/onboarding`으로 이동하는지 확인합니다. 재설정도 별도 브라우저에서 요청·수신하여 새 비밀번호 저장과 로그인을 확인합니다.
5. 만료·재사용 링크가 실패하고, 실패 시 비밀번호 재설정 또는 로그인 화면으로 이동하는지 확인합니다.

템플릿 파일을 저장소에 추가하는 것만으로 운영 Supabase 설정은 바뀌지 않습니다. 실제 메일 발송과 실기기 검증은 운영 설정 적용 후 진행합니다.

## 운영자 안내

- 인터뷰 관리 화면에서 현재 기수 가입 신청서 링크를 복사해 인터뷰를 마친 분에게 전달합니다.
- 가입 신청서 전화번호는 운영자 가입 신청 목록에서만 확인합니다. 기존 신청의 빈 전화번호를 이름으로 추정해 채우지 않습니다.
- 입금 확인과 승인 후 신청 카드의 회원가입 링크를 복사해 전달합니다. 재참여 회원은 기존 계정으로 로그인합니다.

참고: [Supabase 이메일 템플릿](https://supabase.com/docs/guides/auth/auth-email-templates), [PKCE 브라우저 제약](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
