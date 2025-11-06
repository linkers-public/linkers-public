# 마이페이지 스키마 검토 결과

## 📋 개요
프리랜서 및 기업 프로필 마이페이지에 필요한 데이터와 테이블 스키마를 검토한 결과입니다.

---

## 🔵 프리랜서 프로필 페이지

### 1. 받은 팀 초대 (`/my/team-invites`)

**현재 사용 테이블:**
- ✅ `team_members` - 팀 초대 정보
- ✅ `teams` - 팀 정보
- ✅ `accounts` - 매니저 정보

**필요한 컬럼:**
- ✅ `team_members.id` - 초대 ID
- ✅ `team_members.team_id` - 팀 ID
- ✅ `team_members.maker_id` - 초대받은 사용자 ID (user_id)
- ✅ `team_members.status` - 초대 상태 ('pending', 'active', 'declined')
- ✅ `team_members.created_at` - 초대 일시
- ✅ `teams.name` - 팀 이름
- ✅ `teams.manager_id` - 매니저 ID
- ✅ `accounts.username` - 매니저 이름

**상태:**
- ✅ 구현 완료 (기존 테이블 사용)

---

### 2. 받은 프로젝트 제안 (`/my/project-proposals`)

**현재 사용 테이블:**
- ✅ `project_members` - 프로젝트 멤버 정보
- ✅ `counsel` - 프로젝트 정보
- ✅ `client` - 기업 정보
- ✅ `accounts` - 기업 프로필 정보

**필요한 컬럼:**
- ✅ `project_members.id` - 제안 ID
- ✅ `project_members.counsel_id` - 프로젝트 ID
- ✅ `project_members.profile_id` - 프리랜서 프로필 ID
- ✅ `project_members.status` - 제안 상태 ('pending', 'invited', 'active', 'declined')
- ✅ `project_members.created_at` - 제안 일시
- ✅ `counsel.title` - 프로젝트 제목
- ✅ `counsel.client_id` - 기업 ID
- ✅ `client.user_id` - 기업 사용자 ID
- ✅ `accounts.username` - 기업명

**상태:**
- ✅ 구현 완료 (기존 테이블 사용)

---

### 3. 관심 프로젝트 (`/my/bookmarked-projects`)

**필요한 테이블:**
- ❌ `project_bookmarks` - 프로젝트 북마크 테이블 (생성 필요)

**필요한 컬럼:**
```sql
CREATE TABLE IF NOT EXISTS project_bookmarks (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR NOT NULL REFERENCES accounts(profile_id) ON DELETE CASCADE,
  counsel_id INTEGER NOT NULL REFERENCES counsel(counsel_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, counsel_id)
);

CREATE INDEX idx_project_bookmarks_profile_id ON project_bookmarks(profile_id);
CREATE INDEX idx_project_bookmarks_counsel_id ON project_bookmarks(counsel_id);
```

**상태:**
- ❌ 테이블 생성 필요

---

### 4. 관심 기업 (`/my/bookmarked-companies`)

**필요한 테이블:**
- ❌ `company_bookmarks` - 기업 북마크 테이블 (생성 필요)

**필요한 컬럼:**
```sql
CREATE TABLE IF NOT EXISTS company_bookmarks (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR NOT NULL REFERENCES accounts(profile_id) ON DELETE CASCADE,
  company_profile_id VARCHAR NOT NULL REFERENCES accounts(profile_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, company_profile_id),
  CHECK (profile_id != company_profile_id) -- 자기 자신 북마크 방지
);

CREATE INDEX idx_company_bookmarks_profile_id ON company_bookmarks(profile_id);
CREATE INDEX idx_company_bookmarks_company_profile_id ON company_bookmarks(company_profile_id);
```

**상태:**
- ❌ 테이블 생성 필요

---

### 5. 로그인/보안 (`/my/account/security`)

**현재 사용:**
- ✅ `auth.users` - Supabase Auth 사용자 정보
- ✅ `accounts` - 프로필 정보 (deleted_at 업데이트)

