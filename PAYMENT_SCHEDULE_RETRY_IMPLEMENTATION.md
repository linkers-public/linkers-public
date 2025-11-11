# 결제 예약 실패 재시도 로직 구현 완료

## 📋 개요

**포트원에 결제 예약을 등록하는 단계**가 실패한 경우 자동으로 재시도하는 시스템을 구현했습니다.

**중요**: 이 재시도 로직은 포트원이 결제를 시도하는 것과는 별개입니다.
- 포트원이 결제를 시도하려면 먼저 **결제 예약 등록이 성공**해야 합니다
- 결제 예약 등록이 실패하면 포트원이 결제를 시도할 수 없습니다
- 따라서 결제 예약 등록 실패 시 재시도가 필요합니다

**포트원의 재시도 정책**:
- 포트원은 **웹훅 재시도**와 **결제 실패 재시도(리커버리)**를 제공합니다
- 하지만 **결제 예약 등록 실패**에 대한 재시도는 명시적으로 권장하지 않습니다
- 다만, 빌링키 발급 직후 포트원 서버 반영 지연으로 인한 `BILLING_KEY_NOT_FOUND` 에러는 일시적이므로 재시도가 유용합니다

**구현 일자**: 2025-01-XX  
**우선순위**: P0 (높은 우선순위)

---

## ✅ 구현 완료 사항

### 1. 재시도 큐 테이블 생성
- **파일**: `database_payment_retry_queue.sql`
- **테이블**: `payment_retry_queue`
- **기능**:
  - 실패한 결제 예약 정보 저장
  - 재시도 횟수 및 상태 관리
  - 지수 백오프를 위한 `next_retry_at` 필드

### 2. 결제 예약 실패 시 큐 저장
- **파일**: `src/app/api/subscription-v2/register/route.ts`
- **변경 사항**:
  - 결제 예약 실패 시 자동으로 재시도 큐에 저장
  - 5분 후 첫 재시도 예약
  - 에러 정보 상세 저장

### 3. 재시도 처리 API
- **파일**: `src/app/api/subscription-v2/retry-payment-schedule/route.ts`
- **기능**:
  - 재시도 대기 중인 항목 조회
  - 결제 예약 재시도 실행
  - 성공 시 구독 정보 업데이트
  - 실패 시 지수 백오프로 다음 재시도 예약
  - 최대 재시도 횟수 초과 시 실패 처리

### 4. Vercel Cron Job 설정
- **파일**: `vercel.json`
- **스케줄**: 10분마다 실행 (`*/10 * * * *`)
- **엔드포인트**: `/api/subscription-v2/retry-payment-schedule`

---

## 🔄 동작 흐름

### 결제 예약 등록 vs 포트원 결제 시도

**포트원의 정기 결제 흐름**:
1. 우리 서버 → 포트원 API: `scheduleMonthlyPayment()` 호출 (결제 예약 등록)
2. 포트원: 예약된 시간에 자동으로 결제 시도
3. 포트원 → 우리 서버: 웹훅으로 결제 결과 전송

**재시도 로직이 필요한 이유**:
- 1단계(결제 예약 등록)가 실패하면 2단계(포트원 결제 시도)가 발생하지 않음
- 예: 빌링키가 아직 포트원 서버에 반영되지 않아 `BILLING_KEY_NOT_FOUND` 에러 발생
- 이 경우 결제 예약 등록을 재시도해야 포트원이 결제를 시도할 수 있음

### 1. 구독 등록 시 결제 예약 등록 실패
```
사용자 → 구독 등록
  ↓
빌링키 발급 성공
  ↓
구독 정보 DB 저장
  ↓
결제 예약 시도 (비동기)
  ↓
[실패]
  ↓
재시도 큐에 저장
  - status: 'pending'
  - next_retry_at: 5분 후
  - retry_count: 0
```

### 2. 웹훅에서 다음 달 결제 예약 등록 실패

