# 📋 링커스 개발 작업 내역 (2025-11-08)

## 🎯 주요 완료 작업

### 1. 마이페이지 개발 완료

#### 프리랜서 프로필 페이지
- ✅ **받은 팀 초대** (`/my/team-invites`)
  - 팀 초대 목록 조회, 수락/거절 기능
  - 데이터 소스: `team_members`, `teams`, `accounts` 테이블

- ✅ **받은 프로젝트 제안** (`/my/project-proposals`)
  - 프로젝트 제안 목록 조회, 수락/거절 기능
  - 데이터 소스: `project_members`, `counsel`, `client` 테이블

- ✅ **로그인/보안** (`/my/account/security`)
  - 이메일 주소 표시, 비밀번호 변경, 계정 삭제 (Soft delete)

- ✅ **회원 탈퇴** (`/my/account/delete`)
  - 탈퇴 확인 문구 입력, Soft delete 처리

#### 기업 프로필 페이지
- ✅ **회사 정보 수정** (`/my/company/info`)
  - 회사 정보 조회 및 수정 (회사명, 담당자, 연락처, 주소, 웹사이트)
  - 데이터 소스: `client`, `accounts` 테이블
  - 최근 업데이트: `client` 테이블에 contact_person, contact_phone, address, website 컬럼 추가

- ✅ **진행 이력** (`/my/project-history`)
  - 진행 중인 프로젝트 조회, 상태 필터링, 상세보기 링크

- ✅ **완료 프로젝트 저장함** (`/my/completed-projects`)
  - 완료된 프로젝트 조회 (status = 'end')

#### 부분 구현 (추가 개발 필요)
- ⚠️ 관심 프로젝트 (`/my/bookmarked-projects`) - 테이블 생성 완료, 기능 미구현
- ⚠️ 관심 기업 (`/my/bookmarked-companies`) - 테이블 생성 완료, 기능 미구현
- ⚠️ 알림 설정 (`/my/account/notifications`) - UI 완료, 저장 기능 미구현
- ⚠️ 구독 관리 (`/my/subscription`) - 테이블 생성 완료, 기능 미구현
- ⚠️ 결제 내역 (`/my/payments`) - 테이블 생성 완료, 기능 미구현
- ⚠️ 연락처 열람 기록 (`/my/contact-history`) - 테이블 생성 완료, 기능 미구현

---

### 2. 쪽지함 UI/UX 개선 (2025-11-08)

#### 주요 개선 사항
- ✅ **탭 UI 개선**: 아이콘 추가, 하이라이트 기능, 스크롤 가능한 탭 바
- ✅ **메시지 카드 디자인**: 그라데이션 배경 아이콘, 대기 중인 메시지 강조
- ✅ **설명 박스**: 접기 기능 추가, 정보 아이콘
- ✅ **날짜 표시**: 상대 시간 표시 ("방금 전", "5분 전" 등)
- ✅ **액션 버튼**: 아이콘 추가, 일관된 크기
- ✅ **빈 상태 UI**: 더 큰 아이콘, 그라데이션 배경

#### 기술적 개선
- ✅ **컴포넌트 구조화**: TabButton, MessageCard, EmptyState 컴포넌트 생성
- ✅ **유틸리티 함수**: formatRelativeTime 함수 추가
- ✅ **Supabase 쿼리 개선**: PostgREST 조인 대신 별도 쿼리로 안정성 향상

**관련 파일**: `src/app/(home)/my/messages/MessagesClient.tsx`

---

### 3. 월 정기결제 시스템 완전 구현

#### 구현된 기능
- ✅ **구독 등록** (`/api/subscription-v2/register`)
  - 빌링키 발급 후 구독 등록
  - 첫 달 무료 처리
  - 30일 후 첫 결제 예약

- ✅ **포트원 Webhook 처리** (`/api/subscription-v2/webhook`)
  - 결제 성공 시 자동 처리
  - 결제 내역 저장
  - 다음 달 결제 자동 예약

