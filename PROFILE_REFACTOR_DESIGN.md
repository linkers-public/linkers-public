# 프리랜서 팀 프로젝트 관리 시스템 리팩토링 설계

## 📋 요구사항 요약

1. **유저는 프리랜서/기업 각각 프로필 1개씩 가짐**
2. **프로젝트별 메이커 ↔ 매니저 롤 전환이 자유로움**
3. **경력 인증 배지 시스템**

---

## 🏗️ 데이터베이스 구조

### 1. User & Profile 구조

```
User (Supabase Auth)
 ├─ FreelancerProfile (accounts 테이블, profile_type='freelancer')
 └─ CompanyProfile (accounts 테이블, profile_type='company')
```

**핵심 포인트:**
- 한 유저는 최대 2개의 프로필 보유 가능 (freelancer 1개 + company 1개)
- `accounts` 테이블에 `profile_type` 컬럼 추가
- `profile_type` + `user_id` 조합으로 UNIQUE 제약조건 설정

### 2. 프로젝트 단위 역할 매핑

```
Project (counsel 테이블)
 ├─ ProjectMember (project_members 테이블)
 │     - profile_id (프리랜서 or 기업 프로필 중 하나)
 │     - role: MAKER | MANAGER
 │     - status: pending | invited | active | completed | declined
```

**핵심 포인트:**
- 역할은 `ProjectMember` 테이블 단위로 관리
- 같은 프로필이 여러 프로젝트에서 다른 역할 가능
- 같은 프로젝트에서도 역할 변경 가능

### 3. 경력 인증 시스템

```
CareerVerificationRequest (career_verification_requests 테이블)
 ├─ profile_id
 ├─ file_url (증빙자료)
 ├─ badge_type (배지 종류)
 ├─ status: PENDING | APPROVED | REJECTED
 └─ reviewed_by, reviewed_at

승인 시 → Profile.badges[] 에 자동 추가
```

---

## 📊 테이블 상세

### accounts 테이블 (확장)

```sql
-- 추가된 컬럼들
profile_type: profile_type          -- 'freelancer' | 'company'
badges: TEXT[]                      -- 승인된 경력 인증 배지 목록
is_active: BOOLEAN                  -- 현재 활성 프로필 여부
profile_created_at: TIMESTAMP        -- 프로필 생성일
```

**제약조건:**
- `(user_id, profile_type)` UNIQUE 제약조건
- 한 유저는 같은 타입의 프로필을 1개만 가질 수 있음

### project_members 테이블 (신규)

```sql
CREATE TABLE project_members (
  id SERIAL PRIMARY KEY,
  counsel_id INTEGER REFERENCES counsel(counsel_id),
  profile_id VARCHAR REFERENCES accounts(user_id),
  role project_role,                    -- 'MAKER' | 'MANAGER'
  status project_member_status,          -- 'pending' | 'invited' | 'active' | 'completed' | 'declined'
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(counsel_id, profile_id, role)  -- 같은 프로젝트에 같은 역할로 중복 참여 불가
);
```

**주요 기능:**
- 프로젝트별로 역할 자유롭게 선택/변경
- 같은 프로필이 여러 프로젝트에서 다른 역할 가능

### career_verification_requests 테이블 (신규)

```sql
CREATE TABLE career_verification_requests (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR REFERENCES accounts(user_id),
  file_url TEXT NOT NULL,               -- 증빙 파일 URL
  badge_type VARCHAR(100) NOT NULL,     -- 배지 종류
  description TEXT,
  status verification_status,            -- 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewed_by VARCHAR REFERENCES accounts(user_id),
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**자동 처리:**
- 승인 시 트리거가 자동으로 `accounts.badges` 배열에 추가
- 거절 시 거절 사유 저장

---

## 🔄 주요 비즈니스 로직

### 1. 프로필 생성 흐름

```
회원가입
  ↓
프로필 타입 선택 (freelancer / company)
  ↓
프로필 정보 입력
  ↓
프로필 생성 완료
  ↓
경력 인증 파일 업로드 (선택)
  ↓
관리자 검토 → 승인 시 배지 부여
```

**API 예시:**
```typescript
// 프리랜서 프로필 생성
await createProfile({
  profile_type: 'freelancer',
  username: 'john_doe',
  bio: '풀스택 개발자입니다.',
  main_job: ['웹 개발', '앱 개발'],
  expertise: ['React', 'Node.js']
})

// 기업 프로필 생성 (기존 프리랜서 프로필 보유 시)
await createProfile({
  profile_type: 'company',
  username: 'tech_corp',
  bio: 'IT 외주 개발 회사입니다.',
  main_job: ['웹 개발'],
  expertise: ['React', 'Vue.js']
})
```

### 2. 프로젝트 참여 흐름

```
프로젝트 상세 페이지
  ↓
[참여하기] 버튼 클릭
  ↓
