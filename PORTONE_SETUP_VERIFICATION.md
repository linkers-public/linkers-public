# 포트원 설정 확인 결과

## 📋 확인 일시
2025-11-07

## 🏪 상점 정보

### Store ID
```
store-b7989765-d2bf-4cd4-a9e4-01bf6abfc7df
```

**설정 위치:**
- 환경 변수: `NEXT_PUBLIC_PORTONE_V2_STORE_ID`
- 사용 파일: `src/app/(home)/my/subscription/register-v2/page.tsx`

---

## 🔑 채널 정보

### 정기결제용 채널 (권장)
```
채널 ID: channel-id-bca9c4b1-3da4-4a78-bc6d-870e494b7439
채널 키: channel-key-d738bdfd-6896-4aed-9700-7634ca13c91a
PG사: 토스페이먼츠
이름: 토스페이먼츠 결제창 정기결제
V2 지원: ✅
```

**설정 위치:**
- 환경 변수: `NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY`
- 사용 파일: `src/app/(home)/my/subscription/register-v2/page.tsx`

### 일반결제용 채널 (참고)
```
채널 ID: channel-id-ea523f3f-c4a8-483d-96e0-e83326d9517b
채널 키: channel-key-48201276-18bf-4f72-a0e6-eaeedc0eb2a9
PG사: 토스페이먼츠
이름: 토스페이먼츠 결제창 일반결제
V2 지원: ✅
```

---

## 🔐 API Secret

**설정 위치:**
- 환경 변수: `PORTONE_V2_API_SECRET` (서버 사이드 전용)
- 사용 파일: `src/apis/subscription-v2.service.ts`

**확인 방법:**
1. [포트원 관리자 콘솔](https://admin.portone.io) 접속
2. V2 > API Keys 메뉴
3. API Secret 확인 (한 번만 표시되므로 안전하게 보관)

---

## 🔔 Webhook 설정

### Webhook URL
```
프로덕션: https://makers-b2b.vercel.app/api/subscription-v2/webhook
로컬: http://localhost:3000/api/subscription-v2/webhook
```

### Webhook Secret
```
whsec_vIdI10tq2JT+gnmfxPeVNpIn7blsPHGUqris6fB5+m0=
```

**설정 위치:**
- 환경 변수: `PORTONE_V2_WEBHOOK_SECRET` (서버 사이드 전용)
- 사용 파일: `src/app/api/subscription-v2/webhook/route.ts`

**확인 방법:**
1. [포트원 관리자 콘솔](https://admin.portone.io) 접속
2. V2 > Webhooks 메뉴
3. Webhook Secret 확인

---

## ✅ 환경 변수 체크리스트

### 필수 환경 변수

- [ ] `PORTONE_V2_API_SECRET` - API Secret (서버 사이드)
- [ ] `NEXT_PUBLIC_PORTONE_V2_STORE_ID` - Store ID (클라이언트)
- [ ] `NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY` - Channel Key (클라이언트)
- [ ] `PORTONE_V2_WEBHOOK_SECRET` - Webhook Secret (서버 사이드)

### 권장 채널

**정기결제용 채널 사용 권장:**
```
NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY=channel-key-d738bdfd-6896-4aed-9700-7634ca13c91a
```

---

## 📝 설정 확인 방법

### 1. 로컬 환경 변수 확인
```bash
# .env.local 파일 확인
cat .env.local | grep PORTONE
```

### 2. Vercel 환경 변수 확인
1. [Vercel Dashboard](https://vercel.com) 접속
2. 프로젝트 선택
3. Settings > Environment Variables
4. Production, Preview, Development 환경별로 확인

### 3. 포트원 콘솔 확인
1. [포트원 관리자 콘솔](https://admin.portone.io) 접속
2. V2 메뉴에서 각 설정 확인:
   - Stores: Store ID
   - Channels: Channel Key
   - API Keys: API Secret
   - Webhooks: Webhook Secret

---

## 🔍 코드에서 사용 위치

### 클라이언트 사이드
- `src/app/(home)/my/subscription/register-v2/page.tsx`
  - `NEXT_PUBLIC_PORTONE_V2_STORE_ID`
  - `NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY`

### 서버 사이드
- `src/apis/subscription-v2.service.ts`
  - `PORTONE_V2_API_SECRET`
- `src/app/api/subscription-v2/webhook/route.ts`
  - `PORTONE_V2_WEBHOOK_SECRET`
- `src/app/api/subscription-v2/register/route.ts`
  - `scheduleMonthlyPayment` 함수 사용 (내부적으로 `PORTONE_V2_API_SECRET` 사용)

---

## ⚠️ 주의사항

1. **API Secret과 Webhook Secret은 서버 사이드 전용**
   - 클라이언트 번들에 포함되지 않도록 `server-only` 보호
   - 환경 변수 이름에 `NEXT_PUBLIC_` 접두사 없음

2. **Store ID와 Channel Key는 클라이언트에서 사용**
   - 환경 변수 이름에 `NEXT_PUBLIC_` 접두사 필요
   - 빌링키 발급 UI에서 사용

3. **정기결제용 채널 사용 권장**
   - 일반결제 채널도 사용 가능하지만, 정기결제 전용 채널 사용 권장

---

## 🚀 다음 단계

1. 환경 변수 설정 확인
2. Vercel에 환경 변수 배포
3. 웹훅 URL 확인 및 테스트
4. 빌링키 발급 테스트
5. 결제 예약 테스트

