# Counsel 리팩토링 완료 요약

## 완료된 작업

### 1. 스키마 마이그레이션 (`database_migration_counsel_refactor.sql`)
- ✅ `counsel.requested_team_id` 컬럼 추가
- ✅ `notifications` 테이블 생성 (팀↔기업 견적 요청 알림)
- ✅ `counsel_status_events` 테이블 생성 (상태 이벤트 로그)
- ✅ `counsel.deleted_at` 컬럼 추가 (아카이브용)

### 2. API 서비스 수정

#### `src/apis/company-project.service.ts`
- ✅ `getCompanyCounsels()`: `company_profile_id` 의존 제거, `client_id`만 사용
- ✅ `requestEstimate()` 제거
- ✅ `requestEstimateToTeam()` 추가: 기존 프로젝트에 특정 팀 지정
- ✅ `createProjectAndRequestEstimate()` 추가: 새 프로젝트 생성 및 특정 팀에게 견적 요청

#### `src/apis/notification.service.ts` (신규)
- ✅ `createTeamToClientEstimateRequest()`: 팀→기업 견적 요청 알림
- ✅ `createClientToTeamEstimateRequest()`: 기업→팀 견적 요청 알림
- ✅ `getClientNotifications()`: 기업이 받은 알림 조회
- ✅ `getTeamNotifications()`: 팀이 받은 알림 조회
- ✅ `updateNotificationStatus()`: 알림 상태 업데이트

### 3. 컴포넌트 수정

#### `src/app/enterprise/counsel-form/page.tsx`
- ⚠️ 아직 수정 안 됨 (company_profile_id 제거 필요)

#### `src/app/(home)/c/teams/[id]/TeamDetailClient.tsx`
- ✅ `handleSubmitProposal()`: counsel 생성 제거, notifications만 생성

#### `src/app/(home)/my/company/projects/CompanyProjectsClient.tsx`
- ✅ `requestEstimate` → `createProjectAndRequestEstimate` 변경

## 남은 작업

### 1. 상담 신청 폼 수정 (C-1)
**파일**: `src/app/enterprise/counsel-form/page.tsx`

현재:
```typescript
.insert({
  client_id: clientData.user_id,
  // company_profile_id 없음
  counsel_status: 'pending'
})
```

수정 필요 없음 (이미 client_id만 사용 중)

### 2. 기존 프로젝트에 견적 요청 UI 추가
**파일**: `src/app/(home)/my/company/projects/CompanyProjectsClient.tsx`

현재는 새 프로젝트 생성만 가능. 기존 프로젝트 선택 후 `requestEstimateToTeam()` 호출하는 UI 추가 필요.

### 3. 알림 수락/거절 UI
- 기업이 팀의 견적 요청 알림을 수락하면 `counsel` 생성 또는 기존 `counsel` 연결
- 알림 상태 업데이트

### 4. 상태 이벤트 로그 활용
- `counsel_status_events` 테이블에 이벤트 기록
- UI에서 최신 이벤트를 읽어 상태 표시

### 5. 잘못 생성된 counsel 정리
- "팀→기업 견적 요청"으로 생성된 counsel을 notifications로 변환
- 아카이브 또는 삭제

## 주요 변경 사항

### Before
1. 기업이 특정 팀에게 견적 요청 → 새 `counsel` 생성
2. 팀이 기업에게 견적 요청 → 새 `counsel` 생성 ❌
3. `company_profile_id` 의존으로 일부 counsel이 조회되지 않음

### After
1. 기업이 특정 팀에게 견적 요청 → 기존 `counsel` 업데이트 또는 새 `counsel` 생성 + 알림
2. 팀이 기업에게 견적 요청 → `notifications`만 생성 ✅
3. `client_id`만 사용하여 모든 counsel 조회 가능

## 다음 단계

1. 마이그레이션 SQL 실행
2. 기존 프로젝트에 견적 요청 UI 추가
3. 알림 수락/거절 기능 구현
4. 상태 이벤트 로그 기록 및 UI 표시
5. 잘못 생성된 counsel 정리 스크립트 실행

