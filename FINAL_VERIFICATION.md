# 링커스 정기결제 시스템 최종 확인 보고서

생성일: 2025-01-27

## ✅ Supabase 데이터베이스 확인

### 1. 테이블 구조

#### `subscriptions` 테이블
- ✅ 테이블 생성 완료
- ✅ RLS 활성화됨
- ✅ 총 15개 컬럼
- ✅ 필수 컬럼 모두 존재:
  - `id` (BIGINT, PK)
  - `user_id` (UUID, NOT NULL)
  - `plan` (VARCHAR, 기본값: 'basic')
  - `price` (INTEGER, 기본값: 2000)
  - `status` (VARCHAR, 기본값: 'active')
  - `auto_renew` (BOOLEAN, 기본값: true)
  - `customer_uid` (VARCHAR, nullable, unique) - 포트원 V2 빌링키 ID
  - `is_first_month_free` (BOOLEAN, 기본값: true)
  - `first_month_used` (BOOLEAN, 기본값: false)
  - `portone_merchant_uid` (VARCHAR, nullable) - 포트원 결제 ID
  - `portone_schedule_id` (VARCHAR, nullable) - 포트원 예약 결제 ID
  - `next_billing_date` (TIMESTAMPTZ, nullable)
  - `cancelled_at` (TIMESTAMPTZ, nullable)
  - `created_at` (TIMESTAMPTZ, 기본값: now())
  - `updated_at` (TIMESTAMPTZ, 기본값: now())

#### `payments` 테이블
- ✅ 테이블 생성 완료
- ✅ RLS 활성화됨
- ✅ 총 15개 컬럼
- ✅ 필수 컬럼 모두 존재:
  - `id` (BIGINT, PK)
  - `user_id` (UUID, NOT NULL)
  - `subscription_id` (BIGINT, nullable, FK → subscriptions.id)
  - `amount` (INTEGER, NOT NULL)
  - `currency` (VARCHAR, 기본값: 'KRW')
  - `payment_method` (VARCHAR, nullable)
  - `payment_status` (VARCHAR, NOT NULL) - 'pending', 'completed', 'failed', 'cancelled'
  - `pg_provider` (VARCHAR, nullable)
  - `pg_transaction_id` (VARCHAR, nullable)
  - `portone_imp_uid` (VARCHAR, nullable) - 포트원 V1 거래번호
  - `portone_merchant_uid` (VARCHAR, nullable, unique) - 포트원 결제 ID
  - `is_first_month` (BOOLEAN, 기본값: false)
  - `paid_at` (TIMESTAMPTZ, nullable)
  - `created_at` (TIMESTAMPTZ, 기본값: now())
  - `updated_at` (TIMESTAMPTZ, 기본값: now())

### 2. RLS (Row Level Security) 정책

#### `subscriptions` 테이블
- ✅ **SELECT 정책**: "Users can view their own subscriptions"
  - 조건: `auth.uid() = user_id`
- ✅ **INSERT 정책**: "Users can insert their own subscriptions"
  - 조건: `auth.uid() = user_id`
- ✅ **UPDATE 정책**: "Users can update their own subscriptions"
  - 조건: `auth.uid() = user_id`

#### `payments` 테이블
- ✅ **SELECT 정책**: "Users can view their own payments"
  - 조건: `auth.uid() = user_id`
- ✅ **INSERT 정책**: "Users can insert their own payments"
  - 조건: `auth.uid() = user_id`

### 3. 데이터 현황
- `subscriptions`: 0개 (새로 생성된 테이블)
- `payments`: 0개 (새로 생성된 테이블)

### 4. 외래키 제약조건
- ✅ `payments.subscription_id` → `subscriptions.id`
- ✅ `subscriptions.user_id` → `auth.users.id`
- ✅ `payments.user_id` → `auth.users.id`

---

## ✅ 코드 구조 확인

### 1. 서버 사이드 코드 (서버 전용)

#### `src/apis/subscription-v2.service.ts`
- ✅ `server-only` 패키지로 보호됨
- ✅ 클라이언트 번들에 포함되지 않음
- ✅ 주요 함수:
  - `generateBillingKeyId()` - 빌링키 ID 생성 (deprecated, `src/utils/billing-key.ts`로 이동)
  - `requestPaymentWithBillingKey()` - 빌링키로 즉시 결제
  - `scheduleMonthlyPayment()` - 월 정기 결제 예약 (재시도 로직 포함)
  - `unschedulePayment()` - 결제 예약 취소
  - `getPayment()` - 결제 정보 조회
  - `getBillingKey()` - 빌링키 정보 조회
  - `calculateNextBillingDate()` - 다음 결제일 계산
  - `getNextBillingDateISO()` - 다음 결제일 ISO 형식 변환
  - `verifyWebhook()` - 웹훅 검증

