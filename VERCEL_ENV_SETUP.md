# Vercel 환경 변수 설정 가이드

## 🔍 현재 프로젝트 정보

- **프로젝트 이름**: linkers
- **프로젝트 ID**: `prj_rqwcidTL9jaB0yj10TFs4PQBPkNm`
- **팀 ID**: `team_zQOMhwK0Xbzk5DcY7nA6eCYx`
- **도메인**: 
  - `linkforus.com` (커스텀 도메인 - 프로덕션)
  - `makers-b2b.vercel.app` (Vercel 기본 도메인)
  - `linkers-6qr9kouxu-suhyeon10s-projects.vercel.app` (배포 URL)

## ⚠️ 현재 문제

배포 환경에서 다음 에러가 발생하고 있습니다:
```
PORTONE_V2_API_SECRET이 설정되지 않았습니다.
```

## 📝 Vercel 환경 변수 설정 방법

### 1. Vercel 대시보드 접속

1. [Vercel 대시보드](https://vercel.com) 접속
2. 로그인 후 프로젝트 목록에서 **"linkers"** 프로젝트 선택

### 2. 환경 변수 설정 페이지 이동

1. 프로젝트 페이지에서 **Settings** 탭 클릭
2. 왼쪽 메뉴에서 **Environment Variables** 클릭

### 3. 필수 환경 변수 추가

다음 환경 변수들을 **Production**, **Preview**, **Development** 모두에 추가하세요:

#### Supabase (필수)
```
NEXT_PUBLIC_SUPABASE_URL=https://zmxxbdrfwhavwxizdfyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_STORAGE_BUCKET=attach_file
```

#### 포트원 V2 (필수)
```
PORTONE_V2_API_SECRET=your_v2_api_secret_here
NEXT_PUBLIC_PORTONE_V2_STORE_ID=store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY=channel-key-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PORTONE_V2_WEBHOOK_SECRET=your_v2_webhook_secret_here
```

#### 기타 (선택사항)
```
NEXT_PUBLIC_SITE_URL=https://linkforus.com
CRON_SECRET=your_secure_random_string_here
```

> 💡 **환경별 Site URL 설정 팁**
> 
> `NEXT_PUBLIC_SITE_URL`은 OAuth 리다이렉트 URL에 사용됩니다. 
> Production과 Preview 환경에 **다른 값**을 설정할 수 있습니다:
> 
> - **Production**: `https://linkforus.com` (커스텀 도메인)
> - **Preview**: `https://linkers-6qr9kouxu-suhyeon10s-projects.vercel.app` (또는 프리뷰 URL)
> 
> 각 환경 변수를 추가할 때 **Environment** 체크박스를 선택적으로 체크하여 
> Production과 Preview에 서로 다른 값을 설정하세요.

### 4. 환경 변수 추가 단계

각 환경 변수마다:

1. **Key** 입력란에 변수명 입력 (예: `PORTONE_V2_API_SECRET`)
2. **Value** 입력란에 실제 값 입력
3. **Environment** 선택:
   - ✅ Production (프로덕션 배포용)
   - ✅ Preview (프리뷰 배포용)
   - ✅ Development (개발 환경용)
4. **Add** 버튼 클릭

### 5. 재배포

환경 변수를 추가한 후:

1. **Deployments** 탭으로 이동
2. 최신 배포의 **⋯** 메뉴 클릭
3. **Redeploy** 선택
   - 또는 새로운 커밋을 푸시하면 자동으로 재배포됩니다

## 🔑 포트원 V2 값 확인 방법

### PORTONE_V2_API_SECRET
1. [포트원 관리자 콘솔](https://admin.portone.io) 접속
2. **V2** 메뉴 → **API Keys**
3. **API Secret** 복사

### NEXT_PUBLIC_PORTONE_V2_STORE_ID
1. **V2** 메뉴 → **Stores**
2. Store 선택 또는 생성
3. **Store ID** 복사

### NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY
1. **V2** 메뉴 → **Channels**
2. 정기 결제 지원 PG사 채널 선택
3. **Channel Key** 복사

### PORTONE_V2_WEBHOOK_SECRET
1. **V2** 메뉴 → **Webhooks**
2. Webhook 생성 또는 기존 Webhook 선택
3. **Webhook Secret** 복사

## ✅ 환경 변수 설정 체크리스트

### 필수 항목
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
- [ ] `NEXT_PUBLIC_STORAGE_BUCKET` 설정
- [ ] `PORTONE_V2_API_SECRET` 설정 ⚠️ **현재 누락**
- [ ] `NEXT_PUBLIC_PORTONE_V2_STORE_ID` 설정
- [ ] `NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY` 설정
- [ ] `PORTONE_V2_WEBHOOK_SECRET` 설정

### 선택 항목
- [ ] `NEXT_PUBLIC_SITE_URL` 설정 (환경별로 다르게 설정 가능)
  - Production: 프로덕션 도메인
  - Preview: 프리뷰 도메인
- [ ] `CRON_SECRET` 설정

## 🚨 중요 보안 주의사항

### 서버 사이드 전용 변수 (절대 프론트엔드에 노출 금지)
- `PORTONE_V2_API_SECRET`
- `PORTONE_V2_WEBHOOK_SECRET`
- `CRON_SECRET`

이 변수들은 `NEXT_PUBLIC_` 접두사가 없으므로 자동으로 서버 사이드에서만 사용됩니다.

### 프론트엔드 공개 변수
`NEXT_PUBLIC_` 접두사가 있는 변수는 프론트엔드에서 사용 가능합니다:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STORAGE_BUCKET`
- `NEXT_PUBLIC_PORTONE_V2_STORE_ID`
- `NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY`
- `NEXT_PUBLIC_SITE_URL`

## 🔄 환경 변수 적용 확인

환경 변수를 추가한 후:

1. **재배포** 실행
2. 배포 완료 후 웹사이트 접속
3. 구독 등록 페이지에서 테스트
4. 브라우저 콘솔에서 에러 확인

## 📞 문제 해결

### 환경 변수가 적용되지 않는 경우

1. **재배포 확인**: 환경 변수 추가 후 반드시 재배포 필요
2. **변수명 확인**: 대소문자 정확히 일치하는지 확인
3. **Environment 확인**: Production, Preview, Development 모두 설정했는지 확인
4. **값 확인**: 공백이나 특수문자 포함 여부 확인

### 여전히 에러가 발생하는 경우

1. Vercel 대시보드에서 환경 변수 목록 확인
2. 배포 로그 확인 (Deployments → 최신 배포 → Build Logs)
3. 서버 로그 확인 (Functions 탭)

## 🌐 Supabase Site URL 설정 (OAuth 리다이렉트용)

Supabase에서 OAuth 인증이 정상적으로 작동하려면, Supabase 대시보드에도 Site URL을 등록해야 합니다.

### Supabase 대시보드에서 Site URL 등록

1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택
3. **Authentication** → **URL Configuration** 메뉴로 이동
4. **Site URL** 섹션에서 여러 URL을 등록할 수 있습니다:
   - Production URL: `https://linkforus.com` (커스텀 도메인)
   - Preview URL: `https://linkers-6qr9kouxu-suhyeon10s-projects.vercel.app`
   - 로컬 개발 URL: `http://localhost:3000`

5. **Redirect URLs** 섹션에도 각 환경의 콜백 URL을 추가:
   - `https://linkforus.com/auth/callback` (커스텀 도메인)
   - `https://linkers-6qr9kouxu-suhyeon10s-projects.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback`

> ⚠️ **중요**: Supabase는 와일드카드 URL을 지원하지 않으므로, 
> 각 환경의 정확한 URL을 모두 등록해야 합니다.

### 환경별 설정 요약

| 환경 | Vercel 환경 변수 | Supabase Site URL | Supabase Redirect URL |
|------|-----------------|-------------------|----------------------|
| Production | `NEXT_PUBLIC_SITE_URL=https://linkforus.com` (Production만 체크) | `https://linkforus.com` | `https://linkforus.com/auth/callback` |
| Preview | `NEXT_PUBLIC_SITE_URL=https://linkers-6qr9kouxu-suhyeon10s-projects.vercel.app` (Preview만 체크) | `https://linkers-6qr9kouxu-suhyeon10s-projects.vercel.app` | `https://linkers-6qr9kouxu-suhyeon10s-projects.vercel.app/auth/callback` |
| Development | `NEXT_PUBLIC_SITE_URL=http://localhost:3000` (Development만 체크) | `http://localhost:3000` | `http://localhost:3000/auth/callback` |

## 🔗 참고 링크

- [Vercel 환경 변수 문서](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Authentication 설정](https://supabase.com/docs/guides/auth/url-configuration)
- [포트원 V2 관리자 콘솔](https://admin.portone.io/integration-v2)
- [ENV_SETUP.md](./ENV_SETUP.md) - 전체 환경 변수 가이드