- ✅ **월 정기결제 자동 처리** (`/api/subscription-v2/process-monthly`)
  - 매일 실행하여 결제일인 구독 처리
  - Vercel Cron Jobs 또는 외부 스케줄러에서 호출
  - 결제 실패 시 자동 재시도

- ✅ **결제 재시도** (`/api/subscription-v2/retry-payment`)
  - 결제 실패한 구독 수동 재시도

- ✅ **구독 해지** (`/api/subscription-v2/cancel`)
  - 예약된 결제 취소
  - 구독 상태 변경

#### 데이터베이스 스키마
- `subscriptions` 테이블: 구독 정보 저장
- `payments` 테이블: 결제 내역 저장

#### 주요 파일
- `src/apis/subscription-v2.service.ts`: 포트원 API 연동 (서버 전용)
- `src/app/api/subscription-v2/register/route.ts`: 구독 등록
- `src/app/api/subscription-v2/webhook/route.ts`: Webhook 처리
- `src/app/api/subscription-v2/cancel/route.ts`: 구독 해지
- `src/app/api/subscription-v2/retry-payment/route.ts`: 결제 재시도

---

### 4. 프로필 리팩토링 시스템

#### 핵심 설계
- ✅ **유저는 프리랜서/기업 각각 프로필 1개씩 가짐**
- ✅ **프로젝트별 메이커 ↔ 매니저 롤 전환이 자유로움**
- ✅ **경력 인증 배지 시스템**

#### 데이터베이스 구조
- `accounts` 테이블에 `profile_type` 컬럼 추가 ('FREELANCER' | 'COMPANY')
- `project_members` 테이블: 프로젝트별 역할 관리 (MAKER | MANAGER)
- `career_verification_requests` 테이블: 경력 인증 요청 관리

#### 구현된 UI
- ✅ **프로필 생성 페이지** (`/my/profile/create`)
- ✅ **프로필 관리 페이지** (`/my/profile/manage`)
- ✅ **프로필 전환 버튼** (헤더에 표시)
- ✅ **프로젝트 참여 모달** (프로필 선택, 역할 선택)

**관련 파일**:
- `src/app/(home)/my/profile/create/page.tsx`
- `src/app/(home)/my/profile/manage/page.tsx`
- `src/components/ProfileSwitchButton.tsx`
- `src/components/ProjectJoinModal.tsx`

---

### 5. 상담(Counsel) 리팩토링

#### 주요 변경 사항
- ✅ `counsel.requested_team_id` 컬럼 추가
- ✅ `notifications` 테이블 생성 (팀↔기업 견적 요청 알림)
- ✅ `counsel_status_events` 테이블 생성 (상태 이벤트 로그)
- ✅ `counsel.deleted_at` 컬럼 추가 (아카이브용)

#### API 서비스 수정
- ✅ `getCompanyCounsels()`: `company_profile_id` 의존 제거, `client_id`만 사용
- ✅ `requestEstimateToTeam()`: 기존 프로젝트에 특정 팀 지정
- ✅ `createProjectAndRequestEstimate()`: 새 프로젝트 생성 및 특정 팀에게 견적 요청
- ✅ `notification.service.ts` (신규): 팀↔기업 견적 요청 알림 관리

**Before**: 기업이 특정 팀에게 견적 요청 → 새 `counsel` 생성
**After**: 기업이 특정 팀에게 견적 요청 → 기존 `counsel` 업데이트 또는 새 `counsel` 생성 + 알림

---

### 6. 메시지 테이블 구조 개선

#### 데이터베이스 마이그레이션
- ✅ `team_proposals` 테이블: 외래 키 제약조건 추가, 중복 제안 방지
- ✅ `team_members` 테이블: `request_type` 컬럼 추가 ('invite' | 'request')
- ✅ 성능 최적화 인덱스 추가

#### 코드 업데이트
- ✅ `team.service.ts`: `request_type` 필드 추가
- ✅ `proposal.service.ts`: `request_type` 필드 추가
- ✅ `MessagesClient.tsx`: 초대/신청 구분 필터 추가

