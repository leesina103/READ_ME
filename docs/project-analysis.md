# READ ME 프로젝트 구조 분석

> 분석 기준: READ ME v1.0 초기 프로젝트  
> 마지막 확인일: 2026-08-19

현재 프로젝트는 독서모임 READ ME의 **정적 UI 프로토타입** 단계다. 화면과 페이지 이동은 구현되어 있지만 인증, 데이터베이스, 모임 신청 등 실제 서비스 기능은 아직 연결되지 않았다.

## 1. 기술 스택

- Next.js 15.5 계열
  - App Router 사용
  - 현재 모든 페이지는 Server Component
  - API Route와 Server Action은 아직 없음
- React 19
- TypeScript 5.9
  - `strict: true`
  - `@/*` 경로 별칭 사용
- Tailwind CSS v4
  - PostCSS 플러그인 방식
  - CSS 변수로 공통 색상 관리
- Lucide React
  - 책, 캘린더, 사용자 등의 아이콘 사용
- Supabase
  - `@supabase/supabase-js`
  - `@supabase/ssr`
  - 패키지와 환경변수 자리만 준비되어 있으며 실제 연결은 아직 없음
- ESLint 9 및 Next.js ESLint 설정
- Vercel 배포가 가능한 표준 Next.js 구성

## 2. 폴더 구조

```text
READ_ME/
├─ app/
│  ├─ layout.tsx          전역 레이아웃 및 메타데이터
│  ├─ globals.css         Tailwind 및 전역 디자인 변수
│  ├─ page.tsx            메인 페이지
│  ├─ about/
│  │  └─ page.tsx         모임 소개
│  ├─ meeting/
│  │  └─ page.tsx         모임 목록
│  ├─ my/
│  │  └─ page.tsx         MY 페이지
│  ├─ login/
│  │  └─ page.tsx         로그인 UI
│  └─ signup/
│     └─ page.tsx         회원가입 UI
├─ components/
│  ├─ Header.tsx          공통 헤더 및 내비게이션
│  └─ SectionTitle.tsx    공통 섹션 제목
├─ package.json
├─ package-lock.json
├─ tsconfig.json
├─ next.config.ts
├─ postcss.config.mjs
├─ eslint.config.mjs
├─ .env.example
└─ README.md
```

현재 없는 주요 구조:

- `lib/` 또는 `utils/`
- Supabase 클라이언트 모듈
- `middleware.ts`
- `app/api/` 및 `route.ts`
- 데이터베이스 스키마와 마이그레이션
- `public/` 이미지 자산
- 테스트 코드
- 관리자 페이지
- 동적 라우트

## 3. 주요 페이지

| 경로 | 역할 | 현재 상태 |
| --- | --- | --- |
| `/` | 브랜드 소개 및 랜딩 | 구현 완료 |
| `/about` | READ ME 철학과 진행 방식 소개 | 정적 UI 구현 |
| `/meeting` | 기수별 모임 목록 | 하드코딩된 카드 4개 |
| `/my` | 개인 모임 및 독서 기록 영역 | 로그인 안내만 구현 |
| `/login` | 이메일 로그인 | 입력 UI만 구현 |
| `/signup` | 이름, 이메일, 비밀번호 회원가입 | 입력 UI만 구현 |

### 메인 페이지

- 메인 히어로
- 모임 소개 CTA
- 읽기 → 생각하기 → 이야기하기 가치 소개
- 네 번의 질문 커리큘럼
- 모임 페이지로 연결되는 CTA

### 모임 페이지

- 관계, 나, 변화, 마음 등 4개 항목 표시
- 모든 모임 상태는 `준비 중`
- `4회 오프라인 모임` 안내
- 참여 버튼은 실제 신청 대신 `/login`으로 이동

### 공통 UI

- `Header.tsx`: 소개, 모임, MY, 로그인 내비게이션
- `SectionTitle.tsx`: 메인 페이지의 섹션 제목 재사용
- `globals.css`: 배경, 글자, 강조색 등의 디자인 토큰 관리

## 4. 인증 및 DB 구조

현재는 실질적인 인증 및 데이터베이스 구조가 없다.

### 준비된 부분

`.env.example`에 다음 Supabase 환경변수 자리만 준비되어 있다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Supabase 클라이언트 및 SSR 패키지도 의존성에 포함되어 있다.

### 아직 없는 부분