웹훅에서도 다음 달 결제 예약을 등록하는데, 여기서도 실패할 수 있습니다:
```
포트원 → 웹훅 (결제 완료)
  ↓
결제 내역 저장
  ↓
다음 달 결제 예약 등록 시도
  ↓
[실패] (현재는 로그만 남김)
  ↓
재시도 큐에 저장 (향후 구현 가능)
```

**참고**: 현재 웹훅에서는 예약 실패 시 로그만 남기고 있습니다. 필요 시 동일한 재시도 로직을 적용할 수 있습니다.

### 3. 재시도 처리 (Cron Job)
```
Cron Job (10분마다)
  ↓
재시도 큐 조회
  - status = 'pending'
  - next_retry_at <= 현재 시간
  ↓
각 항목에 대해:
  ├─ [성공]
  │   ├─ scheduleId를 구독 정보에 저장
  │   └─ 큐 항목 status = 'completed'
  │
  └─ [실패]
      ├─ retry_count < max_retries (5)
      │   ├─ 지수 백오프 계산 (2^retry_count * 5분, 최대 60분)
      │   ├─ next_retry_at 업데이트
      │   └─ status = 'pending' (재시도 대기)
      │
      └─ retry_count >= max_retries
          └─ status = 'failed' (최종 실패)
```

---

## 📊 데이터베이스 스키마

### payment_retry_queue 테이블

```sql
CREATE TABLE payment_retry_queue (
  id UUID PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  billing_key TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  amount INTEGER NOT NULL,
  order_name TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone_number TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
  error_message TEXT,
  last_error_type TEXT,
  last_error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  next_retry_at TIMESTAMP
);
```

### 인덱스
- `idx_payment_retry_queue_status`: status 필드 인덱스
- `idx_payment_retry_queue_subscription_id`: subscription_id 인덱스
- `idx_payment_retry_queue_next_retry_at`: next_retry_at 인덱스 (pending 상태만)

---

## ⚙️ 설정

### 환경 변수

`.env.local`에 다음 변수 추가 (선택사항):
```env
CRON_SECRET=your_secure_random_string
```

**참고**: `CRON_SECRET`이 설정되지 않으면 인증 없이도 접근 가능합니다. 프로덕션 환경에서는 반드시 설정하세요.

### Vercel Cron Jobs

`vercel.json` 파일이 자동으로 Vercel에 배포되면 Cron Job이 활성화됩니다.

**스케줄**: 10분마다 실행 (`*/10 * * * *`)

---

## 🔍 모니터링

### 재시도 큐 상태 확인

```sql
-- 대기 중인 재시도 항목
SELECT * FROM payment_retry_queue 
WHERE status = 'pending' 
ORDER BY next_retry_at;

-- 실패한 항목
SELECT * FROM payment_retry_queue 
WHERE status = 'failed' 
ORDER BY created_at DESC;

-- 처리 중인 항목
SELECT * FROM payment_retry_queue 
WHERE status = 'processing';
```

### 로그 확인

재시도 처리 로그는 다음 형식으로 출력됩니다:

```
결제 예약 재시도 성공: { queue_id, subscription_id, payment_id }
결제 예약 재시도 실패 - 다음 재시도 예약: { queue_id, retry_count, next_retry_at }
결제 예약 재시도 최종 실패: { queue_id, subscription_id, error }
```

---

## 📈 재시도 전략

### 지수 백오프 (Exponential Backoff)

재시도 간격은 다음과 같이 계산됩니다:

```
재시도 간격 = min(2^retry_count * 5분, 60분)
```

예시:
- 1차 재시도: 5분 후
- 2차 재시도: 10분 후
- 3차 재시도: 20분 후
- 4차 재시도: 40분 후
- 5차 재시도: 60분 후 (최대)
- 6차 재시도: 실패 처리 (max_retries = 5)

### 최대 재시도 횟수

기본값: **5회**

설정 변경:
```sql
UPDATE payment_retry_queue 
SET max_retries = 10 
WHERE id = 'queue_id';
```

---

## 🚨 에러 처리

### 재시도 큐 저장 실패

