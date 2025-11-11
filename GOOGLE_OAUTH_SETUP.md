# Google OAuth 설정 가이드

## 📋 개요

Google OAuth를 사용하기 위해 Google Cloud Console에서 설정해야 하는 항목들입니다.

## 🔧 설정 방법

### 1. Google Cloud Console 접속

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 (또는 새 프로젝트 생성)
3. **API 및 서비스** > **사용자 인증 정보** 메뉴로 이동

### 2. OAuth 2.0 클라이언트 ID 생성

1. **사용자 인증 정보** 페이지에서 **+ 사용자 인증 정보 만들기** 클릭
2. **OAuth 클라이언트 ID** 선택
3. 애플리케이션 유형 선택:
   - **웹 애플리케이션** (일반적인 경우)
   - 또는 **웹 서버** (서버 사이드 인증)

### 3. 승인된 JavaScript 원본 설정

**설정 위치**: OAuth 클라이언트 ID 생성/수정 화면의 **승인된 JavaScript 원본** 섹션

**추가할 URI들**:

#### 개발 환경 (로컬)
```
http://localhost:3000
```

#### 프로덕션 환경
```
https://your-domain.com
https://www.your-domain.com
```

#### Vercel 배포 환경
```
https://your-project.vercel.app
https://your-project-git-main.vercel.app
https://your-project-*.vercel.app
```

**⚠️ 주의사항**:
- 프로토콜(`http://` 또는 `https://`) 포함 필수
- 포트 번호 포함 필수 (로컬 개발 시)
- 마지막에 슬래시(`/`) 없이 입력
- 각 URI를 한 줄씩 입력

**예시**:
```
http://localhost:3000
https://linkers.vercel.app
https://www.linkers.co.kr
```

### 4. 승인된 리디렉션 URI 설정

**설정 위치**: OAuth 클라이언트 ID 생성/수정 화면의 **승인된 리디렉션 URI** 섹션

**추가할 URI들**:

#### Supabase를 사용하는 경우
Supabase가 OAuth 콜백을 처리하므로, Supabase 콜백 URL을 추가해야 합니다:

```
https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
```

**예시**:
```
https://eppwaqburvobrybkmlkv.supabase.co/auth/v1/callback
```

#### 직접 처리하는 경우
프로젝트에서 직접 OAuth 콜백을 처리하는 경우:

**개발 환경**:
```
http://localhost:3000/auth/callback
```

**프로덕션 환경**:
```
https://your-domain.com/auth/callback
https://www.your-domain.com/auth/callback
```

**⚠️ 주의사항**:
- 프로토콜 포함 필수
- 포트 번호 포함 필수 (로컬 개발 시)
- 정확한 경로 포함 (`/auth/callback`)
- 마지막에 슬래시(`/`) 없이 입력
- 각 URI를 한 줄씩 입력

**예시 (Supabase 사용 시)**:
```
https://eppwaqburvobrybkmlkv.supabase.co/auth/v1/callback
```

**예시 (직접 처리 시)**:
```
http://localhost:3000/auth/callback
https://linkers.vercel.app/auth/callback
```

## 🔍 현재 프로젝트 설정 확인

### Supabase 사용 여부 확인

프로젝트에서 Supabase를 사용하는 경우, Supabase 대시보드에서도 Google OAuth를 설정해야 합니다:

1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택 > **Authentication** > **Providers**
3. **Google** 클릭
4. **Enable Google provider** 활성화
5. Google Cloud Console에서 발급받은 **Client ID**와 **Client Secret** 입력
6. **Save** 클릭

### 현재 프로젝트의 리디렉션 URL 확인

코드를 확인한 결과, 현재 프로젝트는 다음과 같은 리디렉션 URL을 사용합니다:

```typescript
// src/components/AuthUI.tsx
redirectTo: `${siteUrl}/auth/callback?profile_type=${profileType}&next=/`
```

따라서 **승인된 리디렉션 URI**에 다음을 추가해야 합니다:

```
http://localhost:3000/auth/callback
https://your-domain.com/auth/callback
```

## 📝 설정 체크리스트

### Google Cloud Console
- [ ] OAuth 동의 화면 구성 완료
- [ ] OAuth 2.0 클라이언트 ID 생성
- [ ] 승인된 JavaScript 원본 추가
  - [ ] `http://localhost:3000` (개발)
  - [ ] 프로덕션 도메인 추가
- [ ] 승인된 리디렉션 URI 추가
  - [ ] Supabase 콜백 URL (Supabase 사용 시)
  - [ ] 또는 `/auth/callback` URL (직접 처리 시)

### Supabase (Supabase 사용 시)
- [ ] Google Provider 활성화
- [ ] Client ID 입력
- [ ] Client Secret 입력
- [ ] 저장 완료

## 🚨 자주 발생하는 오류

### 오류 1: "redirect_uri_mismatch"
**원인**: 승인된 리디렉션 URI에 해당 URL이 등록되지 않음

**해결**:
1. Google Cloud Console에서 정확한 리디렉션 URI 확인
2. 프로토콜, 도메인, 포트, 경로가 정확히 일치하는지 확인
3. URI 추가 후 몇 분 대기 (캐시 문제)

### 오류 2: "invalid_client"
**원인**: Client ID 또는 Client Secret이 잘못됨

**해결**:
1. Google Cloud Console에서 Client ID/Secret 재확인
2. Supabase에 올바르게 입력되었는지 확인
3. 공백이나 특수문자 제거 확인

### 오류 3: "access_denied"
**원인**: OAuth 동의 화면이 제대로 구성되지 않음

**해결**:
1. Google Cloud Console > OAuth 동의 화면 확인
2. 테스트 사용자 추가 (외부 사용자 접근 시)
3. 앱 정보(앱 이름, 로고 등) 입력

## 🔐 보안 주의사항

1. **Client Secret 절대 노출 금지**
   - 환경 변수로 관리
   - Git에 커밋하지 않기
   - `.env.local`에 저장

2. **리디렉션 URI 제한**
   - 필요한 도메인만 추가
   - 와일드카드 사용 최소화
   - 프로덕션과 개발 환경 분리

3. **테스트 사용자 관리**
   - OAuth 동의 화면에서 테스트 사용자 추가
   - 프로덕션 배포 전 검토 완료

## 📚 참고 자료

- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [Next.js OAuth 가이드](https://nextjs.org/docs/authentication)

## 💡 현재 프로젝트 설정 예시

### 개발 환경
```
승인된 JavaScript 원본:
http://localhost:3000

승인된 리디렉션 URI:
http://localhost:3000/auth/callback
```

### 프로덕션 환경 (Vercel)
```
승인된 JavaScript 원본:
https://linkers.vercel.app
https://linkers-git-main.vercel.app

승인된 리디렉션 URI:
https://linkers.vercel.app/auth/callback
```

### Supabase 사용 시
```
승인된 리디렉션 URI:
https://eppwaqburvobrybkmlkv.supabase.co/auth/v1/callback
```

