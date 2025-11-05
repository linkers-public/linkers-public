# 프리랜서 ↔ 기업 프로필 전환 가이드

## 🔄 프로필 전환이란?

한 사용자가 **프리랜서 프로필**과 **기업 프로필**을 각각 최대 1개씩 보유할 수 있으며, 두 프로필 간 **활성 상태(`is_active`)**를 전환하는 기능입니다.

---

## 📊 전환 시 변경되는 사항

### 1. 데이터베이스 변경

```sql
-- 전환 전: 모든 프로필 비활성화
UPDATE accounts 
SET is_active = false 
WHERE user_id = '...'

-- 전환 후: 선택한 프로필만 활성화
UPDATE accounts 
SET is_active = true 
WHERE profile_id = '...' AND user_id = '...'
```

**변경되는 필드:**
- ✅ `accounts.is_active`: `false` → `true` (전환 대상 프로필)
- ✅ `accounts.is_active`: `true` → `false` (기존 활성 프로필)
- ✅ `accounts.updated_at`: 현재 시간으로 업데이트

**변경되지 않는 필드:**
- ❌ `profile_id`: 고유 ID 유지
- ❌ `profile_type`: FREELANCER/COMPANY 유지
- ❌ `role`: MAKER/MANAGER 유지
- ❌ 기타 프로필 정보 (username, bio, badges 등)

---

### 2. 프론트엔드 상태 변경

#### `useProfileStore` 업데이트
```typescript
// 프로필 전환 후 새로고침
const { fetchMyProfileData } = useProfileStore()
await fetchMyProfileData() // 활성 프로필 정보 다시 로드
```

**변경되는 값:**
- ✅ `profile.profile_id` - 활성 프로필의 ID
- ✅ `profile.profile_type` - FREELANCER 또는 COMPANY
- ✅ `profile.role` - MAKER 또는 MANAGER
- ✅ `profile.username` - 활성 프로필의 사용자명
- ✅ `profile.is_active` - true

---

### 3. UI 변경 사항

#### A. 사이드 네비게이터 (`SideNavigator.jsx`)

**프리랜서 프로필 (FREELANCER) 활성화 시:**
```
📁 마이
  - 내 프로필
  - 프로필 관리
  - 포트폴리오 ⭐ (프리랜서만)
  - 경력 인증 배지 ⭐ (프리랜서만)
  - 쪽지함 ⭐ (프리랜서만)
  - 할당된 프로젝트
  - 제안 현황
📁 팀
  - 팀 프로필
  - 프로젝트
```

**기업 프로필 (COMPANY) 활성화 시:**
```
📁 마이
  - 내 프로필
  - 프로필 관리
  - 관심 메이커 ⭐ (기업만)
  - 팀 제안 현황 ⭐ (기업만)
  - 상담 현황 ⭐ (기업만)
📁 팀
  - 팀 프로필
  - 프로젝트
```

#### B. 프로필 페이지 (`ProfileClient.jsx`)

**프리랜서 프로필:**
- ✅ 포트폴리오 섹션 표시 (`PortfolioMeta`)
- ✅ 경력 인증 배지 섹션 표시

**기업 프로필:**
- ❌ 포트폴리오 섹션 숨김
- ❌ 경력 인증 배지 섹션 숨김

#### C. 프로필 전환 버튼 (`ProfileSwitchButton.tsx`)

**표시되는 내용:**
- 현재 활성 프로필의 아이콘 (프리랜서: 👤, 기업: 🏢)
- 현재 활성 프로필의 사용자명
- 현재 활성 프로필 타입 (프리랜서/기업)

---

### 4. 접근 가능한 기능 변경

#### 프리랜서 프로필 (FREELANCER) 활성화 시

**접근 가능:**
- ✅ 프로젝트 참여 신청 (MAKER 역할)
- ✅ 개인 견적서 제출
- ✅ 팀 생성 및 관리 (MANAGER 역할인 경우)
- ✅ 팀 견적서 제출 (MANAGER 역할인 경우)
- ✅ 포트폴리오 관리
- ✅ 경력 인증 배지 요청
- ✅ 메이커 검색/참여

**접근 불가:**
- ❌ 프로젝트 의뢰 (`counsel` 생성)
- ❌ 견적 요청 (`counsel`에 대한 견적 요청)

#### 기업 프로필 (COMPANY) 활성화 시

**접근 가능:**
- ✅ 프로젝트 의뢰 (`counsel` 생성)
- ✅ 견적 요청 및 관리
- ✅ 메이커 검색 및 북마크
- ✅ 상담 현황 관리
- ✅ 팀 프로필 관리 (있는 경우)

**접근 불가:**
- ❌ 개인 견적서 제출
- ❌ 포트폴리오 관리
- ❌ 경력 인증 배지 요청

---

### 5. API 호출 변경

#### 프로필 조회 시

**변경 전:**
```typescript
// 기존 활성 프로필 조회
const { data } = await supabase
  .from('accounts')
  .select('*')
  .eq('user_id', user.id)
  .eq('is_active', true)
  .single()
// → 프리랜서 프로필 반환
```