#### API 라우트
- ✅ `/api/subscription-v2/register` - 구독 등록
- ✅ `/api/subscription-v2/webhook` - 웹훅 처리
- ✅ `/api/subscription-v2/cancel` - 구독 해지
- ✅ `/api/subscription-v2/retry-payment` - 결제 재시도

### 2. 클라이언트 사이드 코드

#### `src/utils/billing-key.ts`
- ✅ 빌링키 ID 생성 유틸리티 (클라이언트/서버 양쪽 사용 가능)

#### `src/app/(home)/my/subscription/register-v2/page.tsx`
- ✅ 포트원 V2 빌링키 발급 UI
- ✅ 구독 등록 처리

#### `src/app/(home)/my/subscription/SubscriptionClient.tsx`
- ✅ 구독 정보 조회
- ✅ 결제 내역 조회
- ✅ 구독 해지
- ✅ 결제 재시도

---

## ⚠️ PortOne V2 설정 확인 필요

### 필수 환경 변수 (Vercel에 설정 필요)

#### 서버 사이드 전용 (절대 프론트엔드에 노출 금지)
```
PORTONE_V2_API_SECRET=your_v2_api_secret_here
PORTONE_V2_WEBHOOK_SECRET=your_v2_webhook_secret_here
```

#### 프론트엔드 공개 변수
```
NEXT_PUBLIC_PORTONE_V2_STORE_ID=store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY=channel-key-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### PortOne V2 콘솔 설정 확인 사항

1. **Store 생성**
   - [포트원 관리자 콘솔](https://admin.portone.io) → V2 → Stores
   - Store ID 확인 → `NEXT_PUBLIC_PORTONE_V2_STORE_ID`에 설정

2. **Channel 등록**
   - V2 → Channels
   - 정기 결제 지원 PG사 선택 (토스페이먼츠, KSNET 등)
   - Channel Key 확인 → `NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY`에 설정

3. **API Secret 발급**
   - V2 → API Keys
   - API Secret 생성 → `PORTONE_V2_API_SECRET`에 설정

4. **Webhook 설정**
   - V2 → Webhooks
   - Webhook URL: `https://makers-b2b.vercel.app/api/subscription-v2/webhook`
   - Webhook Secret 생성 → `PORTONE_V2_WEBHOOK_SECRET`에 설정
   - 이벤트 선택: `Transaction.Paid`, `Transaction.Failed` 등

---

## ✅ 빌드 상태

- ✅ 빌드 성공
- ✅ TypeScript 타입 검사 통과
- ✅ 서버 사이드 코드 클라이언트 번들에서 제외됨 (`server-only` 패키지 사용)
- ✅ 총 62개 페이지 생성 완료

---

## 📋 체크리스트

### 데이터베이스
- [x] `subscriptions` 테이블 생성
- [x] `payments` 테이블 생성
- [x] RLS 정책 설정
- [x] 외래키 제약조건 설정
- [x] 인덱스 설정

### 코드
- [x] 서버 사이드 서비스 파일 (`subscription-v2.service.ts`)
- [x] API 라우트 구현
- [x] 클라이언트 사이드 페이지 구현
- [x] 빌링키 ID 생성 유틸리티 분리
- [x] 서버 사이드 코드 보호 (`server-only`)

### 환경 변수
- [ ] Vercel에 `PORTONE_V2_API_SECRET` 설정
- [ ] Vercel에 `NEXT_PUBLIC_PORTONE_V2_STORE_ID` 설정
- [ ] Vercel에 `NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY` 설정
- [ ] Vercel에 `PORTONE_V2_WEBHOOK_SECRET` 설정

### PortOne V2 콘솔
- [ ] Store 생성 및 ID 확인
- [ ] Channel 등록 및 Key 확인
- [ ] API Secret 발급
- [ ] Webhook 설정

---

## 🚀 다음 단계

1. **Vercel 환경 변수 설정**
   - Vercel 대시보드 → Settings → Environment Variables
   - 위의 필수 환경 변수 모두 추가

2. **PortOne V2 콘솔 설정**
   - Store, Channel, API Secret, Webhook 설정 완료

3. **테스트**
   - 구독 등록 테스트
   - 결제 프로세스 테스트
   - 웹훅 수신 테스트

---

## 📝 참고 문서

- `ENV_SETUP.md` - 환경 변수 설정 가이드
- `VERCEL_ENV_SETUP.md` - Vercel 배포 환경 변수 설정 가이드
- `WEBHOOK_ENDPOINTS.md` - 웹훅 엔드포인트 정보
- `SUBSCRIPTION_V2_CHECKLIST.md` - 구현 체크리스트

---

**결론**: 데이터베이스와 코드 구조는 모두 준비되었습니다. Vercel 환경 변수 설정과 PortOne V2 콘솔 설정만 완료하면 정기결제 시스템을 사용할 수 있습니다.

