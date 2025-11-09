# 결제 시스템 검토 (최신 업데이트)

## 📋 개요

건별 결제 제거 후 현재 결제 시스템의 상태를 종합적으로 검토합니다.

**최근 변경사항:**
- ✅ 건별 결제 제거 (구독 가입으로 유도)
- ✅ "월 1만원 구독으로 무제한 열람하기" 버튼으로 변경
- ✅ 연락처 열람 기록 페이지 삭제

---

## ✅ 구현 완료된 기능

### 1. 구독 결제 시스템

**구현 상태**: ✅ 완료

**주요 기능**:
- PortOne V2 빌링키 기반 정기 결제
- 첫 달 무료 제공
- 월 1만원 구독료
- 자동 갱신 설정
- 구독 해지 기능
- 결제 실패 시 재시도
- 웹훅 처리

**관련 파일**:
- `src/app/(home)/my/subscription/SubscriptionClient.tsx` - 구독 관리 UI
- `src/app/(home)/my/subscription/register-v2/page.tsx` - 구독 등록 페이지
- `src/apis/subscription-v2.service.ts` - 구독 서비스 (서버 사이드)
- `src/app/api/subscription-v2/webhook/route.ts` - 웹훅 처리
- `src/app/api/subscription-v2/cancel/route.ts` - 구독 해지
- `src/app/api/subscription-v2/retry-payment/route.ts` - 결제 재시도

**데이터베이스**:
- `subscriptions` 테이블: 구독 정보 저장
- `payments` 테이블: 결제 내역 저장 (구독 결제만)

**동작 흐름**:
1. 사용자가 구독 등록 페이지 접근
2. PortOne 빌링키 발급 UI 표시
3. 빌링키 발급 성공 → 구독 레코드 생성
4. 첫 달 무료 처리 또는 즉시 결제
5. 월 정기 결제 예약
6. 웹훅으로 결제 완료 처리
7. `payments` 레코드 생성

---

### 2. 견적서 열람 시스템

**구현 상태**: ✅ 완료 (건별 결제 제거됨)

**주요 기능**:
- 무료 열람 (신규 회원가입 시 3회 제공)
- 구독 열람 (활성 구독 시 무제한)
- ~~건별 결제 열람~~ (제거됨 → 구독 가입으로 유도)

**관련 파일**:
- `src/apis/estimate-view.service.ts` - 열람 권한 확인 및 기록 생성
- `src/app/(home)/my/company/estimates/CompanyEstimatesClient.tsx` - 견적서 열람 UI
- `src/app/(home)/my/estimate-view-history/EstimateViewHistoryClient.tsx` - 열람 기록 페이지

**데이터베이스**:
- `estimate_views` 테이블: 열람 기록 저장
  - `view_type`: 'free' | 'subscription' (paid는 더 이상 사용되지 않음)
- `client.free_estimate_views_remaining` 컬럼: 무료 열람 횟수

**동작 흐름**:
1. 견적서 상세 페이지 접근
2. `checkEstimateViewAccess()` 호출
3. 열람 권한 확인:
   - 이미 열람함 → 바로 표시 (연락처 정보 포함)
   - 무료 열람 가능 → "무료로 열람하기" 버튼
   - 구독 중 → "구독으로 열람하기" 버튼
   - 구독 없음 → "월 1만원 구독으로 무제한 열람하기" 버튼 (구독 가입 페이지로 이동)
4. 버튼 클릭 시 열람 기록 생성 및 상세 내용 표시

**변경 사항**:
- ❌ 건별 결제 버튼 제거
- ✅ "월 1만원 구독으로 무제한 열람하기" 버튼 추가
- ✅ 구독 가입 페이지로 리다이렉트

---

### 3. 결제 내역 조회

**구현 상태**: ✅ 완료

**주요 기능**:
- 결제 내역 목록 조회
- 영수증 다운로드
- 결제 상태 표시 (완료/대기/실패)
- 첫 달 무료 표시

**관련 파일**:
- `src/app/(home)/my/payments/PaymentsClient.tsx` - 결제 내역 페이지

**현재 상태**:
- 구독 결제만 표시됨 (건별 결제 제거로 인해)
- 결제 타입 구분 불필요 (구독 결제만 존재)
- 결제 목적: "월 구독료" 또는 "첫 달 무료"

---

## ⚠️ 정리 필요 항목

### 1. 건별 결제 API 정리