**변경 후:**
```typescript
// 새로운 활성 프로필 조회
const { data } = await supabase
  .from('accounts')
  .select('*')
  .eq('user_id', user.id)
  .eq('is_active', true)
  .single()
// → 기업 프로필 반환
```

#### 팀 관련 조회 시

**프리랜서 프로필:**
```typescript
// FREELANCER 프로필로 팀 조회
const { data: teamData } = await supabase
  .from('teams')
  .select('*')
  .eq('manager_profile_id', freelancerProfile.profile_id)
  .single()
```

**기업 프로필:**
```typescript
// 기업 프로필은 팀 매니저가 될 수 없음
// → 팀 조회 불가 (매니저는 FREELANCER 프로필만 가능)
```

---

### 6. 데이터 관계 변경

#### 팀 관련

**프리랜서 프로필:**
- ✅ `teams.manager_profile_id`로 팀 조회 가능
- ✅ `team_members.profile_id`로 팀원 조회 가능
- ✅ 팀 견적서 제출 가능

**기업 프로필:**
- ❌ 팀 매니저가 될 수 없음 (트리거 제약)
- ❌ 팀 멤버가 될 수 없음
- ❌ 팀 견적서 제출 불가

#### 프로젝트 관련

**프리랜서 프로필:**
- ✅ `project_members.profile_id`로 프로젝트 참여 가능
- ✅ MAKER 또는 MANAGER 역할로 참여 가능

**기업 프로필:**
- ✅ `project_members.profile_id`로 프로젝트 참여 가능
- ✅ `counsel.company_profile_id`로 프로젝트 의뢰 가능
- ✅ MANAGER 역할로 프로젝트 관리 가능

#### 견적서 관련

**프리랜서 프로필:**
- ✅ `estimate.manager_profile_id`로 견적서 제출
- ✅ 개인 견적서 제출 (있는 경우)

**기업 프로필:**
- ✅ `estimate.company_profile_id`로 견적서 요청
- ✅ `counsel.company_profile_id`로 프로젝트 의뢰

---

## 🔑 핵심 원칙

### 1. 프로필 독립성
- 각 프로필은 **독립적인 데이터**를 가짐
- 프로필 전환 시 **데이터는 삭제되지 않음**
- 단지 **활성 상태만 변경**됨

### 2. 역할 제한
- **팀 매니저**: FREELANCER 프로필만 가능 (트리거 제약)
- **팀 멤버**: FREELANCER 프로필만 가능
- **프로젝트 참여**: FREELANCER/COMPANY 모두 가능

### 3. UI 조건부 렌더링
- `profile_type === 'FREELANCER'` → 프리랜서 전용 기능 표시
- `profile_type === 'COMPANY'` → 기업 전용 기능 표시
- `is_active === true` → 현재 활성 프로필로 인식

---

## 📝 전환 프로세스

### 1. 사용자 액션
```typescript
// ProfileSwitchButton.tsx
const handleSwitch = async (profileId: string) => {
  await switchActiveProfile(profileId) // 프로필 전환
  await loadProfiles() // 프로필 목록 새로고침
  router.refresh() // 페이지 새로고침
}
```

### 2. 백엔드 처리
```typescript
// profile-refactor.service.ts
export const switchActiveProfile = async (profileIdOrType: string) => {
  // 1. 모든 프로필 비활성화
  await supabase
    .from('accounts')
    .update({ is_active: false })
    .eq('user_id', user.id)
  
  // 2. 선택한 프로필 활성화
  await supabase
    .from('accounts')
    .update({ is_active: true })
    .eq('profile_id', profileIdOrType)
    .eq('user_id', user.id)
}
```

### 3. 프론트엔드 업데이트
- `useProfileStore` 새로고침
- `SideNavigator` 메뉴 재렌더링
- 조건부 UI 요소 재렌더링

---

## ⚠️ 주의사항

### 1. 팀 매니저 전환
- 프리랜서 → 기업 전환 시 팀 매니저 권한 상실
- 기업 → 프리랜서 전환 시 팀 매니저 권한 복구
- **팀 데이터는 유지됨** (프로필만 전환)

### 2. 프로젝트 참여
- 프로필 전환 시 **프로젝트 참여 정보는 유지됨**
- `project_members.profile_id`는 변경되지 않음
- 단, **활성 프로필이 아닌 프로필로는 접근 불가**

### 3. 견적서
- 기존 견적서는 **프로필 ID로 연결**되어 있음
- 프로필 전환 시 **기존 견적서는 유지**
- 새로운 견적서는 **활성 프로필로만 제출 가능**

---

## 🎯 요약

프로필 전환 시 변경되는 것:
1. ✅ `accounts.is_active` 플래그
2. ✅ `useProfileStore`의 활성 프로필 정보
3. ✅ 사이드 네비게이터 메뉴
4. ✅ 조건부 UI 요소 (포트폴리오, 배지 등)
5. ✅ 접근 가능한 기능 (프로젝트 의뢰, 견적서 제출 등)

프로필 전환 시 변경되지 않는 것:
1. ❌ 프로필 데이터 (username, bio, badges 등)
2. ❌ 팀 데이터 (팀 정보는 유지)
3. ❌ 프로젝트 참여 정보 (`project_members`)
4. ❌ 기존 견적서 (`estimate`)

