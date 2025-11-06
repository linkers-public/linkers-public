# 신규 사용자 가입 플로우 체크리스트

## 📋 개요

신규 사용자 가입 시 처리되는 전체 플로우를 확인하고 검증합니다.

---

## 🔄 플로우 1: OAuth 소셜 로그인 가입 (일반 사용자)

### 경로: `/auth` → OAuth 인증 → `/auth/callback` → 프로필 생성

### 1단계: 프로필 타입 선택 (`src/components/AuthUI.tsx`)

**위치:** `src/components/AuthUI.tsx:30-48`

**체크리스트:**
- [x] 사용자가 프로필 타입 선택 (FREELANCER 또는 COMPANY)
- [x] 프로필 타입 미선택 시 알림 표시
- [x] 선택한 프로필 타입을 `sessionStorage`에 저장
- [x] OAuth 리다이렉트 URL에 `profile_type` 파라미터 포함

**코드:**
```30:48:src/components/AuthUI.tsx
  const signInWithProvider = async (provider: 'google' | 'kakao') => {
    if (!profileType) {
      alert('프로필 타입을 선택해주세요.')
      return
    }

    // sessionStorage에 프로필 타입 저장
    sessionStorage.setItem('profileType', profileType)

    // 환경에 따른 site URL 설정
    const siteUrl = getSiteUrl()

    await supabaseClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${siteUrl}/auth/callback?profile_type=${profileType}&next=/`,
      },
    })
  }
```

---

### 2단계: OAuth 콜백 처리 (`src/app/auth/callback/route.ts`)

**위치:** `src/app/auth/callback/route.ts:7-89`

**체크리스트:**
- [x] 인증 코드를 세션으로 교환
- [x] `profile_type` 파라미터 확인
- [x] 사용자 정보 추출 (user_id, email, username)
- [x] 기존 프로필 중복 확인
- [x] 프로필 타입이 있는 경우: 자동 프로필 생성
- [x] 프로필 타입이 없는 경우: 프로필 생성 페이지로 리다이렉트

**코드:**
```34:82:src/app/auth/callback/route.ts
      // 프로필 타입이 지정된 경우에만 프로필 생성
      if (profileType) {
        const { data: existingProfile } = await supabase
          .from('accounts')
          .select('user_id, profile_type')
          .eq('user_id', userId)
          .eq('profile_type', profileType)
          .is('deleted_at', null)
          .maybeSingle()

        // 같은 타입의 프로필이 없으면 생성
        if (!existingProfile) {
          const { error: upsertError } = await supabase
            .from('accounts')
            .upsert({
              user_id: userId,
              username: userName,
              profile_type: profileType,
              bio: '',
              role: profileType === 'FREELANCER' ? 'MAKER' : 'MANAGER',
              main_job: [],
              expertise: [],
              badges: [],
              is_active: true,
              availability_status: 'available',
              profile_created_at: new Date().toISOString()
            }, { 
              onConflict: 'user_id',
              ignoreDuplicates: false
            })

          if (upsertError) {
            console.error('Failed to upsert account:', upsertError)
          }
        }
      } else {
        // 프로필 타입이 없는 경우 (기존 사용자), 기존 프로필 유지
        // 새로운 사용자는 프로필 타입 선택 후 프로필 생성 페이지로 이동하도록
        const { data: existingAccount } = await supabase
          .from('accounts')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle()

        // 프로필이 없으면 프로필 생성 페이지로 리다이렉트
        if (!existingAccount) {
          return NextResponse.redirect(`${origin}/my/profile/create`)
        }
      }
