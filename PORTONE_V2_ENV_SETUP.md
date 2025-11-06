# 포트원 V2 환경 변수 설정 가이드

## 필수 환경 변수

링커스 월 정기결제 시스템을 포트원 V2로 사용하기 위해 다음 환경 변수들을 설정해야 합니다.

### 1. `.env.local` 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성하고 아래 변수들을 추가하세요.

```env
# 포트원 V2 API Secret (포트원 콘솔 > V2 > API Keys에서 확인)
# ⚠️ 서버 사이드에서만 사용! 절대 프론트엔드에 노출하지 마세요!
PORTONE_V2_API_SECRET=your_v2_api_secret_here

# 포트원 V2 Store ID (포트원 콘솔 > V2 > Stores에서 확인)
NEXT_PUBLIC_PORTONE_V2_STORE_ID=store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# 포트원 V2 Channel Key (포트원 콘솔 > V2 > Channels에서 확인)
# 정기 결제 지원 PG사 채널의 채널 키
NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY=channel-key-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# 포트원 V2 Webhook Secret (포트원 콘솔 > V2 > Webhooks에서 확인)
# ⚠️ 서버 사이드에서만 사용! 절대 프론트엔드에 노출하지 마세요!
PORTONE_V2_WEBHOOK_SECRET=your_v2_webhook_secret_here

# 월 정기결제 자동 처리 API 보안 키 (선택사항)
CRON_SECRET=your_secure_random_string_here
```

## 환경 변수 상세 설명

### 1. `PORTONE_V2_API_SECRET`
- **용도**: 포트원 V2 REST API 인증 키
- **사용 위치**: 
  - 서버 사이드: `src/apis/subscription-v2.service.ts`
  - 모든 V2 API 호출 시 사용
