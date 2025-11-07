# 인증 플로우 및 테이블 구조 검토

## 📋 현재 플로우 분석

### 1. OAuth 로그인 플로우 (`/auth`)

**현재 동작:**
- ✅ 프로필 타입 선택이 **필수**입니다
- ❌ 프로필 타입을 선택하지 않으면 로그인 불가 (alert 표시)
- ❌ 기존 사용자도 매번 프로필 타입을 선택해야 함

**코드 위치:** `src/components/AuthUI.tsx:30-48`

```typescript
const signInWithProvider = async (provider: 'google' | 'kakao') => {
  if (!profileType) {
    alert('프로필 타입을 선택해주세요.')
    return  // 로그인 차단
  }
  // ...
}
```

---

### 2. OAuth 콜백 처리 (`/auth/callback`)

**현재 동작:**
- `profile_type` 파라미터가 **있는 경우**:
  - 해당 타입의 프로필이 이미 있으면 → 그대로 진행
  - 해당 타입의 프로필이 없으면 → 자동 생성 후 `/my/update?from=onboarding`로 리다이렉트

- `profile_type` 파라미터가 **없는 경우**:
  - 기존 프로필이 있으면 → 그대로 진행
  - 기존 프로필이 없으면 → `/my/profile/create`로 리다이렉트

**코드 위치:** `src/app/auth/callback/route.ts:40-92`

---

## ⚠️ 문제점 분석

### 문제 1: 기존 사용자 재로그인 시 불편함

**현재 상황:**
- 기존 사용자가 다시 로그인할 때도 프로필 타입을 선택해야 함
- 이미 프로필이 있는 사용자에게는 불필요한 단계

**영향:**
- 사용자 경험 저하
- 불필요한 선택 단계

---

### 문제 2: 테이블 제약조건 검토 필요

#### accounts 테이블 구조

**현재 제약조건:**
```sql
-- UNIQUE 제약조건
ALTER TABLE accounts
  ADD CONSTRAINT uq_accounts_user_type UNIQUE (user_id, profile_type);
```

**문제점:**
1. **`profile_type`이 NULL 허용**
   - TypeScript 타입: `profile_type: Database["public"]["Enums"]["profile_type"] | null`
   - PostgreSQL에서 UNIQUE 제약조건은 NULL 값을 여러 개 허용합니다
   - 즉, 같은 `user_id`에 대해 `profile_type = NULL`인 레코드가 여러 개 생성될 수 있음

2. **UNIQUE 제약조건의 NULL 처리**
   - PostgreSQL 표준: NULL 값은 UNIQUE 제약조건에서 서로 다른 값으로 간주
   - 예: `(user_id='123', profile_type=NULL)` 레코드가 여러 개 가능

**잠재적 문제:**
- `profile_type`이 NULL인 레코드가 여러 개 생성될 수 있음
- 활성 프로필 선택 시 문제 발생 가능

---

## 🔍 테이블 구조 상세 검토

### accounts 테이블

**컬럼:**
- `user_id` (UUID, NOT NULL)
- `profile_type` (ENUM, **NULL 허용**)
- `is_active` (BOOLEAN, DEFAULT true)
- `profile_id` (UUID, PK)

**제약조건:**
1. **UNIQUE 제약조건:**
   ```sql
   ALTER TABLE accounts
     ADD CONSTRAINT uq_accounts_user_type UNIQUE (user_id, profile_type);
   ```
   - PostgreSQL 표준: NULL 값은 UNIQUE 제약조건에서 서로 다른 값으로 간주
   - 즉, `profile_type = NULL`인 레코드가 여러 개 생성될 수 있음

2. **부분 UNIQUE 인덱스 (이미 존재):**
   ```sql
   CREATE UNIQUE INDEX idx_accounts_user_profile_type 
   ON accounts(user_id, profile_type) 
   WHERE profile_type IS NOT NULL AND deleted_at IS NULL;
   ```
   - `profile_type`이 NULL이 아닌 경우에만 UNIQUE 제약조건 적용
   - `profile_type = NULL`인 레코드는 여러 개 가능

**현재 데이터 상태 확인 필요:**
```sql
-- profile_type이 NULL인 레코드 확인
SELECT user_id, COUNT(*) 
FROM accounts 
WHERE profile_type IS NULL 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- profile_type이 NULL이고 is_active가 true인 레코드 확인
SELECT * 
FROM accounts 
WHERE profile_type IS NULL AND is_active = true;
```

---

## 💡 개선 방안

### 방안 1: 기존 사용자 재로그인 최적화

**제안:**
1. OAuth 로그인 시 기존 프로필 확인
2. 기존 프로필이 있으면 프로필 타입 선택 생략
3. 기존 프로필이 없으면 프로필 타입 선택 필수

