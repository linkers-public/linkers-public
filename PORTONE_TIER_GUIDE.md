# 포트원 하위 상점(Tier) 조회 가이드

## 개요

포트원에서 하위 상점(Tier)은 대표 상점 하위에 생성되는 상점으로, 여러 지점이나 서비스를 분리하여 관리할 때 사용합니다.

## 하위 상점이란?

- **대표 상점**: 포트원 회원가입 시 자동으로 생성되는 메인 상점
- **하위 상점**: 대표 상점 하위에 생성되는 추가 상점
- **Tier Code**: 하위 상점을 구분하는 3자리 고유 코드 (알파벳 대문자 또는 숫자)

## 하위 상점 조회 방법

### 1. 포트원 API를 통한 조회

#### 개별 하위 상점 조회

```typescript
import { getTier } from '@/apis/subscription.service'

// Tier Code로 하위 상점 정보 조회
const tierInfo = await getTier('001')
// 결과: { tier_code: '001', tier_name: '강남 지점' }
```

#### API 엔드포인트 사용

```typescript
// GET /api/portone/tiers?tier_code=001
const response = await fetch('/api/portone/tiers?tier_code=001')
const data = await response.json()
```

### 2. 포트원 콘솔에서 조회

1. 포트원 관리자 콘솔 로그인
2. **설정 > 하위 상점 관리** 메뉴 접속
3. 등록된 하위 상점 목록 확인

### 3. 포트원 MCP 도구 사용

포트원 MCP 서버를 통해 하위 상점 목록을 조회할 수 있습니다:

```typescript
// MCP 도구 사용 (로그인 필요)
// listStores() 함수 호출
```

## 하위 상점 사용 방법

### JavaScript SDK에서 사용

```javascript
// 대표 상점 결제
IMP.init('imp12345678')

// 하위 상점 결제
IMP.agency('imp12345678', '001') // Tier Code: 001
```

### REST API에서 사용

REST API 호출 시 Header에 Tier 정보를 포함해야 합니다:

```typescript
const response = await fetch('https://api.iamport.kr/payments/prepare', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Tier': '001' // 하위 상점 Tier Code
  },
  body: JSON.stringify({
    // 결제 정보
  })
})
```

## 구현된 기능

### 1. 하위 상점 조회 서비스

`src/apis/subscription.service.ts`에 다음 함수가 추가되었습니다:

```typescript
// 하위 상점 정보 조회
export async function getTier(tierCode: string): Promise<TierInfo>
```

### 2. API 엔드포인트

`src/app/api/portone/tiers/route.ts`:
- `GET /api/portone/tiers?tier_code=001`: 하위 상점 정보 조회

## 사용 예시

### 프론트엔드에서 사용

```typescript
// 하위 상점 정보 조회
const fetchTierInfo = async (tierCode: string) => {
  try {
    const response = await fetch(`/api/portone/tiers?tier_code=${tierCode}`)
    const data = await response.json()
    
    if (data.success) {
      console.log('하위 상점 정보:', data.tier)
      // { tier_code: '001', tier_name: '강남 지점' }
    }
  } catch (error) {
    console.error('하위 상점 조회 실패:', error)
  }
}
```

### 서버 사이드에서 사용

```typescript
import { getTier } from '@/apis/subscription.service'

// API Route에서 사용
export async function GET(request: NextRequest) {
  const tierCode = '001'
  const tierInfo = await getTier(tierCode)
  return NextResponse.json({ tier: tierInfo })
}
```

## 주의사항

1. **Tier Code 형식**: 알파벳 대문자 또는 숫자만 사용 가능, 반드시 3자리
2. **권한**: 하위 상점 조회는 포트원 API 인증이 필요합니다
3. **목록 조회**: 포트원 V1 API에는 하위 상점 목록 조회 API가 없을 수 있으므로, 포트원 콘솔에서 확인하세요

## 관련 문서

- [포트원 하위 상점 관리 가이드](https://developers.portone.io/opi/ko/support/agency-and-tier)
- [포트원 API 문서 - Tiers](https://developers.portone.io/api/rest-v1)