- **확인 방법**: 
  1. [포트원 관리자 콘솔](https://admin.portone.io) 로그인
  2. V2 > API Keys 메뉴
  3. API Secret 복사
- **보안**: ⚠️ **절대 프론트엔드에 노출하지 마세요!** 서버 사이드에서만 사용

### 2. `NEXT_PUBLIC_PORTONE_V2_STORE_ID`
- **용도**: 포트원 V2 Store ID
- **사용 위치**: 
  - 프론트엔드: `src/app/(home)/my/subscription/register-v2/page.tsx`
  - 빌링키 발급 UI 로드 시 사용
- **확인 방법**: 
  1. [포트원 관리자 콘솔](https://admin.portone.io) 로그인
  2. V2 > Stores 메뉴
  3. Store ID 복사 (store-로 시작하는 UUID 형식)

### 3. `NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY`
- **용도**: 포트원 V2 Channel Key
- **사용 위치**: 
  - 프론트엔드: `src/app/(home)/my/subscription/register-v2/page.tsx`
  - 빌링키 발급 UI 로드 시 사용
- **확인 방법**: 
  1. [포트원 관리자 콘솔](https://admin.portone.io) 로그인
  2. V2 > Channels 메뉴
  3. 정기 결제 지원 PG사 채널 선택
  4. Channel Key 복사 (channel-key-로 시작하는 UUID 형식)
- **주의**: 정기 결제를 지원하는 PG사 채널의 키를 사용해야 합니다

### 4. `PORTONE_V2_WEBHOOK_SECRET`
- **용도**: 포트원 V2 Webhook 검증 키
- **사용 위치**: 
  - 서버 사이드: `src/app/api/subscription-v2/webhook/route.ts`
  - Webhook 요청 검증 시 사용
- **확인 방법**: 
  1. [포트원 관리자 콘솔](https://admin.portone.io) 로그인
  2. V2 > Webhooks 메뉴
  3. Webhook Secret 복사
- **보안**: ⚠️ **절대 프론트엔드에 노출하지 마세요!** 서버 사이드에서만 사용

### 5. `CRON_SECRET` (선택사항)
- **용도**: 월 정기결제 자동 처리 API 보안 키
- **생성 방법**: 
  ```bash
  # 랜덤 문자열 생성 (32자리)
  openssl rand -hex 32
  ```
- **보안**: ⚠️ **절대 프론트엔드에 노출하지 마세요!**

## 포트원 V2 콘솔 설정 단계

### 1단계: 포트원 V2 활성화
1. [포트원 관리자 콘솔](https://admin.portone.io) 접속
2. V2 메뉴로 이동
3. V2 서비스 활성화 (필요한 경우)

### 2단계: Store 생성
1. V2 > Stores 메뉴
2. Store 생성 또는 기존 Store 선택
3. Store ID 복사

### 3단계: Channel 등록
1. V2 > Channels 메뉴
2. 정기 결제 지원 PG사 선택 (토스페이먼츠, KSNET 등)
3. Channel 생성
4. Channel Key 복사

### 4단계: API Secret 발급
1. V2 > API Keys 메뉴
2. API Secret 생성
3. API Secret 복사 (한 번만 표시되므로 안전하게 보관)

### 5단계: Webhook 설정
1. V2 > Webhooks 메뉴
2. Webhook URL 설정: `https://your-domain.com/api/subscription-v2/webhook`
3. Webhook Secret 생성 및 복사
4. 이벤트 선택: `Transaction.Paid`, `Transaction.Failed` 등

## V1 vs V2 차이점

### API 엔드포인트
- **V1**: `https://api.iamport.kr`
- **V2**: `https://api.portone.io`

### 인증 방식
- **V1**: REST API Key + Secret으로 Access Token 발급
- **V2**: API Secret 직접 사용 (Token 발급 불필요)

### SDK
- **V1**: `IMP.init()`, `IMP.request_pay()` (전역 객체)
- **V2**: `@portone/browser-sdk/v2`, `@portone/server-sdk` (npm 패키지)

### 빌링키 발급
- **V1**: `IMP.request_pay()`에 `customer_uid` 포함
- **V2**: `PortOne.loadIssueBillingKeyUI()` 사용

### 결제 요청
- **V1**: `/subscribe/payments/again` API
- **V2**: `/payments/{paymentId}/billing-key` API

## 패키지 설치

포트원 V2를 사용하기 위해 다음 패키지를 설치해야 합니다:

```bash
npm install @portone/server-sdk @portone/browser-sdk
```

## 환경 변수 설정 체크리스트

- [ ] `.env.local` 파일 생성
- [ ] `PORTONE_V2_API_SECRET` 설정
- [ ] `NEXT_PUBLIC_PORTONE_V2_STORE_ID` 설정
- [ ] `NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY` 설정
- [ ] `PORTONE_V2_WEBHOOK_SECRET` 설정
- [ ] `CRON_SECRET` 설정 (선택사항)
- [ ] 포트원 V2 콘솔에서 Store 생성 완료
- [ ] 포트원 V2 콘솔에서 Channel 등록 완료
- [ ] 포트원 V2 콘솔에서 Webhook 설정 완료
- [ ] `@portone/server-sdk` 및 `@portone/browser-sdk` 패키지 설치

## 보안 주의사항

1. **`.env.local` 파일은 절대 Git에 커밋하지 마세요!**
   - `.gitignore`에 `.env.local`이 포함되어 있는지 확인

2. **프로덕션 환경 변수 설정**
   - Vercel: 프로젝트 설정 > Environment Variables
   - 다른 플랫폼: 해당 플랫폼의 환경 변수 설정 메뉴 사용

3. **Secret 키 보안**
   - `PORTONE_V2_API_SECRET`와 `PORTONE_V2_WEBHOOK_SECRET`, `CRON_SECRET`는 서버 사이드에서만 사용
   - 프론트엔드 코드에 절대 포함하지 마세요

## 문제 해결

### 환경 변수가 적용되지 않는 경우
1. 서버 재시작 (Next.js 개발 서버)
2. `.env.local` 파일 위치 확인 (프로젝트 루트)
3. 변수명 오타 확인
4. `NEXT_PUBLIC_` 접두사 확인 (프론트엔드에서 사용하는 변수)

### 포트원 V2 API 호출 실패 시
1. API Secret 확인
2. 포트원 콘솔에서 API Secret 재발급 후 업데이트
3. Store ID와 Channel Key 확인
4. 네트워크 오류 확인

## 참고 자료

- [포트원 V2 관리자 콘솔](https://admin.portone.io/integration-v2)
- [포트원 V2 개발자 문서](https://developers.portone.io/opi/ko/integration/start/v2/readme)
- [포트원 V2 API 문서](https://developers.portone.io/api/rest-v2)
- [포트원 V2 빌링키 연동 가이드](https://developers.portone.io/opi/ko/integration/start/v2/billing/readme)

