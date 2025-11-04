# UI 구현 완료 요약

## 완료된 UI 컴포넌트

### 1. 프로필 관리 UI

#### ✅ 프로필 생성 페이지 (`/my/profile/create`)
- 프리랜서/기업 프로필 타입 선택
- 사용자명, 소개, 주요 업무, 전문 기술 입력
- 프로필 타입별로 각 1개씩만 생성 가능
- 위치: `src/app/(home)/my/profile/create/page.tsx`

#### ✅ 프로필 관리 페이지 (`/my/profile/manage`)
- 모든 프로필 목록 조회
- 프로필 전환 기능
- 프로필별 정보 및 배지 표시
- 위치: `src/app/(home)/my/profile/manage/page.tsx`

#### ✅ 프로필 전환 버튼 (`ProfileSwitchButton`)
- 헤더에 표시
- 프로필이 여러 개일 때 드롭다운으로 전환
- 프로필 관리 및 생성으로 이동 가능
- 위치: `src/components/ProfileSwitchButton.tsx`

### 2. 프로젝트 참여 UI

#### ✅ 프로젝트 참여 모달 (`ProjectJoinModal`)
- 프로필 선택
- 역할 선택 (메이커/매니저)
- 프로젝트 참여 신청
- 위치: `src/components/ProjectJoinModal.tsx`

#### ✅ 프로필 선택 컴포넌트 (`ProfileSelector`)
- 재사용 가능한 프로필 선택 UI
- 프로필 타입 및 배지 표시
- 프로필 생성 유도
- 위치: `src/components/ProfileSelector.tsx`

### 3. 기존 프로필 페이지 개선

#### ✅ 프로필 페이지 (`/my/profile`, `/profile/[username]`)
- 프로필 타입 표시
- 경력 인증 배지 표시
- 프로필이 없을 때 생성 유도 UI
- 위치: `src/app/(home)/my/profile/page.tsx`, `src/components/ProfileClient.jsx`

#### ✅ 프로필 업데이트 페이지 (`/my/update`)
- 기존 업데이트 기능 유지
- 위치: `src/app/(home)/my/update/ProfileUpdateClient.tsx`

#### ✅ 프로필 서비스 (`profile.service.ts`)
- 활성 프로필 우선 조회
- 프로필 타입 필터링 지원
- 위치: `src/apis/profile.service.ts`

### 4. 네비게이션

#### ✅ 사이드 네비게이터
- 프로필 관리 메뉴 추가
- 위치: `src/components/SideNavigator.jsx`

#### ✅ 헤더
- 프로필 전환 버튼 추가
- 위치: `src/layout/Header.jsx`

## 주의사항

### ENUM 값 불일치
실제 데이터베이스의 ENUM 값은 **대문자**입니다:
- `profile_type`: 'FREELANCER', 'COMPANY' (소문자 'freelancer', 'company' 아님)
- `project_member_status`: 'INVITED', 'ACTIVE', 'COMPLETED', 'LEFT' ('pending', 'declined' 없음)

### 배지 타입
- 데이터베이스에서 `badges`는 `jsonb` 타입으로 저장됨 (TEXT[] 아님)
- 코드에서 배열처럼 사용 가능하지만, 실제로는 JSONB이므로 주의 필요

### 프로필 조회 로직
- `fetchMyProfile()`: 활성 프로필 우선 조회, 없으면 첫 번째 프로필
- 프로필이 없을 경우 생성 유도 UI 표시

## 사용 흐름

### 1. 첫 프로필 생성
```
로그인 → 프로필 없음 감지 → 프로필 생성 페이지 안내
→ 프리랜서/기업 선택 → 프로필 정보 입력 → 생성 완료
```

### 2. 프로필 전환
```
헤더의 프로필 버튼 클릭 → 프로필 목록 표시 → 활성 프로필 선택
→ 프로필 전환 완료 → 페이지 새로고침
```

### 3. 프로젝트 참여
```
프로젝트 상세 페이지 → "프로젝트 참여 신청" 버튼 클릭
→ 모달에서 프로필 선택 → 역할 선택 (메이커/매니저)
→ 참여 신청 완료
```

### 4. 프로필 관리
```
마이페이지 → 사이드바 "프로필 관리" 클릭
→ 프로필 목록 조회 → 전환/수정/생성 가능
```

## 추가 구현 권장 사항

1. **경력 인증 업로드 페이지**
   - `/my/profile/verification` 경로
   - 파일 업로드 기능
   - 배지 타입 선택

2. **관리자 대시보드**
   - 경력 인증 요청 검토
   - 배지 승인/거절 기능

3. **프로필 검색 필터**
   - 배지 기반 검색
   - 프로필 타입별 필터

4. **프로필 삭제 기능**
   - 소프트 삭제 (deleted_at 업데이트)