프로필 선택 (프리랜서 / 기업 중 선택)
  ↓
역할 선택 (메이커 / 매니저)
  ↓
참여 신청 완료
```

**API 예시:**
```typescript
// 프로젝트 참여 신청
await joinProject({
  counsel_id: 123,
  profile_id: 'user-uuid',        // 선택한 프로필 ID
  role: 'MAKER'                   // 선택한 역할
})

// 역할 변경 (같은 프로젝트 내에서)
await changeProjectRole(
  123,                             // counsel_id
  'user-uuid',                     // profile_id
  'MANAGER'                        // 새 역할
)
```

### 3. 경력 인증 흐름

```
경력 업로드 페이지
  ↓
증빙 파일 업로드
  ↓
배지 타입 선택 ('PM 5년 이상', 'SI 1억 이상' 등)
  ↓
요청 제출
  ↓
관리자 검토
  ↓
승인 → 프로필에 배지 부여
거절 → 거절 사유 안내
```

**API 예시:**
```typescript
// 경력 인증 요청
await submitCareerVerification({
  profile_id: 'user-uuid',
  file_url: 'https://storage.../certificate.pdf',
  badge_type: 'PM 5년 이상',
  description: '5년간 프로젝트 매니저로 활동했습니다.'
})

// 본인의 인증 요청 목록 조회
await getMyCareerVerifications('user-uuid')
```

---

## 🎯 사용 시나리오

### 시나리오 1: 프리랜서 → 기업 프로필 추가

```
1. 사용자가 프리랜서 프로필로 활동 중
2. 마이페이지 → "기업 프로필 추가 생성"
3. 기업 프로필 정보 입력 후 생성
4. 프로필 전환 기능으로 프리랜서/기업 간 전환 가능
```

### 시나리오 2: 프로젝트별 역할 전환

```
프로젝트 A: 프리랜서 프로필로 MAKER 역할 참여
프로젝트 B: 같은 프리랜서 프로필로 MANAGER 역할 참여
프로젝트 C: 기업 프로필로 MANAGER 역할 참여

→ 한 사용자가 여러 프로젝트에서 서로 다른 역할 수행 가능
```

### 시나리오 3: 프로젝트 내 역할 변경

```
1. 프로젝트에 MAKER로 참여 중
2. 프로젝트 진행 중 역할 변경 필요
3. 역할 변경 기능으로 MANAGER로 전환
4. 기업 소통, 견적서 작성 등의 업무 수행
```

---

## 🔐 보안 (RLS 정책)

### project_members
- 사용자는 자신이 참여한 프로젝트의 멤버 정보 조회 가능
- 자신의 프로필로만 프로젝트 참여 신청 가능
- 자신의 참여 정보만 업데이트 가능

### career_verification_requests
- 사용자는 자신의 경력 인증 요청만 조회 가능
- 자신의 요청만 생성/수정 가능 (PENDING 상태일 때만)
- 관리자는 모든 요청 조회 및 승인/거절 가능

---

## 📝 마이그레이션 가이드

### 1. 데이터베이스 마이그레이션

```bash
# Supabase SQL Editor에서 실행
psql < database_profile_refactor.sql
```

**주의사항:**
- 기존 `accounts` 테이블에 `profile_type` 컬럼 추가
- 기존 데이터는 `role` 필드 기반으로 `profile_type` 자동 설정
- `project_participation` 테이블 데이터는 유지 (선택적으로 마이그레이션 가능)

### 2. 타입 정의 업데이트

```bash
# Supabase CLI로 타입 재생성 (선택사항)
npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
```

### 3. 기존 코드 마이그레이션

**주요 변경점:**
- `accounts.user_id` 조회 → 프로필 타입별로 필터링 필요
- `project_participation` → `project_members`로 전환 고려
- 프로필 선택 UI 추가 필요

---

## 🚀 다음 단계

1. **UI 컴포넌트 개발**
   - 프로필 선택 드롭다운
   - 프로필 생성 폼
   - 프로젝트 참여 시 프로필/역할 선택 모달
   - 경력 인증 업로드 페이지

2. **프로필 전환 기능**
   - 마이페이지에서 활성 프로필 전환
   - 토스앱 스타일의 프로필 스위처

3. **관리자 대시보드**
   - 경력 인증 요청 검토 페이지
   - 배지 승인/거절 기능

4. **검색 및 필터링**
   - 배지 기반 검색 필터
   - 프로필 타입별 검색

---

## 📚 참고 파일

- `database_profile_refactor.sql` - 전체 마이그레이션 스크립트
- `src/apis/profile-refactor.service.ts` - 프로필 관리 서비스
- `src/apis/project-member.service.ts` - 프로젝트 멤버 관리 서비스
- `src/apis/career-verification.service.ts` - 경력 인증 서비스
- `src/types/supabase.ts` - 업데이트된 타입 정의