재시도 큐 저장 자체가 실패해도 사용자에게는 영향이 없습니다:
- 로그만 남김
- 구독 등록은 성공으로 처리
- 수동으로 재시도 가능

### 최대 재시도 횟수 초과

최대 재시도 횟수를 초과하면:
- `status = 'failed'`로 변경
- 관리자가 수동으로 확인 필요
- 필요 시 수동 재시도 가능

---

## 🔧 수동 재시도

### API를 통한 수동 재시도

```bash
curl -X POST https://your-domain.com/api/subscription-v2/retry-payment-schedule \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

### 특정 항목 재시도

재시도 큐의 특정 항목을 다시 활성화:

```sql
UPDATE payment_retry_queue 
SET 
  status = 'pending',
  retry_count = 0,
  next_retry_at = NOW() + INTERVAL '5 minutes'
WHERE id = 'queue_id';
```

---

## 📝 TODO 제거

다음 TODO 주석이 제거되었습니다:

**파일**: `src/app/api/subscription-v2/register/route.ts`  
**라인**: 176  
**내용**: `// TODO: 실패 시 재시도 로직 추가 (예: cron job 또는 별도 큐)`

## 💡 추가 개선 가능 사항

### 웹훅에서의 결제 예약 실패 처리

현재 웹훅(`src/app/api/subscription-v2/webhook/route.ts`)에서 다음 달 결제 예약이 실패하면 로그만 남기고 있습니다 (라인 225-233).

필요 시 동일한 재시도 큐 로직을 적용할 수 있습니다:

```typescript
// 웹훅에서 결제 예약 실패 시
catch (scheduleError: any) {
  // 재시도 큐에 저장
  await supabase.from('payment_retry_queue').insert({...})
}
```

## 📚 포트원의 재시도 정책 참고

포트원은 다음 재시도 정책을 제공합니다:

1. **웹훅 재시도**: 
   - 웹훅 전송 실패 시 총 5회까지 재시도
   - Exponential Backoff + Jitter 적용
   - [포트원 기술 블로그 - 웹훅 재시도](https://developers.portone.io/blog/posts/2024-02/v2-webhook)

2. **결제 실패 재시도 (리커버리)**:
   - 포트원 콘솔에서 제공하는 기능
   - 결제 실패 건에 대한 일괄 재시도 자동화
   - 매일 설정한 시간에 전날 실패한 결제 재시도

3. **결제 예약 등록 실패 재시도**:
   - 포트원에서 명시적으로 권장하지 않음
   - 하지만 빌링키 반영 지연 등 일시적 오류에 대비해 구현 권장

---

## ✅ 체크리스트

- [x] 재시도 큐 테이블 생성
- [x] 결제 예약 실패 시 큐 저장 로직
- [x] 재시도 처리 API 구현
- [x] Vercel Cron Job 설정
- [x] 지수 백오프 구현
- [x] 최대 재시도 횟수 처리
- [x] 에러 로깅
- [x] TODO 주석 제거

---

## 🚀 다음 단계

1. **DB 마이그레이션 실행**
   ```bash
   # Supabase SQL Editor에서 실행
   # database_payment_retry_queue.sql 파일 내용 실행
   ```

2. **환경 변수 설정** (선택사항)
   ```env
   CRON_SECRET=your_secure_random_string
   ```

3. **Vercel 배포**
   - `vercel.json` 파일이 포함된 상태로 배포
   - Vercel 대시보드에서 Cron Job 활성화 확인

4. **모니터링 설정**
   - 재시도 큐 상태 정기 확인
   - 실패한 항목 알림 설정 (선택사항)

---

## 📚 관련 파일

- `database_payment_retry_queue.sql` - DB 스키마
- `src/app/api/subscription-v2/register/route.ts` - 구독 등록 API
- `src/app/api/subscription-v2/retry-payment-schedule/route.ts` - 재시도 처리 API
- `src/apis/subscription-v2.service.ts` - 결제 예약 서비스
- `vercel.json` - Vercel Cron Job 설정

---

**작성일**: 2025-01-XX  
**작성자**: AI Assistant  
**버전**: 1.0

