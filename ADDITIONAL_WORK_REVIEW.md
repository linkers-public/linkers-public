# 추가 작업 검토 결과

## ✅ 완료된 작업

1. **accounts 테이블 생성** ✅
   - 모든 필수 컬럼 포함
   - 기본값 설정 완료

2. **UNIQUE 제약조건 추가** ✅
   - `uq_accounts_user_type`: `(user_id, profile_type)`
   - 제약조건 정상 작동 확인

3. **ENUM 타입 생성** ✅
   - `profile_type`: 'FREELANCER', 'COMPANY' (대문자)
   - `user_role`: 'MAKER', 'MANAGER', 'NONE'
   - 코드와 일치 ✅

4. **인덱스 생성** ✅
   - `user_id`, `profile_type`, `(user_id, profile_type)` 조합 인덱스
   - `deleted_at` 부분 인덱스

---

## ⚠️ 추가 작업 필요

### 1. accounts 테이블 RLS 활성화 및 정책 추가 (보안 필수)

**현재 상태:**
- ❌ RLS가 비활성화되어 있음
- ❌ 보안 어드바이저에서 ERROR 레벨로 표시됨

**필요 작업:**
```sql
-- RLS 활성화
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- RLS 정책 추가
-- 사용자는 자신의 프로필만 조회 가능
CREATE POLICY "Users can view their own profiles" ON accounts
  FOR SELECT USING (auth.uid()::text = user_id);

-- 사용자는 자신의 프로필만 생성 가능
CREATE POLICY "Users can insert their own profiles" ON accounts
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can update their own profiles" ON accounts
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- 사용자는 자신의 프로필만 삭제 가능 (soft delete)
CREATE POLICY "Users can delete their own profiles" ON accounts
  FOR DELETE USING (auth.uid()::text = user_id);
```

**우선순위:** 🔴 높음 (보안 필수)

---

### 2. client 테이블 생성 (기업 가입 기능 필요)

**현재 상태:**
- ❌ `client` 테이블이 존재하지 않음
- ❌ `EnterpriseAuthForm`에서 사용 중

**필요 작업:**
```sql
-- client 테이블 생성
CREATE TABLE IF NOT EXISTS client (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL UNIQUE,
  company_name VARCHAR NOT NULL,
  contact_info VARCHAR,
  email VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_client_user_id ON client(user_id);

-- RLS 활성화 및 정책 추가
ALTER TABLE client ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own client data" ON client
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own client data" ON client
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own client data" ON client
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
```

**우선순위:** 🔴 높음 (기능 필수)

---

### 3. updated_at 자동 업데이트 트리거

**현재 상태:**
- ⚠️ `updated_at` 컬럼이 있지만 자동 업데이트 트리거 없음

**필요 작업:**
```sql
-- 트리거 함수 (이미 존재할 수 있음)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- accounts 테이블에 트리거 적용
CREATE TRIGGER update_accounts_updated_at 
  BEFORE UPDATE ON accounts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- client 테이블에 트리거 적용 (생성 후)
CREATE TRIGGER update_client_updated_at 
  BEFORE UPDATE ON client 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**우선순위:** 🟡 중간 (편의성)

---

### 4. profile_id 자동 생성 확인

**현재 상태:**
- ✅ `profile_id`는 UUID로 자동 생성됨 (DEFAULT gen_random_uuid())
- ⚠️ 코드에서 `profile_id`를 사용하는지 확인 필요

**확인 필요:**
- 코드에서 `profile_id`를 직접 참조하는 부분이 있는지
- `user_id`와 `profile_type` 조합으로만 조회하는지

**우선순위:** 🟢 낮음 (확인만 필요)

---

## 📊 현재 데이터베이스 상태

### accounts 테이블
- ✅ 테이블 생성 완료
- ✅ UNIQUE 제약조건 추가 완료
- ❌ RLS 비활성화 (보안 이슈)
- ⚠️ updated_at 자동 업데이트 트리거 없음

### client 테이블
- ❌ 테이블 미존재 (생성 필요)

### ENUM 타입
- ✅ profile_type: 'FREELANCER', 'COMPANY'
- ✅ user_role: 'MAKER', 'MANAGER', 'NONE'

---

## 🎯 권장 작업 순서

1. **client 테이블 생성** (기능 필수)
2. **accounts RLS 활성화 및 정책 추가** (보안 필수)
3. **client RLS 활성화 및 정책 추가** (보안 필수)
4. **updated_at 자동 업데이트 트리거 추가** (편의성)

---

## 🔍 추가 확인 사항

1. **코드 호환성**
   - ✅ ENUM 값이 코드와 일치 (대문자)
   - ✅ UNIQUE 제약조건이 코드의 onConflict와 일치
   - ⚠️ client 테이블이 없어서 기업 가입 기능이 작동하지 않을 수 있음

2. **보안 어드바이저**
   - ❌ accounts 테이블 RLS 비활성화 (ERROR)
   - ⚠️ 다른 테이블들도 RLS 비활성화 상태 (별도 작업 필요)

3. **테스트 필요**
   - [ ] OAuth 가입 플로우 테스트
   - [ ] 기업 가입 플로우 테스트 (client 테이블 생성 후)
   - [ ] RLS 정책 테스트 (RLS 활성화 후)
   - [ ] 중복 프로필 생성 방지 테스트

