# 스키마 리디자인 마이그레이션 완료 보고서

## ✅ 완료된 작업

### 1. 컬럼 추가
- ✅ `teams.manager_profile_id` 추가
- ✅ `team_members.profile_id` 추가
- ✅ `estimate.manager_profile_id` 추가
- ✅ `estimate.company_profile_id` 추가
- ✅ `counsel.company_profile_id` 추가

### 2. 외래 키 제약조건
- ✅ `teams.manager_profile_id` → `accounts.profile_id`
- ✅ `team_members.profile_id` → `accounts.profile_id`
- ✅ `estimate.manager_profile_id` → `accounts.profile_id`
- ✅ `estimate.company_profile_id` → `accounts.profile_id`
- ✅ `counsel.company_profile_id` → `accounts.profile_id`
- ✅ `career_verification_requests.profile_id` → `accounts.profile_id` (백필 완료)

### 3. UNIQUE 제약조건
- ✅ `accounts(user_id, profile_type)` - 한 사용자당 프로필 타입별 1개
- ✅ `team_members(team_id, profile_id)` - 한 프로필이 같은 팀에 중복 가입 금지
- ✅ `estimate(counsel_id, team_id)` - 동일 프로젝트에 동일 팀 중복 견적 금지

### 4. 데이터 백필
- ✅ 팀 매니저: `user_id` → `FREELANCER` 프로필의 `profile_id`
- ✅ 팀 멤버: `user_id` → `FREELANCER` 프로필의 `profile_id`
- ✅ 견적 매니저: `user_id` → `FREELANCER` 프로필의 `profile_id`
- ✅ 견적 회사: `client.user_id` → `COMPANY` 프로필의 `profile_id`
- ✅ 프로젝트 요청 회사: `client_id` → `COMPANY` 프로필의 `profile_id`

### 5. 도메인 제약
- ✅ 트리거: `trg_teams_manager_is_freelancer` - 매니저는 반드시 FREELANCER 프로필이어야 함

### 6. 인덱스 추가
- ✅ `idx_teams_manager_profile_id`
- ✅ `idx_team_members_profile_id`
- ✅ `idx_estimate_manager_profile_id`
- ✅ `idx_estimate_company_profile_id`
- ✅ `idx_counsel_company_profile_id`

### 7. 조회용 뷰
- ✅ `team_with_members` - 팀 정보와 매니저/팀원을 함께 조회

---

## 📊 변경 전후 비교

### 변경 전 구조
```
teams
  └─ manager_id (uuid) → auth.users.id (직접 참조)
      └─ accounts에서 profile_type 필터링 필요

team_members
  └─ maker_id (uuid) → auth.users.id (직접 참조)
      └─ accounts에서 profile_type 필터링 필요

estimate
  ├─ manager_id (uuid) → auth.users.id
  └─ client_id (uuid) → client.user_id
```

### 변경 후 구조
```
teams
  └─ manager_profile_id (uuid) → accounts.profile_id ✅
      └─ FK 제약조건 + 트리거로 FREELANCER 강제

team_members
  └─ profile_id (uuid) → accounts.profile_id ✅
      └─ FK 제약조건으로 무결성 보장

estimate
  ├─ manager_profile_id (uuid) → accounts.profile_id ✅
  └─ company_profile_id (uuid) → accounts.profile_id ✅
```

---

## 🔄 다음 단계 (코드 수정 필요)

### 프론트엔드/API 수정
1. **팀 프로필 조회**
   - 기존: `teams.manager_id` → `accounts` 조회 후 필터링
   - 변경: `teams.manager_profile_id` → `accounts` 직접 조인

2. **팀 멤버 조회**
   - 기존: `team_members.maker_id` → `accounts` 조회 후 필터링
   - 변경: `team_members.profile_id` → `accounts` 직접 조인

3. **견적 조회**
   - 기존: `estimate.manager_id`, `estimate.client_id` 사용
   - 변경: `estimate.manager_profile_id`, `estimate.company_profile_id` 사용

### 수정 필요한 파일
- `src/apis/team.service.ts` - 팀 프로필 조회 로직
- `src/apis/team-estimate.service.ts` - 견적 제출 로직
- `src/apis/project-member.service.ts` - 프로젝트 멤버 조회
- 모든 `user_id` 기반 조회를 `profile_id` 기반으로 변경

---

## ⚠️ 주의사항

### 기존 컬럼 유지
- `teams.manager_id` (user_id) - **아직 유지됨** (하위 호환성)
- `team_members.maker_id` (user_id) - **아직 유지됨** (하위 호환성)
- `estimate.manager_id` (user_id) - **아직 유지됨** (하위 호환성)
- `estimate.client_id` (user_id) - **아직 유지됨** (하위 호환성)
- `counsel.client_id` (user_id) - **아직 유지됨** (하위 호환성)

### 제거 예정
코드 수정 완료 후 다음 컬럼들을 제거할 수 있습니다:
```sql
-- 코드 수정 완료 후 실행
ALTER TABLE teams DROP COLUMN IF EXISTS manager_id;
ALTER TABLE team_members DROP COLUMN IF EXISTS maker_id;
ALTER TABLE estimate DROP COLUMN IF EXISTS manager_id;
ALTER TABLE estimate DROP COLUMN IF EXISTS client_id;
ALTER TABLE counsel DROP COLUMN IF EXISTS client_id;
```

---

## 🎯 핵심 개선 사항

1. **프로필이 1급 시민**
   - 모든 관계가 `profile_id` 기준으로 정규화
   - `user_id`는 RLS/권한 체크에만 사용

2. **도메인 제약 강화**
   - 트리거로 매니저는 FREELANCER 프로필 강제
   - FK 제약조건으로 데이터 무결성 보장

3. **조회 성능 향상**
   - 직접 FK 조인 가능 (PostgREST 자동 인식)
   - 뷰로 복잡한 조인 최적화

4. **프로젝트별 역할 전환**
   - `project_members.role`로 프로젝트별 역할 관리
   - 동일 프로필이 여러 프로젝트에서 다른 역할 가능

---

## 📝 마이그레이션 실행 순서

1. ✅ 컬럼 추가
2. ✅ 외래 키 제약조건 추가
3. ✅ 데이터 백필
4. ✅ 도메인 제약 트리거 추가
5. ✅ 인덱스 추가
6. ✅ 조회용 뷰 생성

**다음:** 프론트엔드 코드 수정 → 기존 컬럼 제거