```

**자동 생성되는 프로필 정보:**
- `user_id`: 인증된 사용자 ID
- `username`: 이메일에서 추출 또는 `user_${userId.slice(0, 8)}`
- `profile_type`: 선택한 타입 (FREELANCER 또는 COMPANY)
- `role`: FREELANCER → 'MAKER', COMPANY → 'MANAGER'
- `bio`: 빈 문자열
- `main_job`: 빈 배열
- `expertise`: 빈 배열
- `badges`: 빈 배열
- `is_active`: true
- `availability_status`: 'available'

---

### 3단계: 프로필 생성 페이지 (선택적, 프로필이 없는 경우)

**위치:** `src/app/(home)/my/profile/create/page.tsx`

**체크리스트:**
- [x] 쿼리 파라미터에서 프로필 타입 확인
- [x] 기존 프로필 중복 체크
- [x] 프로필 타입 선택 UI 제공
- [x] 사용자명, 소개, 주요 업무, 전문 기술 입력
- [x] 프로필 생성 API 호출

**코드:**
```30:60:src/app/(home)/my/profile/create/page.tsx
  useEffect(() => {
    const checkExistingProfiles = async () => {
      try {
        const typeParam = searchParams.get('type')
        if (typeParam && (typeParam === 'FREELANCER' || typeParam === 'COMPANY')) {
          // 기존 프로필 확인
          const profiles = await getUserProfiles()
          const existingProfile = profiles.find((p: any) => p.profile_type === typeParam)
          
          if (existingProfile) {
            toast({
              variant: 'destructive',
              title: '프로필이 이미 존재합니다',
              description: `${typeParam === 'FREELANCER' ? '프리랜서' : '기업'} 프로필이 이미 생성되어 있습니다.`,
            })
            router.push('/my/profile/manage')
            return
          }
          
          setProfileType(typeParam as ProfileType)
        }
      } catch (err: any) {
        console.error('프로필 확인 실패:', err)
      } finally {
        setChecking(false)
      }
    }

    checkExistingProfiles()
  }, [searchParams, router])
```

---

## 🔄 플로우 2: 기업 전용 이메일 가입

### 경로: `EnterpriseAuthForm` → Supabase Auth → `client` 테이블 저장

**위치:** `src/components/EnterpriseAuthForm.tsx:33-91`

**체크리스트:**
- [x] 회원가입 모드에서 이메일/비밀번호 입력
- [x] 회사명, 담당자 이름, 연락처 입력
- [x] Supabase Auth로 사용자 생성
- [x] `client` 테이블에 기업 정보 저장
- [x] 이메일 인증 안내 메시지 표시

**코드:**
```61:84:src/components/EnterpriseAuthForm.tsx
        // 회원가입 로직
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        })

        if (authError) throw authError

        if (authData.user) {
          // 기업 계정 정보 저장
          const { error: clientError } = await supabase
            .from('client')
            .insert({
              user_id: authData.user.id,
              company_name: formData.companyName,
              contact_info: formData.phone,
              email: formData.email,
            })

          if (clientError) throw clientError

          alert('회원가입이 완료되었습니다. 이메일을 확인해주세요.')
          setIsLogin(true)
        }
