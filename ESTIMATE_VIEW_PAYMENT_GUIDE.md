# 견적서 열람 결제 기능 정리

## 📋 요구사항

1. **가격**: 1만원 (건별)
2. **구성**: 건별 열람권 + 무제한 열람(구독제)
3. **무료 제공**: 신규 회원가입 시 구독 없이도 최초 3회 무료 열람 제공 (구독과 별개)
   - 무료 열람으로 견적서를 열람하면, 견적서에 포함된 연락처 정보도 함께 확인 가능

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
- `paid`: 건별 결제 (1만원)
- `subscription`: 구독으로 열람 (무제한)

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
4. 건별 결제 필요 → `viewType: 'paid'`, `canView: false`

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
- **건별 결제**: "10,000원으로 열람하기" 버튼

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

### 시나리오 3: 건별 결제 (1만원)

```
1. 사용자가 견적서 상세 페이지 접근
   ↓
2. checkEstimateViewAccess() 호출
   ↓
3. 무료 열람 횟수 없음 + 구독 없음 확인
   ↓
4. "10,000원으로 열람하기" 버튼 표시
   ↓
5. 버튼 클릭 → POST /api/payments/estimate-view
   ↓
6. PortOne 결제 위젯 열기 (⚠️ 미구현)
   ↓
7. 결제 완료 → createPaidEstimateView(estimateId, paymentId)
   ↓
8. estimate_views 레코드 생성 (view_type: 'paid', payment_id, amount_paid 저장)
   ↓
9. 견적서 상세 내용 표시 (연락처 정보 포함)
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

## ⚠️ 미완성 항목

### 1. PortOne 결제 위젯 연동

**현재 상태:**
- 결제 API는 구현됨 (`/api/payments/estimate-view`)
- PortOne V2 결제 요청 생성은 완료
- 프론트엔드 결제 위젯 연동 미구현

**필요 작업:**
1. PortOne SDK 설치 및 설정
2. 결제 위젯 UI 구현
3. 결제 완료 콜백 처리
4. `createPaidEstimateView()` 호출

**참고:**
- PortOne V2 문서: https://developers.portone.io/docs/ko/v2
- 결제 위젯 예제 코드 필요

### 2. 구독 시스템 연동

**현재 상태:**
- `subscriptions` 테이블 조회는 구현됨
- 구독 가입/해지 로직 확인 필요

**필요 작업:**
1. 구독 가입 시 무제한 열람 권한 부여 확인
2. 구독 해지 시 권한 제거 확인
3. 구독 만료 시 권한 제거 확인

### 3. 무료 열람 횟수 관리

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
  ├─ YES → 상세 내용 표시
  └─ NO
      ↓
무료 열람 가능? (free_estimate_views_remaining > 0)
  ├─ YES → "무료로 열람하기" 버튼
  │         ↓
  │         createEstimateView('free')
  │         ↓
  │         free_estimate_views_remaining - 1
  │         ↓
  │         상세 내용 표시
  └─ NO
      ↓
구독 중? (subscriptions.status = 'active')
  ├─ YES → "구독으로 열람하기" 버튼
  │         ↓
  │         createEstimateView('subscription')
  │         ↓
  │         상세 내용 표시
  └─ NO
      ↓
건별 결제 필요 → "10,000원으로 열람하기" 버튼
  ↓
POST /api/payments/estimate-view
  ↓
PortOne 결제 위젯 (⚠️ 미구현)
  ↓
결제 완료
  ↓
createPaidEstimateView(estimateId, paymentId)
  ↓
상세 내용 표시
```

---

## 🚀 다음 단계

### 우선순위 1: PortOne 결제 위젯 연동

1. **PortOne SDK 설치**
   ```bash
   npm install @portone/browser-sdk/v2
   ```

2. **결제 위젯 구현**
   - `CompanyEstimatesClient.tsx`에 결제 위젯 추가
   - 결제 완료 콜백 처리
   - `createPaidEstimateView()` 호출

3. **에러 처리**
   - 결제 실패 시 처리
   - 결제 취소 시 처리

### 우선순위 2: 구독 시스템 확인

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
- 건별 결제 열람 기록 생성 (`createPaidEstimateView`)
- 결제 API (`/api/payments/estimate-view`)
- UI 구현 (열람 버튼, 상세 내용 표시)

### ⚠️ 미완성 기능
- PortOne 결제 위젯 연동 (프론트엔드)
- 결제 완료 콜백 처리
- 구독 시스템 연동 확인

### 📌 핵심 포인트
1. **가격**: 1만원 (건별) ✅
2. **구성**: 건별 열람권 + 무제한 열람(구독제) ✅
3. **무료 제공**: 신규 회원가입 시 구독 없이도 3회 무료 열람 제공 (구독과 별개) ✅
4. **연락처 포함**: 견적서 열람 시 견적서에 포함된 연락처 정보도 함께 확인 가능 ✅