- 브라우저용 Supabase 클라이언트
- 서버용 Supabase 클라이언트
- 쿠키 기반 세션 갱신
- 인증 미들웨어
- 로그인 및 회원가입 API 호출
- 로그아웃
- 이메일 인증과 비밀번호 재설정
- Google OAuth
- 로그인 상태에 따른 헤더 변경
- `/my` 및 관리자 페이지 접근 제어
- 사용자 역할과 권한
- DB 테이블 및 관계 정의
- Row Level Security 정책
- 마이그레이션 파일

로그인과 회원가입 화면에는 `<form>`, 제출 핸들러, 상태 관리가 없다. 현재 버튼을 눌러도 실제 인증 동작은 수행되지 않는다.

## 5. 현재 구현된 기능

### 구현됨

- 모든 정적 페이지 렌더링
- 페이지 간 링크 이동
- 공통 헤더
- 반응형 레이아웃
- Tailwind 기반 카드와 버튼 스타일
- Lucide 아이콘
- 모임 및 커리큘럼 정보 표시
- 기본 HTML 메타데이터
- 로그인 및 회원가입 입력 화면
- MY 페이지 로그인 유도
- Vercel 배포를 위한 기본 구성

### 아직 동작하지 않음

- 로그인
- 회원가입
- 로그아웃
- 회원 세션 유지
- 모임 신청 및 취소
- 모임 상세 조회
- 독서 기록 작성 및 조회
- 사용자 프로필
- 관리자 기능
- DB 데이터 조회 및 저장

## 6. 앞으로 구현해야 할 기능

### 핵심 기능

- [ ] Supabase Auth 연결
- [ ] 이메일 회원가입, 로그인, 로그아웃
- [ ] Google 로그인
- [ ] 일반 사용자, 멤버, 관리자 권한
- [ ] 기수 및 모임 데이터베이스
- [ ] 모임 신청 및 취소
- [ ] 실제 MY 페이지
- [ ] 관리자 페이지
- [ ] 카카오톡 채널 연동

### 예상 DB 영역

실제 스키마는 아직 없지만 현재 기획상 다음 데이터 모델이 필요할 가능성이 높다.

- `profiles`: 사용자 프로필과 역할
- `cohorts` 또는 `programs`: 기수 및 프로그램
- `meetings` 또는 `sessions`: 회차별 일정
- `books`: 선정 도서
- `applications`: 모임 신청 및 승인 상태
- `reading_records`: 개인 독서 기록

역할과 신청 데이터에는 Supabase Row Level Security 정책도 함께 설계해야 한다.

### UI 및 품질 개선

- [ ] Pretendard 또는 Noto Sans KR 적용
- [ ] 로그인 및 회원가입을 실제 `<form>` 구조로 변경
- [ ] `<label>`, `autoComplete`, 유효성 검사 및 오류 메시지 추가
- [ ] 메인과 모임 페이지에 중복된 기수 데이터 통합
- [ ] `metadataBase` 및 Open Graph 메타데이터 추가
- [ ] 카카오톡 링크 미리보기 지원
- [ ] 테스트 환경 및 핵심 기능 테스트 추가

## 7. 구현 전에 확정할 사항

현재 메인 페이지의 `01`~`04`는 **한 기수의 네 회차**처럼 표현되지만, 모임 페이지에서는 **01기~04기**로 표현된다.

DB를 설계하기 전에 다음 개념을 먼저 확정해야 한다.

- 하나의 기수에 몇 개의 회차가 포함되는가?
- 각 회차에 책이 한 권씩 연결되는가?
- 사용자는 기수 전체에 신청하는가, 개별 회차에 신청하는가?
- 신청 즉시 멤버가 되는가, 관리자 승인이 필요한가?
- 정원, 대기 신청, 신청 기간을 관리해야 하는가?

## 8. 권장 구현 순서

1. 기수, 회차, 신청 방식 등 도메인 개념 확정
2. Supabase DB 스키마와 RLS 정책 설계
3. Supabase 브라우저 및 서버 클라이언트 구성
4. 회원가입, 로그인, 로그아웃과 세션 처리
5. 사용자 역할 및 접근 제어
6. 모임 데이터 조회와 상세 페이지
7. 모임 신청 및 취소
8. MY 페이지
9. 관리자 페이지
10. 메타데이터, 접근성, 테스트 보완

이 문서는 구현이 진행될 때 체크박스와 현재 상태를 지속적으로 갱신하는 기준 문서로 사용한다.
