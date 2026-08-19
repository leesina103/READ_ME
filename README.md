# READ ME v1.0

Read books. Read yourself.

책을 읽고, 나를 읽는 독서모임 READ ME의 웹페이지 초기 프로젝트입니다.

## 기술 스택

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Supabase 준비 구조
- Vercel 배포 가능 구조

## 개발 환경

**Windows + Git Bash** 기준으로 설명합니다. Git for Windows를 설치하면 함께 설치되며, 시작 메뉴에서 `Git Bash`로 실행합니다.

macOS / Linux 터미널에서도 아래 명령이 그대로 동작합니다.

> PowerShell을 쓰는 경우 `npm`이 실행 정책 오류(`이 시스템에서 스크립트를 실행할 수 없으므로`)를 낼 수 있습니다. Git Bash에서는 발생하지 않습니다.

### 1. Node.js 확인

```bash
node -v
npm -v
```

Node.js 20 이상을 권장합니다. 설치되어 있지 않다면 https://nodejs.org 에서 LTS 버전을 받으세요. 설치 후에는 Git Bash를 껐다 켜야 `PATH`가 반영됩니다.

### 2. 의존성 설치

프로젝트 폴더에서:

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속. 파일을 저장하면 브라우저가 자동으로 갱신되므로 새로고침할 필요가 없습니다.

- 서버를 끌 때는 `Ctrl + C`
- 이 터미널은 서버가 점유하므로, git 명령은 **별도의 Git Bash 창**에서 실행하세요
- `EADDRINUSE` 오류가 나면 3000 포트를 이미 쓰고 있다는 뜻입니다. 이전 서버가 남아 있는 것이므로 작업 관리자에서 Node.js 프로세스를 종료하거나, 다른 포트로 실행하세요

```bash
npm run dev -- -p 3001
```

### 4. 배포 전 확인 (중요)

`npm run dev`는 관대해서 그냥 넘어가는 문제를 `npm run build`가 잡아냅니다. 타입 오류나 프로덕션 전용 문제가 대표적입니다.

**push 하기 전에 반드시 아래 두 명령을 통과시키세요.** 이 단계를 건너뛰면 로컬은 멀쩡한데 Vercel 배포만 실패하는 상황이 생깁니다.

```bash
npm run lint
npm run build
```

빌드 결과를 실제로 확인하고 싶다면:

```bash
npm start
```

`npm run build`로 만들어진 프로덕션 빌드가 http://localhost:3000 에서 실행됩니다. 개발 중에는 `npm run dev`만 쓰면 됩니다.

### 일상 작업 흐름

```bash
npm run dev          # 터미널 1: 켜두고 개발
                     # 코드 수정 → 저장 → 브라우저 자동 갱신

npm run build        # 터미널 2: push 전 확인
git add .
git commit -m "커밋 메시지"
git push
```

## Git Bash 사용 시 참고

### 경로 표기

Git Bash는 유닉스식 경로를 씁니다.

| Windows | Git Bash |
| --- | --- |
| `C:\Users\fw` | `/c/Users/fw` |
| `C:\Users\fw\Documents` | `~/Documents` |

탐색기에서 복사한 경로(`C:\...`)는 백슬래시 때문에 그대로 붙여넣으면 동작하지 않습니다.

### 폴더 내용 복사

압축을 푼 폴더의 **내용물만** 옮길 때는 끝에 `/.`를 붙입니다. 이게 없으면 폴더째로 한 단계 깊게 복사되고 `.gitignore` 같은 숨김 파일이 빠집니다.

```bash
cp -r ~/Downloads/READ-ME-v1.0/. .
ls -a
```

### 대화형 CLI가 멈출 때

Git Bash(mintty)는 일부 Windows 콘솔 앱과 궁합이 맞지 않아, 방향키로 선택하는 도구(`npx create-next-app` 등)가 멈춘 것처럼 보일 수 있습니다. 이때만 앞에 `winpty`를 붙이세요.

```bash
winpty npx create-next-app@latest
```

`npm run dev`, `npm run build`, `git` 명령은 해당 없습니다.

## Windows에서 개발할 때 주의사항

### import 경로의 대소문자

