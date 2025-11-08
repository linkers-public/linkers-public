# 테이블 구조 검토 보고서

## 주요 테이블 구조 분석

### 1. 프로젝트 상담 관련 테이블

#### `counsel` (프로젝트 상담 요청)
- **역할**: 기업이 프로젝트를 등록하는 테이블
- **주요 컬럼**:
  - `counsel_id` (PK)
  - `client_id` → `client.user_id` 참조
  - `company_profile_id` → `accounts.profile_id` 참조
  - `title`, `outline` (프로젝트 정보)
  - `counsel_status` (pending, recruiting, end)
  - `start_date`, `due_date`

#### `team_counsel` (팀별 상담 연결)
- **역할**: 특정 팀에게 견적 요청을 알리는 테이블
- **주요 컬럼**:
  - `team_counsel_id` (PK)
  - `team_id` → `teams.id` 참조
  - `client_id` → `client.user_id` 참조
  - `counsel_status` (상담 상태)
  - ⚠️ **문제**: `counsel_id` 컬럼이 없음!

### 2. 견적서 관련 테이블

#### `estimate` (견적서)
- **역할**: 매니저가 작성한 견적서
- **주요 컬럼**:
  - `estimate_id` (PK)
  - `team_id` → `teams.id` 참조
  - `counsel_id` → `counsel.counsel_id` 참조
  - `client_id` → `client.user_id` 참조
  - `company_profile_id` → `accounts.profile_id` 참조
  - `manager_id`, `manager_profile_id`
  - `estimate_status` (pending, accept, in_progress)
  - `estimate_date`, `estimate_start_date`, `estimate_due_date`

#### `estimate_version` (견적서 버전)
- **역할**: 견적서의 버전 관리
- **주요 컬럼**:
  - `estimate_version_id` (PK)
  - `estimate_id` → `estimate.estimate_id` 참조
  - `total_amount` (총액)
  - `detail` (상세 내역)
  - `start_date`, `end_date`
  - `version_date`

### 3. 마일스톤 및 지급 관련 테이블

#### `milestone` (마일스톤)
- **역할**: 프로젝트 진행 단계
- **주요 컬럼**:
  - `milestone_id` (PK)
  - `estimate_id` → `estimate.estimate_id` 참조
  - `estimate_version_id` → `estimate_version.estimate_version_id` 참조
  - `title`, `detail`
  - `payment_amount`
  - `milestone_start_date`, `milestone_due_date`
  - `milestone_status` (상태)
  - `progress` (진행률)

#### `payment` (지급 내역)
- **역할**: 마일스톤별 지급 정보
- **주요 컬럼**:
  - `payment_id` (PK)
  - `milestone_id` → `milestone.milestone_id` 참조
  - `payment_amount`, `payment_date`
  - `payment_method`, `payment_status`

### 4. 팀 관련 테이블

#### `teams` (팀 정보)
- **역할**: 프리랜서 팀 정보
- **주요 컬럼**:
  - `id` (PK)
  - `name` (팀명)
  - `manager_id` (매니저 user_id)
  - `manager_profile_id` → `accounts.profile_id` 참조
  - `bio`, `specialty`, `sub_specialty`

#### `team_members` (팀 멤버)
- **역할**: 팀에 속한 멤버들
- **주요 컬럼**:
  - `id` (PK)
  - `team_id` → `teams.id` 참조
  - `profile_id` → `accounts.profile_id` 참조
  - `maker_id` (메이커 user_id)
  - `status`

### 5. 프로필 관련 테이블

#### `accounts` (프로필)
- **역할**: 사용자 프로필 (프리랜서/기업)
- **주요 컬럼**:
  - `profile_id` (PK, UUID)
  - `user_id` (auth.users.id)
  - `profile_type` (FREELANCER, COMPANY)
  - `role` (MAKER, MANAGER, NONE)
  - `username`, `bio`, `main_job`, `expertise`

#### `client` (기업 정보)
- **역할**: 기업 클라이언트 정보
- **주요 컬럼**:
  - `id` (PK, UUID)
  - `user_id` (auth.users.id, UNIQUE)
  - `company_name`, `contact_person`, `contact_phone`
  - `email`, `address`, `website`

## 현재 견적 요청 프로세스 분석

### ❌ 문제점

1. **`team_counsel` 테이블에 `counsel_id`가 없음**
   - `team_counsel`은 `team_id`와 `client_id`만 가지고 있음
   - 특정 `counsel`(프로젝트)를 특정 팀에 연결할 수 없음

