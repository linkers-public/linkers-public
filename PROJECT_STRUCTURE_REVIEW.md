# 프로젝트 전체 구조 검토 및 개선사항

## 📋 개요

프로젝트 전체 구조를 검토하고 개선사항을 정리한 문서입니다.

**검토 일자**: 2025-01-XX  
**프로젝트**: LINKUS - 프리랜서 매칭 플랫폼  
**기술 스택**: Next.js 14, TypeScript, Supabase, PortOne V2

---

## 🏗️ 현재 프로젝트 구조

### 디렉토리 구조

```
linkers/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (home)/            # 일반 사용자 페이지
│   │   ├── enterprise/        # 기업 고객 전용 페이지
│   │   ├── auth/              # 인증 페이지
│   │   └── api/               # API 라우트
│   ├── components/            # 재사용 컴포넌트
│   ├── apis/                  # API 서비스 함수
│   ├── hooks/                 # 커스텀 훅
│   ├── stores/                # Zustand 상태 관리
│   ├── types/                 # TypeScript 타입
│   └── supabase/              # Supabase 설정
├── public/                    # 정적 파일
└── [문서 파일들]              # 많은 마크다운 문서
```

### 기술 스택

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payment**: PortOne V2 API
- **Deployment**: Vercel

---

## ✅ 잘 구성된 부분

### 1. 프로젝트 구조
- ✅ Next.js App Router 사용
- ✅ 기능별 디렉토리 분리 (apis, components, hooks)
- ✅ 타입 정의 중앙화 (types/)

### 2. 코드 품질
- ✅ TypeScript 사용
- ✅ 일부 공통 에러 핸들링 함수 존재
- ✅ 환경 변수 관리 (env.example)

### 3. 문서화
- ✅ 상세한 마크다운 문서들
- ✅ README 기본 구조 존재

---

## ⚠️ 개선이 필요한 부분

### 1. 코드 품질 및 일관성

#### 문제점
- **TODO 주석 다수**: 10개 이상의 TODO 주석 발견
  - `src/app/api/subscription-v2/register/route.ts`: 재시도 로직 TODO
  - `src/app/(home)/my/bookmarked-makers/BookMarkedMakerClient.tsx`: ZOD 반영 TODO
  - `src/app/(home)/my/account/security/SecurityClient.tsx`: 이메일 변경 로직 TODO
  - 기타 다수

- **파일 확장자 혼용**: `.tsx`와 `.jsx` 혼용
  - `src/components/GlobalNavigator.jsx`
  - `src/components/IconButton.jsx`
  - `src/components/ProfileClient.jsx`
  - `src/components/SideNavigator.jsx`
  - `src/layout/Footer.jsx`
  - `src/app/meeting/LandingPageClient.jsx`

- **타입 안정성 부족**
  - 일부 파일에서 `any` 타입 사용
  - ZOD 스키마 검증 미적용 (TODO로 표시됨)

#### 개선 방안
1. **TODO 주석 정리**
   - 우선순위별로 정리
   - 이슈 트래커에 등록
   - 단기/장기 계획 수립

2. **파일 확장자 통일**
   - 모든 React 컴포넌트를 `.tsx`로 변환
   - TypeScript 타입 추가

3. **타입 안정성 강화**
   - ZOD 스키마 도입
   - `any` 타입 제거
   - 엄격한 타입 체크

---

### 2. API 구조

#### 문제점
- **API 라우트 중복**
  - `subscription/`과 `subscription-v2/` 동시 존재
  - 구버전 API 정리 필요

- **에러 처리 일관성 부족**
  - 일부는 공통 함수 사용 (`handleError`)
  - 일부는 직접 처리
  - 에러 메시지 형식 불일치

- **API 문서화 부족**
  - API 엔드포인트 문서 없음
  - 요청/응답 형식 명시 없음

#### 개선 방안
1. **API 버전 관리**
   - 구버전 API 제거 또는 deprecated 표시
   - API 버전 관리 전략 수립

2. **에러 처리 표준화**
   - 공통 에러 핸들링 유틸리티 생성
   - 에러 타입 정의
   - 일관된 에러 응답 형식

3. **API 문서화**
   - OpenAPI/Swagger 스펙 작성
   - 또는 간단한 API 문서 페이지 생성

---

### 3. 테스트

#### 문제점
- **테스트 코드 없음**
  - 단위 테스트 없음
  - 통합 테스트 없음
  - E2E 테스트 없음

#### 개선 방안
1. **테스트 환경 구축**
   - Jest + React Testing Library 설정
   - 또는 Vitest 사용 고려

