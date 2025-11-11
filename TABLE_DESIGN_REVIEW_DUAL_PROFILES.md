# 프리랜서/기업 프로필 2개 보유 시 테이블 설계 검토

## 📋 현재 설계 개요

### 핵심 원칙
- 한 사용자(`user_id`)는 **프리랜서 프로필 1개**와 **기업 프로필 1개**를 각각 가질 수 있음
- 최대 2개의 프로필 보유 가능
- `is_active` 필드로 현재 활성 프로필 관리
- 프로필 전환 시 활성 상태만 변경 (데이터 삭제 없음)

---

## 🗄️ accounts 테이블 구조

### 주요 컬럼
```sql
accounts (
  profile_id UUID PRIMARY KEY,           -- 프로필 고유 ID
  user_id UUID NOT NULL,                 -- 인증 사용자 ID (auth.users.id)
  profile_type ENUM,                    -- 'FREELANCER' | 'COMPANY'
  username VARCHAR,
  role ENUM,                             -- 'MAKER' | 'MANAGER' | 'NONE'
  is_active BOOLEAN DEFAULT true,        -- 활성 프로필 여부
  bio TEXT,
  main_job TEXT[],
  expertise TEXT[],
  badges TEXT[],
  availability_status VARCHAR,
  profile_created_at TIMESTAMP,
  deleted_at TIMESTAMP                   -- Soft delete
)
```

### 제약조건

#### 1. UNIQUE 제약조건
```sql
ALTER TABLE accounts
  ADD CONSTRAINT uq_accounts_user_type 
  UNIQUE (user_id, profile_type);
```

**의미:**
- 한 사용자는 같은 `profile_type`을 가진 프로필을 1개만 가질 수 있음
- `(user_id='123', profile_type='FREELANCER')` → ✅ 허용
- `(user_id='123', profile_type='COMPANY')` → ✅ 허용
- `(user_id='123', profile_type='FREELANCER')` 중복 → ❌ 차단

**⚠️ 주의사항:**
- PostgreSQL에서 UNIQUE 제약조건은 NULL 값을 여러 개 허용
- `profile_type`이 NULL인 경우 중복 생성 가능
- **권장:** `profile_type`을 NOT NULL로 변경 필요

#### 2. 부분 UNIQUE 인덱스 (이미 존재)
```sql
CREATE UNIQUE INDEX idx_accounts_user_profile_type 
ON accounts(user_id, profile_type) 
WHERE profile_type IS NOT NULL AND deleted_at IS NULL;
```

**의미:**
- `profile_type`이 NULL이 아닌 경우에만 UNIQUE 제약 적용
- Soft delete된 레코드는 제외

---

## 🔗 다른 테이블과의 관계

### accounts.profile_id를 참조하는 테이블들

#### 1. teams (팀 정보)
```sql
teams (
  id BIGINT PRIMARY KEY,
  manager_profile_id UUID REFERENCES accounts(profile_id),
  ...
)
```
- **제약:** 트리거로 `manager_profile_id`는 반드시 `FREELANCER` 프로필이어야 함
- **의미:** 팀 매니저는 프리랜서 프로필만 가능

#### 2. team_members (팀 멤버)
```sql
team_members (
  id BIGINT PRIMARY KEY,
  team_id BIGINT REFERENCES teams(id),
  profile_id UUID REFERENCES accounts(profile_id),
  ...
)
```
- **제약:** `UNIQUE(team_id, profile_id)` - 같은 팀에 중복 가입 금지
- **의미:** 팀 멤버는 프리랜서 프로필만 가능 (비즈니스 로직)

#### 3. counsel (프로젝트 상담)
```sql
counsel (
  counsel_id INTEGER PRIMARY KEY,
  company_profile_id UUID REFERENCES accounts(profile_id),
  ...
)
```
- **의미:** 프로젝트 의뢰는 기업 프로필만 가능

#### 4. estimate (견적서)
```sql
estimate (
  estimate_id INTEGER PRIMARY KEY,
  manager_profile_id UUID REFERENCES accounts(profile_id),
  company_profile_id UUID REFERENCES accounts(profile_id),
  ...
)
```
- **의미:** 
  - `manager_profile_id`: 프리랜서 프로필 (견적 작성자)
  - `company_profile_id`: 기업 프로필 (의뢰자)

#### 5. project_members (프로젝트 멤버)
```sql
project_members (
  id SERIAL PRIMARY KEY,
  counsel_id INTEGER REFERENCES counsel(counsel_id),
  profile_id VARCHAR REFERENCES accounts(profile_id),
  role project_role,  -- 'MAKER' | 'MANAGER'
  ...
)
```
- **의미:** 프로젝트별 역할 관리
- **특징:** 같은 프로필이 여러 프로젝트에서 다른 역할 가능