**필요한 기능:**
- ✅ 이메일 변경 (Supabase Auth API 사용)
- ✅ 비밀번호 변경 (Supabase Auth API 사용)
- ✅ 계정 삭제 (Soft delete - `accounts.deleted_at` 업데이트)

**상태:**
- ✅ 구현 완료 (Supabase Auth 사용)

---

### 6. 알림 설정 (`/my/account/notifications`)

**필요한 테이블:**
- ❌ `user_settings` - 사용자 설정 테이블 (생성 필요)

**필요한 컬럼:**
```sql
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  web_push_enabled BOOLEAN DEFAULT true,
  kakao_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
```

**상태:**
- ❌ 테이블 생성 필요

---

## 🟢 기업 프로필 페이지

### 1. 내 정보 / 회사 정보 수정 (`/my/company/info`)

**현재 사용 테이블:**
- ✅ `client` - 기업 정보
- ✅ `accounts` - 프로필 정보

**필요한 컬럼:**
- ✅ `client.user_id` - 사용자 ID
- ✅ `client.company_name` - 회사명
- ⚠️ `client.contact_person` - 담당자명 (확인 필요)
- ⚠️ `client.contact_phone` - 연락처 (확인 필요)
- ⚠️ `client.address` - 주소 (확인 필요)
- ⚠️ `client.website` - 웹사이트 (확인 필요)
- ✅ `accounts.username` - 회사명 (동기화)
- ✅ `accounts.contact_phone` - 연락처
- ✅ `accounts.contact_website` - 웹사이트

**필요한 스키마 업데이트:**
```sql
-- client 테이블에 컬럼 추가 (없는 경우)
ALTER TABLE client
ADD COLUMN IF NOT EXISTS contact_person VARCHAR,
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS website VARCHAR;
```

**상태:**
- ⚠️ `client` 테이블 스키마 확인 및 업데이트 필요

---

### 2. 팀 멤버 관리 (`/my/company/team-members`)

**필요한 테이블:**
- ❌ `company_team_members` - 기업 팀 멤버 테이블 (생성 필요)

**필요한 컬럼:**
```sql
CREATE TABLE IF NOT EXISTS company_team_members (
  id SERIAL PRIMARY KEY,
  company_user_id VARCHAR NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id VARCHAR NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_email VARCHAR NOT NULL,
  member_name VARCHAR,
  role VARCHAR(50) DEFAULT 'member', -- 'admin', 'member'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'inactive'
  invited_by VARCHAR REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_user_id, member_user_id)
);

CREATE INDEX idx_company_team_members_company_user_id ON company_team_members(company_user_id);
CREATE INDEX idx_company_team_members_member_user_id ON company_team_members(member_user_id);
```

**상태:**
- ❌ 테이블 생성 필요

---

### 3. 구독 관리 (`/my/subscription`)

**필요한 테이블:**
- ❌ `subscriptions` - 구독 정보 테이블 (생성 필요)

