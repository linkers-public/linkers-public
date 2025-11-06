# 웹훅 엔드포인트 가이드

포트원 정기 결제 시스템에서 사용하는 웹훅 엔드포인트 정보입니다.

## 📍 웹훅 엔드포인트

### 포트원 V2 (권장)

**로컬 개발 환경:**
```
http://localhost:3000/api/subscription-v2/webhook
```

**프로덕션 환경:**
```
https://your-domain.com/api/subscription-v2/webhook
```

**파일 위치:**
- `src/app/api/subscription-v2/webhook/route.ts`

**처리 이벤트:**
- `Transaction.Paid` - 결제 완료 시

**요청 메서드:**
- `POST`

**검증:**
- `PORTONE_V2_WEBHOOK_SECRET` 환경 변수로 검증
- Standard Webhooks 기반 검증 (2024-01-01 및 2024-04-25 버전 모두 지원)

**웹훅 버전:**
- 현재 사용 중: `2024-01-01`
- 지원 버전: `2024-01-01`, `2024-04-25` (Standard Webhooks 검증 방식 동일)

---

### 포트원 V1 (선택사항)

**로컬 개발 환경:**
```
http://localhost:3000/api/subscription/webhook
```

**프로덕션 환경:**
```
https://your-domain.com/api/subscription/webhook
```

**파일 위치:**
- `src/app/api/subscription/webhook/route.ts`

**처리 이벤트:**
- `payment.succeeded` - 결제 성공 시
- `payment.failed` - 결제 실패 시

**요청 메서드:**
- `POST`

---

## 🔧 포트원 콘솔 설정

### 포트원 V2 웹훅 설정

1. [포트원 관리자 콘솔](https://admin.portone.io) 접속
2. **V2** 메뉴로 이동
3. **Webhooks** 메뉴 선택
4. **Webhook 추가** 클릭
5. 다음 정보 입력:
   - **Webhook URL**: `https://your-domain.com/api/subscription-v2/webhook`
   - **이벤트 선택**: `Transaction.Paid` 체크
   - **Webhook Secret**: 생성 후 복사 (환경 변수에 설정)
6. **저장**

**환경 변수 설정:**
```env
PORTONE_V2_WEBHOOK_SECRET=your_webhook_secret_here
```

---

### 포트원 V1 웹훅 설정

1. [포트원 관리자 콘솔](https://admin.portone.io) 접속
2. **결제 연동** > **실 연동 관리** 메뉴
3. **결제알림(Webhook) 관리** 선택
4. **Webhook URL 추가** 클릭
5. 다음 정보 입력:
   - **Webhook URL**: `https://your-domain.com/api/subscription/webhook`
   - **이벤트 선택**: 
     - `payment.succeeded` (결제 성공)
     - `payment.failed` (결제 실패)
6. **저장**

---

## 🧪 로컬 개발 환경 테스트

로컬 개발 환경에서 웹훅을 테스트하려면 다음 도구를 사용할 수 있습니다:

### 1. ngrok 사용 (권장)

```bash
# ngrok 설치
npm install -g ngrok

# 로컬 서버 터널링
ngrok http 3000
```

ngrok이 제공하는 HTTPS URL을 포트원 콘솔에 등록:
```
https://your-ngrok-url.ngrok.io/api/subscription-v2/webhook
```

### 2. 포트원 테스트 도구

포트원 콘솔에서 테스트 모드로 웹훅을 테스트할 수 있습니다.

---

## 📝 웹훅 처리 흐름

### V2 웹훅 처리 흐름

```
1. 포트원 → POST /api/subscription-v2/webhook
2. Webhook 검증 (PORTONE_V2_WEBHOOK_SECRET)
3. Transaction.Paid 이벤트 확인
4. 결제 정보 조회 (getPayment)
5. 구독 정보 조회
6. 결제 내역 저장 (payments 테이블)
7. 첫 달 무료 처리 (필요 시)
8. 다음 달 결제 예약 (scheduleMonthlyPayment)
9. 구독 정보 업데이트
10. 성공 응답 반환
```

### V1 웹훅 처리 흐름

```
1. 포트원 → POST /api/subscription/webhook
2. imp_uid, merchant_uid 확인
3. 결제 정보 조회 (getPayment)
4. 구독 정보 조회
5. 결제 내역 저장 (payments 테이블)
6. 첫 달 무료 처리 (필요 시)
7. 다음 달 결제 예약 (scheduleMonthlyPayment)
8. 구독 정보 업데이트
9. 성공 응답 반환
```

---

## 🔒 보안

### 웹훅 검증

**V2:**
- `PORTONE_V2_WEBHOOK_SECRET`로 서명 검증
- `verifyWebhook()` 함수 사용

**V1:**
- 포트원에서 제공하는 검증 로직 사용
- `imp_uid`와 `merchant_uid`로 검증

### 보안 체크리스트

- [ ] Webhook Secret 환경 변수 설정
- [ ] HTTPS 사용 (프로덕션)
- [ ] Webhook URL이 공개적으로 접근 가능한지 확인
- [ ] 로그에 민감한 정보 노출하지 않기

---

## 🐛 문제 해결

### 웹훅이 수신되지 않는 경우

1. **URL 확인**
   - 포트원 콘솔에 등록된 URL 확인
   - 프로덕션 환경에서는 HTTPS 필수

2. **서버 로그 확인**
   ```bash
   # 개발 서버 로그 확인
   npm run dev
   ```

3. **Webhook Secret 확인**
   - 환경 변수 `PORTONE_V2_WEBHOOK_SECRET` 확인
   - 포트원 콘솔의 Webhook Secret과 일치하는지 확인

4. **네트워크 확인**
   - 방화벽 설정 확인
   - 포트 3000 (개발) 또는 443 (프로덕션) 열려있는지 확인

### 웹훅 검증 실패

1. **Webhook Secret 재생성**
   - 포트원 콘솔에서 Webhook Secret 재생성
   - 환경 변수 업데이트

2. **요청 본문 확인**
   - V2: 원본 문자열 그대로 전달 (JSON 파싱 전)
   - V1: JSON 형식으로 전달

---

## 📚 참고 자료

- [포트원 V2 웹훅 문서](https://developers.portone.io/opi/ko/integration/webhook/readme-v2)
- [포트원 V1 웹훅 문서](https://developers.portone.io/opi/ko/integration/webhook/readme)
- [ngrok 사용법](https://ngrok.com/docs)

---

## 💡 빠른 참조

### 프로덕션 웹훅 URL 예시

**Vercel 배포 시:**
```
https://your-project.vercel.app/api/subscription-v2/webhook
```

**커스텀 도메인 사용 시:**
```
https://your-domain.com/api/subscription-v2/webhook
```

### 환경 변수

```env
# V2 웹훅 Secret
PORTONE_V2_WEBHOOK_SECRET=your_webhook_secret_here
```

