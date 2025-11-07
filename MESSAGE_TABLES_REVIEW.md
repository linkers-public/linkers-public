# 메시지 테이블 구조 검토 결과

## 📋 현재 메시지 관련 테이블 구조

### 1. `team_members` 테이블
**용도**: 팀 초대 및 합류 신청 관리

**컬럼 구조**:
```sql
- id (BIGINT, PK)
- team_id (BIGINT, FK → teams.id)
- profile_id (UUID, FK → accounts.profile_id) ✅
- maker_id (UUID, nullable) ⚠️
- status (VARCHAR, nullable) -- 'pending', 'active', 'declined'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP, nullable)
```

**현재 사용 방식**:
- **팀 초대**: 매니저가 메이커를 초대 → `status = null` 또는 `status = 'pending'`
- **합류 신청**: 메이커가 팀에 신청 → `status = 'pending'`, `maker_id`가 자신
- **활성 멤버**: `status = 'active'`

**문제점**:
1. ⚠️ **`profile_id`와 `maker_id` 중복**
   - `profile_id`: accounts.profile_id 참조 (프로필 기반)
   - `maker_id`: user_id (auth.users.id 참조)
   - 두 필드가 모두 존재하여 혼란 가능

2. ⚠️ **역할 구분 불명확**
   - 초대인지 신청인지 구분이 어려움
   - `maker_id`가 null인 경우와 있는 경우의 차이 불명확

3. ⚠️ **외래 키 제약조건 부족**
   - `maker_id`에 외래 키 제약조건 없음 (참조 무결성 보장 안 됨)

---

### 2. `team_proposals` 테이블
**용도**: 매니저가 메이커에게 팀 제안 보내기

**컬럼 구조**:
```sql
- id (BIGINT, PK)
- team_id (BIGINT, nullable)
- manager_id (UUID, NOT NULL) -- default: auth.uid()
- maker_id (UUID, NOT NULL)
- message (TEXT, nullable)
- created_at (TIMESTAMP)
```

**현재 사용 방식**:
- 매니저가 메이커에게 팀 제안 전송
- 메이커가 수락하면 `team_members`에 추가

**문제점**:
1. ❌ **외래 키 제약조건 없음**
   - `team_id` → `teams.id` 외래 키 없음
   - `manager_id` → `accounts.user_id` 외래 키 없음
   - `maker_id` → `accounts.user_id` 외래 키 없음
   - 참조 무결성 보장 안 됨

2. ⚠️ **중복 데이터 가능성**
   - 같은 매니저가 같은 메이커에게 여러 번 제안 가능
   - UNIQUE 제약조건 없음

3. ⚠️ **제안 삭제 정책 불명확**
   - 수락 후 제안 레코드 처리 방식 불명확

---

### 3. `project_members` 테이블
**용도**: 기업이 프리랜서를 프로젝트에 초대

**컬럼 구조**:
```sql
- id (SERIAL, PK)
- counsel_id (INTEGER, FK → counsel.counsel_id)
- profile_id (UUID, FK → accounts.profile_id) ✅
- role (project_role, NOT NULL) -- 'MAKER' | 'MANAGER'
- status (project_member_status, NOT NULL) -- 'pending', 'INVITED', 'ACTIVE', 'LEFT'
- joined_at (TIMESTAMP, nullable)
- left_at (TIMESTAMP, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(counsel_id, profile_id, role) ✅
```

**현재 사용 방식**:
- 기업이 프리랜서를 프로젝트에 초대
- `status = 'INVITED'`로 초대 상태 표시

**문제점**:
1. ✅ **구조가 가장 명확함**
   - 외래 키 제약조건 존재
   - UNIQUE 제약조건으로 중복 방지
   - 상태 관리 명확

---

## 🔍 주요 문제점 요약

### 1. `team_members` 테이블
- **`profile_id`와 `maker_id` 중복**: 두 필드가 모두 존재하여 혼란
- **역할 구분 불명확**: 초대인지 신청인지 구분 어려움
- **외래 키 부족**: `maker_id`에 외래 키 제약조건 없음

