# 프론트엔드 코드 마이그레이션 완료 보고서

## ✅ 완료된 수정 사항

### 1. `src/apis/team.service.ts`
- ✅ `fetchTeamProfileByTeamManager()`:
  - `manager_id` → `manager_profile_id` 사용
  - FK를 이용한 자동 조인 활용 (PostgREST 자동 인식)
  - `team_members.maker_id` → `team_members.profile_id` 사용
  - 수동 조인 제거, FK 기반 자동 조인으로 변경

### 2. `src/apis/team-estimate.service.ts`
- ✅ `submitTeamEstimate()`:
  - 파라미터: `clientId` → `companyProfileId`로 변경
  - `manager_id` → `manager_profile_id` 사용
  - `client_id` → `company_profile_id` 사용
  - counsel에서 `company_profile_id` 자동 조회

- ✅ `getTeamEstimate()`:
  - `manager_id` → `manager_profile_id` 사용

### 3. `src/apis/project-member.service.ts`
- ✅ `joinProject()`: 권한 체크 로직을 `profile_id` 기준으로 수정
- ✅ `updateProjectMember()`: `profile_id` 기준 권한 체크
- ✅ `getProfileProjects()`: `profile_id` 기준 권한 체크
- ✅ `changeProjectRole()`: `profile_id` 기준 권한 체크

### 4. `src/app/(home)/my/estimate-requests/EstimateRequestsClient.tsx`
- ✅ `loadRequests()`:
  - `client:client_id` → `company:company_profile_id` 조인 변경
  - `manager_id` → `manager_profile_id` 사용

- ✅ `handleSubmitEstimate()`:
  - `manager_id` → `manager_profile_id` 사용
  - `client_id` → `company_profile_id` 사용
  - counsel에서 `company_profile_id` 자동 조회

### 5. `src/app/(home)/project-detail/[id]/project-detail.client.tsx`
- ✅ 매니저 확인 로직:
  - `manager_id` → `manager_profile_id` 사용
  - FREELANCER 프로필 조회 후 팀 확인

- ✅ `handleTeamEstimateSubmit()`:
  - counsel에서 `company_profile_id` 자동 조회
  - `submitTeamEstimate` 호출 시 `company_profile_id` 전달

---

## 🔄 주요 변경 패턴

### 변경 전
```typescript
// user_id 직접 사용
.eq('manager_id', user.id)
.eq('maker_id', user.id)

// 수동 조인
const { data: managerData } = await supabase
  .from('accounts')
  .select('*')
  .eq('user_id', data.manager_id)
  .eq('profile_type', 'FREELANCER')
  .single()
```

### 변경 후
```typescript
// FREELANCER 프로필 조회 후 profile_id 사용
const { data: managerProfile } = await supabase
  .from('accounts')
  .select('profile_id')
  .eq('user_id', user.id)
  .eq('profile_type', 'FREELANCER')
  .maybeSingle()

.eq('manager_profile_id', managerProfile.profile_id)

// FK 자동 조인 (PostgREST)
.select(`
  *,
  manager:manager_profile_id (
    profile_id,
    username,
    role
  ),
  team_members:team_members (
    *,
    account:profile_id (
      profile_id,
      username
    )
  )
`)
```

---

## 📝 다음 단계

### 1. 테스트
- 팀 프로필 조회 기능 테스트
- 견적서 제출 기능 테스트
- 프로젝트 멤버 조회 기능 테스트

### 2. 기존 컬럼 제거 (선택사항)
코드가 정상 동작 확인 후, 하위 호환성을 위한 기존 컬럼 제거:

```sql
ALTER TABLE teams DROP COLUMN IF EXISTS manager_id;
ALTER TABLE team_members DROP COLUMN IF EXISTS maker_id;
ALTER TABLE estimate DROP COLUMN IF EXISTS manager_id;
ALTER TABLE estimate DROP COLUMN IF EXISTS client_id;
ALTER TABLE counsel DROP COLUMN IF EXISTS client_id;
```

### 3. 추가 확인 필요 사항
- 다른 파일에서 `manager_id`, `maker_id`, `client_id` 사용 여부 확인
- RLS 정책이 `profile_id` 기준으로 업데이트되었는지 확인

---

## 🎯 개선 효과

1. **코드 간소화**: 수동 조인 제거, FK 자동 조인 활용
2. **데이터 무결성**: FK 제약조건으로 데이터 일관성 보장
3. **성능 향상**: 직접 FK 조인으로 조회 성능 개선
4. **유지보수성**: 프로필 기반 구조로 비즈니스 로직 명확화

