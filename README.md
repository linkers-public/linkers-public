# Makers Web Platform

메이커와 기업을 연결하는 프로젝트 매칭 플랫폼입니다.

## 🚀 주요 기능

### 기업 고객 (Enterprise)
- **프로젝트 상담 신청**: 요구사항, 예산, 기간을 입력하여 프로젝트 상담을 신청할 수 있습니다
- **메이커 검색**: 간단한 태그/직무 필터를 통해 적합한 메이커를 검색할 수 있습니다
- **견적서 관리**: 받은 견적서를 검토하고 수락할 수 있습니다
- **프로젝트 진행 관리**: 마일스톤 기반으로 프로젝트 진행 상황을 관리할 수 있습니다
- **실시간 채팅**: 메이커 팀과 실시간으로 소통할 수 있습니다

### 메이커 (Maker)
- **프로필 관리**: 개인/팀 프로필을 등록하고 관리할 수 있습니다
- **프로젝트 검색**: 관심 있는 프로젝트를 검색하고 지원할 수 있습니다
- **견적서 작성**: 상담 요청에 대한 견적서를 작성하고 제출할 수 있습니다
- **프로젝트 진행**: 수락된 프로젝트의 진행 상황을 관리할 수 있습니다

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (home)/            # 홈페이지 및 일반 사용자 페이지
│   ├── enterprise/        # 기업 고객 전용 페이지
│   └── auth/              # 인증 관련 페이지
├── components/            # 재사용 가능한 컴포넌트
├── apis/                  # API 서비스 함수들
├── hooks/                 # 커스텀 훅
├── stores/                # 상태 관리
├── types/                 # TypeScript 타입 정의
└── supabase/              # Supabase 설정
```

## 🚀 시작하기

### 1. 저장소 클론
```bash
git clone [repository-url]
cd makers-web
```

### 2. 의존성 설치
```bash
npm install
# 또는
yarn install
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 필요한 환경 변수를 설정하세요.

**빠른 시작:**
```bash
# env.example 파일을 복사하여 .env.local 생성
cp env.example .env.local
```

**필수 환경 변수:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase Anon Key
- `NEXT_PUBLIC_STORAGE_BUCKET` - Supabase Storage 버킷 이름

**포트원 V2 (정기 결제 사용 시):**
- `PORTONE_V2_API_SECRET` - 포트원 V2 API Secret
- `NEXT_PUBLIC_PORTONE_V2_STORE_ID` - 포트원 V2 Store ID
- `NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY` - 포트원 V2 Channel Key
- `PORTONE_V2_WEBHOOK_SECRET` - 포트원 V2 Webhook Secret

> 📖 **자세한 환경 변수 설정 가이드**: [ENV_SETUP.md](./ENV_SETUP.md)를 참고하세요.

**환경별 설정:**
- **개발 환경**: `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- **프로덕션 환경**: `NEXT_PUBLIC_SITE_URL=https://your-domain.com`

> 참고: `NEXT_PUBLIC_SITE_URL`은 소셜 로그인(OAuth) 리다이렉트 URL에 사용됩니다. 설정하지 않으면 자동으로 `window.location.origin`을 사용합니다.

### 4. 개발 서버 실행
```bash
npm run dev
# 또는
yarn dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📱 주요 페이지

### 기업 고객 페이지
- `/enterprise` - 기업 홈페이지
- `/enterprise/counsel-form` - 프로젝트 상담 신청
- `/enterprise/my-counsel` - 보낸 프로젝트 목록
- `/enterprise/counsel-detail/[id]` - 상담서 상세 보기
- `/enterprise/(dashboard)/estimate-list/[counselId]` - 견적서 목록
- `/enterprise/(dashboard)/manager-team/[counselId]` - 프로젝트 진행 관리
- `/enterprise/(dashboard)/counsel-status/[counselId]` - 팀 채팅

### 메이커 페이지
- `/` - 홈페이지
- `/search-projects` - 프로젝트 검색
- `/profile/[username]` - 메이커 프로필
- `/my/profile` - 내 프로필 관리

## 🔧 개발 가이드

### API 서비스
`src/apis/` 폴더에 있는 서비스 함수들을 통해 Supabase와 통신합니다:

- `counsel.service.ts` - 상담 관련 API
- `estimate.service.ts` - 견적서 관련 API
- `chat.service.ts` - 채팅 관련 API
- `profile.service.ts` - 프로필 관련 API

### 컴포넌트 구조
- `src/components/ui/` - 기본 UI 컴포넌트
- `src/components/` - 비즈니스 로직 컴포넌트

### 상태 관리
- `src/stores/` - Zustand를 사용한 전역 상태 관리
- `src/hooks/` - 커스텀 훅

## 🚀 배포

### Vercel 배포
```bash
npm run build
```

Vercel 플랫폼을 사용하여 쉽게 배포할 수 있습니다.

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