### 2. `team_proposals` 테이블
- **외래 키 제약조건 없음**: 모든 참조 필드에 외래 키 없음
- **중복 제안 가능**: UNIQUE 제약조건 없음
- **제안 수락 후 처리 불명확**: 수락 후 레코드 삭제 여부 불명확

### 3. 데이터 일관성
- `team_members`와 `team_proposals` 간 관계 불명확
- 같은 기능을 두 테이블에서 처리하는 혼란

---

## 💡 개선 방안

### 옵션 1: 테이블 구조 개선 (권장)

#### `team_members` 테이블 개선
```sql
-- 1. maker_id 제거 (profile_id로 충분)
ALTER TABLE team_members DROP COLUMN IF EXISTS maker_id;

-- 2. 초대/신청 구분을 위한 컬럼 추가
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS request_type VARCHAR(20) DEFAULT 'invite';
-- 'invite': 매니저가 초대
-- 'request': 메이커가 신청

-- 3. 외래 키 제약조건 확인
-- profile_id는 이미 FK 존재 ✅
```

#### `team_proposals` 테이블 개선
```sql
-- 1. 외래 키 제약조건 추가
ALTER TABLE team_proposals
ADD CONSTRAINT team_proposals_team_id_fkey
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

-- 2. 중복 제안 방지
ALTER TABLE team_proposals
ADD CONSTRAINT team_proposals_unique_proposal
UNIQUE(team_id, maker_id);

-- 3. 제안 수락 후 자동 삭제 트리거 (선택사항)
-- 또는 수락 시 삭제하는 로직 유지
```

### 옵션 2: 통합 테이블 구조 (대규모 리팩토링)

하나의 통합 메시지 테이블로 변경:
```sql
CREATE TABLE team_messages (
  id BIGSERIAL PRIMARY KEY,
  team_id BIGINT NOT NULL REFERENCES teams(id),
  sender_profile_id UUID NOT NULL REFERENCES accounts(profile_id),
  receiver_profile_id UUID NOT NULL REFERENCES accounts(profile_id),
  message_type VARCHAR(20) NOT NULL, -- 'invite', 'proposal', 'request'
  status VARCHAR(20) DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  UNIQUE(team_id, sender_profile_id, receiver_profile_id, message_type)
);
```

---

## 📊 현재 구조의 장단점

### 장점
1. ✅ **기능 분리**: 각 테이블이 명확한 역할
2. ✅ **기존 코드와 호환**: 이미 구현된 로직 활용 가능
3. ✅ **성능**: 필요한 데이터만 조회 가능

### 단점
1. ❌ **데이터 중복**: `team_members`에 `profile_id`와 `maker_id` 중복
2. ❌ **외래 키 부족**: 참조 무결성 보장 안 됨
3. ❌ **역할 구분 어려움**: 초대/신청 구분이 불명확

---

## 🎯 권장 사항

### 즉시 개선 가능한 사항
1. **`team_proposals` 테이블에 외래 키 추가**
   - `team_id` → `teams.id`
   - 중복 제안 방지 UNIQUE 제약조건 추가

2. **`team_members` 테이블 정리**
   - `maker_id` 제거 또는 `request_type` 컬럼 추가로 역할 구분

3. **RLS 정책 강화**
   - 각 테이블의 RLS 정책 확인 및 보완

### 장기 개선 사항
1. **통합 메시지 테이블 검토**
   - 모든 메시지 타입을 하나의 테이블로 관리
   - 확장성과 유지보수성 향상

2. **이벤트 로깅 테이블 추가**
   - 메시지 상태 변경 이력 추적
   - 감사(audit) 목적

---

## 📝 결론

현재 구조는 **기본적으로 동작하지만 개선 여지가 있음**:

1. **`team_proposals`**: 외래 키 제약조건 추가 필요
2. **`team_members`**: `profile_id`와 `maker_id` 중복 해결 필요
3. **데이터 일관성**: 두 테이블 간 관계 명확화 필요

**우선순위**: `team_proposals` 외래 키 추가 > `team_members` 정리 > 통합 구조 검토

