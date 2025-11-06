# 링커스 정기 결제 구현 가이드

## 개요

링커스 서비스의 월 정기 결제 시스템입니다. 첫 달은 무료로 제공되며, 이후 매월 2,000원이 자동으로 결제됩니다.

## 주요 기능

1. **첫 달 무료**: 구독 등록 시 첫 달은 무료로 이용 가능
2. **월 정기 결제**: 매월 자동으로 결제 진행
3. **구독 관리**: 자동 갱신 설정, 구독 해지 기능
4. **포트원 연동**: 포트원을 통한 안전한 결제 처리

## 구현된 파일

### 1. 데이터베이스
- `database_subscription_migration.sql`: 구독 관련 컬럼 추가 마이그레이션

### 2. API 서비스
- `src/apis/subscription.service.ts`: 포트원 정기 결제 서비스
- `src/app/api/subscription/register/route.ts`: 구독 등록 API
- `src/app/api/subscription/webhook/route.ts`: 포트원 Webhook 처리
- `src/app/api/subscription/cancel/route.ts`: 구독 해지 API

### 3. 프론트엔드
- `src/app/(home)/my/subscription/register/page.tsx`: 구독 등록 페이지
- `src/app/(home)/my/subscription/SubscriptionClient.tsx`: 구독 관리 페이지 (업데이트됨)

## 설정 방법

### 1. 데이터베이스 마이그레이션

```sql
-- database_subscription_migration.sql 실행
-- Supabase SQL Editor에서 실행하거나 마이그레이션 도구 사용
```

### 2. 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```env
# 포트원 API 키 (포트원 콘솔에서 발급)
NEXT_PUBLIC_PORTONE_REST_API_KEY=your_rest_api_key
PORTONE_REST_API_SECRET=your_rest_api_secret

# 포트원 가맹점 식별코드 (포트원 콘솔에서 확인)
NEXT_PUBLIC_PORTONE_IMP_CODE=your_imp_code

# 포트원 채널 키 (포트원 콘솔 > 결제 연동 > 연동 정보 > 채널 관리에서 확인)
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=your_channel_key
```

### 3. 포트원 콘솔 설정

1. **채널 등록**
   - 포트원 콘솔 > 결제 연동 > 연동 정보 > 채널 관리
   - 정기 결제 지원 PG사 선택 (토스페이먼츠, 나이스페이먼츠 등)
   - 채널 키 복사하여 환경 변수에 설정

2. **Webhook URL 설정**
   - 포트원 콘솔 > 설정 > Webhook
   - Webhook URL: `https://your-domain.com/api/subscription/webhook`
   - 이벤트: `payment.succeeded`, `payment.failed` 등 선택

## 사용 흐름

### 1. 구독 등록

1. 사용자가 `/my/subscription/register` 페이지 접속
2. "구독 등록하기" 버튼 클릭
3. 포트원 결제창에서 카드 정보 입력 (빌링키 발급)
4. 첫 달 무료 처리 및 다음 달 결제 예약

### 2. 월 정기 결제

1. 예약된 날짜에 포트원이 자동으로 결제 시도
2. Webhook으로 결제 결과 수신
3. 결제 성공 시:
   - 결제 내역 DB 저장
   - 다음 달 결제 예약
4. 결제 실패 시:
   - 재시도 로직 (구현 필요)

### 3. 구독 해지

1. 사용자가 `/my/subscription` 페이지에서 "구독 해지" 클릭
2. 예약된 결제 취소
3. 구독 상태를 'cancelled'로 변경

## 주요 로직

### 첫 달 무료 처리

```typescript
// 구독 등록 시
is_first_month_free: true
first_month_used: false
next_billing_date: 구독일 + 30일

// 첫 달 결제 시 (Webhook)
- 결제는 진행되지만 실제로는 무료 처리
- first_month_used: true로 변경
- 다음 달 결제 예약
```

### 월 정기 결제 스케줄링

```typescript
// 다음 달 결제일 계산
const nextBillingDate = new Date(currentDate)
nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

// 포트원 schedule API로 예약
await scheduleMonthlyPayment(
  customer_uid,
  merchant_uid,
  scheduleAt, // Unix timestamp
  amount,
  name,
  buyerInfo
)
```

## 테이블 구조

### subscriptions 테이블

```sql
- id: 구독 ID
- user_id: 사용자 ID
- plan: 플랜 ('basic')
- price: 월 구독료 (2000원)
- status: 상태 ('active', 'inactive', 'cancelled')
- auto_renew: 자동 갱신 여부
- customer_uid: 포트원 빌링키 (고객 고유 ID)
- is_first_month_free: 첫 달 무료 여부
- first_month_used: 첫 달 무료 사용 여부
- next_billing_date: 다음 결제일
- portone_merchant_uid: 포트원 주문번호
- created_at, updated_at, cancelled_at
```

### payments 테이블

```sql
- id: 결제 ID
- user_id: 사용자 ID
- subscription_id: 구독 ID
- amount: 결제 금액
- payment_status: 결제 상태
- portone_imp_uid: 포트원 거래 ID
- portone_merchant_uid: 포트원 주문번호
- is_first_month: 첫 달 결제 여부
- paid_at: 결제 일시
```

## 주의사항

1. **첫 달 무료 처리**: 첫 달 결제는 실제로 진행되지만, 금액은 0원으로 처리하거나 취소 처리해야 합니다. 현재 구현은 Webhook에서 첫 달 결제를 인식하여 처리합니다.

2. **결제 실패 처리**: 결제 실패 시 재시도 로직을 구현해야 합니다. 포트원의 재시도 API를 활용하세요.

3. **보안**: 
   - `PORTONE_REST_API_SECRET`는 서버 사이드에서만 사용
   - Webhook 검증 로직 추가 권장 (포트원 서명 검증)

4. **테스트**: 
   - 포트원 테스트 모드에서 충분히 테스트 후 실연동 전환
   - 테스트 카드 번호 사용

## 다음 단계

1. 결제 실패 시 재시도 로직 구현
2. 구독 갱신 알림 (이메일, SMS)
3. 구독 플랜 확장 (프리미엄, 엔터프라이즈)
4. 결제 내역 상세 페이지 구현
5. 영수증 발급 기능

