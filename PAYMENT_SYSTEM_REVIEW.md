# 결제 시스템 전체 검토

## 📋 개요

현재 구현된 결제 관련 기능들을 종합적으로 검토하고, 개선 사항 및 미완성 항목을 정리합니다.

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

**관련 파일**:
- `src/app/(home)/my/subscription/SubscriptionClient.tsx` - 구독 관리 UI
- `src/app/(home)/my/subscription/register-v2/page.tsx` - 구독 등록 페이지
- `src/apis/subscription-v2.service.ts` - 구독 서비스 (서버 사이드)
- `src/app/api/subscription-v2/webhook/route.ts` - 웹훅 처리
- `src/app/api/subscription-v2/cancel/route.ts` - 구독 해지
- `src/app/api/subscription-v2/retry-payment/route.ts` - 결제 재시도

**데이터베이스**:
- `subscriptions` 테이블: 구독 정보 저장
- `payments` 테이블: 결제 내역 저장

**동작 흐름**:
1. 사용자가 구독 등록 페이지 접근
2. PortOne 빌링키 발급 UI 표시
3. 빌링키 발급 성공 → 구독 레코드 생성
4. 첫 달 무료 처리 또는 즉시 결제
5. 월 정기 결제 예약
6. 웹훅으로 결제 완료 처리

---

### 2. 견적서 열람 시스템

**구현 상태**: ⚠️ 부분 완료 (프론트엔드 위젯 미완성)

**주요 기능**:
- 무료 열람 (신규 회원가입 시 3회 제공)
- 구독 열람 (활성 구독 시 무제한)
- 건별 결제 열람 (1만원)

**관련 파일**:
- `src/apis/estimate-view.service.ts` - 열람 권한 확인 및 기록 생성
- `src/app/api/payments/estimate-view/route.ts` - 건별 결제 API
- `src/app/(home)/my/company/estimates/CompanyEstimatesClient.tsx` - 견적서 열람 UI
- `src/app/(home)/my/estimate-view-history/EstimateViewHistoryClient.tsx` - 열람 기록 페이지

**데이터베이스**:
- `estimate_views` 테이블: 열람 기록 저장
- `client.free_estimate_views_remaining` 컬럼: 무료 열람 횟수

**동작 흐름**:
1. 견적서 상세 페이지 접근
2. `checkEstimateViewAccess()` 호출
3. 열람 권한 확인:
   - 이미 열람함 → 바로 표시
   - 무료 열람 가능 → "무료로 열람하기" 버튼
   - 구독 중 → "구독으로 열람하기" 버튼
   - 건별 결제 필요 → "10,000원으로 열람하기" 버튼
4. 버튼 클릭 시 열람 기록 생성 및 상세 내용 표시

---

### 3. 결제 내역 조회

**구현 상태**: ✅ 완료 (개선 필요)

**주요 기능**:
- 결제 내역 목록 조회
- 영수증 다운로드
- 결제 상태 표시 (완료/대기/실패)

**관련 파일**:
- `src/app/(home)/my/payments/PaymentsClient.tsx` - 결제 내역 페이지

**문제점**:
- 구독 결제와 견적서 열람 결제를 구분하지 않음
- 결제 타입 필터링 없음

---

## ⚠️ 미완성 항목

### 1. 견적서 열람 건별 결제 - PortOne 위젯 연동

**현재 상태**:
- ✅ 결제 API 구현 완료 (`/api/payments/estimate-view`)
- ✅ PortOne V2 결제 요청 생성 완료
- ❌ 프론트엔드 PortOne 결제 위젯 미구현
- ❌ 결제 완료 콜백 처리 미구현

**필요 작업**:
1. PortOne Browser SDK 설치
   ```bash
   npm install @portone/browser-sdk/v2
   ```

2. 결제 위젯 구현
   - `CompanyEstimatesClient.tsx`에 결제 위젯 추가
   - 결제 완료 콜백 처리
   - `createPaidEstimateView()` 호출

3. 에러 처리
   - 결제 실패 시 처리
   - 결제 취소 시 처리

**참고 문서**:
- PortOne V2 문서: https://developers.portone.io/docs/ko/v2
- 현재 구독 등록 페이지에서 사용하는 방식 참고 (`src/app/(home)/my/subscription/register-v2/page.tsx`)

---

### 2. 결제 내역 페이지 개선

**현재 문제점**:
- 구독 결제와 견적서 열람 결제를 구분하지 않음
- 결제 타입 필터링 없음
- 결제 목적(구독/견적서 열람) 표시 없음

**개선 방안**:
1. 결제 타입 필터 추가
   - 전체
   - 구독 결제
   - 견적서 열람 결제

2. 결제 목적 표시
   - 구독 결제: "월 구독료" 또는 "첫 달 무료"
   - 견적서 열람: "견적서 열람 - [견적서 ID]" 또는 "견적서 열람 - [프로젝트명]"

3. `payments` 테이블에 `payment_type` 컬럼 추가 (선택)
   - 또는 `subscription_id`와 `estimate_id`로 구분

---

### 3. 무료 열람 횟수 마이그레이션

**현재 상태**:
- 신규 회원가입 시 기본값 3회 제공
- 기존 사용자에게는 기본값 미적용

**필요 작업**:
```sql
-- 기존 client 레코드에 무료 열람 횟수 설정
UPDATE public.client
SET free_estimate_views_remaining = 3
WHERE free_estimate_views_remaining IS NULL;
```

