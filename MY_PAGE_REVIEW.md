# 마이페이지 전체 검토 보고서

## 📋 개요
마이페이지의 구조, 일관성, 사용성, 기능을 전반적으로 검토하고 개선점을 제안합니다.

## 🔍 현재 구조

### 1. 레이아웃 구조
- **레이아웃 파일**: `src/app/(home)/my/layout.tsx`
- **사이드 네비게이션**: `src/components/SideNavigator.jsx`
- **레이아웃 특징**:
  - 데스크톱: 좌측 사이드바 (200px) + 메인 컨텐츠
  - 모바일: 사이드바 숨김, 메인 컨텐츠만 표시

### 2. 페이지 분류

#### 기업 프로필 (COMPANY)
1. **회사 계정**
   - `/my/company/info` - 내 정보 / 회사 정보 수정
   - `/my/company/team-members` - 팀 멤버 관리

2. **프로젝트**
   - `/my/company/projects` - 내 프로젝트 ✅ (최근 개선됨)
   - `/my/company/estimates` - 받은 견적서 ✅ (최근 개선됨)

3. **결제 / 구독**
   - `/my/subscription` - 구독 관리
   - `/my/payments` - 결제 내역
   - `/my/contact-history` - 연락처 열람 기록

4. **프로젝트 기록**
   - `/my/project-history` - 진행 이력
   - `/my/completed-projects` - 완료 프로젝트 저장함

5. **설정**
   - `/my/account/notifications` - 알림 설정
   - `/my/account/security` - 계정 보안
   - `/my/account/delete` - 회원 탈퇴

#### 프리랜서 프로필 (FREELANCER)
1. **내 프로필**
   - `/my/profile` - 프로필 보기/수정
   - `/my/team-profile` - 팀 프로필 조회
   - `/my/team-projects` - 팀 프로젝트 확인

2. **관심항목**
   - `/my/bookmarked-projects` - 관심 프로젝트
   - `/my/bookmarked-makers` - 관심 메이커

3. **내 히스토리**
   - `/my/received-proposals` - 받은 제안 목록
   - `/my/sent-requests` - 보낸 요청 목록

4. **계정관리**
   - `/my/account/security` - 로그인/보안
   - `/my/account/notifications` - 알림 설정

## ⚠️ 발견된 문제점

### 1. UI/UX 일관성 문제

#### 문제 1: 헤더 스타일 불일치
- **받은 견적서** (`/my/company/estimates`): ✅ 현대적 UI (최근 개선)
- **내 프로젝트** (`/my/company/projects`): ✅ 현대적 UI (최근 개선)
- **진행 이력** (`/my/project-history`): ❌ 기본 스타일
- **완료 프로젝트** (`/my/completed-projects`): ❌ 기본 스타일
- **회사 정보 수정** (`/my/company/info`): ❌ 기본 스타일

**개선 필요**: 모든 페이지에 일관된 헤더 스타일 적용

#### 문제 2: 빈 상태 메시지 불일치
- 일부 페이지: 아이콘 + 메시지 ✅
- 일부 페이지: 텍스트만 ❌

#### 문제 3: 로딩 상태 불일치
- 일부 페이지: 스피너 + 메시지 ✅
- 일부 페이지: 스피너만 ❌

### 2. 기능적 문제점

#### 문제 1: 프로젝트 이력 페이지
- **파일**: `src/app/(home)/my/project-history/ProjectHistoryClient.tsx`
- **문제**: 
  - `deleted_at` 필터링 없음 (삭제된 프로젝트도 표시될 수 있음)
  - 잘못 생성된 counsel도 표시될 수 있음
- **개선 필요**: `getCompanyCounsels()`와 동일한 필터링 로직 적용

#### 문제 2: 완료 프로젝트 페이지
- **파일**: `src/app/(home)/my/completed-projects/CompletedProjectsClient.tsx`
- **문제**:
  - `deleted_at` 필터링 없음
  - 잘못 생성된 counsel도 표시될 수 있음
- **개선 필요**: `getCompanyCounsels()`와 동일한 필터링 로직 적용

#### 문제 3: 회사 정보 수정 페이지
- **파일**: `src/app/(home)/my/company/info/CompanyInfoClient.tsx`
- **문제**:
  - 불필요한 아이콘 사용 (Building2, User, Phone, Mail)
  - UI가 구식 스타일
- **개선 필요**: 현대적 UI로 개선, 아이콘 최소화

### 3. 네비게이션 구조 문제

