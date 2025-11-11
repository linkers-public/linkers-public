# 기업/프리랜서 프로필 데이터 저장 구조 분석

## 📊 현재 저장 구조

### 1. accounts 테이블 (프리랜서/기업 공통)

**현재 컬럼 구조:**
```sql
accounts (
  profile_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_type ENUM NOT NULL,          -- 'FREELANCER' | 'COMPANY'
  
  -- 공통 필드
  username VARCHAR NOT NULL,
  bio TEXT NOT NULL,
  role ENUM NOT NULL,                  -- 'MAKER' | 'MANAGER' | 'NONE'
  is_active BOOLEAN NOT NULL,
  profile_created_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  profile_image_url TEXT,
  
  -- 연락처 정보 (공통)
  contact_phone VARCHAR,
  contact_email VARCHAR,
  contact_website TEXT,
  
  -- 프리랜서 전용 필드 (기업 프로필에는 불필요)
  main_job TEXT[],                     -- 프리랜서 전용 ⚠️
  expertise TEXT[],                     -- 프리랜서 전용 ⚠️
  badges JSONB,                         -- 프리랜서 전용 ⚠️
  availability_status VARCHAR          -- 프리랜서 전용 ⚠️
)
```

### 2. client 테이블 (기업 전용)

**현재 컬럼 구조:**
```sql
client (
  user_id UUID PRIMARY KEY,            -- accounts.user_id와 동일
  
  -- 기업 정보
  company_name VARCHAR,
  contact_person VARCHAR,               -- 담당자명
  contact_phone VARCHAR,                -- accounts.contact_phone과 중복 ⚠️
  email VARCHAR,                        -- accounts.contact_email과 중복 ⚠️
  address TEXT,
  website VARCHAR,                      -- accounts.contact_website과 중복 ⚠️
  
  -- 서비스 관련
  free_estimate_views_remaining INTEGER DEFAULT 3,
  client_status VARCHAR DEFAULT 'active',
  
  -- 타임스탬프
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

---

## 🔍 현재 저장 방식

### 프리랜서 프로필 (FREELANCER)

**저장 위치:**
- ✅ `accounts` 테이블에 `profile_type='FREELANCER'`로 저장
- ✅ 모든 필드 사용 (main_job, expertise, badges, availability_status 포함)

**저장 예시:**
```typescript
{
  profile_id: "uuid-123",
  user_id: "user-456",
  profile_type: "FREELANCER",
  username: "홍길동",
  bio: "풀스택 개발자",
  role: "MAKER",
  main_job: ["프론트엔드", "백엔드"],
  expertise: ["React", "Node.js"],
  badges: [{ type: "Senior Dev", verified: true }],
  availability_status: "available",
  contact_phone: "010-1234-5678",
  contact_email: "freelancer@example.com",
  contact_website: "https://portfolio.com"
}
```

### 기업 프로필 (COMPANY)

**저장 위치:**
- ✅ `accounts` 테이블에 `profile_type='COMPANY'`로 저장
- ⚠️ `client` 테이블에 기업 상세 정보 저장
- ⚠️ **문제:** accounts 테이블에 프리랜서 전용 필드도 저장됨 (불필요)

**저장 예시:**

**accounts 테이블:**
```typescript
{
  profile_id: "uuid-789",
  user_id: "user-456",
  profile_type: "COMPANY",
  username: "테크스타트업",
  bio: "AI 솔루션 개발 기업",
  role: "MANAGER",
  main_job: [],                        // ⚠️ 기업에는 불필요하지만 빈 배열로 저장
  expertise: [],                        // ⚠️ 기업에는 불필요하지만 빈 배열로 저장
  badges: [],                          // ⚠️ 기업에는 불필요하지만 빈 배열로 저장
  availability_status: "available",    // ⚠️ 기업에는 불필요
  contact_phone: "02-1234-5678",
  contact_email: "company@example.com",
  contact_website: "https://company.com"
}
```

**client 테이블:**
```typescript
{
  user_id: "user-456",
  company_name: "테크스타트업",
  contact_person: "김대표",
  contact_phone: "02-1234-5678",      // ⚠️ accounts.contact_phone과 중복
  email: "company@example.com",        // ⚠️ accounts.contact_email과 중복
  address: "서울시 강남구",
  website: "https://company.com",      // ⚠️ accounts.contact_website과 중복
  free_estimate_views_remaining: 3
}
```

---

## ⚠️ 현재 구조의 문제점

### 1. 데이터 중복

**문제:**
- `accounts.contact_phone` ↔ `client.contact_phone` 중복
- `accounts.contact_email` ↔ `client.email` 중복
- `accounts.contact_website` ↔ `client.website` 중복
- `accounts.username` ↔ `client.company_name` 중복 가능

**영향:**
- 데이터 불일치 가능성
- 업데이트 시 두 테이블 모두 수정 필요
- 유지보수 복잡도 증가

### 2. 불필요한 필드 저장

**문제:**
- 기업 프로필에도 프리랜서 전용 필드 저장:
  - `main_job: []` (빈 배열)
  - `expertise: []` (빈 배열)
  - `badges: []` (빈 배열)
  - `availability_status: "available"` (의미 없음)

**영향:**
- 저장 공간 낭비
- 데이터 의미 혼란
- 쿼리 시 불필요한 필드 포함

### 3. 테이블 분리로 인한 복잡성

**문제:**
- 기업 정보가 `accounts`와 `client` 두 테이블에 분산
- 조회 시 JOIN 필요
- 데이터 일관성 보장 어려움

**현재 코드 예시:**
```typescript
// 기업 정보 조회 시 두 테이블 모두 조회
const { data: clientData } = await supabase
  .from('client')
  .select('*')
  .eq('user_id', user.id)

