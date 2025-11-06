# 월 정기결제 완전 구현 가이드

## 개요

링커스 서비스의 월 정기결제 시스템이 완전히 구현되었습니다. 첫 달 무료 + 매월 자동 결제가 가능합니다.

## 구현된 기능

### 1. 구독 등록 (`/api/subscription/register`)
- 빌링키 발급 후 구독 등록
- 첫 달 무료 처리
- 30일 후 첫 결제 예약

### 2. 포트원 Webhook 처리 (`/api/subscription/webhook`)
- 결제 성공 시 자동 처리
- 결제 내역 저장
- 다음 달 결제 자동 예약
- 첫 달 무료 처리

### 3. 월 정기결제 자동 처리 (`/api/subscription/process-monthly`)
- 매일 실행하여 결제일인 구독 처리
- Vercel Cron Jobs 또는 외부 스케줄러에서 호출
- 결제 실패 시 자동 재시도

### 4. 결제 재시도 (`/api/subscription/retry-payment`)
- 결제 실패한 구독 수동 재시도
- 사용자가 직접 재시도 가능

### 5. 구독 해지 (`/api/subscription/cancel`)
- 예약된 결제 취소
- 구독 상태 변경

## 월 정기결제 플로우

### 1단계: 구독 등록
```
사용자 → 구독 등록 페이지 → 카드 정보 입력 (빌링키 발급)
→ /api/subscription/register 호출
→ 첫 달 무료 설정 + 30일 후 첫 결제 예약
```

### 2단계: 첫 결제 (30일 후)
```
포트원이 예약된 시간에 자동 결제 시도
→ Webhook으로 결제 결과 수신
→ /api/subscription/webhook 처리
→ 결제 내역 저장 + 다음 달 결제 예약
```

### 3단계: 이후 매월 결제
```
매월 같은 날짜에 자동 결제
→ Webhook 처리
→ 다음 달 결제 예약 (반복)
```

## 스케줄러 설정

### Vercel Cron Jobs 사용

`vercel.json` 파일에 추가:

```json
{
  "crons": [
    {
      "path": "/api/subscription/process-monthly",
      "schedule": "0 9 * * *"
    }
  ]
}
```

- `schedule: "0 9 * * *"`: 매일 오전 9시 실행
- 매일 결제일인 구독을 확인하여 결제 처리

### 환경 변수 추가

`.env.local`:
```env
CRON_SECRET=your_secure_random_string
```

### 외부 스케줄러 사용

외부 스케줄러(예: GitHub Actions, AWS EventBridge)에서 호출:

```bash
curl -X POST https://your-domain.com/api/subscription/process-monthly \
  -H "Authorization: Bearer your_cron_secret"
```

## API 사용 예시

### 1. 구독 등록

```typescript
// 프론트엔드
const response = await fetch('/api/subscription/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer_uid: 'linkers_user123_1234567890',
    buyer_info: {
      name: '홍길동',
      email: 'hong@example.com',
      tel: '010-1234-5678',
    },
  }),
})
```

### 2. 결제 재시도

```typescript
// 결제 실패한 구독 재시도
const response = await fetch('/api/subscription/retry-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscription_id: 1,
  }),
})
```

### 3. 월 정기결제 자동 처리 (스케줄러)

```bash
# 매일 실행
curl -X POST https://your-domain.com/api/subscription/process-monthly \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

## 주요 코드 파일

### 서비스 레이어
- `src/apis/subscription.service.ts`: 포트원 API 연동

### API 엔드포인트
- `src/app/api/subscription/register/route.ts`: 구독 등록
- `src/app/api/subscription/webhook/route.ts`: Webhook 처리
- `src/app/api/subscription/process-monthly/route.ts`: 월 정기결제 자동 처리
- `src/app/api/subscription/retry-payment/route.ts`: 결제 재시도
- `src/app/api/subscription/cancel/route.ts`: 구독 해지

### 프론트엔드
- `src/app/(home)/my/subscription/register/page.tsx`: 구독 등록 페이지
- `src/app/(home)/my/subscription/SubscriptionClient.tsx`: 구독 관리 페이지

## 데이터베이스 스키마

### subscriptions 테이블
```sql
- id: 구독 ID
- user_id: 사용자 ID
- customer_uid: 포트원 빌링키
- plan: 플랜 ('basic')
- price: 월 구독료 (2000원)
- status: 상태 ('active', 'inactive', 'cancelled')
- auto_renew: 자동 갱신 여부
- is_first_month_free: 첫 달 무료 여부
- first_month_used: 첫 달 무료 사용 여부
- next_billing_date: 다음 결제일
- portone_merchant_uid: 포트원 주문번호
```

### payments 테이블
```sql
- id: 결제 ID
- user_id: 사용자 ID
- subscription_id: 구독 ID
- amount: 결제 금액
- payment_status: 결제 상태 ('completed', 'failed')
- portone_imp_uid: 포트원 거래 ID
- portone_merchant_uid: 포트원 주문번호
- is_first_month: 첫 달 결제 여부
- paid_at: 결제 일시
```

## 월 정기결제 로직 상세

### 1. 구독 등록 시
```typescript
// 첫 달 무료 설정
is_first_month_free: true
first_month_used: false
next_billing_date: 구독일 + 30일

// 30일 후 첫 결제 예약
scheduleMonthlyPayment(
  customer_uid,
  merchant_uid,
  scheduleAt, // 30일 후
  2000,
  '링커스 월 구독료',
  buyerInfo
)
```

### 2. 첫 결제 시 (Webhook)
```typescript
// 결제 내역 저장
// 첫 달 무료 플래그 업데이트
first_month_used: true

// 다음 달 결제 예약
next_billing_date: 현재일 + 1개월
scheduleMonthlyPayment(...) // 다음 달 예약
```

### 3. 이후 매월 결제
```typescript
// 매월 같은 날짜에 자동 결제
// Webhook으로 결과 수신
// 다음 달 결제 예약 (반복)
```

## 결제 실패 처리

### 자동 재시도
- `process-monthly` API에서 결제 실패 시 실패 내역 저장
- 사용자가 수동으로 재시도 가능

### 수동 재시도
- `/api/subscription/retry-payment` API 호출
- 결제 실패한 구독에 대해 재시도

## 보안 고려사항

1. **Cron Secret**: `process-monthly` API는 인증 키 필요
2. **Webhook 검증**: 포트원 Webhook 서명 검증 추가 권장
3. **RLS 정책**: Supabase RLS로 데이터 접근 제한

## 테스트 방법

### 1. 구독 등록 테스트
```bash
# 테스트 카드로 구독 등록
# 포트원 테스트 모드 사용
```

### 2. Webhook 테스트
```bash
# 포트원 콘솔에서 Webhook 테스트 전송
# 또는 실제 결제 후 Webhook 수신 확인
```

### 3. 월 정기결제 테스트
```bash
# process-monthly API 직접 호출
curl -X POST http://localhost:3000/api/subscription/process-monthly \
  -H "Authorization: Bearer your_cron_secret"
```

## 모니터링

### 로그 확인
- 결제 성공/실패 로그
- Webhook 처리 로그
- 월 정기결제 처리 로그

### 알림 설정
- 결제 실패 시 알림 (이메일, SMS)
- 월 정기결제 처리 결과 알림

## 다음 단계

1. 결제 실패 시 자동 재시도 로직 강화
2. 결제 실패 알림 시스템 구축
3. 구독 갱신 알림 (이메일, SMS)
4. 결제 내역 상세 페이지 구현
5. 영수증 발급 기능