---

### 4. 구독 시스템과 견적서 열람 연동 확인

**확인 필요 사항**:
1. 구독 가입 시 무제한 열람 권한 부여 확인 ✅
   - `checkEstimateViewAccess()`에서 `subscriptions.status = 'active'` 확인
   
2. 구독 해지 시 권한 제거 확인 ✅
   - `checkEstimateViewAccess()`에서 구독 상태 확인
   
3. 구독 만료 시 권한 제거 확인 ✅
   - `next_billing_date` 확인 로직 구현됨

**추가 개선 사항**:
- 구독 만료 전 알림 기능 (선택)
- 구독 갱신 실패 시 권한 제거 확인

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
- ✅ 결제 완료 후에만 열람 기록 생성
- ✅ `payment_status = 'completed'` 확인
- ✅ `payment.user_id`와 현재 사용자 일치 확인

**추가 권장 사항**:
- 웹훅으로 결제 검증 (견적서 열람 결제용)
- 결제 금액 검증 (1만원 고정)

---

### 3. 중복 열람 방지

**현재 구현**:
- ✅ `UNIQUE(client_id, estimate_id)` 제약조건 (추정)
- ✅ 이미 열람한 경우 재결제 불가

**확인 필요**:
- 데이터베이스 제약조건 확인
- API 레벨 중복 체크 확인

---

## 📊 데이터 흐름도

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

### 견적서 열람 결제 흐름
```
사용자 → 견적서 상세 페이지
  ↓
checkEstimateViewAccess()
  ↓
열람 권한 확인
  ├─ 무료 열람 → createEstimateView('free')
  ├─ 구독 열람 → createEstimateView('subscription')
  └─ 건별 결제 → POST /api/payments/estimate-view
                    ↓
                    PortOne 결제 위젯 (⚠️ 미구현)
                    ↓
                    결제 완료
                    ↓
                    createPaidEstimateView()
  ↓
estimate_views 레코드 생성
  ↓
상세 내용 표시 (연락처 정보 포함)
```

---

## 🚀 우선순위별 개선 사항

### 우선순위 1: PortOne 결제 위젯 연동 (견적서 열람)

**작업 내용**:
1. PortOne Browser SDK 설치
2. 결제 위젯 UI 구현
3. 결제 완료 콜백 처리
4. `createPaidEstimateView()` 호출
5. 에러 처리 (결제 실패/취소)

**예상 소요 시간**: 2-3시간

---

### 우선순위 2: 결제 내역 페이지 개선

**작업 내용**:
1. 결제 타입 필터 추가 (구독/견적서 열람)
2. 결제 목적 표시 개선
3. UI/UX 개선

**예상 소요 시간**: 1-2시간

---

### 우선순위 3: 무료 열람 횟수 마이그레이션

**작업 내용**:
1. SQL 마이그레이션 스크립트 작성
2. 기존 사용자 데이터 업데이트
3. 테스트

**예상 소요 시간**: 30분

---

### 우선순위 4: 보안 강화

**작업 내용**:
1. RLS 정책 확인 및 추가
2. 웹훅 검증 강화 (견적서 열람 결제용)
3. 결제 금액 검증 추가

**예상 소요 시간**: 1-2시간

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
- [x] 건별 결제 API
- [ ] PortOne 결제 위젯 연동 (프론트엔드)
- [ ] 결제 완료 콜백 처리
- [x] 열람 기록 조회
- [x] 열람 기록 페이지

### 결제 내역
- [x] 결제 내역 조회
- [x] 영수증 다운로드
- [ ] 결제 타입 필터링
- [ ] 결제 목적 표시 개선

### 보안
- [ ] RLS 정책 확인
- [x] 결제 검증 (구독)
- [ ] 결제 검증 (견적서 열람 - 웹훅)
- [x] 중복 열람 방지

### 데이터 마이그레이션
- [ ] 무료 열람 횟수 설정 (기존 사용자)

---

## 💡 추가 개선 제안

### 1. 결제 통계 대시보드
- 월별 결제 금액
- 구독/견적서 열람 결제 비율
- 결제 성공률

### 2. 프로모션 기능
- 추가 무료 열람 제공
- 할인 쿠폰
- 이벤트 기간 무료 열람

### 3. 알림 기능
- 구독 만료 전 알림
- 결제 실패 알림
- 무료 열람 횟수 부족 알림

### 4. 환불 처리
- 구독 해지 시 환불
- 견적서 열람 환불 (정책 필요)

---

## 📌 요약

### ✅ 잘 구현된 부분
1. 구독 결제 시스템이 완전히 구현되어 있음
2. 견적서 열람 권한 확인 로직이 명확함
3. 무료/구독/건별 결제 구분이 잘 되어 있음
4. 연락처 정보 포함 기능이 잘 구현됨

### ⚠️ 개선이 필요한 부분
1. **견적서 열람 건별 결제의 프론트엔드 위젯 연동** (최우선)
2. 결제 내역 페이지의 타입 구분 및 필터링
3. 기존 사용자 무료 열람 횟수 마이그레이션
4. RLS 정책 확인 및 보안 강화

### 🎯 다음 단계
1. PortOne 결제 위젯 연동 구현
2. 결제 내역 페이지 개선
3. 무료 열람 횟수 마이그레이션 실행
4. 보안 정책 확인 및 강화