**현재 상태**:
- ✅ UI에서 건별 결제 버튼 제거됨
- ✅ 구독 가입으로 유도하도록 변경됨
- ⚠️ `/api/payments/estimate-view` API는 아직 존재 (사용되지 않음)
- ⚠️ `createPaidEstimateView()` 함수는 아직 존재 (사용되지 않음)

**권장 작업**:
1. **옵션 A: API 유지 (향후 사용 가능성 고려)**
   - 주석으로 "현재 사용되지 않음" 표시
   - 향후 필요 시 재활성화 가능

2. **옵션 B: API 제거 (완전 정리)**
   - `/api/payments/estimate-view` 삭제
   - `createPaidEstimateView()` 함수 제거 또는 주석 처리
   - `estimate_views.view_type`에서 'paid' 제거 (또는 유지)

**추천**: 옵션 A (향후 필요 시 재활성화 가능)

---

### 2. 데이터베이스 스키마 정리

**현재 상태**:
- `estimate_views.view_type`: 'free' | 'paid' | 'subscription'
- `estimate_views.payment_id`: 건별 결제 시 사용 (현재 사용 안 함)
- `estimate_views.amount_paid`: 건별 결제 금액 (현재 사용 안 함)

**권장 작업**:
- `view_type`의 'paid'는 유지 (기존 데이터 호환성)
- `payment_id`, `amount_paid`는 NULL 허용 상태 유지
- 향후 필요 시 재활성화 가능하도록 구조 유지

---

### 3. 문서 업데이트

**업데이트 필요 문서**:
- `ESTIMATE_VIEW_PAYMENT_GUIDE.md` - 건별 결제 제거 반영
- `ESTIMATE_VIEW_MVP.md` - 건별 결제 제거 반영
- `PAYMENT_SYSTEM_REVIEW.md` - 최신 상태 반영

---

## 🔒 보안 고려사항

### 1. RLS (Row Level Security)

**확인 필요**:
- `estimate_views` 테이블 RLS 정책 확인
- `payments` 테이블 RLS 정책 확인
- `subscriptions` 테이블 RLS 정책 확인

**권장 정책**:
```sql
-- estimate_views: 클라이언트는 자신의 열람 기록만 조회 가능
CREATE POLICY "Clients can view their own estimate view records"
ON public.estimate_views FOR SELECT
USING (auth.uid() = client_id);

-- estimate_views: 클라이언트는 자신의 열람 기록을 생성할 수 있음
CREATE POLICY "Clients can insert their own estimate view records"
ON public.estimate_views FOR INSERT
WITH CHECK (auth.uid() = client_id);
```

---

### 2. 결제 검증

**현재 구현**:
- ✅ 구독 결제: 웹훅으로 결제 검증
- ✅ 결제 완료 후에만 구독 활성화
- ✅ `payment_status = 'completed'` 확인
- ✅ `payment.user_id`와 현재 사용자 일치 확인

---

### 3. 중복 열람 방지

**현재 구현**:
- ✅ `UNIQUE(client_id, estimate_id)` 제약조건
- ✅ 이미 열람한 경우 재열람 불가
- ✅ 무료 열람 횟수 차감 로직

---

## 📊 최종 데이터 흐름도

### 구독 결제 흐름
```
사용자 → 구독 등록 페이지
  ↓
PortOne 빌링키 발급 UI
  ↓
빌링키 발급 성공
  ↓
구독 레코드 생성 (subscriptions)
  ↓
첫 달 무료 또는 즉시 결제
  ↓
월 정기 결제 예약
  ↓
웹훅으로 결제 완료 처리
  ↓
payments 레코드 생성
```

### 견적서 열람 흐름 (건별 결제 제거 후)
```
사용자 → 견적서 상세 페이지
  ↓
checkEstimateViewAccess()
  ↓
열람 권한 확인
  ├─ 이미 열람함 → 상세 내용 표시 (연락처 포함)
  ├─ 무료 열람 가능 → "무료로 열람하기" 버튼
  │                     ↓
  │                     createEstimateView('free')
  │                     ↓
  │                     free_estimate_views_remaining - 1
  │                     ↓
  │                     상세 내용 표시 (연락처 포함)
  ├─ 구독 중 → "구독으로 열람하기" 버튼
  │              ↓
  │              createEstimateView('subscription')
  │              ↓
  │              상세 내용 표시 (연락처 포함)
  └─ 구독 없음 → "월 1만원 구독으로 무제한 열람하기" 버튼
                  ↓
                  구독 가입 페이지로 이동
```

---

## 🚀 우선순위별 개선 사항

### 우선순위 1: 문서 업데이트

