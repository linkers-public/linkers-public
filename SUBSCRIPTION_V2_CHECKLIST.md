# 포트원 V2 정기결제 구현 체크리스트

정기결제가 제대로 동작하는지 확인하기 위한 체크리스트입니다.

## ✅ 구현 완료 항목

### 1. 코드 구현
- [x] V2 서비스 파일 (`src/apis/subscription-v2.service.ts`)
- [x] 구독 등록 API (`src/app/api/subscription-v2/register/route.ts`)
- [x] 웹훅 처리 API (`src/app/api/subscription-v2/webhook/route.ts`)
- [x] 구독 해지 API (`src/app/api/subscription-v2/cancel/route.ts`)
- [x] 결제 재시도 API (`src/app/api/subscription-v2/retry-payment/route.ts`)
- [x] 구독 등록 페이지 (`src/app/(home)/my/subscription/register-v2/page.tsx`)
- [x] 구독 관리 페이지 (`src/app/(home)/my/subscription/SubscriptionClient.tsx`)

### 2. 패키지 설치
- [x] `@portone/server-sdk@^0.17.0`
- [x] `@portone/browser-sdk@^0.1.1`

---

## ⚠️ 설정 필요 항목

### 1. 환경 변수 설정

`.env.local` 파일에 다음 변수들을 설정해야 합니다:

```env
# 필수
PORTONE_V2_API_SECRET=your_v2_api_secret_here
NEXT_PUBLIC_PORTONE_V2_STORE_ID=store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY=channel-key-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PORTONE_V2_WEBHOOK_SECRET=your_v2_webhook_secret_here
```

**확인 방법:**
```bash
# 환경 변수 확인
echo $PORTONE_V2_API_SECRET  # Linux/Mac
echo %PORTONE_V2_API_SECRET%  # Windows
```

### 2. 포트원 V2 콘솔 설정

