# 새로운 결제 모델 V2 구현 가이드

## 📋 새로운 가격 정책

- **건별 열람권**: 2,000원
- **월 구독**: 9,900원
- **무료 열람**: 3회 (신규 회원가입 시)

### 비즈니스 로직
- 4건 이상 열람하면 구독이 더 유리
- 초반 무료 체험으로 전환 유도
- 유저 세그먼트별 수익 극대화

---

## ✅ 완료된 작업

### 1. 데이터베이스 스키마
- ✅ `pricing` 테이블 생성 (운영자가 가격 조정 가능)
- ✅ `free_quota` 테이블 생성 (무료 열람 카운트)
- ✅ `estimate_access` 테이블 생성 (영구 권리)
- ✅ `payments` 테이블 업데이트 (purpose, estimate_id, amount_krw, pg_tid, meta)
- ✅ `subscriptions` 테이블 업데이트 (billing_key, amount_krw, current_period_start, current_period_end, cancel_at_period_end)
- ✅ `estimate_views` 테이블 업데이트 (user_id 컬럼 추가)

### 2. SQL RPC 함수
- ✅ `can_view_estimate(user_id, estimate_id)` - 사용 가능 여부 판단
- ✅ `grant_free_view(user_id, estimate_id)` - 무료 열람 소진 + 권리 부여
- ✅ `grant_ppv_after_payment(payment_id)` - 결제 후 권리 부여(건별)
- ✅ `activate_subscription(user_id, amount, billing_key, period_start, period_end)` - 구독 갱신/활성화
- ✅ `get_free_quota(user_id)` - 무료 열람 횟수 조회

### 3. API 엔드포인트
- ✅ `POST /api/estimates/[id]/view` - 견적 열람 시도 API
- ✅ `POST /api/checkout/ppv` - 건별 결제 생성 API
- ✅ `POST /api/webhooks/portone` - PortOne 웹훅 (건별 결제 처리)
- ⚠️ PortOne V2 결제 위젯 프론트엔드 연동 필요

### 4. 데이터 마이그레이션
- ✅ 기존 `client.free_estimate_views_remaining` → `free_quota` 마이그레이션
- ✅ 기존 `estimate_views` → `estimate_access` 마이그레이션
- ✅ 기존 `payments` 데이터에 `purpose` 설정

---

## 🔄 진행 중인 작업

### 1. API 서비스 업데이트
- [ ] `src/apis/estimate-view.service.ts` 업데이트
  - 새로운 가격 반영 (2,000원)
  - `can_view_estimate` RPC 함수 사용
  - `grant_free_view` RPC 함수 사용
  - `free_quota` 조회 로직 추가

### 2. 프론트엔드 UI 업데이트
- [x] `src/app/(home)/my/company/estimates/CompanyEstimatesClient.tsx` 업데이트
  - ✅ 새로운 가격 표시 (2,000원, 9,900원)
  - ✅ 무료 열람 횟수 배지 표시 (상단)
  - ✅ 결제 모달 개선 (건별 vs 구독 비교)
  - ✅ "4건 이상 이득" 문구 추가
  - ⚠️ PortOne V2 결제 위젯 실제 연동 필요

### 3. 구독 시작 API
- [ ] `POST /api/subscriptions/start` 구현
  - 빌링키 발급 → 최초 결제 → 구독행 생성
  - `activate_subscription` RPC 함수 사용

### 4. 구독 갱신 웹훅
- [ ] `POST /api/webhooks/portone-subscriptions` 구현
  - 매월 갱신 성공 시 `current_period_start/end` 업데이트
  - `payments`에 영수 추가

---

## 📝 사용 흐름

### 시나리오 1: 무료 열람
```
1. 사용자가 견적서 상세 페이지 접근
2. POST /api/estimates/:id/view 호출
3. can_view_estimate() → false
4. grant_free_view() → true
5. estimate_access 생성 (source: 'free')
6. free_quota.used + 1
7. 견적서 상세 내용 표시
```

