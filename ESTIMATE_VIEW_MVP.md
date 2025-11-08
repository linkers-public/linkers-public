# 견적서 열람 MVP 구현 가이드

## 📋 요구사항

1. **가격**: 1만원 (건별)
2. **구성**: 건별 열람권 + 무제한 열람(구독제)
3. **무료 제공**: 최초 n회는 무료로 열람 가능 (기본 3회)

## 🗄️ 데이터베이스 구조

### 테이블 생성

```sql
-- estimate_views: 견적서 열람 기록
-- client.free_estimate_views_remaining: 무료 열람 횟수 (기본 3회)
```

마이그레이션 파일: `database_estimate_view_access_migration.sql`

## 🔧 구현 내용

### 1. API 서비스 (`src/apis/estimate-view.service.ts`)

- `checkEstimateViewAccess()`: 열람 권한 확인
- `createEstimateView()`: 무료/구독 열람 기록 생성
- `createPaidEstimateView()`: 건별 결제 후 열람 기록 생성
- `getEstimateViewHistory()`: 열람 기록 조회

### 2. 결제 API (`src/app/api/payments/estimate-view/route.ts`)

- 건별 결제 요청 생성 (1만원)
- PortOne V2 결제 연동

### 3. UI 구현 (`src/app/(home)/my/company/estimates/CompanyEstimatesClient.tsx`)

- 견적서 상세 페이지에 열람 권한 체크
- 열람 불가 시 결제/무료 열람 버튼 표시
- 열람 가능 시 상세 내용 표시

## 📝 사용 흐름

### 무료 열람
1. 사용자가 견적서 상세 페이지 접근
2. `checkEstimateViewAccess()` 호출
3. 무료 열람 횟수 확인 (기본 3회)
4. 무료 열람 가능 시 "무료로 열람하기" 버튼 표시
5. 버튼 클릭 시 `createEstimateView(estimateId, 'free')` 호출
6. 무료 열람 횟수 차감 및 열람 기록 생성
7. 상세 내용 표시

### 구독 열람
1. 사용자가 활성 구독 보유 확인
2. "구독으로 열람하기" 버튼 표시
3. 버튼 클릭 시 `createEstimateView(estimateId, 'subscription')` 호출
4. 열람 기록 생성 (구독 ID 포함)
5. 상세 내용 표시

### 건별 결제
1. 무료 열람 횟수 없음 + 구독 없음
2. "10,000원으로 열람하기" 버튼 표시
3. 버튼 클릭 시 `/api/payments/estimate-view` 호출
4. PortOne 결제 위젯 열기 (추후 구현)
5. 결제 완료 후 `createPaidEstimateView(estimateId, paymentId)` 호출
6. 열람 기록 생성 및 상세 내용 표시

## 🚀 다음 단계

1. **PortOne 결제 위젯 연동**
   - 프론트엔드에 PortOne SDK 추가
   - 결제 완료 콜백 처리
   - `createPaidEstimateView()` 호출

2. **구독 시스템 연동**
   - 구독 가입 시 무제한 열람 권한 부여
   - 구독 해지 시 권한 제거

3. **무료 열람 횟수 설정**
   - 관리자 페이지에서 무료 열람 횟수 조정 가능
   - 프로모션 등으로 추가 무료 열람 제공

4. **열람 기록 관리**
   - 열람 기록 조회 페이지
   - 열람 통계 (월별, 프로젝트별)

## 📊 데이터 흐름

```
견적서 상세 페이지 접근
  ↓
checkEstimateViewAccess()
  ↓
이미 열람함? → YES → 상세 내용 표시
  ↓ NO
무료 열람 가능? → YES → 무료 열람 버튼
  ↓ NO
구독 중? → YES → 구독 열람 버튼
  ↓ NO
건별 결제 필요 → 결제 버튼
```

## 🔒 보안 고려사항

- RLS 정책으로 열람 기록 접근 제어
- 결제 검증 (결제 완료 후에만 열람 기록 생성)
- 중복 열람 방지 (UNIQUE 제약조건)

