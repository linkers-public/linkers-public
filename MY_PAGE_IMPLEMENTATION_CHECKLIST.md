# 마이페이지 기능 구현 체크리스트

## 📋 개요
프리랜서 및 기업 프로필 마이페이지 기능 구현 상태를 확인한 결과입니다.

---

## 🔵 프리랜서 프로필 페이지

### 1. 받은 팀 초대 (`/my/team-invites`)

**구현 상태:** ✅ **완료**

**구현된 기능:**
- ✅ 팀 초대 목록 조회 (`team_members` 테이블)
- ✅ 팀 초대 수락 기능
- ✅ 팀 초대 거절 기능
- ✅ 초대 상태 표시 (대기중/수락됨/거절됨)
- ✅ 매니저 정보 표시

**데이터 소스:**
- `team_members` 테이블
- `teams` 테이블
- `accounts` 테이블

---

### 2. 받은 프로젝트 제안 (`/my/project-proposals`)

**구현 상태:** ✅ **완료**

**구현된 기능:**
- ✅ 프로젝트 제안 목록 조회 (`project_members` 테이블)
- ✅ 프로젝트 제안 수락 기능
- ✅ 프로젝트 제안 거절 기능
- ✅ 제안 상태 표시 (대기중/수락됨/거절됨)
- ✅ 기업 정보 표시
- ✅ 프로젝트 상세보기 링크

**데이터 소스:**
- `project_members` 테이블
- `counsel` 테이블 (프로젝트 정보)
- `client` 테이블
- `accounts` 테이블

---

### 3. 관심 프로젝트 (`/my/bookmarked-projects`)

**구현 상태:** ⚠️ **부분 구현** (테이블 생성 완료, 기능 미구현)

**구현된 기능:**
- ✅ 페이지 구조 및 UI
- ✅ 빈 상태 표시
- ❌ 북마크 목록 조회 (TODO)
- ❌ 북마크 해제 기능 (TODO)

**필요한 작업:**
```typescript
// BookmarkedProjectsClient.tsx의 loadBookmarkedProjects 함수 구현 필요
const loadBookmarkedProjects = async () => {
  // 1. 활성 프로필 확인
  // 2. project_bookmarks 테이블에서 북마크 조회
  // 3. counsel 테이블과 조인하여 프로젝트 정보 가져오기
  // 4. 상태 업데이트
}
```

**데이터 소스:**
- `project_bookmarks` 테이블 ✅ (생성 완료)
- `counsel` 테이블
- `accounts` 테이블

---

### 4. 관심 기업 (`/my/bookmarked-companies`)

**구현 상태:** ⚠️ **부분 구현** (테이블 생성 완료, 기능 미구현)

**구현된 기능:**
- ✅ 페이지 구조 및 UI
- ✅ 빈 상태 표시
- ❌ 북마크 목록 조회 (TODO)
- ❌ 북마크 해제 기능 (TODO)

**필요한 작업:**
```typescript
// BookmarkedCompaniesClient.tsx의 loadBookmarkedCompanies 함수 구현 필요
const loadBookmarkedCompanies = async () => {
  // 1. 활성 프로필 확인
  // 2. company_bookmarks 테이블에서 북마크 조회
  // 3. accounts 테이블과 조인하여 기업 정보 가져오기
  // 4. 상태 업데이트
}
```

**데이터 소스:**
- `company_bookmarks` 테이블 ✅ (생성 완료)
- `accounts` 테이블

---

### 5. 로그인/보안 (`/my/account/security`)

**구현 상태:** ✅ **완료**

**구현된 기능:**
- ✅ 이메일 주소 표시 (읽기 전용)
- ✅ 비밀번호 변경 기능
- ✅ 계정 삭제 기능 (Soft delete)
- ✅ 사용자 정보 로드

**데이터 소스:**
- Supabase Auth API
- `accounts` 테이블 (deleted_at 업데이트)
- `client` 테이블 (client_status 업데이트)

**참고:**
- 이메일 변경 기능은 "준비 중" 상태 (Supabase Auth API 사용 필요)

---

### 6. 알림 설정 (`/my/account/notifications`)

**구현 상태:** ⚠️ **부분 구현** (테이블 생성 완료, 기능 미구현)

**구현된 기능:**
- ✅ 페이지 구조 및 UI
- ✅ Switch 컴포넌트 (이메일/웹푸시/카카오톡)
- ✅ 설정 상태 관리 (로컬)
- ❌ 설정 조회 (TODO)
- ❌ 설정 저장 (TODO)

