# 인증 메일과 브라우저 전환

가입 메일은 운영 Site URL의 `/auth/confirm`을 엽니다. 링크를 열면 안내 화면만 표시하며, 사용자가 ‘이메일 인증 완료하기’를 누를 때 서버가 토큰을 검증하고 닉네임 설정 화면으로 이동합니다. 재설정 메일은 `/auth/callback`에서 토큰을 검증합니다. 기존에 발송한 `code` 링크는 가입을 요청한 브라우저에서 열어야 합니다.

## 운영 적용 순서

1. 홈페이지의 가입 인증 화면(`/auth/confirm`)과 비밀번호 재설정 콜백(`/auth/callback`)을 먼저 배포합니다.
2. Supabase의 Authentication → URL Configuration에서 Site URL을 운영 홈페이지 주소로 설정합니다. 가입 메일은 이 주소(`{{ .SiteURL }}`)에 `/auth/confirm`을 붙입니다. 재설정 메일은 앱이 전달한 콜백 주소(`{{ .RedirectTo }}`)를 사용하므로 배포 환경의 `NEXT_PUBLIC_SITE_URL`과 Supabase의 Redirect URLs도 확인합니다.
3. Authentication → Email Templates에서 Confirm signup 본문에는 `supabase/templates/confirmation.html`, Reset password 본문에는 `supabase/templates/recovery.html` 내용을 저장합니다.

## 운영 적용 후 확인

1. 승인된 새 테스트 계정으로 가입하고, 받은 메일에서 ‘이메일 인증 화면 열기’를 누릅니다. 별도 브라우저에서도 홈페이지의 인증 안내가 열리고, 이때까지는 Supabase 사용자 목록에서 해당 이메일이 미인증 상태인지 확인합니다.
2. 홈페이지에서 ‘이메일 인증 완료하기’를 누릅니다. 이메일이 인증되고 ‘닉네임 정하기’ 화면(`/onboarding`)이 열리는지 확인합니다.
3. 닉네임을 저장하기 전에 창을 닫습니다. 로그아웃 상태인 브라우저에서 같은 메일 링크를 다시 열고 ‘로그인하고 이어가기’를 선택합니다. 가입한 계정으로 로그인한 뒤 닉네임을 정할 수 있어야 합니다.
4. 만료된 가입 링크로 인증 버튼을 눌렀을 때 로그인 안내가 나오는지 확인합니다. 아직 인증 전인 회원은 로그인 화면에서 새 인증 메일을 요청할 수 있습니다.
5. 비밀번호 재설정은 별도로 확인합니다. 새 메일로 비밀번호를 변경한 뒤 로그인하고, 이미 사용한 재설정 링크를 다시 열면 재설정 안내가 나오는지 확인합니다.

템플릿 파일을 저장소에 추가하는 것만으로 운영 Supabase 설정은 바뀌지 않습니다. 실제 메일 발송과 실기기 검증은 운영 설정 적용 후 진행합니다.

## 운영자 안내

- 인터뷰 관리 화면에서 현재 기수 가입 신청서 링크를 복사해 인터뷰를 마친 분에게 전달합니다.
- 가입 신청서 전화번호는 운영자 가입 신청 목록에서만 확인합니다. 기존 신청의 빈 전화번호를 이름으로 추정해 채우지 않습니다.
- 입금 확인과 승인 후 신청 카드의 회원가입 링크를 복사해 전달합니다. 재참여 회원은 기존 계정으로 로그인합니다.

참고: [Supabase 이메일 템플릿](https://supabase.com/docs/guides/auth/auth-email-templates), [PKCE 브라우저 제약](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
