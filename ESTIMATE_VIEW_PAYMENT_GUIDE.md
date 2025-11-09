# 견적서 열람 결제 기능 정리

## 📋 요구사항

1. **구성**: 무제한 열람(구독제) + 무료 열람(신규 회원가입 시 3회)
2. **구독 가격**: 월 1만원
3. **무료 제공**: 신규 회원가입 시 구독 없이도 최초 3회 무료 열람 제공 (구독과 별개)
   - 무료 열람으로 견적서를 열람하면, 견적서에 포함된 연락처 정보도 함께 확인 가능
4. **건별 결제**: 제거됨 (구독 가입으로 유도)

---

## 🗄️ 데이터베이스 구조

### 1. `estimate_views` 테이블 (견적서 열람 기록)

```sql
CREATE TABLE public.estimate_views (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id UUID NOT NULL REFERENCES public.client(user_id),
  estimate_id INTEGER NOT NULL REFERENCES public.estimate(estimate_id),
  view_type TEXT NOT NULL CHECK (view_type IN ('free', 'paid', 'subscription')),
  amount_paid INTEGER DEFAULT 0,              -- 결제 금액 (무료는 0)
  payment_id INTEGER NULL REFERENCES public.payments(id),
  subscription_id INTEGER NULL REFERENCES public.subscriptions(id),
  UNIQUE(client_id, estimate_id)              -- 같은 견적서는 한 번만 열람
);
```

**열람 타입:**
- `free`: 무료 열람 (최초 n회)
- `subscription`: 구독으로 열람 (무제한)
- `paid`: 건별 결제 (현재 사용되지 않음, 기존 데이터 호환성 유지)

### 2. `client` 테이블 확장

```sql
ALTER TABLE public.client
ADD COLUMN free_estimate_views_remaining INTEGER DEFAULT 3;
```

- 기본값: 3회 무료 열람 (신규 회원가입 시 자동 부여)
- 무료 열람 시 1회씩 차감
- **구독과 별개**: 구독 가입 여부와 무관하게 제공
- 구독 가입/해지와 무관하게 무료 열람 횟수 유지

### 3. `subscriptions` 테이블 (구독 정보)

구독 시스템과 연동하여 활성 구독 시 무제한 열람 가능

---

## 🔧 구현된 기능

### 1. API 서비스 (`src/apis/estimate-view.service.ts`)

#### ✅ `checkEstimateViewAccess(estimateId)`
견적서 열람 권한 확인

**반환값:**
```typescript
{
  canView: boolean              // 열람 가능 여부
  viewType: 'free' | 'paid' | 'subscription' | null
  freeViewsRemaining: number   // 남은 무료 열람 횟수
  hasActiveSubscription: boolean
  hasViewed: boolean           // 이미 열람한 경우
  price: number               // 건별 결제 가격 (10000원)
}
```

**우선순위:**
1. 이미 열람함 → `canView: true`
2. 무료 열람 횟수 있음 → `viewType: 'free'`
3. 활성 구독 있음 → `viewType: 'subscription'`
4. 구독 가입 필요 → `viewType: 'paid'`, `canView: false` (구독 가입 페이지로 유도)

#### ✅ `createEstimateView(estimateId, viewType)`
무료/구독 열람 기록 생성

- 무료 열람: `free_estimate_views_remaining` 1회 차감
- 구독 열람: `subscription_id` 저장

#### ✅ `createPaidEstimateView(estimateId, paymentId)`
건별 결제 후 열람 기록 생성

- 결제 완료 검증 후 열람 기록 생성
- `payment_id` 및 `amount_paid` 저장

#### ✅ `getEstimateViewHistory()`
열람 기록 조회

---

### 2. 결제 API (`src/app/api/payments/estimate-view/route.ts`)

#### ✅ `POST /api/payments/estimate-view`

**요청:**
```json
{
  "estimateId": 123
}
```

**응답:**
```json
{
  "paymentId": "payment_xxx",
  "merchantUid": "estimate_view_userId_123_timestamp",
  "amount": 10000,
  "orderName": "견적서 열람 - 123"
}
```

**기능:**
- PortOne V2 결제 요청 생성
- 결제 금액: 10,000원 (고정)
- 결제 완료 후 `createPaidEstimateView()` 호출 필요

**⚠️ 미완성:**
- 프론트엔드 PortOne 결제 위젯 연동 필요
- 결제 완료 콜백 처리 필요

---

### 3. UI 구현 (`src/app/(home)/my/company/estimates/CompanyEstimatesClient.tsx`)

#### ✅ 열람 권한 체크
견적서 상세 페이지 접근 시 `checkEstimateViewAccess()` 호출