**필요한 작업:**
```typescript
// NotificationsClient.tsx의 loadNotificationSettings 함수 구현 필요
const loadNotificationSettings = async () => {
  // 1. user_settings 테이블에서 설정 조회
  // 2. 없으면 기본값 사용
  // 3. 상태 업데이트
}

// handleSave 함수 구현 필요
const handleSave = async () => {
  // 1. user_settings 테이블에 upsert
  // 2. 성공 메시지 표시
}
```

**데이터 소스:**
- `user_settings` 테이블 ✅ (생성 완료)

---

## 🟢 기업 프로필 페이지

### 1. 내 정보 / 회사 정보 수정 (`/my/company/info`)

**구현 상태:** ✅ **완료**

**구현된 기능:**
- ✅ 회사 정보 조회 (`client`, `accounts` 테이블)
- ✅ 회사 정보 수정 (저장)
- ✅ 회사명, 담당자, 연락처, 주소, 웹사이트 수정
- ✅ 이메일 표시 (읽기 전용)

**데이터 소스:**
- `client` 테이블 ✅ (컬럼 추가 완료)
- `accounts` 테이블

---

### 2. 팀 멤버 관리 (`/my/company/team-members`)

**구현 상태:** ⚠️ **부분 구현** (테이블 생성 완료, 기능 미구현)

**구현된 기능:**
- ✅ 페이지 구조 및 UI
- ✅ 멤버 추가 폼
- ✅ 멤버 목록 표시 영역
- ❌ 멤버 목록 조회 (TODO)
- ❌ 멤버 추가 기능 (TODO)
- ❌ 멤버 제거 기능 (TODO)

**필요한 작업:**
```typescript
// TeamMembersClient.tsx의 loadTeamMembers 함수 구현 필요
const loadTeamMembers = async () => {
  // 1. company_team_members 테이블에서 멤버 조회
  // 2. 상태 업데이트
}

// handleAddMember 함수 구현 필요
const handleAddMember = async () => {
  // 1. 이메일로 사용자 찾기 (또는 초대 이메일 발송)
  // 2. company_team_members 테이블에 추가
  // 3. 목록 새로고침
}

// handleRemoveMember 함수 구현 필요
const handleRemoveMember = async () => {
  // 1. company_team_members 테이블에서 삭제
  // 2. 목록 새로고침
}
```

**데이터 소스:**
- `company_team_members` 테이블 ✅ (생성 완료)

---

### 3. 구독 관리 (`/my/subscription`)

**구현 상태:** ⚠️ **부분 구현** (테이블 생성 완료, 기능 미구현)

**구현된 기능:**
- ✅ 페이지 구조 및 UI
- ✅ 구독 정보 표시 영역
- ✅ 자동 갱신 토글 UI
- ✅ 구독 해지 버튼
- ❌ 구독 정보 조회 (TODO - 임시 데이터 사용 중)
- ❌ 자동 갱신 토글 기능 (TODO)
- ❌ 구독 해지 기능 (TODO)

**필요한 작업:**
```typescript
// SubscriptionClient.tsx의 loadSubscription 함수 구현 필요
const loadSubscription = async () => {
  // 1. company_subscriptions 테이블에서 구독 정보 조회
  // 2. 없으면 기본값 또는 null
  // 3. 상태 업데이트
}

// handleRenewalToggle 함수 구현 필요
const handleRenewalToggle = async () => {
  // 1. company_subscriptions 테이블 업데이트
  // 2. 상태 새로고침
}

// handleCancel 함수 구현 필요
const handleCancel = async () => {
  // 1. company_subscriptions 테이블 업데이트 (status = 'cancelled', cancelled_at 설정)
  // 2. 상태 새로고침
}
```

**데이터 소스:**
- `company_subscriptions` 테이블 ✅ (생성 완료)

**참고:**
- 테이블명이 `subscriptions`가 아닌 `company_subscriptions`로 생성됨

---

### 4. 결제 내역 / 영수증 (`/my/payments`)

**구현 상태:** ⚠️ **부분 구현** (테이블 생성 완료, 기능 미구현)

**구현된 기능:**
- ✅ 페이지 구조 및 UI
- ✅ 결제 내역 카드 UI
- ✅ 영수증 다운로드 버튼
- ❌ 결제 내역 조회 (TODO)
- ❌ 영수증 다운로드 기능 (TODO)