#### 6. career_verification_requests (경력 인증)
```sql
career_verification_requests (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR REFERENCES accounts(profile_id),
  ...
)
```
- **의미:** 경력 인증은 프리랜서 프로필만 가능 (비즈니스 로직)

#### 7. messages (쪽지)
```sql
messages (
  id UUID PRIMARY KEY,
  sender_profile_id UUID REFERENCES accounts(profile_id),
  receiver_profile_id UUID REFERENCES accounts(profile_id),
  ...
)
```
- **의미:** 프로필 간 메시지 교환

---

## ✅ 설계의 장점

### 1. 데이터 무결성 보장
- **UNIQUE 제약조건:** 같은 타입의 프로필 중복 방지
- **외래 키 제약조건:** 참조 무결성 보장
- **트리거 제약:** 도메인 규칙 강제 (예: 팀 매니저는 FREELANCER만)

### 2. 프로필 독립성
- 각 프로필은 독립적인 데이터 보유
- 프로필 전환 시 데이터 삭제 없음
- `is_active`로 활성 프로필만 관리

### 3. 유연한 역할 관리
- 프로젝트별 역할 전환 가능
- 같은 프로필이 여러 프로젝트에서 다른 역할 가능

### 4. 확장성
- 새로운 프로필 타입 추가 용이
- 프로필별 기능 분리 가능

---

## ⚠️ 잠재적 문제점 및 개선 방안

### 1. profile_type NULL 허용 문제

**문제:**
```sql
-- 현재: profile_type이 NULL 허용
profile_type ENUM  -- NULL 가능
```

**위험:**
- `profile_type = NULL`인 레코드가 여러 개 생성될 수 있음
- UNIQUE 제약조건이 NULL 값에 대해 작동하지 않음
- 활성 프로필 선택 시 문제 발생 가능

**해결 방안:**
```sql
-- 1. 기존 NULL 값 처리
UPDATE accounts 
SET profile_type = 'FREELANCER'
WHERE profile_type IS NULL;

-- 2. NOT NULL 제약조건 추가
ALTER TABLE accounts 
  ALTER COLUMN profile_type SET NOT NULL;
```

**우선순위:** 🔴 높음 (데이터 무결성 필수)

---

### 2. is_active 다중 활성화 가능성

**문제:**
- 현재 제약조건으로는 여러 프로필이 동시에 `is_active = true`일 수 있음
- 애플리케이션 로직에서만 단일 활성 프로필 보장

**위험:**
- 데이터 불일치 가능
- 활성 프로필 조회 시 예상치 못한 결과

**해결 방안 A: 체크 제약조건 추가 (권장)**
```sql
-- 부분 UNIQUE 인덱스로 단일 활성 프로필 보장
CREATE UNIQUE INDEX idx_accounts_user_active_profile 
ON accounts(user_id) 
WHERE is_active = true AND deleted_at IS NULL;
```

**해결 방안 B: 트리거 사용**
```sql
CREATE OR REPLACE FUNCTION ensure_single_active_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- 같은 user_id의 다른 프로필 비활성화
    UPDATE accounts
    SET is_active = false
    WHERE user_id = NEW.user_id
      AND profile_id != NEW.profile_id
      AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ensure_single_active_profile
  BEFORE INSERT OR UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_profile();
```

**우선순위:** 🟡 중간 (데이터 일관성)

---

### 3. 프로필 타입별 도메인 제약 부족

**현재 상태:**
- 팀 매니저는 FREELANCER만 가능 (트리거로 강제)
- 팀 멤버는 FREELANCER만 가능 (비즈니스 로직)
- 프로젝트 의뢰는 COMPANY만 가능 (비즈니스 로직)

**문제:**
- 외래 키 제약조건만으로는 프로필 타입 검증 불가
- 애플리케이션 로직에 의존

**해결 방안:**
```sql
-- 예: 팀 매니저는 FREELANCER만 가능 (이미 구현됨)
CREATE OR REPLACE FUNCTION check_team_manager_profile_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM accounts 
    WHERE profile_id = NEW.manager_profile_id 
      AND profile_type = 'FREELANCER'
  ) THEN
    RAISE EXCEPTION 'Team manager must have FREELANCER profile';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_teams_manager_is_freelancer
  BEFORE INSERT OR UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION check_team_manager_profile_type();
```

**우선순위:** 🟢 낮음 (이미 트리거로 구현됨)

---

### 4. 프로필 삭제 시 참조 무결성