**필요한 컬럼:**
```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan VARCHAR(50) DEFAULT 'basic', -- 'basic', 'premium', 'enterprise'
  price INTEGER NOT NULL DEFAULT 2000, -- 월 구독료 (원)
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'cancelled'
  auto_renew BOOLEAN DEFAULT true,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

**상태:**
- ❌ 테이블 생성 필요

---

### 4. 결제 내역 / 영수증 (`/my/payments`)

**필요한 테이블:**
- ❌ `payments` - 결제 내역 테이블 (생성 필요)

**필요한 컬럼:**
```sql
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- 결제 금액 (원)
  currency VARCHAR(10) DEFAULT 'KRW',
  payment_method VARCHAR(50), -- 'card', 'bank_transfer', etc.
  payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  pg_provider VARCHAR(50), -- 'iamport', 'toss', etc.
  pg_transaction_id VARCHAR, -- PG사 거래 ID
  receipt_url TEXT, -- 영수증 URL
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_payment_status ON payments(payment_status);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);
```

**상태:**
- ❌ 테이블 생성 필요

---

### 5. 연락처 열람 기록 (`/my/contact-history`)

**필요한 테이블:**
- ❌ `contact_purchases` - 연락처 구매 기록 테이블 (생성 필요)

**필요한 컬럼:**
```sql
CREATE TABLE IF NOT EXISTS contact_purchases (
  id SERIAL PRIMARY KEY,
  buyer_user_id VARCHAR NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_profile_id VARCHAR NOT NULL REFERENCES accounts(profile_id) ON DELETE CASCADE,
  seller_profile_id VARCHAR NOT NULL REFERENCES accounts(profile_id) ON DELETE CASCADE,
  price INTEGER NOT NULL, -- 구매 금액 (원)
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contact_purchases_buyer_user_id ON contact_purchases(buyer_user_id);
CREATE INDEX idx_contact_purchases_buyer_profile_id ON contact_purchases(buyer_profile_id);
CREATE INDEX idx_contact_purchases_seller_profile_id ON contact_purchases(seller_profile_id);
CREATE INDEX idx_contact_purchases_purchased_at ON contact_purchases(purchased_at);
```

**상태:**
- ❌ 테이블 생성 필요

---

### 6. 진행 이력 (`/my/project-history`)

**현재 사용 테이블:**
- ✅ `counsel` - 프로젝트 정보
- ✅ `client` - 기업 정보

**필요한 컬럼:**
- ✅ `counsel.counsel_id` - 프로젝트 ID
- ✅ `counsel.title` - 프로젝트 제목
- ✅ `counsel.counsel_status` - 프로젝트 상태
- ✅ `counsel.start_date` - 시작일
- ✅ `counsel.due_date` - 마감일
- ✅ `counsel.created_at` - 생성일
- ✅ `counsel.client_id` - 기업 ID

**상태:**
- ✅ 구현 완료 (기존 테이블 사용)

---

### 7. 완료 프로젝트 저장함 (`/my/completed-projects`)

**현재 사용 테이블:**
- ✅ `counsel` - 프로젝트 정보

**필요한 컬럼:**
- ✅ `counsel.counsel_id` - 프로젝트 ID
- ✅ `counsel.title` - 프로젝트 제목
- ✅ `counsel.counsel_status` - 프로젝트 상태 ('end')
- ✅ `counsel.updated_at` - 완료일 (또는 별도 완료일 컬럼)
- ✅ `counsel.created_at` - 생성일
- ✅ `counsel.client_id` - 기업 ID

**상태:**
- ✅ 구현 완료 (기존 테이블 사용)

---

### 8. 회원 탈퇴 (`/my/account/delete`)

**현재 사용:**
- ✅ `accounts` - 프로필 정보 (deleted_at 업데이트)
- ✅ `client` - 기업 정보 (client_status 업데이트)

**필요한 컬럼:**
- ✅ `accounts.deleted_at` - 삭제 일시 (Soft delete)
- ⚠️ `client.client_status` - 기업 상태 (확인 필요)

**필요한 스키마 업데이트:**
```sql
-- client 테이블에 client_status 컬럼 추가 (없는 경우)
ALTER TABLE client
ADD COLUMN IF NOT EXISTS client_status VARCHAR(20) DEFAULT 'active';
```

**상태:**
- ⚠️ `client.client_status` 컬럼 확인 필요

---

## 📊 요약

### ✅ 구현 완료 (기존 테이블 사용)
1. 받은 팀 초대
2. 받은 프로젝트 제안
3. 로그인/보안
4. 진행 이력
5. 완료 프로젝트 저장함

### ⚠️ 스키마 확인/업데이트 필요
1. 내 정보 / 회사 정보 수정 (`client` 테이블 컬럼 추가)
2. 회원 탈퇴 (`client.client_status` 확인)

### ❌ 테이블 생성 필요
1. 관심 프로젝트 (`project_bookmarks`)
2. 관심 기업 (`company_bookmarks`)
3. 알림 설정 (`user_settings`)
4. 팀 멤버 관리 (`company_team_members`)
5. 구독 관리 (`subscriptions`)
6. 결제 내역 (`payments`)
7. 연락처 열람 기록 (`contact_purchases`)

---

## 🔧 필요한 SQL 마이그레이션

전체 마이그레이션 스크립트는 `database_my_page_schema.sql` 파일에 생성 예정입니다.