**개선 효과**:
- 데이터 무결성 향상 (외래 키, UNIQUE 제약조건)
- 역할 구분 명확화 (초대 vs 신청)
- 코드 가독성 향상

---

### 7. 데이터베이스 마이그레이션

#### 생성/수정된 테이블
- ✅ `subscriptions` - 구독 정보
- ✅ `payments` - 결제 내역
- ✅ `notifications` - 알림
- ✅ `counsel_status_events` - 상태 이벤트 로그
- ✅ `project_bookmarks` - 프로젝트 북마크
- ✅ `company_bookmarks` - 기업 북마크
- ✅ `user_settings` - 사용자 알림 설정
- ✅ `company_team_members` - 기업 팀 멤버
- ✅ `contact_purchases` - 연락처 구매 기록

#### 컬럼 추가/수정
- ✅ `client` 테이블: contact_person, contact_phone, address, website 컬럼 추가
- ✅ `accounts` 테이블: profile_type 컬럼 추가
- ✅ `counsel` 테이블: requested_team_id, deleted_at 컬럼 추가
- ✅ `team_members` 테이블: request_type 컬럼 추가

---

### 8. 코드 마이그레이션

#### 주요 변경 패턴
- ✅ `manager_id` → `manager_profile_id` 사용
- ✅ `maker_id` → `profile_id` 사용
- ✅ `client_id` → `company_profile_id` 사용 (일부)
- ✅ PostgREST FK 자동 조인 활용 (수동 조인 제거)

#### 수정된 파일
- `src/apis/team.service.ts`
- `src/apis/team-estimate.service.ts`
- `src/apis/project-member.service.ts`
- `src/app/(home)/my/estimate-requests/EstimateRequestsClient.tsx`
- `src/app/(home)/project-detail/[id]/project-detail.client.tsx`

**개선 효과**:
- 코드 간소화 (수동 조인 제거)
- 데이터 무결성 향상 (FK 제약조건)
- 성능 향상 (직접 FK 조인)
- 유지보수성 향상 (프로필 기반 구조)

---

## 📊 구현 상태 요약

### 전체 통계
- **완전 구현**: 8개 페이지
- **부분 구현**: 7개 페이지
- **총 페이지**: 15개

### 프리랜서 프로필
- **완전 구현**: 4개
- **부분 구현**: 3개

### 기업 프로필
- **완전 구현**: 4개
- **부분 구현**: 4개

---

## 🔧 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript, JavaScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Payment**: PortOne V2 API

### 배포
- **Platform**: Vercel
- **Cron Jobs**: Vercel Cron Jobs (월 정기결제)

---

## 📝 주요 파일 구조

### API 서비스
- `src/apis/counsel.service.ts` - 상담 관련 API
- `src/apis/estimate.service.ts` - 견적서 관련 API
- `src/apis/chat.service.ts` - 채팅 관련 API
- `src/apis/profile.service.ts` - 프로필 관련 API
- `src/apis/subscription-v2.service.ts` - 구독 서비스 (서버 전용)
- `src/apis/notification.service.ts` - 알림 서비스
- `src/apis/team.service.ts` - 팀 관리 서비스
- `src/apis/project-member.service.ts` - 프로젝트 멤버 관리

### API 엔드포인트
- `src/app/api/subscription-v2/register/route.ts` - 구독 등록
- `src/app/api/subscription-v2/webhook/route.ts` - Webhook 처리
- `src/app/api/subscription-v2/cancel/route.ts` - 구독 해지
- `src/app/api/subscription-v2/retry-payment/route.ts` - 결제 재시도

### 주요 페이지
- `src/app/(home)/my/` - 마이페이지
- `src/app/(home)/my/company/` - 기업 프로필 페이지
- `src/app/enterprise/` - 기업 대시보드
- `src/app/(home)/my/messages/` - 쪽지함
- `src/app/(home)/my/subscription/` - 구독 관리

---

## 🚀 다음 단계 작업