**작업 내용**:
1. `ESTIMATE_VIEW_PAYMENT_GUIDE.md` 업데이트
   - 건별 결제 제거 반영
   - 구독 가입 유도로 변경된 흐름 반영

2. `ESTIMATE_VIEW_MVP.md` 업데이트
   - 건별 결제 시나리오 제거

3. `PAYMENT_SYSTEM_REVIEW.md` 업데이트
   - 최신 상태 반영

**예상 소요 시간**: 30분

---

### 우선순위 2: 무료 열람 횟수 마이그레이션

**작업 내용**:
```sql
-- 기존 client 레코드에 무료 열람 횟수 설정
UPDATE public.client
SET free_estimate_views_remaining = 3
WHERE free_estimate_views_remaining IS NULL;
```

**예상 소요 시간**: 10분

---

### 우선순위 3: 건별 결제 API 정리 (선택)

**작업 내용**:
1. `/api/payments/estimate-view` 주석 처리 또는 삭제
2. `createPaidEstimateView()` 주석 처리 또는 삭제
3. 관련 코드 정리

**예상 소요 시간**: 20분

---

### 우선순위 4: 보안 강화

**작업 내용**:
1. RLS 정책 확인 및 추가
2. 결제 검증 로직 확인
3. 중복 열람 방지 확인

**예상 소요 시간**: 1시간

---

## 📝 체크리스트

### 구독 결제 시스템
- [x] 구독 등록 기능
- [x] 구독 해지 기능
- [x] 자동 갱신 설정
- [x] 결제 실패 시 재시도
- [x] 웹훅 처리
- [x] 구독 관리 페이지
- [x] 결제 내역 조회

### 견적서 열람 시스템
- [x] 무료 열람 기능
- [x] 구독 열람 기능
- [x] 건별 결제 제거 (구독 가입으로 유도)
- [x] 열람 기록 조회
- [x] 열람 기록 페이지
- [x] 연락처 정보 포함 기능

### 결제 내역
- [x] 결제 내역 조회
- [x] 영수증 다운로드
- [x] 결제 상태 표시
- [x] 첫 달 무료 표시

### 보안
- [ ] RLS 정책 확인
- [x] 결제 검증 (구독)
- [x] 중복 열람 방지

### 데이터 마이그레이션
- [ ] 무료 열람 횟수 설정 (기존 사용자)

### 코드 정리
- [ ] 건별 결제 API 정리 (주석 처리 또는 삭제)
- [ ] 문서 업데이트

---

## 📌 최종 요약

### ✅ 완료된 기능
1. **구독 결제 시스템**: 완전히 구현됨
2. **견적서 열람 시스템**: 무료/구독 열람 완료, 건별 결제 제거
3. **결제 내역 조회**: 구독 결제 내역 조회 완료
4. **연락처 정보 포함**: 견적서 열람 시 연락처 정보 표시

### ⚠️ 정리 필요
1. **건별 결제 API**: 사용되지 않지만 코드는 남아있음 (정리 필요)
2. **문서 업데이트**: 건별 결제 제거 반영 필요
3. **무료 열람 횟수 마이그레이션**: 기존 사용자 데이터 업데이트 필요

### 🎯 다음 단계
1. 문서 업데이트 (건별 결제 제거 반영)
2. 무료 열람 횟수 마이그레이션 실행
3. 건별 결제 API 정리 (선택)
4. RLS 정책 확인 및 보안 강화

---

## 💡 현재 결제 모델

### 최종 구조
1. **무료 열람**: 신규 회원가입 시 3회 제공 (구독과 별개)
2. **구독 열람**: 월 1만원, 무제한 열람
3. **건별 결제**: 제거됨 (구독 가입으로 유도)

### 사용자 여정
```
신규 회원가입
  ↓
무료 열람 3회 제공
  ↓
무료 열람 횟수 소진
  ↓
구독 가입 유도 ("월 1만원 구독으로 무제한 열람하기")
  ↓
구독 가입
  ↓
무제한 열람 가능
```

---

## 🔍 코드 정리 권장 사항

### 1. 사용되지 않는 API 정리
- `/api/payments/estimate-view` - 주석 처리 또는 삭제
- `createPaidEstimateView()` - 주석 처리 또는 삭제

### 2. 타입 정의 정리
- `EstimateViewAccess.viewType`: 'paid'는 유지하되 사용되지 않음 표시
- `EstimateViewRecord.view_type`: 'paid'는 기존 데이터 호환성을 위해 유지

### 3. UI 코드 정리
- 건별 결제 관련 주석 제거 또는 정리
- 구독 가입 유도 로직 명확화