const { data: accountData } = await supabase
  .from('accounts')
  .select('username, contact_phone, contact_website')
  .eq('profile_id', profile.profile_id)

// 두 테이블 데이터 병합
setCompanyInfo({
  company_name: clientData?.company_name || accountData?.username,
  contact_phone: clientData?.contact_phone || accountData?.contact_phone,
  website: clientData?.website || accountData?.contact_website,
  // ...
})
```

---

## 📋 프로필별 필요한 데이터

### 프리랜서 프로필 (FREELANCER)

**필요한 필드:**
- ✅ 기본 정보: username, bio, profile_image_url
- ✅ 전문 분야: main_job, expertise
- ✅ 경력 인증: badges
- ✅ 상태: availability_status
- ✅ 연락처: contact_phone, contact_email, contact_website
- ✅ 포트폴리오 (별도 테이블)

**불필요한 필드:**
- ❌ company_name, contact_person, address (기업 전용)

### 기업 프로필 (COMPANY)

**필요한 필드:**
- ✅ 기본 정보: username (회사명), bio (회사 소개)
- ✅ 기업 정보: company_name, contact_person, address
- ✅ 연락처: contact_phone, contact_email, website
- ✅ 서비스: free_estimate_views_remaining
- ✅ 프로필 이미지: profile_image_url

**불필요한 필드:**
- ❌ main_job, expertise, badges (프리랜서 전용)
- ❌ availability_status (프리랜서 전용)

---

## 💡 개선 방안

### 방안 1: JSONB 필드로 프로필별 데이터 분리 (권장)

**장점:**
- 단일 테이블로 관리
- 프로필 타입별로 필요한 데이터만 저장
- 확장성 좋음

**구조:**
```sql
ALTER TABLE accounts
ADD COLUMN profile_data JSONB;

-- 프리랜서 프로필
{
  "main_job": ["프론트엔드", "백엔드"],
  "expertise": ["React", "Node.js"],
  "badges": [...],
  "availability_status": "available"
}