**구현 방법:**
```typescript
// AuthUI.tsx 수정
const signInWithProvider = async (provider: 'google' | 'kakao') => {
  // 기존 사용자 확인
  const { data: { user } } = await supabaseClient.auth.getUser()
  
  if (user) {
    // 기존 프로필 확인
    const { data: existingProfiles } = await supabaseClient
      .from('accounts')
      .select('profile_type')
      .eq('user_id', user.id)
      .is('deleted_at', null)
    
    // 기존 프로필이 있으면 프로필 타입 선택 생략
    if (existingProfiles && existingProfiles.length > 0) {
      // 프로필 타입 없이 로그인 진행
      await supabaseClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${siteUrl}/auth/callback?next=/`,
        },
      })
      return
    }
  }
  
  // 신규 사용자 또는 프로필이 없는 경우
  if (!profileType) {
    alert('프로필 타입을 선택해주세요.')
    return
  }
  
  // 기존 로직...
}
```

---

### 방안 2: 테이블 제약조건 강화

**제안:**
1. `profile_type`을 NOT NULL로 변경 (권장)
2. 또는 부분 UNIQUE 인덱스 사용

**옵션 A: profile_type을 NOT NULL로 변경 (권장)**
```sql
-- 1. 기존 NULL 값 처리 (기본값으로 'FREELANCER' 설정)
UPDATE accounts 
SET profile_type = 'FREELANCER' 
WHERE profile_type IS NULL;

-- 2. NOT NULL 제약조건 추가
ALTER TABLE accounts 
  ALTER COLUMN profile_type SET NOT NULL;

-- 3. 기존 UNIQUE 제약조건이 제대로 작동하도록 확인
-- (이미 부분 UNIQUE 인덱스가 있으므로 추가 작업 불필요)
```

**옵션 B: 현재 상태 유지 (부분 UNIQUE 인덱스 활용)**
- 현재 부분 UNIQUE 인덱스가 이미 존재하므로 추가 작업 불필요
- 하지만 `profile_type = NULL`인 레코드가 생성될 수 있는 위험은 여전히 존재
- 코드에서 `profile_type`을 항상 설정하도록 보장해야 함

---

## ✅ 권장 사항

### 우선순위 1: 테이블 제약조건 수정 (필수)

1. **`profile_type`을 NOT NULL로 변경**
   - 데이터 무결성 보장
   - UNIQUE 제약조건이 제대로 작동
   - 모든 프로필이 명확한 타입을 가짐

2. **기존 NULL 데이터 마이그레이션**
   - 기존 `profile_type = NULL` 레코드 처리
   - 기본값으로 'FREELANCER' 또는 사용자에게 선택하게 하기

### 우선순위 2: 로그인 플로우 개선 (UX)

1. **기존 사용자 재로그인 최적화**
   - 기존 프로필이 있으면 프로필 타입 선택 생략
   - 신규 사용자만 프로필 타입 선택

2. **프로필 타입 선택을 선택사항으로 변경**
   - 기존 사용자는 선택 생략 가능
   - 신규 사용자는 선택 필수

---

## 📊 현재 상태 요약

| 항목 | 현재 상태 | 문제점 |
|------|----------|--------|
| OAuth 로그인 | 프로필 타입 선택 필수 | 기존 사용자도 매번 선택해야 함 |
| 콜백 처리 | profile_type 파라미터 기반 | 정상 작동 |
| accounts.profile_type | NULL 허용 | NULL 레코드가 여러 개 생성될 수 있음 |
| UNIQUE 제약조건 | (user_id, profile_type) | profile_type이 NULL이면 제약조건 무효 |
| 부분 UNIQUE 인덱스 | ✅ 존재 (profile_type IS NOT NULL) | NULL 값은 제약조건 미적용 |

---

## 🔧 다음 단계

1. **데이터베이스 확인** ✅ 완료
   - `profile_type = NULL`인 레코드 수 확인: 0개
   - 중복 레코드 확인: 없음

2. **마이그레이션 실행** ✅ 완료
   - `database_migration_profile_type_not_null.sql` 실행 완료
   - NOT NULL 제약조건 추가 완료
   - profile_type이 이제 NOT NULL로 설정됨

3. **코드 수정** ✅ 완료
   - 로그인 플로우 개선 ✅
   - 기존 사용자 재로그인 최적화 ✅

---

## ✅ 완료된 작업

### 1. 로그인 플로우 개선 ✅

**변경 사항:**
- 기존 프로필이 있는 사용자는 프로필 타입 선택 생략 가능
- 신규 사용자는 프로필 타입 선택 필수
- 기존 프로필 확인 로직 추가

**구현 위치:**
- `src/components/AuthUI.tsx`

**주요 변경:**
- `useEffect`로 기존 프로필 확인
- `hasExistingProfile` 상태 추가
- 프로필 타입 선택을 조건부로 처리

### 2. 마이그레이션 스크립트 작성 ✅

**파일:**
- `database_migration_profile_type_not_null.sql`

**내용:**
- NULL 값 처리 (기본값 'FREELANCER'로 설정)
- NOT NULL 제약조건 추가
- 제약조건 및 인덱스 확인 쿼리 포함

**주의사항:**
- 실제 데이터 확인 후 마이그레이션 실행 필요
- NULL 값이 있는 경우 적절한 값으로 변경 필요

### 3. 마이그레이션 실행 완료 ✅

**실행 결과:**
- ✅ `profile_type`이 NULL인 레코드: 0개 (이미 정상 상태)
- ✅ NOT NULL 제약조건 추가 완료
- ✅ `is_nullable`: "NO" (NOT NULL 확인됨)
- ✅ UNIQUE 인덱스 정상 작동 확인

**확인된 제약조건:**
- `idx_accounts_user_profile_type`: UNIQUE 인덱스 (user_id, profile_type)
- `ux_accounts_user_profile_type`: UNIQUE 인덱스 (user_id, profile_type)

**마이그레이션 이름:**
- `add_profile_type_not_null_constraint`

**결과:**
- 이제 `profile_type`이 NULL인 레코드는 생성될 수 없음
- 데이터 무결성 보장됨