#### 2.1 Store 생성
1. [포트원 관리자 콘솔](https://admin.portone.io) 접속
2. **V2** 메뉴 → **Stores**
3. Store 생성 또는 기존 Store 선택
4. Store ID 복사 → `NEXT_PUBLIC_PORTONE_V2_STORE_ID`에 설정

#### 2.2 Channel 등록
1. **V2** 메뉴 → **Channels**
2. 정기 결제 지원 PG사 선택 (토스페이먼츠, KSNET 등)
3. Channel 생성
4. Channel Key 복사 → `NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY`에 설정

#### 2.3 API Secret 발급
1. **V2** 메뉴 → **API Keys**
2. API Secret 생성
3. API Secret 복사 → `PORTONE_V2_API_SECRET`에 설정

#### 2.4 Webhook 설정
1. **V2** 메뉴 → **Webhooks**
2. Webhook 추가
3. Webhook URL 입력: `https://your-domain.com/api/subscription-v2/webhook`
   - 로컬 테스트: ngrok 사용 (`https://your-ngrok-url.ngrok.io/api/subscription-v2/webhook`)
4. 이벤트 선택: `Transaction.Paid`
5. Webhook Secret 생성 및 복사 → `PORTONE_V2_WEBHOOK_SECRET`에 설정

---

## 🧪 테스트 체크리스트

### 1. 구독 등록 테스트

1. **페이지 접속**
   ```
   http://localhost:3000/my/subscription/register-v2
   ```

2. **빌링키 발급 테스트**
   - "구독 등록하기" 버튼 클릭
   - 포트원 결제창이 열리는지 확인
   - 테스트 카드 정보 입력
   - 빌링키 발급 성공 확인

3. **구독 등록 확인**
   - 구독 정보가 DB에 저장되는지 확인
   - 첫 달 무료 플래그가 설정되는지 확인
   - 30일 후 결제 예약이 등록되는지 확인

**확인 방법:**
```sql
-- Supabase SQL Editor에서 실행
SELECT * FROM subscriptions 
WHERE user_id = 'your_user_id' 
ORDER BY created_at DESC 
LIMIT 1;
```

### 2. 웹훅 테스트

1. **로컬 테스트 (ngrok 사용)**
   ```bash
   # ngrok 설치
   npm install -g ngrok
   
   # 로컬 서버 터널링
   ngrok http 3000
   
   # 생성된 HTTPS URL을 포트원 콘솔에 등록
   ```

2. **웹훅 수신 확인**
   - 포트원 콘솔에서 테스트 웹훅 발송
   - 서버 로그에서 웹훅 수신 확인
   - 결제 내역이 DB에 저장되는지 확인

**확인 방법:**
```sql
-- 결제 내역 확인
SELECT * FROM payments 
WHERE subscription_id = 'your_subscription_id' 
ORDER BY created_at DESC;
```

### 3. 정기 결제 테스트

1. **결제 예약 확인**
   - 포트원 콘솔에서 예약된 결제 확인
   - 예약 시간이 올바른지 확인 (30일 후)

2. **자동 결제 테스트**
   - 예약 시간이 되면 자동으로 결제 실행
   - 웹훅을 통해 결제 결과 수신
   - 다음 달 결제 예약이 자동으로 등록되는지 확인

---

## 🔍 문제 해결

### 문제 1: 빌링키 발급 실패

**증상:**
- "카드 등록 실패" 에러 메시지
- 포트원 결제창이 열리지 않음

**해결 방법:**
1. 환경 변수 확인
   ```bash
   # Store ID와 Channel Key 확인
   echo $NEXT_PUBLIC_PORTONE_V2_STORE_ID
   echo $NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY
   ```

2. 포트원 콘솔 확인
   - Store가 활성화되어 있는지 확인
   - Channel이 정기 결제를 지원하는지 확인
   - Channel Key가 올바른지 확인

3. 브라우저 콘솔 확인
   - 개발자 도구 → Console 탭
   - 에러 메시지 확인

### 문제 2: 구독 등록 API 실패

**증상:**
- "구독 등록에 실패했습니다" 에러
- 서버 로그에 에러 메시지

**해결 방법:**
1. 환경 변수 확인
   ```bash
   echo $PORTONE_V2_API_SECRET
   ```

2. 서버 로그 확인
   ```bash
   # 개발 서버 로그 확인
   npm run dev
   ```

3. 포트원 API Secret 확인
   - 포트원 콘솔에서 API Secret 재발급
   - 환경 변수 업데이트

### 문제 3: 웹훅이 수신되지 않음

**증상:**
- 결제는 성공했지만 웹훅이 오지 않음
- 결제 내역이 DB에 저장되지 않음

**해결 방법:**
1. Webhook URL 확인
   - 포트원 콘솔에 등록된 URL 확인
   - HTTPS 사용 확인 (프로덕션)

2. Webhook Secret 확인
   ```bash
   echo $PORTONE_V2_WEBHOOK_SECRET
   ```

3. 포트원 콘솔에서 웹훅 테스트
   - Webhooks 메뉴 → 테스트 발송
   - 서버 로그 확인

### 문제 4: 결제 예약 실패

**증상:**
- "결제 예약 실패" 에러
- 다음 달 결제가 예약되지 않음

**해결 방법:**
1. 빌링키 확인
   ```sql
   SELECT customer_uid FROM subscriptions 
   WHERE id = 'your_subscription_id';
   ```

2. 예약 시간 형식 확인
   - ISO 8601 형식인지 확인
   - 미래 시간인지 확인

3. 포트원 API 확인
   - 포트원 콘솔에서 예약된 결제 목록 확인

---

## 📊 동작 확인 방법

### 1. 구독 등록 확인

**DB 확인:**
```sql
SELECT 
  id,
  user_id,
  plan,
  price,
  status,
  is_first_month_free,
  first_month_used,
  next_billing_date,
  portone_merchant_uid,
  created_at
FROM subscriptions
WHERE user_id = 'your_user_id'
ORDER BY created_at DESC
LIMIT 1;
```

**예상 결과:**
- `status`: `active`
- `is_first_month_free`: `true`
- `first_month_used`: `false`
- `next_billing_date`: 현재 시간 + 30일
- `portone_merchant_uid`: `linkers_sub_...` 형식

### 2. 결제 예약 확인

**포트원 콘솔:**
1. V2 → Payments → Scheduled Payments
2. 예약된 결제 목록 확인
3. 예약 시간이 `next_billing_date`와 일치하는지 확인

### 3. 웹훅 처리 확인

**DB 확인:**
```sql
SELECT 
  id,
  subscription_id,
  amount,
  payment_status,
  is_first_month,
  paid_at,
  created_at
FROM payments
WHERE subscription_id = 'your_subscription_id'
ORDER BY created_at DESC;
```

**예상 결과:**
- 결제 완료 시 `payment_status`: `completed`
- 첫 달 결제 시 `is_first_month`: `true`
- `paid_at`에 결제 시간 기록

---

## 🚀 배포 전 확인사항

### 프로덕션 환경

1. **환경 변수 설정**
   - Vercel 또는 배포 플랫폼에 환경 변수 설정
   - 프로덕션용 Store ID, Channel Key 사용

2. **Webhook URL 업데이트**
   - 프로덕션 도메인으로 Webhook URL 변경
   - 포트원 콘솔에서 Webhook URL 업데이트

3. **테스트**
   - 프로덕션 환경에서 구독 등록 테스트
   - 실제 결제 테스트 (소액)
   - 웹훅 수신 확인

---

## 📝 참고 자료

- [환경 변수 설정 가이드](./ENV_SETUP.md)
- [웹훅 엔드포인트 가이드](./WEBHOOK_ENDPOINTS.md)
- [포트원 V2 개발자 문서](https://developers.portone.io/opi/ko/integration/start/v2/readme)
- [포트원 V2 관리자 콘솔](https://admin.portone.io/integration-v2)

---

## ✅ 최종 확인

정기결제가 제대로 동작하려면:

1. ✅ 코드 구현 완료
2. ⚠️ 환경 변수 설정 필요
3. ⚠️ 포트원 V2 콘솔 설정 필요
4. ⚠️ 테스트 필요

**다음 단계:**
1. 환경 변수 설정
2. 포트원 V2 콘솔 설정
3. 로컬 테스트
4. 프로덕션 배포