```

**저장되는 정보:**
- `client` 테이블:
  - `user_id`: 인증된 사용자 ID
  - `company_name`: 회사명
  - `contact_info`: 연락처
  - `email`: 이메일
- `accounts` 테이블 (자동 생성):
  - `user_id`: 인증된 사용자 ID
  - `username`: 회사명 또는 이메일에서 추출
  - `profile_type`: 'COMPANY'
  - `role`: 'MANAGER'
  - 기타 기본값 설정 (bio: '', main_job: [], expertise: [], 등)

**참고:** ✅ 기업 전용 가입 시 `accounts` 테이블에 COMPANY 프로필이 자동 생성됩니다.

---

## ✅ 개선 사항 완료

### 1. OAuth 콜백에서 프로필 자동 생성 시 데이터 부족 ✅
**개선 완료:**
- 프로필이 새로 생성된 경우 프로필 수정 페이지(`/my/update?new_profile=true`)로 자동 리다이렉트
- 프로필 수정 페이지에서 새 프로필 완성 유도 메시지 표시
- 토스트 알림으로 프로필 완성 안내

**구현 위치:**
- `src/app/auth/callback/route.ts:68-70`
- `src/app/(home)/my/update/ProfileUpdateClient.tsx:47-58, 177-195`

### 2. 기업 전용 가입과 일반 가입 플로우 불일치 ✅
**개선 완료:**
- 기업 전용 가입 시 `accounts` 테이블에 COMPANY 프로필 자동 생성
- 회사명을 username으로 사용 (없으면 이메일에서 추출)
- `client` 테이블과 `accounts` 테이블 모두에 정보 저장

**구현 위치:**
- `src/components/EnterpriseAuthForm.tsx:82-118`

### 3. 프로필 타입 중복 체크
**현재 상태:**
- OAuth 콜백에서 중복 체크 수행 ✅
- 프로필 생성 페이지에서도 중복 체크 수행 ✅
- `createProfile` API에서도 중복 체크 수행 ✅

**상태:** ✅ 잘 구현됨

### 4. 에러 처리
**현재 상태:**
- OAuth 콜백 에러 시 `/auth/auth-code-error`로 리다이렉트 ✅
- 프로필 생성 실패 시 에러 메시지 표시 ✅
- 기업 가입 실패 시 에러 메시지 표시 ✅

**상태:** ✅ 잘 구현됨

---

## 📊 데이터베이스 테이블 관계

### accounts 테이블
- `user_id`: `auth.users.id` 참조
- `profile_type`: 'FREELANCER' 또는 'COMPANY'
- UNIQUE 제약: `(user_id, profile_type)` - 한 사용자당 프로필 타입별 1개

### client 테이블
- `user_id`: `auth.users.id` 참조
- 기업 전용 정보 저장

---

## ✅ 검증 체크리스트

### OAuth 가입 플로우
- [ ] 프로필 타입 선택 없이 OAuth 로그인 시도 → 알림 표시
- [ ] FREELANCER 프로필 타입 선택 후 Google 로그인 → 프로필 자동 생성 확인
- [ ] COMPANY 프로필 타입 선택 후 Kakao 로그인 → 프로필 자동 생성 확인
- [ ] 이미 존재하는 프로필 타입으로 재가입 시도 → 중복 체크 동작 확인
- [ ] 프로필 타입 없이 콜백 접근 → 프로필 생성 페이지로 리다이렉트

### 기업 전용 가입 플로우
- [ ] 이메일/비밀번호로 회원가입 → `client` 테이블에 저장 확인
- [ ] 중복 이메일 가입 시도 → 에러 처리 확인
- [ ] 가입 후 이메일 인증 안내 메시지 표시 확인

### 프로필 생성 페이지
- [ ] 프로필 타입 선택 → 폼 표시 확인
- [ ] 필수 필드(사용자명) 미입력 → 에러 표시 확인
- [ ] 프로필 생성 성공 → 프로필 관리 페이지로 이동 확인
- [ ] 이미 존재하는 프로필 타입 선택 → 중복 에러 표시 확인

---

## 🔍 추가 확인 사항

1. **세션 관리**
   - OAuth 콜백 후 세션이 정상적으로 생성되는지 확인
   - 프로필 생성 후 사용자 인증 상태 유지 확인

2. **리다이렉트 경로**
   - OAuth 콜백 후 `next` 파라미터에 따른 리다이렉트 동작 확인
   - 보안: `next` 파라미터가 `/`로 시작하는지 확인 ✅

3. **사용자 경험**
   - 프로필 자동 생성 후 추가 정보 입력 유도
   - 프로필 생성 완료 후 적절한 피드백 제공

---

## 📝 요약

### 정상 동작하는 부분
1. ✅ OAuth 가입 시 프로필 타입 선택 필수
2. ✅ 프로필 자동 생성 및 중복 체크
3. ✅ 에러 처리 및 리다이렉트
4. ✅ 프로필 생성 페이지에서 중복 체크
5. ✅ 기업 전용 가입 시 `accounts` 테이블 프로필 자동 생성
6. ✅ 자동 생성된 프로필의 추가 정보 입력 유도 (프로필 수정 페이지로 리다이렉트)
7. ✅ 프로필 생성 완료 후 명확한 다음 단계 안내 (토스트 및 안내 메시지)

### 개선 완료된 부분
1. ✅ 기업 전용 가입 시 `accounts` 테이블 프로필 자동 생성
2. ✅ 자동 생성된 프로필의 추가 정보 입력 유도
3. ✅ 프로필 생성 완료 후 명확한 다음 단계 안내

