# 데이터베이스 마이그레이션 실행 가이드

## 방법 1: Supabase 대시보드에서 실행 (추천)

### 단계별 가이드

1. **Supabase 프로젝트 대시보드 접속**
   - https://supabase.com/dashboard 접속
   - 해당 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 **SQL Editor** 클릭
   - **New query** 버튼 클릭

3. **SQL 파일 복사 & 붙여넣기**
   - `database_profile_refactor.sql` 파일의 전체 내용을 복사
   - SQL Editor에 붙여넣기

4. **실행**
   - 우측 상단의 **Run** 버튼 클릭 (또는 Ctrl/Cmd + Enter)

5. **결과 확인**
   - 성공 메시지 확인
   - 에러가 발생하면 에러 메시지 확인 후 리포트

---

## 방법 2: Supabase CLI 사용

### 전제 조건
- Supabase 프로젝트가 로컬에 연결되어 있어야 함
- `.env` 파일에 `SUPABASE_DB_PASSWORD` 등 설정 필요

### 실행 명령어

```bash
# Supabase 프로젝트 연결 (처음 한 번만)
npx supabase link --project-ref <your-project-ref>

# SQL 파일 실행
npx supabase db execute --file database_profile_refactor.sql
```

또는

```bash
# psql 직접 사용 (Supabase 연결 문자열 필요)
psql <your-connection-string> -f database_profile_refactor.sql
```

---

## 마이그레이션 후 확인 사항

### 1. 테이블 생성 확인
```sql
-- 프로젝트 멤버 테이블 확인
SELECT * FROM project_members LIMIT 1;

-- 경력 인증 요청 테이블 확인
SELECT * FROM career_verification_requests LIMIT 1;
```

### 2. ENUM 타입 확인
```sql
-- ENUM 타입 확인
SELECT typname FROM pg_type WHERE typtype = 'e' AND typname IN ('profile_type', 'project_role', 'project_member_status', 'verification_status');
```

### 3. accounts 테이블 컬럼 확인
```sql
-- 새로운 컬럼 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'accounts' 
AND column_name IN ('profile_type', 'badges', 'is_active', 'profile_created_at');
```

### 4. 인덱스 확인
```sql
-- 인덱스 확인
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('project_members', 'career_verification_requests');
```

### 5. 트리거 확인
```sql
-- 트리거 확인
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('project_members', 'career_verification_requests');
```

### 6. 뷰 확인
```sql
-- 뷰 확인
SELECT table_name 
FROM information_schema.views 
WHERE table_name IN ('project_members_with_details', 'career_verification_with_details');
```

---

## 마이그레이션 롤백 (필요시)

마이그레이션을 롤백해야 하는 경우:

```sql
-- 테이블 삭제
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS career_verification_requests CASCADE;

-- 뷰 삭제
DROP VIEW IF EXISTS project_members_with_details;
DROP VIEW IF EXISTS career_verification_with_details;

-- 함수 삭제
DROP FUNCTION IF EXISTS get_user_profiles(VARCHAR);
DROP FUNCTION IF EXISTS get_project_members(INTEGER);
DROP FUNCTION IF EXISTS approve_career_verification();

-- ENUM 타입 삭제 (주의: 다른 테이블에서 사용 중이면 실패)
DROP TYPE IF EXISTS profile_type CASCADE;
DROP TYPE IF EXISTS project_role CASCADE;
DROP TYPE IF EXISTS project_member_status CASCADE;
DROP TYPE IF EXISTS verification_status CASCADE;

-- 컬럼 삭제 (accounts 테이블)
ALTER TABLE accounts 
DROP COLUMN IF EXISTS profile_type,
DROP COLUMN IF EXISTS badges,
DROP COLUMN IF EXISTS is_active,
DROP COLUMN IF EXISTS profile_created_at;

-- 인덱스 삭제
DROP INDEX IF EXISTS idx_accounts_user_profile_type;
```

---

## 주의사항

1. **백업 필수**: 프로덕션 환경에서는 반드시 데이터베이스 백업 후 실행
2. **테스트 환경에서 먼저 실행**: 프로덕션 전 테스트 환경에서 검증
3. **기존 데이터 영향**: `accounts` 테이블에 기존 데이터가 있으면 `profile_type`이 자동으로 설정됨
4. **RLS 정책**: 새로운 테이블에 RLS가 활성화되어 있으니 권한 확인 필요

---

## 문제 해결

### 에러: "type already exists"
- ENUM 타입이 이미 존재하는 경우, `CREATE TYPE IF NOT EXISTS` 사용 불가
- 수동으로 확인 후 필요한 경우만 생성

### 에러: "permission denied"
- RLS 정책으로 인한 권한 문제
- 관리자 계정으로 실행하거나 RLS 정책 수정 필요

### 에러: "foreign key constraint"
- 참조하는 테이블이 없는 경우
- `counsel`, `accounts` 테이블 존재 확인