**필요한 작업:**
```typescript
// PaymentsClient.tsx의 loadPayments 함수 구현 필요
const loadPayments = async () => {
  // 1. company_payments 테이블에서 결제 내역 조회
  // 2. 최신순 정렬
  // 3. 상태 업데이트
}

// handleDownloadReceipt 함수 구현 필요
const handleDownloadReceipt = async (paymentId: string) => {
  // 1. company_payments 테이블에서 receipt_url 가져오기
  // 2. 파일 다운로드 또는 새 창 열기
}
```

**데이터 소스:**
- `company_payments` 테이블 ✅ (생성 완료)

**참고:**
- 테이블명이 `payments`가 아닌 `company_payments`로 생성됨

---

### 5. 연락처 열람 기록 (`/my/contact-history`)

**구현 상태:** ⚠️ **부분 구현** (테이블 생성 완료, 기능 미구현)

**구현된 기능:**
- ✅ 페이지 구조 및 UI
- ✅ 연락처 기록 카드 UI
- ✅ 프로필 보기 링크
- ❌ 연락처 열람 기록 조회 (TODO)

**필요한 작업:**
```typescript
// ContactHistoryClient.tsx의 loadContactHistory 함수 구현 필요
const loadContactHistory = async () => {
  // 1. 활성 프로필 확인
  // 2. contact_purchases 테이블에서 구매 기록 조회
  // 3. accounts 테이블과 조인하여 프리랜서 정보 가져오기
  // 4. 상태 업데이트
}
```

**데이터 소스:**
- `contact_purchases` 테이블 ✅ (생성 완료)
- `accounts` 테이블

---

### 6. 진행 이력 (`/my/project-history`)

**구현 상태:** ✅ **완료**

**구현된 기능:**
- ✅ 진행 중인 프로젝트 조회 (`counsel` 테이블)
- ✅ 프로젝트 상태 필터링
- ✅ 프로젝트 상세보기 링크
- ✅ 상태 배지 표시

**데이터 소스:**
- `counsel` 테이블
- `client` 테이블

---

### 7. 완료 프로젝트 저장함 (`/my/completed-projects`)

**구현 상태:** ✅ **완료**

**구현된 기능:**
- ✅ 완료된 프로젝트 조회 (`counsel` 테이블, status = 'end')
- ✅ 완료일 표시
- ✅ 프로젝트 상세보기 링크

**데이터 소스:**
- `counsel` 테이블

---

### 8. 회원 탈퇴 (`/my/account/delete`)

**구현 상태:** ✅ **완료**

**구현된 기능:**
- ✅ 탈퇴 확인 문구 입력
- ✅ Soft delete 처리 (`accounts.deleted_at`, `client.client_status`)
- ✅ 로그아웃 및 홈으로 이동

**데이터 소스:**
- `accounts` 테이블
- `client` 테이블

---

## 📊 구현 상태 요약

### ✅ 완전 구현 (7개)
1. 받은 팀 초대
2. 받은 프로젝트 제안
3. 로그인/보안
4. 내 정보 / 회사 정보 수정
5. 진행 이력
6. 완료 프로젝트 저장함
7. 회원 탈퇴

### ⚠️ 부분 구현 (6개)
1. 관심 프로젝트 - 테이블 생성 완료, 기능 미구현
2. 관심 기업 - 테이블 생성 완료, 기능 미구현
3. 알림 설정 - 테이블 생성 완료, 기능 미구현
4. 팀 멤버 관리 - 테이블 생성 완료, 기능 미구현
5. 구독 관리 - 테이블 생성 완료, 기능 미구현
6. 결제 내역 / 영수증 - 테이블 생성 완료, 기능 미구현
7. 연락처 열람 기록 - 테이블 생성 완료, 기능 미구현

---

## 🔧 다음 단계 작업

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

### 우선순위 3: 테이블명 업데이트
- `SubscriptionClient.tsx` - `subscriptions` → `company_subscriptions`
- `PaymentsClient.tsx` - `payments` → `company_payments`

---

## 📝 참고사항

1. **테이블명 변경:**
   - `subscriptions` → `company_subscriptions` (기존 테이블과 충돌 방지)
   - `payments` → `company_payments` (기존 테이블과 충돌 방지)

2. **counsel 테이블:**
   - 현재 데이터베이스에 `counsel` 테이블이 존재하지 않음
   - `project_bookmarks` 테이블의 `counsel_id`는 외래키 없이 생성됨
   - `counsel` 테이블이 생성되면 외래키 추가 필요

3. **타입 불일치:**
   - `client.user_id`는 VARCHAR 타입
   - `auth.users.id`는 UUID 타입
   - `company_team_members` 테이블은 VARCHAR로 생성됨 (외래키 제약 없음)

