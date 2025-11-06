# 보안 및 일관성 개선 사항

## ✅ 완료된 개선 사항

### 1. accounts upsert의 onConflict 수정 ✅

**문제:**
- 기존: `onConflict: 'user_id'` - user_id만으로 충돌 처리
- 한 사용자가 FREELANCER와 COMPANY 프로필을 모두 가질 수 있는데, user_id만으로는 충돌 처리 불가

**해결:**
- `onConflict: 'user_id,profile_type'`로 변경
- UNIQUE 제약조건 `(user_id, profile_type)`에 맞춰 수정

**적용 위치:**
- `src/app/auth/callback/route.ts:68`
- `src/components/EnterpriseAuthForm.tsx:104`

**데이터베이스 마이그레이션:**
```sql
ALTER TABLE accounts
  ADD CONSTRAINT uq_accounts_user_type UNIQUE (user_id, profile_type);
```

**파일:** `database_migration_accounts_unique_constraint.sql`

---

### 2. profile_type 신뢰성 검증 (서버사이드) ✅

**문제:**
- 쿼리 파라미터는 클라이언트에서 조작 가능
- 악의적인 profile_type 값이 들어올 수 있음

**해결:**
- 서버사이드에서 화이트리스트 검증 강제
- 허용된 값만 처리: `FREELANCER`, `COMPANY`

**적용 위치:**
- `src/app/auth/callback/route.ts:11-16`

**코드:**
```typescript
const allowedProfileTypes = new Set(['FREELANCER', 'COMPANY'])
const profileTypeParam = searchParams.get('profile_type')
const profileType = profileTypeParam && allowedProfileTypes.has(profileTypeParam) 
  ? (profileTypeParam as ProfileType) 
  : null
```

---

### 3. OAuth 콜백의 next 파라미터 정규화 ✅

**문제:**
- 오픈 리다이렉트 취약점 가능성
- 외부 URL로 리다이렉트될 수 있음

**해결:**
- `/`로 시작하는 내부 경로만 허용
- `new URL()`을 사용하여 안전한 리다이렉트 보장

**적용 위치:**
- `src/app/auth/callback/route.ts:18-20, 95`

**코드:**
```typescript
const nextParam = searchParams.get('next') ?? '/'
const safeNext = nextParam.startsWith('/') ? nextParam : '/'
return NextResponse.redirect(new URL(safeNext, origin))
```

---

### 4. 기업 전용 가입 시 accounts 자동 생성 일관화 ✅

**문제:**
- 기업 가입 시 `client` 테이블에만 저장
- OAuth 가입과 일관성 부족

**해결:**
- `upsert`를 사용하여 OAuth 콜백과 동일한 로직 적용
- `onConflict: 'user_id,profile_type'` 적용

**적용 위치:**
- `src/components/EnterpriseAuthForm.tsx:87-106`

---

### 5. 프로필 자동 생성 후 온보딩 페이지로 리다이렉트 ✅

**문제:**
- 프로필이 자동 생성되지만 bio/main_job/expertise가 비어있음
- 사용자가 다음 단계를 모를 수 있음

**해결:**
- 프로필 생성 직후 온보딩 페이지(`/my/update?from=onboarding`)로 리다이렉트
- 프로필 완성 유도 메시지 표시

**적용 위치:**
- `src/app/auth/callback/route.ts:76`
- `src/app/(home)/my/update/ProfileUpdateClient.tsx:50-61`

---

## ⚠️ 추가 권장 사항

### 1. 세션 저장소 사용 정리

**현재 상태:**
- `sessionStorage.setItem('profileType')` 사용 중
- 클라이언트 전용이라 서버 콜백에 의존하지 않음

**권장:**
- URL 파라미터로 전달 (현재 구현됨 ✅)
- 또는 OAuth state 파라미터에 포함하여 검증

---

### 2. 이메일 회원가입 후 처리

**현재 상태:**
- `auth.signUp` 후 `client` 및 `accounts` 레코드 생성
- 이메일 확인이 필요한 경우 고아 데이터 가능성

**권장:**
- 이메일 확인 후 처리하거나
- 7~14일 후 미확인 사용자 데이터 정리 배치 작업

---

### 3. RLS/권한 정책 재확인

**필수 확인:**
- `accounts` 테이블: `auth.uid() = user_id`인 행만 접근 가능
- `client` 테이블: `auth.uid() = user_id`인 행만 접근 가능

**예시 RLS 정책:**
```sql
-- accounts 테이블
CREATE POLICY "own_rows_only" ON accounts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- client 테이블
CREATE POLICY "own_rows_only_client" ON client
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 🧪 테스트 체크리스트

### 보안 테스트
- [ ] 중복 클릭/이중 콜백: 콜백이 두 번 호출되어도 중복 레코드가 생기지 않는지
- [ ] 타입 스왑 시나리오: FREELANCER 생성 후 COMPANY 추가 생성이 정상 동작하는지
- [ ] 삭제/복구 플로우: deleted_at 활용 시, 동일 타입 재생성 로직과 충돌 없는지
- [ ] RLS 차단 확인: 다른 계정이 임의 user_id로 upsert 시도할 때 전부 거절되는지

### 기능 테스트
- [ ] Kakao/Google 혼합: 동일 user가 다른 OAuth provider로 재로그인해도 동일 user_id로 매핑되는지
- [ ] 프로필 타입 검증: 잘못된 profile_type 값이 들어올 때 무시되는지
- [ ] 오픈 리다이렉트 방지: 외부 URL로 리다이렉트 시도 시 차단되는지

---

## 📝 변경 사항 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| onConflict | `user_id` | `user_id,profile_type` |
| profile_type 검증 | 없음 | 화이트리스트 검증 |
| next 파라미터 | 문자열 연결 | `new URL()` 사용 |
| 기업 가입 프로필 | insert만 | upsert 사용 |
| 온보딩 리다이렉트 | 없음 | `/my/update?from=onboarding` |

---

## 🔗 관련 파일

- `src/app/auth/callback/route.ts` - OAuth 콜백 처리
- `src/components/EnterpriseAuthForm.tsx` - 기업 가입 폼
- `src/app/(home)/my/update/ProfileUpdateClient.tsx` - 프로필 수정 페이지
- `database_migration_accounts_unique_constraint.sql` - DB 마이그레이션