2. **테스트 우선순위**
   - 핵심 비즈니스 로직 (결제, 구독)
   - API 엔드포인트
   - 주요 컴포넌트

---

### 4. 컴포넌트 구조

#### 문제점
- **컴포넌트 크기**
  - 일부 컴포넌트가 매우 큼 (1000+ 라인)
  - `src/layout/Header.tsx`: 1000+ 라인

- **재사용성 부족**
  - 비슷한 로직의 중복 코드
  - 공통 컴포넌트 부족

#### 개선 방안
1. **컴포넌트 분리**
   - 큰 컴포넌트를 작은 단위로 분리
   - 관심사 분리 (UI/로직)

2. **재사용 가능한 컴포넌트**
   - 공통 UI 컴포넌트 확장
   - 비즈니스 로직 훅으로 분리

---

### 5. 상태 관리

#### 문제점
- **상태 관리 일관성**
   - Zustand 사용하지만 일부는 로컬 상태
   - 전역 상태와 로컬 상태 구분 불명확

#### 개선 방안
1. **상태 관리 전략 수립**
   - 전역 상태 vs 로컬 상태 가이드라인
   - 상태 관리 패턴 문서화

---

### 6. 보안

#### 문제점
- **RLS 정책 확인 필요**
  - 문서에 RLS 정책 확인 필요 표시
  - 실제 구현 상태 불명확

- **환경 변수 관리**
  - `.env.local` 파일 관리 방법 불명확
  - 민감 정보 노출 위험

#### 개선 방안
1. **보안 감사**
   - RLS 정책 전체 검토
   - 인증/인가 로직 검증

2. **환경 변수 관리**
   - `.env.example` 업데이트
   - 환경 변수 검증 로직 추가

---

### 7. 성능

#### 문제점
- **코드 스플리팅**
   - 큰 번들 크기 가능성
   - 동적 임포트 활용 부족

- **이미지 최적화**
   - Next.js Image 컴포넌트 사용 확인 필요

#### 개선 방안
1. **번들 분석**
   - `@next/bundle-analyzer` 도입
   - 번들 크기 최적화

2. **코드 스플리팅**
   - 동적 임포트 활용
   - 라우트별 코드 스플리팅

---

### 8. 문서화

#### 문제점
- **문서 관리**
  - 마크다운 문서가 많지만 최신화 필요
   - 문서 간 일관성 부족

- **코드 문서화**
   - JSDoc 주석 부족
   - 함수 설명 부족

#### 개선 방안
1. **문서 정리**
   - 사용하지 않는 문서 제거
   - 최신 상태로 업데이트
   - 문서 인덱스 생성

2. **코드 문서화**
   - 주요 함수에 JSDoc 추가
   - 타입 정의에 설명 추가

---

## 🎯 우선순위별 개선 계획

### 우선순위 1: 즉시 개선 (1-2주)

1. **TODO 주석 정리**
   - [ ] 모든 TODO 주석 목록화
   - [ ] 우선순위 결정
   - [ ] 이슈 트래커 등록

2. **파일 확장자 통일**
   - [ ] `.jsx` → `.tsx` 변환
   - [ ] TypeScript 타입 추가

3. **에러 처리 표준화**
   - [ ] 공통 에러 핸들링 유틸리티 생성
   - [ ] 기존 코드에 적용

### 우선순위 2: 단기 개선 (1개월)

4. **API 구조 정리**
   - [ ] 구버전 API 제거 또는 deprecated
   - [ ] API 문서화

5. **컴포넌트 리팩토링**
   - [ ] 큰 컴포넌트 분리
   - [ ] 재사용 가능한 컴포넌트 추출

6. **보안 강화**
   - [ ] RLS 정책 전체 검토
   - [ ] 환경 변수 검증

### 우선순위 3: 중기 개선 (2-3개월)

7. **테스트 도입**
   - [ ] 테스트 환경 구축
   - [ ] 핵심 로직 테스트 작성

8. **성능 최적화**
   - [ ] 번들 분석
   - [ ] 코드 스플리팅

9. **문서화 개선**
   - [ ] 문서 정리 및 업데이트
   - [ ] 코드 문서화

---

## 📊 코드 메트릭

### 파일 통계
- **총 파일 수**: 약 200+ 파일
- **TypeScript 파일**: 대부분
- **JavaScript 파일**: 약 6개 (변환 필요)

### 코드 품질
- **TODO 주석**: 10+ 개
- **테스트 파일**: 0개
- **에러 처리**: 부분적 표준화

---

## 🔍 상세 개선 항목

### 1. TODO 주석 목록

#### 높은 우선순위
1. `src/app/api/subscription-v2/register/route.ts:176`
   - 실패 시 재시도 로직 추가 필요