### 우선순위 1: 데이터 조회 기능 구현
1. 관심 프로젝트 - 북마크 목록 조회
2. 관심 기업 - 북마크 목록 조회
3. 알림 설정 - 설정 조회 및 저장
4. 구독 관리 - 구독 정보 조회 및 업데이트
5. 결제 내역 - 결제 내역 조회
6. 연락처 열람 기록 - 구매 기록 조회
7. 팀 멤버 관리 - 멤버 목록 조회

### 우선순위 2: 데이터 수정 기능 구현
1. 관심 프로젝트 - 북마크 추가/해제
2. 관심 기업 - 북마크 추가/해제
3. 팀 멤버 관리 - 멤버 추가/제거
4. 구독 관리 - 자동 갱신 토글, 구독 해지
5. 결제 내역 - 영수증 다운로드

### 우선순위 3: UI/UX 개선
1. 프로젝트 이력/완료 프로젝트 페이지 필터링 개선
2. 회사 정보 수정 페이지 UI 현대화
3. 빈 상태/로딩 상태 일관성 개선
4. 공통 컴포넌트 생성 (EmptyState, LoadingState, PageHeader)
5. 네비게이션 활성 상태 개선

---

## 📚 참고 문서

### 개발 문서
- `11_7_마이페이지_개발_현황.md` - 마이페이지 개발 현황
- `MY_PAGE_REVIEW.md` - 마이페이지 전체 검토 보고서
- `MONTHLY_SUBSCRIPTION_COMPLETE.md` - 월 정기결제 완전 구현 가이드
- `PROFILE_REFACTOR_DESIGN.md` - 프로필 리팩토링 설계
- `COUNSEL_REFACTOR_SUMMARY.md` - 상담 리팩토링 완료 요약
- `MESSAGE_TABLES_IMPROVEMENT_SUMMARY.md` - 메시지 테이블 구조 개선
- `CODE_MIGRATION_SUMMARY.md` - 프론트엔드 코드 마이그레이션
- `UI_IMPLEMENTATION_SUMMARY.md` - UI 구현 완료 요약
- `NOTION_UPDATE_2025_11_08.md` - 쪽지함 UI/UX 개선 내역

### 환경 설정
- `PORTONE_V2_ENV_SETUP.md` - 포트원 V2 환경 설정
- `VERCEL_ENV_SETUP.md` - Vercel 환경 설정
- `WEBHOOK_ENDPOINTS.md` - 웹훅 엔드포인트 가이드

---

## ⚠️ 알려진 이슈

### 1. 스키마 캐시 문제
- `client.address` 컬럼이 PostgREST 스키마 캐시에 반영되지 않음
- **해결 방법**: Supabase 대시보드에서 API 스키마 새로고침 필요
- **임시 조치**: 코드에서 address 필드를 별도로 처리하도록 수정 완료

### 2. ENUM 값 불일치
- 실제 데이터베이스의 ENUM 값은 **대문자**입니다:
  - `profile_type`: 'FREELANCER', 'COMPANY' (소문자 아님)
  - `project_member_status`: 'INVITED', 'ACTIVE', 'COMPLETED', 'LEFT'

### 3. 부분 구현 기능
- 일부 페이지는 테이블 생성은 완료되었으나 기능 구현이 미완성
- 우선순위에 따라 순차적으로 구현 예정

---

## 🎯 주요 성과

1. ✅ **마이페이지 핵심 기능 완성**: 프리랜서/기업 프로필별 마이페이지 구현
2. ✅ **결제 시스템 구축**: 포트원 V2 연동 월 정기결제 완전 구현
3. ✅ **프로필 시스템 리팩토링**: 프로필 타입별 관리 시스템 구축
4. ✅ **UI/UX 개선**: 쪽지함 등 주요 페이지 UI/UX 현대화
5. ✅ **데이터베이스 구조 개선**: 여러 테이블 구조 개선 및 마이그레이션 완료
6. ✅ **코드 품질 향상**: FK 기반 자동 조인 활용, 코드 간소화

---

*최종 업데이트: 2025-11-08*

