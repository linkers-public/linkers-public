# 유저 프로필과 팀 프로필 데이터베이스 구조 분석

## 📊 테이블 구조

### 1. `accounts` 테이블 (유저 프로필)

**핵심 컬럼:**
- `profile_id` (UUID, PK): 프로필 고유 ID
- `user_id` (UUID, NOT NULL): 인증 사용자 ID (auth.users.id 참조)
- `username` (VARCHAR): 사용자명
- `profile_type` (ENUM): 프로필 타입
  - `FREELANCER`: 프리랜서 프로필
  - `COMPANY`: 기업 프로필
- `role` (ENUM): 역할
  - `MAKER`: 메이커
  - `MANAGER`: 매니저
  - `NONE`: 역할 없음
- `is_active` (BOOLEAN): 활성 프로필 여부
- `bio`, `main_job`, `expertise`, `badges` 등 프로필 정보

**특징:**
- 한 `user_id`가 여러 `profile_id`를 가질 수 있음 (FREELANCER, COMPANY 각각)
- `profile_id`는 각 프로필마다 고유한 UUID
- `user_id`는 `auth.users.id`와 연결

---

### 2. `teams` 테이블 (팀 프로필)

**핵심 컬럼:**
- `id` (BIGINT, PK): 팀 ID
- `name` (VARCHAR): 팀 이름
- `manager_id` (UUID, NOT NULL): 매니저의 user_id (auth.users.id 참조)
- `bio`, `specialty`, `sub_specialty`, `prefered`: 팀 정보

**특징:**
- `manager_id`는 `auth.users.id`를 직접 참조 (accounts.user_id와 동일)
- 한 매니저당 하나의 팀만 가질 수 있음 (제약조건 없지만 비즈니스 로직상)
- 외래 키 제약조건 없음 (참조 무결성 보장 안 됨)

---

### 3. `team_members` 테이블 (팀 멤버)

**핵심 컬럼:**
- `id` (BIGINT, PK): 멤버 ID
- `team_id` (BIGINT): 팀 ID (teams.id 참조)
- `maker_id` (UUID): 메이커의 user_id (auth.users.id 참조)
- `status` (VARCHAR): 멤버 상태

**특징:**
- `team_id` → `teams.id` 외래 키 존재 ✅
- `maker_id` → `auth.users.id` 참조 (외래 키 제약조건 없음)
- `maker_id`는 `accounts.user_id`와 동일한 값이지만 직접적인 관계 없음

---

## 🔗 관계 구조

### 현재 관계도

```
auth.users (인증 테이블)
    ↓ user_id
accounts (프로필 테이블)
    ├─ profile_id (FREELANCER 프로필)
    └─ profile_id (COMPANY 프로필)
         ↓ user_id
teams
    ├─ manager_id → auth.users.id
    └─ team_members
         └─ maker_id → auth.users.id
```

### 관계 특징

1. **직접 참조 관계 없음**
   - `teams.manager_id`는 `auth.users.id` 참조하지만 `accounts`와의 외래 키 없음
   - `team_members.maker_id`도 `auth.users.id` 참조하지만 `accounts`와의 외래 키 없음

2. **프로필 다중화**
   - 한 사용자가 여러 프로필을 가질 수 있음
   - 예: `user_id = 'baa0fd5e-...'`가 두 프로필 보유:
     - `profile_id = '4ac543ae-...'` (FREELANCER, MAKER) → "장수현"
     - `profile_id = '619453d2-...'` (COMPANY, MANAGER) → "장수현의 회사"

3. **팀 매니저 표시 규칙**
   - 팀 매니저는 `teams.manager_id`로 관리
   - 표시 시에는 매니저의 **FREELANCER 프로필**을 보여줘야 함
   - 현재 데이터: `manager_id = 'baa0fd5e-...'`는 두 프로필 모두 존재

---

## 📋 실제 데이터 예시

### 팀 구조 예시

```
팀: "Linkers AI 팀" (id: 8)
├─ 매니저: user_id = 'baa0fd5e-...'
│   ├─ 프로필 1: profile_id = '4ac543ae-...' (FREELANCER, MAKER) → "장수현" ⭐ 표시용
│   └─ 프로필 2: profile_id = '619453d2-...' (COMPANY, MANAGER) → "장수현의 회사"
│
└─ 팀원: user_id = '20b6c4f0-...'
    └─ 프로필: profile_id = 'f39bd117-...' (FREELANCER, MAKER) → "박개발"
```

---

## ⚠️ 주의사항 및 이슈

### 1. 외래 키 부족
- `teams.manager_id` → `accounts` 관계 없음
- `team_members.maker_id` → `accounts` 관계 없음
- PostgREST가 자동 조인을 인식하지 못함 → **수동 조인 필요**

### 2. 프로필 선택 로직 필요
- 매니저 표시 시 `profile_type = 'FREELANCER'` 프로필 선택
- 팀원 표시 시 `profile_type = 'FREELANCER'` 및 `role = 'MAKER'` 프로필 선택

### 3. 데이터 무결성
- `teams.manager_id`가 실제 존재하는 `auth.users.id`인지 보장 안 됨
- `team_members.maker_id`도 마찬가지

---

## 🔧 권장 사항

### 1. 외래 키 추가 (선택사항)
```sql
-- teams.manager_id → accounts.user_id 외래 키
ALTER TABLE teams
ADD CONSTRAINT teams_manager_id_fkey
FOREIGN KEY (manager_id) REFERENCES accounts(user_id);

-- team_members.maker_id → accounts.user_id 외래 키
ALTER TABLE team_members
ADD CONSTRAINT team_members_maker_id_fkey
FOREIGN KEY (maker_id) REFERENCES accounts(user_id);
```

### 2. 조회 시 필터링
- 매니저 조회: `accounts WHERE user_id = teams.manager_id AND profile_type = 'FREELANCER'`
- 팀원 조회: `accounts WHERE user_id = team_members.maker_id AND profile_type = 'FREELANCER' AND role = 'MAKER'`

### 3. 비즈니스 로직
- 한 사용자는 한 팀의 매니저만 될 수 있음
- 한 사용자는 여러 팀의 멤버가 될 수 있음
- 매니저와 멤버는 서로 다른 역할

---

## 📝 현재 코드에서의 처리 방식

### `team.service.ts`에서의 처리
```typescript
// 매니저 정보 조회 (프리랜서 프로필)
const { data: managerData } = await supabase
  .from('accounts')
  .select('profile_id, user_id, username, role, bio')
  .eq('user_id', data.manager_id)
  .eq('profile_type', 'FREELANCER')  // ⭐ FREELANCER 프로필만
  .single()

// 팀원 정보 조회 (MAKER 역할만)
const { data: accountData } = await supabase
  .from('accounts')
  .select('profile_id, user_id, username, role, bio')
  .eq('user_id', member.maker_id)
  .eq('role', 'MAKER')  // ⭐ MAKER 역할만
  .single()
```

이 방식이 올바르게 구현되어 있습니다! ✅