2. `src/app/(home)/my/account/security/SecurityClient.tsx:53`
   - 이메일 변경 로직 구현 필요

#### 중간 우선순위
3. `src/app/(home)/my/bookmarked-makers/BookMarkedMakerClient.tsx:18,32`
   - ZOD 스키마 반영 필요

4. `src/app/(home)/my/estimates-dashboard/EstimatesDashboardClient.tsx:333`
   - counsel 테이블 컬럼 추가 후 연동 필요

5. `src/app/(home)/my/profile/portfolio/PortfolioClient.tsx:81`
   - account_portfolios 테이블 타입 정의 필요

#### 낮은 우선순위
6. `src/app/(home)/search-makers/SearchMakersClient.tsx:17`
   - 중복 추출 / ZOD 반영

7. `src/app/(home)/my/team-proposal/TeamProposalClient.tsx:17,32,75`
   - ZOD 반영, 필터 연동

8. `src/components/SearchMakerCard.tsx:4`
   - ZOD 반영

---

### 2. 파일 확장자 변환 필요 목록

다음 파일들을 `.tsx`로 변환하고 TypeScript 타입을 추가해야 합니다:

1. `src/components/GlobalNavigator.jsx`
2. `src/components/IconButton.jsx`
3. `src/components/ProfileClient.jsx`
4. `src/components/SideNavigator.jsx`
5. `src/layout/Footer.jsx`
6. `src/app/meeting/LandingPageClient.jsx`

---

### 3. API 라우트 정리

#### 중복/구버전 API
- `src/app/api/subscription/` - 구버전 (V2로 마이그레이션 완료)
- `src/app/api/payments/estimate-view` - 사용되지 않음 (건별 결제 제거됨)

#### 권장 작업
1. 구버전 API 제거 또는 deprecated 표시
2. 사용되지 않는 API 제거
3. API 버전 관리 전략 수립

---

### 4. 컴포넌트 크기 문제

#### 큰 컴포넌트 목록
1. `src/layout/Header.tsx` - 1000+ 라인
   - 분리 필요: 네비게이션, 사용자 메뉴, 검색 등

#### 권장 작업
1. 컴포넌트를 기능별로 분리
2. 공통 로직을 훅으로 추출
3. 재사용 가능한 하위 컴포넌트 생성

---

## 📝 체크리스트

### 코드 품질
- [ ] TODO 주석 정리
- [ ] 파일 확장자 통일 (.jsx → .tsx)
- [ ] 타입 안정성 강화 (any 제거, ZOD 도입)
- [ ] 에러 처리 표준화

### API 구조
- [ ] 구버전 API 정리
- [ ] API 문서화
- [ ] 에러 응답 형식 통일

### 테스트
- [ ] 테스트 환경 구축
- [ ] 핵심 로직 테스트 작성

### 컴포넌트
- [ ] 큰 컴포넌트 분리
- [ ] 재사용 가능한 컴포넌트 추출

### 보안
- [ ] RLS 정책 검토
- [ ] 환경 변수 검증

### 성능
- [ ] 번들 분석
- [ ] 코드 스플리팅

### 문서화
- [ ] 문서 정리 및 업데이트
- [ ] 코드 문서화 (JSDoc)

---

## 🚀 다음 단계

1. **즉시 시작 가능한 작업**
   - TODO 주석 목록화 및 우선순위 결정
   - 파일 확장자 변환 (.jsx → .tsx)
   - 공통 에러 핸들링 유틸리티 생성

2. **단기 계획**
   - API 구조 정리
   - 컴포넌트 리팩토링
   - 보안 감사

3. **중기 계획**
   - 테스트 도입
   - 성능 최적화
   - 문서화 개선

---

## 📚 참고 문서

- [결제 시스템 검토](./PAYMENT_SYSTEM_REVIEW_UPDATED.md)
- [개발 작업 요약](./DEVELOPMENT_WORK_SUMMARY.md)
- [마이페이지 검토](./MY_PAGE_REVIEW.md)
- [프로필 리팩토링 설계](./PROFILE_REFACTOR_DESIGN.md)

---

## 💡 추가 제안

### 1. 코드 리뷰 프로세스
- PR 템플릿 생성
- 코드 리뷰 체크리스트
- 자동화된 린트/타입 체크

### 2. CI/CD 개선
- 자동 테스트 실행
- 자동 배포 파이프라인
- 환경별 배포 전략

### 3. 모니터링
- 에러 추적 (Sentry 등)
- 성능 모니터링
- 사용자 분석

---

**작성일**: 2025-01-XX  
**작성자**: AI Assistant  
**버전**: 1.0