### 시나리오 2: 건별 결제
```
1. 사용자가 견적서 상세 페이지 접근
2. POST /api/estimates/:id/view 호출
3. can_view_estimate() → false
4. grant_free_view() → false (무료 횟수 소진)
5. 402 Payment Required 반환
6. 프론트에서 "건별 2,000원으로 열람" 버튼 표시
7. POST /api/checkout/ppv 호출
8. payments 레코드 생성 (status: 'pending')
9. PortOne 결제 위젯 열기
10. 결제 완료 → POST /api/webhooks/portone
11. payments 업데이트 (status: 'completed')
12. grant_ppv_after_payment() 호출
13. estimate_access 생성 (source: 'paid')
14. 견적서 상세 내용 표시
```

### 시나리오 3: 구독 열람
```
1. 사용자가 활성 구독 보유
2. POST /api/estimates/:id/view 호출
3. can_view_estimate() → true (구독 활성)
4. estimate_views에 열람 기록 추가
5. 견적서 상세 내용 표시
```

### 시나리오 4: 구독 가입
```
1. 사용자가 구독 가입 페이지 접근
2. PortOne 빌링키 발급
3. POST /api/subscriptions/start 호출
4. activate_subscription() 호출
5. subscriptions 레코드 생성
6. payments 레코드 생성 (purpose: 'subscription')
7. 이후 모든 견적서 무제한 열람 가능
```

---

## 🔒 보안 고려사항

### 1. RLS 정책
- ✅ `pricing`: 모든 인증된 사용자 조회 가능
- ✅ `free_quota`: 본인만 조회/기록
- ✅ `estimate_access`: 본인만 조회/기록
- ✅ `estimate_views`: 본인만 조회/기록

### 2. 멱등성 처리
- ✅ `payments` 테이블: `(pg_provider, pg_tid)` 유니크 제약조건
- ✅ `estimate_access` 테이블: `(user_id, estimate_id)` 유니크 제약조건
- ✅ `grant_ppv_after_payment`: 내부 `ON CONFLICT DO NOTHING` 처리

### 3. 결제 검증
- ✅ 웹훅 시그니처 검증
- ✅ 결제 상태 확인 (`payment_status = 'completed'`)
- ✅ 중복 결제 방지 (estimate_access 유니크)

---

## 📊 데이터 모델

### pricing 테이블
```sql
id | plan          | label      | amount_krw | interval | is_active
1  | ppv           | 건별 열람권 | 2000       | NULL     | true
2  | subscription  | 월 구독     | 9900       | month    | true
```

### free_quota 테이블
```sql
user_id | granted | used | updated_at
uuid    | 3       | 1    | 2025-01-27
```

### estimate_access 테이블
```sql
id | user_id | estimate_id | source       | created_at
1  | uuid    | 123         | free         | 2025-01-27
2  | uuid    | 456         | paid         | 2025-01-27
3  | uuid    | 789         | subscription | 2025-01-27
```

---

## 🚀 다음 단계

1. **API 서비스 업데이트** (우선순위 1)
   - `estimate-view.service.ts` 새 모델 반영
   - 가격 조회 로직 추가

2. **프론트엔드 UI 업데이트** (우선순위 2)
   - 가격 표시 업데이트
   - 결제 모달 개선
   - 무료 열람 횟수 배지

3. **구독 시작 API 구현** (우선순위 3)
   - 빌링키 발급 처리
   - 구독 레코드 생성

4. **구독 갱신 웹훅 구현** (우선순위 4)
   - 매월 갱신 처리
   - 기간 업데이트

---

## 📌 참고사항

- 기존 `/api/payments/estimate-view` API는 레거시로 유지 (하위 호환성)
- 새로운 `/api/checkout/ppv` API 사용 권장
- 가격 변경 시 `pricing` 테이블만 업데이트하면 즉시 반영
- 무료 열람 횟수 변경 시 `free_quota.granted` 업데이트