2. **견적 요청 시 `estimate`를 생성하는 문제**
   - 기업이 견적을 "요청"하는 단계에서 `estimate`를 생성하면 안 됨
   - `estimate`는 매니저가 견적서를 "작성"할 때 생성되어야 함

### ✅ 올바른 프로세스

1. **기업이 견적 요청**
   - `counsel` 테이블에 프로젝트 정보 생성
   - `counsel_status = 'recruiting'`
   - ⚠️ 팀과 연결하는 방법이 필요함

2. **매니저가 견적서 작성**
   - `/my/estimate-requests`에서 `counsel` 목록 확인
   - `estimate` 테이블에 견적서 생성
   - `estimate_version`에 상세 정보 저장
   - `milestone` 추가 (선택)

## 해결 방안

### 옵션 1: `team_counsel` 테이블에 `counsel_id` 추가
```sql
ALTER TABLE team_counsel 
ADD COLUMN counsel_id INTEGER REFERENCES counsel(counsel_id);
```

### 옵션 2: `counsel` 테이블에 `requested_team_id` 추가 (간단)
```sql
ALTER TABLE counsel 
ADD COLUMN requested_team_id INTEGER REFERENCES teams(id);
```

### 옵션 3: 별도 테이블 생성
```sql
CREATE TABLE estimate_requests (
  id SERIAL PRIMARY KEY,
  counsel_id INTEGER REFERENCES counsel(counsel_id),
  team_id INTEGER REFERENCES teams(id),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR DEFAULT 'pending'
);
```

## 권장 사항

**옵션 2**를 권장합니다:
- 가장 간단하고 직관적
- 기업이 특정 팀에게 견적을 요청할 때 `counsel.requested_team_id`에 저장
- 매니저는 자신의 팀에 대한 `counsel`만 조회 가능

## 실제 테이블 존재 여부 확인

⚠️ **중요**: 실제 데이터베이스에 `counsel`, `estimate`, `estimate_version`, `milestone`, `payment`, `team_counsel` 테이블이 존재하지 않을 수 있습니다.

타입 파일(`src/types/supabase.ts`)에는 정의되어 있지만, 실제 데이터베이스에는 아직 생성되지 않았을 가능성이 있습니다.

## 현재 구현 상태

### ✅ 수정 완료
1. **견적 요청 시 `estimate` 생성 제거**
   - `requestEstimate()` 함수에서 `counsel`만 생성
   - `TeamDetailClient.tsx`에서도 `estimate` 생성 제거

2. **올바른 프로세스**
   - 기업이 견적 요청 → `counsel` 생성 (프로젝트 정보)
   - 매니저가 견적서 작성 → `estimate` + `estimate_version` 생성

### ⚠️ 남은 문제

1. **팀과 `counsel` 연결 방법**
   - 현재 `team_counsel` 테이블에 `counsel_id`가 없음
   - 매니저가 자신의 팀에 대한 견적 요청을 어떻게 조회할지 불명확

2. **해결 방안**

   **방안 A: `counsel` 테이블에 `requested_team_id` 추가 (권장)**
   ```sql
   ALTER TABLE counsel 
   ADD COLUMN requested_team_id INTEGER REFERENCES teams(id);
   ```
   - 장점: 간단하고 직관적
   - 단점: 하나의 `counsel`에 하나의 팀만 지정 가능

   **방안 B: `team_counsel` 테이블에 `counsel_id` 추가**
   ```sql
   ALTER TABLE team_counsel 
   ADD COLUMN counsel_id INTEGER REFERENCES counsel(counsel_id);
   ```
   - 장점: 하나의 `counsel`에 여러 팀 지정 가능
   - 단점: `team_counsel` 테이블 구조 변경 필요

   **방안 C: 현재 구조 유지 (모든 매니저가 모든 `counsel` 조회)**
   - 기업이 특정 팀에게만 요청하는 기능 없음
   - 모든 매니저가 모든 프로젝트에 견적 제출 가능
   - 가장 단순하지만 요구사항과 맞지 않을 수 있음

## 최종 권장 사항

**방안 A (`counsel.requested_team_id` 추가)**를 권장합니다:
1. 기업이 특정 팀에게 견적 요청 시 `counsel.requested_team_id`에 저장
2. 매니저는 `counsel.requested_team_id = 자신의_팀_id`인 `counsel`만 조회
3. `requested_team_id`가 NULL이면 모든 매니저가 조회 가능 (공개 프로젝트)

