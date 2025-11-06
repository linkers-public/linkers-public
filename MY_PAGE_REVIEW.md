# 마이페이지 구현 검토 결과

## ❌ 미구현 기능 목록

### 1. 프로필 이미지 업로드 기능
**위치**: `src/app/(home)/my/update/ProfileUpdateClient.tsx`
- **현재 상태**: 프로필 이미지 업로드 UI 및 기능이 없음
- **필요 작업**: 
  - 이미지 업로드 컴포넌트 추가
  - `profile_image_url` 필드 저장 기능
  - Supabase Storage 연동

### 2. 학력 태그 기능
**위치**: 
- `src/app/(home)/my/profile/educations/create/EducationCreateClient .tsx`
- `src/app/(home)/my/profile/educations/[id]/update/EducationUpdateClient.tsx`
- **현재 상태**: 학력 태그 선택 기능 없음 (고교/대학/대학원)
- **필요 작업**: 
  - 학력 레벨 선택 드롭다운/라디오 버튼 추가
  - 데이터베이스 스키마에 `education_level` 필드 추가 필요 여부 확인

### 3. 자격증 추가/수정 기능
**위치**: `src/components/ProfileClient.jsx` (LicenseMeta 컴포넌트)
- **현재 상태**: 
  - "추가하기" 버튼이 있지만 클릭 이벤트 없음
  - 수정 버튼이 있지만 클릭 이벤트 없음
- **필요 작업**:
  - 자격증 추가 페이지 생성 (`/my/profile/licenses/create`)
  - 자격증 수정 페이지 생성 (`/my/profile/licenses/[id]/update`)
  - 버튼에 라우팅 연결
  - `updateLicense` API 함수 구현 (현재 빈 함수)

### 4. 팀 제안 기능
**위치**: `src/app/(home)/my/team-proposal/TeamProposalClient.tsx`
- **현재 상태**: `handlePropose` 함수가 비어있음
- **필요 작업**: 
  - 팀 제안 API 연동
  - 제안 다이얼로그/모달 구현

### 5. 팀 포트폴리오 기능
**위치**: `src/app/(home)/team-profile/TeamProfileClient.tsx`
- **현재 상태**: 팀 포트폴리오 관리 기능 없음
- **필요 작업**: 
  - 팀 포트폴리오 추가/수정/삭제 기능
  - 팀 프로젝트 포트폴리오 표시

### 6. 프로필 업데이트 페이지 상단 여백
**위치**: `src/app/(home)/my/update/ProfileUpdateClient.tsx`
- **현재 상태**: 상단 여백 제거 필요 (다른 페이지와 일관성)
- **필요 작업**: `-mt-4 md:-mt-8` 클래스 추가

## ⚠️ 부분 구현된 기능

### 1. 자격증 API
**위치**: `src/apis/profile.service.ts`
- `createLicense`: ✅ 구현됨
- `updateLicense`: ❌ 빈 함수
- `deleteLicense`: ❌ 빈 함수

### 2. 메이커 검색 배지 필터
**위치**: `/search-makers` 페이지
- **현재 상태**: 배지 필터 기능 없음
- **필요 작업**: 배지 필터 추가

## 📋 우선순위별 구현 필요 사항

### 높은 우선순위
1. **자격증 추가/수정 기능** - UI는 있지만 기능이 연결되지 않음
2. **프로필 이미지 업로드** - 기본 기능으로 중요
3. **프로필 업데이트 페이지 상단 여백 제거** - UI 일관성

### 중간 우선순위
4. **학력 태그 기능** - 사용성 개선
5. **팀 제안 기능** - 핵심 기능

### 낮은 우선순위
6. **팀 포트폴리오 기능** - 추가 기능
7. **메이커 검색 배지 필터** - 필터링 개선

## 🔍 추가 확인 필요 사항

1. **데이터베이스 스키마 확인**
   - `accounts` 테이블에 `profile_image_url` 필드 존재 여부
   - `account_educations` 테이블에 `education_level` 필드 존재 여부

2. **API 엔드포인트 확인**
   - 자격증 수정/삭제 API 구현 상태
   - 팀 제안 API 존재 여부

3. **라우팅 확인**
   - 자격증 관련 페이지 라우트 설정 여부
   - 팀 프로필 페이지 접근 경로 (`/my/team-profile` vs `/team-profile`)

