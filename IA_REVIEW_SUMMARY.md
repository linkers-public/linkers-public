# IA 검토 및 누락 페이지 요약

## 완료된 기능 ✅

### 기업(Company)
1. ✅ 프로젝트 견적 요청 등록 (`/enterprise/counsel-form`)
   - 서비스종류, 요구사항, 희망비용(int 만원), 기간(int 개월), 연락처
2. ✅ 받은 견적서 대시보드 (`/my/estimates-dashboard`)
   - 필터: 분야, 최신/비용순, 마감임박
   - 카드 리스트 → 상세(팀구성/작업범위/추가옵션/비용/기간)
3. ✅ 매칭(연락처 열람) - 소액 과금 MVP 구현

### 프리랜서(메이커/매니저 공통)
1. ✅ 개인 프로필 (`/my/profile`)
   - 기본정보(소개/연락처) - 프로필 이미지 업로드 기능 추가 필요
   - 직무/전문태그(태그형 + 자유입력) - ✅ 구현됨
   - 경력(개월 단위) - ✅ 구현됨 (`account_work_experiences`)
   - 학력(자유입력) - ✅ 구현됨, 태그 기능 추가 필요 (고교/대학/대학원)
   - 자격증 - ✅ 구현됨 (`account_license`)
   - 포트폴리오(링크/설명/역할/성과) - ✅ 구현됨 (`/my/profile/portfolio`)
   - 경력 인증 배지 - ✅ 구현됨 (`/my/profile/badges`)
2. ✅ 쪽지함 (`/my/messages`)
   - 매니저의 팀초대/기업 제안 수락/거절
3. ✅ 역할 스위치 - 프로필 전환 기능 (`/my/profile/manage`)
4. ✅ 프로젝트 참여 시 메이커/매니저 선택 - `ProjectJoinModal`에서 구현됨

### 매니저(프리랜서의 역할)
1. ✅ 메이커 검색 (`/search-makers`)
   - 필터: 직무, 경력(년/개월), 전문태그 - ✅ 구현됨
   - 배지 필터 추가 필요
   - 프로필 상세 보기 → 팀 제안(쪽지) - ✅ 구현됨
2. ✅ 팀 프로필 (`/my/team-profile`)
   - 팀 소개, 전문분야, 선호 견적/기간 - ✅ 구현됨
   - 팀원 관리: 제안 → 수락 시 팀원 추가/제거 - ✅ 구현됨
   - 팀 포트폴리오 기능 추가 필요
3. ✅ 견적 요청 목록 (`/my/estimate-requests`) - **새로 생성됨**
   - 필터/정렬 → 상세 열람 → 세부 견적서 작성/제출

## 추가로 구현 필요한 기능

### 우선순위 높음
1. **프로필 이미지 업로드 기능**
   - 위치: `/my/update` (ProfileUpdateClient)
   - `profile_image_url` 필드 활용

2. **학력 태그 기능**
   - 위치: `/my/profile/educations/create`
   - 고교/대학/대학원 태그 선택 + 자유입력

3. **매니저용 메이커 검색 배지 필터**
   - 위치: `/search-makers`
   - `badges` 필드 기준 필터링 추가

4. **팀 포트폴리오 기능**
   - 위치: `/my/team-profile`
   - 팀 프로젝트 포트폴리오 관리

## 생성된 새 페이지

1. `/my/estimate-requests` - 매니저용 견적 요청 목록
   - 필터: 분야, 검색, 정렬, 마감임박
   - 카드 리스트 표시
   - 견적서 작성/수정 다이얼로그

## 파일 구조

```
src/app/
├── (home)/
│   ├── my/
│   │   ├── estimates-dashboard/ ✅ (받은 견적서 대시보드)
│   │   ├── estimate-requests/ ✅ (견적 요청 목록 - 새로 생성)
│   │   ├── messages/ ✅ (쪽지함)
│   │   ├── profile/
│   │   │   ├── badges/ ✅ (경력 인증 배지)
│   │   │   ├── portfolio/ ✅ (포트폴리오)
│   │   │   └── educations/ ⚠️ (학력 태그 추가 필요)
│   │   ├── team-profile/ ✅ (팀원 관리 기능 있음, 포트폴리오 추가 필요)
│   │   └── update/ ⚠️ (프로필 이미지 업로드 추가 필요)
│   ├── search-makers/ ⚠️ (배지 필터 추가 필요)
│   └── project-detail/[id]/ ✅ (역할 선택 기능 구현됨)
└── enterprise/
    ├── counsel-form/ ✅ (견적 요청 등록)
    └── estimate-review/ ✅ (견적서 검토)
```