Windows는 파일명 대소문자를 구분하지 않지만 Linux는 구분합니다. 아래처럼 실제 파일명과 다르게 써도 Windows에서는 동작하지만, **Vercel 배포 시 `Module not found`로 빌드가 실패합니다.**

```tsx
// 파일이 components/Header.tsx 인 경우
import { Header } from "@/components/header";  // Windows OK, Vercel 실패
import { Header } from "@/components/Header";  // 올바름
```

로컬에서 `npm run build`를 돌려도 이 문제는 Windows에서 잡히지 않습니다. import 경로를 파일명과 정확히 일치시키세요.

### 줄바꿈 문자

`.gitattributes`에서 `eol=lf`로 통일해 두었습니다. Windows와 Linux 양쪽에서 작업해도 diff가 깨지지 않습니다. 별도 설정은 필요 없습니다.

### node_modules

OS별 바이너리가 포함되므로 커밋하지 않습니다. `.gitignore`에 이미 포함되어 있습니다. 다른 PC에서는 `npm install`로 새로 받으세요.

## Supabase

현재 v1.0에서는 Supabase 연결을 위한 환경변수 파일만 준비되어 있습니다.

`.env.example`을 복사해서 `.env.local`을 만들고 다음 값을 입력하면 됩니다.

```bash
cp .env.example .env.local
```

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`.env.local`은 `.gitignore`에 포함되어 있어 커밋되지 않습니다. 실제 회원가입/로그인 기능은 다음 단계에서 연결합니다.

## Git 설정

처음 사용하는 PC라면 한 번만 설정합니다. `user.email`은 GitHub 계정에 등록된 주소여야 커밋이 계정에 연결됩니다.

```bash
git config --global user.name "이름"
git config --global user.email "GitHub에_등록된_이메일"
```

## GitHub

이미 원격 저장소가 연결되어 있다면 아래 세 명령이 전부입니다.

```bash
git add .
git commit -m "커밋 메시지"
git push
```

새 PC에서 처음 받아올 때:

```bash
git clone https://github.com/USERNAME/REPOSITORY.git
cd REPOSITORY
npm install
```

HTTPS로 clone하면 Git Credential Manager가 브라우저 로그인 창을 띄웁니다. 한 번 인증하면 이후로는 자동입니다.

빈 저장소에 처음 연결하는 경우:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

## Vercel

GitHub에 올린 뒤 Vercel에서 해당 저장소를 Import하면 배포됩니다. 이후 `main` 브랜치에 push할 때마다 자동 배포됩니다.

Supabase를 연결한 뒤에는 Vercel Project Settings > Environment Variables에 `.env.local`과 같은 값을 등록해야 합니다.

## 페이지 구성

| 경로 | 파일 | 설명 |
| --- | --- | --- |
| `/` | `app/page.tsx` | 메인 |
| `/about` | `app/about/page.tsx` | 소개 |
| `/meeting` | `app/meeting/page.tsx` | 모임 목록 |
| `/my` | `app/my/page.tsx` | MY (로그인 안내만) |
| `/login` | `app/login/page.tsx` | 로그인 (UI만) |
| `/signup` | `app/signup/page.tsx` | 회원가입 (UI만) |

## 다음 개발 단계

1. Supabase Auth 실제 연결
2. Google 로그인 추가
3. 일반 사용자 / 멤버 / 관리자 권한
4. 기수 및 모임 데이터베이스
5. 모임 신청
6. MY 페이지
7. 관리자 페이지
8. 카카오톡 채널 연동

### 알려진 개선 필요 항목

- 한글 폰트 미적용 (`next/font`로 Pretendard 또는 Noto Sans KR 연결 필요)
- 로그인/회원가입 폼에 `<form>`, `<label>`, `autoComplete` 없음 (Supabase 연결 전 정리 권장)
- 기수 데이터가 `app/page.tsx`와 `app/meeting/page.tsx`에 중복 하드코딩됨
- 메인은 "한 기수 4회차", 모임 페이지는 "01기~04기"로 기수 개념이 서로 다름 (내용 확정 필요)
- `metadata`에 `metadataBase` / `openGraph` 없음 (카카오톡 링크 미리보기 빈칸)