**현재 상태:**
- Soft delete 사용 (`deleted_at`)
- 외래 키 제약조건은 `ON DELETE CASCADE` 또는 `ON DELETE RESTRICT`

**문제:**
- Soft delete된 프로필을 참조하는 레코드 처리
- 활성 프로필만 조회하는 쿼리 필요

**해결 방안:**
```sql
-- 모든 외래 키 참조에 deleted_at 체크 추가
-- 예: 팀 조회 시
SELECT t.*, a.username, a.profile_type
FROM teams t
JOIN accounts a ON t.manager_profile_id = a.profile_id
WHERE a.deleted_at IS NULL;
```

**우선순위:** 🟡 중간 (데이터 일관성)

---

### 5. 프로필 전환 시 트랜잭션 처리

**현재 구현:**
```typescript
// 1. 모든 프로필 비활성화
await supabase
  .from('accounts')
  .update({ is_active: false })
  .eq('user_id', user.id)

// 2. 선택한 프로필 활성화
await supabase
  .from('accounts')
  .update({ is_active: true })
  .eq('profile_id', profileId)
```

**문제:**
- 두 개의 별도 쿼리로 인한 경쟁 조건 가능
- 중간 상태에서 데이터 불일치 가능

**해결 방안:**
```sql
-- 트랜잭션으로 처리 (애플리케이션 레벨)
BEGIN;
  UPDATE accounts SET is_active = false WHERE user_id = '...';
  UPDATE accounts SET is_active = true WHERE profile_id = '...';
COMMIT;

-- 또는 트리거로 자동 처리 (권장)
-- 위의 "해결 방안 B" 참조
```

**우선순위:** 🟡 중간 (데이터 일관성)

---

## 📊 데이터 모델 다이어그램

```
auth.users (인증)
    │
    ├─ user_id
    │
accounts (프로필)
    ├─ profile_id (PK)
    ├─ user_id (FK → auth.users.id)
    ├─ profile_type (FREELANCER | COMPANY)
    ├─ is_active (활성 프로필)
    └─ ...
    │
    ├─ FREELANCER 프로필 (최대 1개)
    │   ├─ teams.manager_profile_id
    │   ├─ team_members.profile_id
    │   ├─ estimate.manager_profile_id
    │   ├─ project_members.profile_id
    │   └─ career_verification_requests.profile_id
    │
    └─ COMPANY 프로필 (최대 1개)
        ├─ counsel.company_profile_id
        └─ estimate.company_profile_id
```

---

## ✅ 검증 체크리스트

### 데이터 무결성
- [ ] `profile_type` NOT NULL 제약조건 추가
- [ ] 단일 활성 프로필 보장 (인덱스 또는 트리거)
- [ ] 프로필 타입별 도메인 제약 확인

### 참조 무결성
- [ ] 모든 외래 키 제약조건 확인
- [ ] Soft delete 처리 로직 확인
- [ ] 프로필 삭제 시 참조 데이터 처리

### 성능
- [ ] `(user_id, profile_type)` 인덱스 확인
- [ ] `is_active` 필터링 인덱스 확인
- [ ] 프로필 조회 쿼리 최적화

### 애플리케이션 로직
- [ ] 프로필 전환 시 트랜잭션 처리
- [ ] 프로필 타입별 기능 분리
- [ ] 에러 처리 및 사용자 안내

---

## 🎯 권장 개선 사항 요약

### 즉시 적용 (높은 우선순위)
1. ✅ `profile_type` NOT NULL 제약조건 추가
2. ✅ 단일 활성 프로필 보장 (부분 UNIQUE 인덱스)

### 단기 개선 (중간 우선순위)
3. ✅ 프로필 전환 트리거 추가
4. ✅ Soft delete 처리 일관성 확보

### 장기 개선 (낮은 우선순위)
5. ✅ 프로필 타입별 도메인 제약 강화
6. ✅ 성능 최적화 (인덱스 추가)

---

## 📝 결론

현재 테이블 설계는 **프리랜서/기업 프로필 2개 보유**를 잘 지원합니다.

**강점:**
- ✅ UNIQUE 제약조건으로 프로필 타입별 중복 방지
- ✅ 외래 키 제약조건으로 참조 무결성 보장
- ✅ 프로필 독립성 및 유연한 역할 관리

**개선 필요:**
- ⚠️ `profile_type` NOT NULL 제약조건 추가
- ⚠️ 단일 활성 프로필 보장 메커니즘 강화
- ⚠️ 프로필 전환 시 트랜잭션 처리

전반적으로 **견고한 설계**이며, 위 개선 사항을 적용하면 더욱 안정적인 시스템이 됩니다.