-- 기업 프로필
{
  "company_name": "테크스타트업",
  "contact_person": "김대표",
  "address": "서울시 강남구",
  "free_estimate_views_remaining": 3
}
```

### 방안 2: client 테이블을 accounts에 통합

**장점:**
- 단일 테이블로 관리
- JOIN 불필요
- 데이터 일관성 보장

**구조:**
```sql
-- client 테이블의 컬럼을 accounts에 추가
ALTER TABLE accounts
ADD COLUMN company_name VARCHAR,
ADD COLUMN contact_person VARCHAR,
ADD COLUMN address TEXT,
ADD COLUMN free_estimate_views_remaining INTEGER;

-- client 테이블 제거 또는 보관
```

### 방안 3: 현재 구조 유지 + NULL 허용

**장점:**
- 기존 구조 유지
- 마이그레이션 최소화

**구조:**
- 프리랜서: main_job, expertise, badges 사용
- 기업: NULL 또는 빈 값 유지
- client 테이블은 기업 전용 정보만 저장

---

## 📊 현재 코드에서의 사용 패턴

### 프로필 생성 시

**OAuth 콜백 (`src/app/auth/callback/route.ts`):**
```typescript
await supabase.from('accounts').upsert({
  user_id: userId,
  username: userName,
  profile_type: profileType,
  bio: '',
  role: profileType === 'FREELANCER' ? 'MAKER' : 'MANAGER',
  main_job: [],              // ⚠️ 기업도 빈 배열로 저장
  expertise: [],             // ⚠️ 기업도 빈 배열로 저장
  badges: [],                // ⚠️ 기업도 빈 배열로 저장
  is_active: true,
  availability_status: 'available',  // ⚠️ 기업도 저장
})
```

**기업 가입 (`src/components/EnterpriseAuthForm.tsx`):**
```typescript
// accounts 테이블
await supabase.from('accounts').upsert({
  profile_type: 'COMPANY',
  main_job: [],              // ⚠️ 불필요
  expertise: [],             // ⚠️ 불필요
  badges: [],                // ⚠️ 불필요
  availability_status: 'available',  // ⚠️ 불필요
})

// client 테이블
await supabase.from('client').insert({
  company_name: formData.companyName,
  contact_phone: formData.phone,
  email: formData.email,
})
```

### 프로필 조회 시

**기업 정보 조회 (`src/app/(home)/my/company/info/CompanyInfoClient.tsx`):**
```typescript
// 두 테이블 모두 조회
const { data: clientData } = await supabase
  .from('client')
  .select('*')
  .eq('user_id', user.id)

const { data: accountData } = await supabase
  .from('accounts')
  .select('username, contact_phone, contact_website')
  .eq('profile_id', profile.profile_id)

// 데이터 병합 (중복 처리)
setCompanyInfo({
  company_name: clientData?.company_name || accountData?.username,
  contact_phone: clientData?.contact_phone || accountData?.contact_phone,
  website: clientData?.website || accountData?.contact_website,
})
```

---

## 🎯 권장 개선 사항

### 즉시 개선 (높은 우선순위)

1. **기업 프로필 생성 시 불필요한 필드 제거**
   - `main_job`, `expertise`, `badges`를 NULL로 저장
   - `availability_status`를 NULL로 저장

2. **데이터 중복 제거**
   - `client` 테이블을 단일 소스로 사용
   - `accounts` 테이블의 중복 필드 제거 또는 읽기 전용

### 단기 개선 (중간 우선순위)

3. **테이블 구조 정리**
   - `client` 테이블의 컬럼을 `accounts`에 통합 검토
   - 또는 JSONB 필드로 프로필별 데이터 분리

4. **코드 리팩토링**
   - 프로필 타입별 데이터 접근 로직 분리
   - 중복 제거 및 일관성 확보

---

## 📝 결론

**현재 상태:**
- ✅ 기본 구조는 작동함
- ⚠️ 데이터 중복 및 불필요한 필드 저장
- ⚠️ 테이블 분리로 인한 복잡성

**개선 필요:**
- 기업 프로필에 프리랜서 전용 필드 저장 중단
- `client`와 `accounts` 간 데이터 중복 제거
- 프로필 타입별 데이터 구조 명확화