#### 문제 1: 메뉴 그룹화 불일치
- 기업 프로필: "회사 계정", "프로젝트", "결제 / 구독", "프로젝트 기록", "설정"
- 프리랜서 프로필: "내 프로필", "관심항목", "내 히스토리", "계정관리"
- **문제**: 그룹명이 일관되지 않음

#### 문제 2: 활성 상태 표시
- 현재: 텍스트 색상만 변경
- **개선 필요**: 더 명확한 활성 상태 표시 (배경색, 아이콘 등)

### 4. 데이터 필터링 문제

#### 문제 1: 중복 필터링 로직
- `getCompanyCounsels()`: 잘못된 counsel 필터링 ✅
- `ProjectHistoryClient`: 필터링 없음 ❌
- `CompletedProjectsClient`: 필터링 없음 ❌

**개선 필요**: 공통 필터링 로직을 유틸 함수로 분리

## ✅ 개선 제안

### 1. 즉시 개선 (High Priority)

#### 1.1 프로젝트 이력/완료 프로젝트 페이지 필터링 개선
```typescript
// 공통 필터링 로직 추가
const filterValidCounsels = (counsels: any[]) => {
  return counsels.filter((counsel) => {
    // deleted_at 체크
    if (counsel.deleted_at) return false
    
    // 잘못 생성된 counsel 제외
    if (counsel.title && (
      counsel.title.includes('팀 견적 요청') || 
      counsel.title.includes('팀 팀 견적 요청')
    )) {
      return false
    }
    
    if (counsel.outline && (
      counsel.outline.includes('팀 견적을 요청') ||
      counsel.outline.includes('팀 견적 요청') ||
      counsel.outline.includes('프젝에 참여')
    )) {
      return false
    }
    
    return true
  })
}
```

#### 1.2 UI 일관성 개선
- 모든 페이지에 동일한 헤더 스타일 적용
- 빈 상태 메시지 통일
- 로딩 상태 통일

#### 1.3 회사 정보 수정 페이지 현대화
- 불필요한 아이콘 제거
- 현대적 폼 디자인 적용

### 2. 중기 개선 (Medium Priority)

#### 2.1 공통 컴포넌트 생성
- `EmptyState` 컴포넌트
- `LoadingState` 컴포넌트
- `PageHeader` 컴포넌트

#### 2.2 네비게이션 개선
- 활성 상태 표시 개선
- 그룹명 일관성 확보

### 3. 장기 개선 (Low Priority)

#### 3.1 성능 최적화
- 데이터 페칭 최적화
- 무한 스크롤 고려

#### 3.2 접근성 개선
- 키보드 네비게이션
- 스크린 리더 지원

## 📊 우선순위별 작업 목록

### 🔴 긴급 (이번 주)
1. 프로젝트 이력/완료 프로젝트 페이지 필터링 개선
2. 회사 정보 수정 페이지 UI 현대화
3. 빈 상태/로딩 상태 일관성 개선

### 🟡 중요 (다음 주)
1. 공통 컴포넌트 생성
2. 네비게이션 활성 상태 개선
3. 모든 페이지 헤더 스타일 통일

### 🟢 개선 (향후)
1. 성능 최적화
2. 접근성 개선
3. 모바일 UX 개선

## 📝 체크리스트

### 기업 프로필 페이지
- [x] `/my/company/projects` - 내 프로젝트 ✅
- [x] `/my/company/estimates` - 받은 견적서 ✅
- [ ] `/my/company/info` - 회사 정보 수정 ⚠️
- [ ] `/my/company/team-members` - 팀 멤버 관리 ⚠️
- [ ] `/my/project-history` - 진행 이력 ⚠️
- [ ] `/my/completed-projects` - 완료 프로젝트 ⚠️
- [ ] `/my/subscription` - 구독 관리 ❓
- [ ] `/my/payments` - 결제 내역 ❓
- [ ] `/my/contact-history` - 연락처 열람 기록 ❓

### 프리랜서 프로필 페이지
- [ ] `/my/profile` - 프로필 보기/수정 ❓
- [ ] `/my/team-profile` - 팀 프로필 조회 ❓
- [ ] `/my/team-projects` - 팀 프로젝트 확인 ❓
- [ ] `/my/bookmarked-projects` - 관심 프로젝트 ❓
- [ ] `/my/bookmarked-makers` - 관심 메이커 ❓
- [ ] `/my/received-proposals` - 받은 제안 목록 ❓
- [ ] `/my/sent-requests` - 보낸 요청 목록 ❓

## 🎯 다음 단계

1. **즉시 개선**: 프로젝트 이력/완료 프로젝트 필터링
2. **UI 통일**: 모든 페이지에 일관된 스타일 적용
3. **공통 컴포넌트**: 재사용 가능한 컴포넌트 생성
