# 환경 변수 설정 가이드

링커스 프로젝트에 필요한 모든 환경 변수를 정리한 문서입니다.

## 📋 목차

1. [필수 환경 변수](#필수-환경-변수)
2. [포트원 V2 환경 변수](#포트원-v2-환경-변수)
3. [포트원 V1 환경 변수](#포트원-v1-환경-변수-선택사항)
4. [Supabase 환경 변수](#supabase-환경-변수)
5. [기타 환경 변수](#기타-환경-변수)
6. [환경 변수 설정 방법](#환경-변수-설정-방법)
7. [보안 주의사항](#보안-주의사항)

---

## 필수 환경 변수

프로젝트를 실행하기 위해 반드시 설정해야 하는 환경 변수입니다.

### Supabase (필수)

```env
# Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anon Key (공개 키)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Supabase Storage 버킷 이름
NEXT_PUBLIC_STORAGE_BUCKET=your_bucket_name
```

**확인 방법:**
1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택 > Settings > API
3. Project URL과 anon public key 복사
4. Storage > Buckets에서 버킷 이름 확인

---

## 포트원 V2 환경 변수

포트원 V2를 사용하는 경우 설정합니다. (권장)

```env
# 포트원 V2 API Secret (서버 사이드 전용)
PORTONE_V2_API_SECRET=your_v2_api_secret_here

# 포트원 V2 Store ID
NEXT_PUBLIC_PORTONE_V2_STORE_ID=store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# 포트원 V2 Channel Key
NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY=channel-key-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# 포트원 V2 Webhook Secret (서버 사이드 전용)
PORTONE_V2_WEBHOOK_SECRET=your_v2_webhook_secret_here
```

**확인 방법:**
1. [포트원 관리자 콘솔](https://admin.portone.io) 접속
2. V2 > API Keys: API Secret 복사
3. V2 > Stores: Store ID 복사
4. V2 > Channels: Channel Key 복사
5. V2 > Webhooks: Webhook Secret 복사

**사용 위치:**
- `PORTONE_V2_API_SECRET`: `src/apis/subscription-v2.service.ts`
- `NEXT_PUBLIC_PORTONE_V2_STORE_ID`: `src/app/(home)/my/subscription/register-v2/page.tsx`
- `NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY`: `src/app/(home)/my/subscription/register-v2/page.tsx`
- `PORTONE_V2_WEBHOOK_SECRET`: `src/app/api/subscription-v2/webhook/route.ts`

---

## 포트원 V1 환경 변수 (선택사항)

포트원 V1을 사용하는 경우 설정합니다. V2 사용 시 불필요합니다.

```env
# 포트원 REST API Key
NEXT_PUBLIC_PORTONE_REST_API_KEY=your_rest_api_key_here

# 포트원 REST API Secret (서버 사이드 전용)
PORTONE_REST_API_SECRET=your_rest_api_secret_here

# 포트원 가맹점 식별코드
NEXT_PUBLIC_PORTONE_IMP_CODE=imp12345678

# 포트원 채널 키
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=channel_key_here
```

**확인 방법:**
1. [포트원 관리자 콘솔](https://admin.portone.io) 접속
2. 설정 > 내 식별코드, API Keys: REST API Key, Secret, IMP 코드 복사
3. 결제 연동 > 연동 정보 > 채널 관리: 채널 키 복사

**사용 위치:**
- `NEXT_PUBLIC_PORTONE_REST_API_KEY`: `src/apis/subscription.service.ts`
- `PORTONE_REST_API_SECRET`: `src/apis/subscription.service.ts`
- `NEXT_PUBLIC_PORTONE_IMP_CODE`: `src/app/(home)/my/subscription/register/page.tsx`
- `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`: `src/app/(home)/my/subscription/register/page.tsx`

---

## 기타 환경 변수

### 필수

```env
# 사이트 URL (프로덕션 환경에서 사용)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

**사용 위치:** `src/lib/utils.ts`

### 선택사항

```env
# 월 정기결제 자동 처리 API 보안 키
CRON_SECRET=your_secure_random_string_here
```

**생성 방법:**
```bash
# 랜덤 문자열 생성 (32자리)
openssl rand -hex 32
```

**사용 위치:** `src/app/api/subscription/process-monthly/route.ts`

---

## 환경 변수 설정 방법

### 1. 로컬 개발 환경

프로젝트 루트에 `.env.local` 파일을 생성하고 위의 환경 변수들을 추가하세요.

```bash
# .env.local 파일 생성
touch .env.local
```

`.env.local` 파일 예시:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_STORAGE_BUCKET=your_bucket_name

# 포트원 V2 (권장)
PORTONE_V2_API_SECRET=your_v2_api_secret_here
NEXT_PUBLIC_PORTONE_V2_STORE_ID=store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY=channel-key-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PORTONE_V2_WEBHOOK_SECRET=your_v2_webhook_secret_here

# 기타
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CRON_SECRET=your_secure_random_string_here
```

### 2. 프로덕션 환경 (Vercel)

1. [Vercel 대시보드](https://vercel.com) 접속
2. 프로젝트 선택 > Settings > Environment Variables
3. 각 환경 변수 추가
4. Environment 선택 (Production, Preview, Development)
5. Save

### 3. 환경 변수 우선순위

Next.js는 다음 순서로 환경 변수를 로드합니다:

1. `.env.local` (모든 환경, Git에 커밋하지 않음)
2. `.env.development` / `.env.production` (환경별)
3. `.env` (기본값)

---

## 보안 주의사항

### ⚠️ 절대 Git에 커밋하지 마세요!

다음 파일들은 `.gitignore`에 포함되어 있습니다:
- `.env.local`
- `.env*.local`
- `.env.development.local`
- `.env.production.local`

### 🔒 서버 사이드 전용 변수

다음 환경 변수는 **절대 프론트엔드에 노출되지 않도록** 주의하세요:

- `PORTONE_V2_API_SECRET`
- `PORTONE_V2_WEBHOOK_SECRET`
- `PORTONE_REST_API_SECRET`
- `CRON_SECRET`

이 변수들은 `NEXT_PUBLIC_` 접두사가 없으므로 자동으로 서버 사이드에서만 사용됩니다.

### ✅ 프론트엔드 공개 변수

`NEXT_PUBLIC_` 접두사가 있는 변수는 프론트엔드에서 사용 가능합니다:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STORAGE_BUCKET`
- `NEXT_PUBLIC_PORTONE_V2_STORE_ID`
- `NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY`
- `NEXT_PUBLIC_PORTONE_REST_API_KEY`
- `NEXT_PUBLIC_PORTONE_IMP_CODE`
- `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`
- `NEXT_PUBLIC_SITE_URL`

---

## 환경 변수 체크리스트

### 필수 항목

- [ ] `.env.local` 파일 생성
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
- [ ] `NEXT_PUBLIC_STORAGE_BUCKET` 설정

### 포트원 V2 (권장)

- [ ] `PORTONE_V2_API_SECRET` 설정
- [ ] `NEXT_PUBLIC_PORTONE_V2_STORE_ID` 설정
- [ ] `NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY` 설정
- [ ] `PORTONE_V2_WEBHOOK_SECRET` 설정
- [ ] 포트원 V2 콘솔에서 Store 생성 완료
- [ ] 포트원 V2 콘솔에서 Channel 등록 완료
- [ ] 포트원 V2 콘솔에서 Webhook 설정 완료

### 포트원 V1 (선택사항)

- [ ] `NEXT_PUBLIC_PORTONE_REST_API_KEY` 설정
- [ ] `PORTONE_REST_API_SECRET` 설정
- [ ] `NEXT_PUBLIC_PORTONE_IMP_CODE` 설정
- [ ] `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` 설정

### 기타

- [ ] `NEXT_PUBLIC_SITE_URL` 설정 (프로덕션)
- [ ] `CRON_SECRET` 설정 (선택사항)

---

## 문제 해결

### 환경 변수가 적용되지 않는 경우

1. **서버 재시작**
   ```bash
   # 개발 서버 재시작
   npm run dev
   ```

2. **파일 위치 확인**
   - `.env.local` 파일이 프로젝트 루트에 있는지 확인
   - 파일명 오타 확인 (`.env.local` 정확히)

3. **변수명 확인**
   - 대소문자 정확히 일치하는지 확인
   - `NEXT_PUBLIC_` 접두사 확인 (프론트엔드 사용 시)

4. **캐시 삭제**
   ```bash
   # Next.js 캐시 삭제
   rm -rf .next
   npm run dev
   ```

### 환경 변수 확인 방법

```typescript
// 서버 사이드에서 확인
console.log(process.env.PORTONE_V2_API_SECRET)

// 프론트엔드에서 확인 (NEXT_PUBLIC_ 접두사 필요)
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

---

## 참고 자료

- [Next.js 환경 변수 문서](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase 문서](https://supabase.com/docs)
- [포트원 V2 관리자 콘솔](https://admin.portone.io/integration-v2)
- [포트원 V2 개발자 문서](https://developers.portone.io/opi/ko/integration/start/v2/readme)

---

## 빠른 시작

1. `.env.local` 파일 생성
2. 위의 필수 환경 변수 설정
3. 개발 서버 실행: `npm run dev`
4. 브라우저에서 `http://localhost:3000` 접속

자세한 설정 방법은 각 섹션의 "확인 방법"을 참고하세요.

