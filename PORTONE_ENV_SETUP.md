# 포트원 환경 변수 설정 가이드

## 필수 환경 변수

링커스 월 정기결제 시스템을 사용하기 위해 다음 환경 변수들을 설정해야 합니다.

### 1. `.env.local` 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성하고 아래 변수들을 추가하세요.

```env
# 포트원 REST API Key
NEXT_PUBLIC_PORTONE_REST_API_KEY=your_rest_api_key_here

# 포트원 REST API Secret
PORTONE_REST_API_SECRET=your_rest_api_secret_here

# 포트원 가맹점 식별코드
NEXT_PUBLIC_PORTONE_IMP_CODE=imp12345678

# 포트원 채널 키
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=channel_key_here

# 월 정기결제 자동 처리 API 보안 키 (선택사항)
CRON_SECRET=your_secure_random_string_here
```

## 환경 변수 상세 설명

### 1. `NEXT_PUBLIC_PORTONE_REST_API_KEY`
- **용도**: 포트원 REST API 인증 키
- **사용 위치**: 
  - 서버 사이드: `src/apis/subscription.service.ts`
  - Access Token 발급 시 사용
- **확인 방법**: 
  1. [포트원 관리자 콘솔](https://admin.portone.io) 로그인
  2. 설정 > 내 식별코드, API Keys
  3. REST API Key 복사
- **보안**: 프론트엔드에 노출되지만, Secret과 함께 사용해야 실제 API 호출 가능

### 2. `PORTONE_REST_API_SECRET`
- **용도**: 포트원 REST API 비밀 키
- **사용 위치**: 
  - 서버 사이드만: `src/apis/subscription.service.ts`
  - Access Token 발급 시 사용
- **확인 방법**: 
  1. [포트원 관리자 콘솔](https://admin.portone.io) 로그인
  2. 설정 > 내 식별코드, API Keys
  3. REST API Secret 복사 (재발급 가능)
- **보안**: ⚠️ **절대 프론트엔드에 노출하지 마세요!** 서버 사이드에서만 사용

### 3. `NEXT_PUBLIC_PORTONE_IMP_CODE`
- **용도**: 포트원 가맹점 식별코드
- **사용 위치**: 
  - 프론트엔드: `src/app/(home)/my/subscription/register/page.tsx`
  - 포트원 SDK 초기화 시 사용 (`IMP.init()`)
- **확인 방법**: 
  1. [포트원 관리자 콘솔](https://admin.portone.io) 로그인
  2. 설정 > 내 식별코드, API Keys
  3. 고객사 식별코드 복사 (IMP로 시작)
- **형식**: `imp12345678` (IMP + 숫자)

### 4. `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`
- **용도**: 포트원 채널 키
- **사용 위치**: 
  - 프론트엔드: `src/app/(home)/my/subscription/register/page.tsx`
  - 결제창 호출 시 사용 (`IMP.request_pay()`)
- **확인 방법**: 
  1. [포트원 관리자 콘솔](https://admin.portone.io) 로그인
  2. 결제 연동 > 연동 정보 > 채널 관리
  3. 정기 결제 지원 PG사 채널 선택
  4. 채널 키 복사
- **주의**: 정기 결제를 지원하는 PG사 채널의 키를 사용해야 합니다

### 5. `CRON_SECRET` (선택사항)
- **용도**: 월 정기결제 자동 처리 API 보안 키
- **사용 위치**: 
  - 서버 사이드: `src/app/api/subscription/process-monthly/route.ts`
  - Vercel Cron Jobs 또는 외부 스케줄러에서 호출 시 인증용
- **생성 방법**: 
  ```bash
  # 랜덤 문자열 생성 (32자리)
  openssl rand -hex 32
  ```
- **보안**: ⚠️ **절대 프론트엔드에 노출하지 마세요!**

## 포트원 콘솔 설정 단계

### 1단계: 포트원 계정 생성 및 로그인
1. [포트원 관리자 콘솔](https://admin.portone.io) 접속
2. 회원가입 또는 로그인

### 2단계: API 키 확인
1. 설정 > 내 식별코드, API Keys
2. 다음 정보 확인/복사:
   - 고객사 식별코드 (IMP 코드)
   - REST API Key
   - REST API Secret (재발급 가능)

### 3단계: 채널 등록
1. 결제 연동 > 연동 정보 > 채널 관리
2. 정기 결제 지원 PG사 선택 (토스페이먼츠, 나이스페이먼츠 등)
3. 채널 추가
4. 채널 키 복사

### 4단계: Webhook 설정
1. 결제 연동 > 실 연동 관리
2. 결제알림(Webhook) 관리
3. Webhook URL 설정: `https://your-domain.com/api/subscription/webhook`
4. 이벤트 선택: `payment.succeeded`, `payment.failed` 등

## 환경 변수 설정 체크리스트

- [ ] `.env.local` 파일 생성
- [ ] `NEXT_PUBLIC_PORTONE_REST_API_KEY` 설정
- [ ] `PORTONE_REST_API_SECRET` 설정
- [ ] `NEXT_PUBLIC_PORTONE_IMP_CODE` 설정
- [ ] `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` 설정
- [ ] `CRON_SECRET` 설정 (선택사항)
- [ ] 포트원 콘솔에서 채널 등록 완료
- [ ] Webhook URL 설정 완료

## 보안 주의사항

1. **`.env.local` 파일은 절대 Git에 커밋하지 마세요!**
   - `.gitignore`에 `.env.local`이 포함되어 있는지 확인

2. **프로덕션 환경 변수 설정**
   - Vercel: 프로젝트 설정 > Environment Variables
   - 다른 플랫폼: 해당 플랫폼의 환경 변수 설정 메뉴 사용

3. **Secret 키 보안**
   - `PORTONE_REST_API_SECRET`와 `CRON_SECRET`는 서버 사이드에서만 사용
   - 프론트엔드 코드에 절대 포함하지 마세요

## 테스트 환경 변수

테스트 모드 사용 시:
- 포트원 콘솔에서 테스트 모드 채널 생성
- 테스트 채널의 채널 키 사용
- 테스트 카드 번호로 결제 테스트

## 문제 해결

### 환경 변수가 적용되지 않는 경우
1. 서버 재시작 (Next.js 개발 서버)
2. `.env.local` 파일 위치 확인 (프로젝트 루트)
3. 변수명 오타 확인
4. `NEXT_PUBLIC_` 접두사 확인 (프론트엔드에서 사용하는 변수)

### 포트원 API 호출 실패 시
1. API Key와 Secret 확인
2. 포트원 콘솔에서 API 키 재발급 후 업데이트
3. 네트워크 오류 확인

## 참고 자료

- [포트원 관리자 콘솔](https://admin.portone.io)
- [포트원 개발자 문서](https://developers.portone.io)
- [포트원 API 문서](https://developers.portone.io/api/rest-v1)