#### ✅ 열람 버튼 표시
- **무료 열람**: "무료로 열람하기" 버튼
- **구독 열람**: "구독으로 열람하기" 버튼
- **구독 가입 필요**: "월 1만원 구독으로 무제한 열람하기" 버튼 (구독 가입 페이지로 이동)

#### ✅ 열람 후 상세 내용 표시
열람 기록 생성 후 견적서 상세 내용 표시

---

## 📝 사용 흐름

### 시나리오 1: 무료 열람 (신규 회원가입 시 3회 제공)

**중요**: 구독 여부와 무관하게 신규 회원가입 시 기본 3회 무료 열람 제공

```
1. 신규 회원가입 (기업 계정)
   ↓
2. client 테이블 생성 시 free_estimate_views_remaining = 3 (기본값)
   ↓
3. 사용자가 견적서 상세 페이지 접근
   ↓
4. checkEstimateViewAccess() 호출
   ↓
5. free_estimate_views_remaining > 0 확인 (구독 여부와 무관)
   ↓
6. "무료로 열람하기" 버튼 표시
   ↓
7. 버튼 클릭 → createEstimateView(estimateId, 'free')
   ↓
8. free_estimate_views_remaining 1회 차감
   ↓
9. estimate_views 레코드 생성 (view_type: 'free')
   ↓
10. 견적서 상세 내용 표시 (연락처 정보 포함)
```

### 시나리오 2: 구독 열람 (무제한)

```
1. 사용자가 견적서 상세 페이지 접근
   ↓
2. checkEstimateViewAccess() 호출
   ↓
3. 무료 열람 횟수 없음 확인
   ↓
4. 활성 구독 확인 (subscriptions.status = 'active')
   ↓
5. "구독으로 열람하기" 버튼 표시
   ↓
6. 버튼 클릭 → createEstimateView(estimateId, 'subscription')
   ↓
7. estimate_views 레코드 생성 (view_type: 'subscription', subscription_id 저장)
   ↓
8. 견적서 상세 내용 표시 (연락처 정보 포함)
```

### 시나리오 3: 구독 가입 필요

```
1. 사용자가 견적서 상세 페이지 접근
   ↓
2. checkEstimateViewAccess() 호출
   ↓
3. 무료 열람 횟수 없음 + 구독 없음 확인
   ↓
4. "월 1만원 구독으로 무제한 열람하기" 버튼 표시
   ↓
5. 버튼 클릭 → 구독 가입 페이지로 이동 (/my/subscription/register-v2)
   ↓
6. 구독 가입 완료
   ↓
7. 다시 견적서 상세 페이지 접근
   ↓
8. "구독으로 열람하기" 버튼 표시
   ↓
9. 버튼 클릭 → createEstimateView(estimateId, 'subscription')
   ↓
10. estimate_views 레코드 생성 (view_type: 'subscription', subscription_id 저장)
   ↓
11. 견적서 상세 내용 표시 (연락처 정보 포함)
```

### 시나리오 4: 이미 열람한 견적서

```
1. 사용자가 견적서 상세 페이지 접근
   ↓
2. checkEstimateViewAccess() 호출
   ↓
3. estimate_views에 레코드 존재 확인
   ↓
4. canView: true 반환
   ↓
5. 견적서 상세 내용 바로 표시 (연락처 정보 포함, 버튼 없음)
```

---

## ⚠️ 정리 필요 항목

### 1. 건별 결제 API 정리

**현재 상태:**
- ✅ UI에서 건별 결제 버튼 제거됨
- ✅ 구독 가입으로 유도하도록 변경됨
- ⚠️ `/api/payments/estimate-view` API는 아직 존재 (사용되지 않음)
- ⚠️ `createPaidEstimateView()` 함수는 아직 존재 (사용되지 않음)

**권장 작업:**
- 주석으로 "현재 사용되지 않음" 표시
- 향후 필요 시 재활성화 가능하도록 유지

### 2. 구독 시스템 연동

**현재 상태:**
- `subscriptions` 테이블 조회는 구현됨
- 구독 가입/해지 로직 확인 필요

**필요 작업:**
1. 구독 가입 시 무제한 열람 권한 부여 확인
2. 구독 해지 시 권한 제거 확인
3. 구독 만료 시 권한 제거 확인

### 3. 무료 열람 횟수 마이그레이션

**현재 상태:**
- 기본값: 3회
- 기존 사용자에게 기본값 적용 필요

**필요 작업:**
1. 기존 `client` 레코드에 `free_estimate_views_remaining = 3` 설정
2. 관리자 페이지에서 무료 열람 횟수 조정 기능 (선택)
3. 프로모션 등으로 추가 무료 열람 제공 기능 (선택)

---

## 🔒 보안 고려사항

### 1. RLS (Row Level Security)

```sql
-- 클라이언트는 자신의 열람 기록만 조회 가능
CREATE POLICY "Clients can view their own estimate view records"
ON public.estimate_views FOR SELECT
USING (auth.uid() = client_id);

-- 클라이언트는 자신의 열람 기록을 생성할 수 있음
CREATE POLICY "Clients can insert their own estimate view records"
ON public.estimate_views FOR INSERT
WITH CHECK (auth.uid() = client_id);
```

### 2. 결제 검증

- 결제 완료 후에만 열람 기록 생성
- `payment_status = 'completed'` 확인
- `payment.user_id`와 현재 사용자 일치 확인

### 3. 중복 열람 방지

- `UNIQUE(client_id, estimate_id)` 제약조건
- 이미 열람한 경우 재결제 불가

---

## 📊 데이터 흐름도

```
견적서 상세 페이지 접근
  ↓
checkEstimateViewAccess()
  ↓
이미 열람함? 
  ├─ YES → 상세 내용 표시 (연락처 정보 포함)
  └─ NO
      ↓
무료 열람 가능? (free_estimate_views_remaining > 0)
  ├─ YES → "무료로 열람하기" 버튼
  │         ↓
  │         createEstimateView('free')
  │         ↓
  │         free_estimate_views_remaining - 1
  │         ↓
  │         상세 내용 표시 (연락처 정보 포함)
  └─ NO
      ↓
구독 중? (subscriptions.status = 'active')
  ├─ YES → "구독으로 열람하기" 버튼
  │         ↓
  │         createEstimateView('subscription')
  │         ↓
  │         상세 내용 표시 (연락처 정보 포함)
  └─ NO
      ↓
구독 가입 필요 → "월 1만원 구독으로 무제한 열람하기" 버튼
  ↓
구독 가입 페이지로 이동 (/my/subscription/register-v2)
  ↓
구독 가입 완료 후 다시 접근
  ↓
"구독으로 열람하기" 버튼 표시
  ↓
상세 내용 표시 (연락처 정보 포함)
```

---

## 🚀 다음 단계

### 우선순위 1: 문서 업데이트 완료 ✅

건별 결제 제거 반영 완료

### 우선순위 2: 무료 열람 횟수 마이그레이션

1. **SQL 마이그레이션 실행**
   ```sql
   -- 기존 client 레코드에 무료 열람 횟수 설정
   UPDATE public.client
   SET free_estimate_views_remaining = 3
   WHERE free_estimate_views_remaining IS NULL;
   ```

### 우선순위 3: 건별 결제 API 정리 (선택)

1. **코드 정리**
   - `/api/payments/estimate-view` 주석 처리
   - `createPaidEstimateView()` 주석 처리

### 우선순위 4: 구독 시스템 확인

1. **구독 가입/해지 로직 확인**
   - 구독 가입 시 권한 부여 확인
   - 구독 해지 시 권한 제거 확인

2. **구독 만료 처리**
   - `next_billing_date` 확인
   - 만료 시 권한 제거

### 우선순위 3: 기존 사용자 데이터 마이그레이션

1. **무료 열람 횟수 설정**
   ```sql
   UPDATE public.client
   SET free_estimate_views_remaining = 3
   WHERE free_estimate_views_remaining IS NULL;
   ```

---

## 📝 요약

### ✅ 완료된 기능
- 데이터베이스 구조 (estimate_views, client.free_estimate_views_remaining)
- 열람 권한 확인 API (`checkEstimateViewAccess`)
- 무료/구독 열람 기록 생성 (`createEstimateView`)
- UI 구현 (열람 버튼, 상세 내용 표시)
- 연락처 정보 포함 기능
- 구독 가입 유도 기능

### ⚠️ 정리 필요
- 건별 결제 API 정리 (사용되지 않지만 코드 존재)
- 무료 열람 횟수 마이그레이션 (기존 사용자)

### 📌 핵심 포인트
1. **구성**: 무제한 열람(구독제) + 무료 열람(신규 회원가입 시 3회) ✅
2. **구독 가격**: 월 1만원 ✅
3. **무료 제공**: 신규 회원가입 시 구독 없이도 3회 무료 열람 제공 (구독과 별개) ✅
4. **연락처 포함**: 견적서 열람 시 견적서에 포함된 연락처 정보도 함께 확인 가능 ✅
5. **건별 결제**: 제거됨 (구독 가입으로 유도) ✅

