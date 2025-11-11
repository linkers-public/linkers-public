-- ============================================
-- 링커스 프로젝트 초기 데이터베이스 스키마
-- 모든 기본 테이블 생성
-- ============================================

-- ============================================
-- 1. ENUM 타입 정의
-- ============================================

-- 프로필 타입
DO $$ BEGIN
    CREATE TYPE profile_type AS ENUM ('freelancer', 'company');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 사용자 역할
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('MAKER', 'MANAGER', 'NONE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 프로젝트 멤버 역할
DO $$ BEGIN
    CREATE TYPE project_role AS ENUM ('MAKER', 'MANAGER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 프로젝트 멤버 상태
DO $$ BEGIN
    CREATE TYPE project_member_status AS ENUM ('pending', 'invited', 'active', 'completed', 'declined');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 경력 인증 상태
DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 상담 상태
DO $$ BEGIN
    CREATE TYPE counsel_status AS ENUM ('pending', 'recruiting', 'end');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 상담 비용
DO $$ BEGIN
    CREATE TYPE counsel_cost AS ENUM ('500만원 이하', '500만원 ~ 1000만원', '1000만원 ~ 5000만원', '5000만원 ~ 1억원');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 상담 기간
DO $$ BEGIN
    CREATE TYPE counsel_period AS ENUM ('1개월 이하', '1개월 ~ 3개월', '3개월 ~ 6개월', '6개월 ~ 1년');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 프로젝트 분야
DO $$ BEGIN
    CREATE TYPE project_feild AS ENUM ('웹 개발', '앱 개발', '인공지능', '서버 개발', '클라우드', 'CI/CD', '데이터베이스', '디자인', '보안');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 기술 스택
DO $$ BEGIN
    CREATE TYPE skill AS ENUM ('React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'Spring', 'Django', 'Flask', 'Express', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'GitHub', 'GitLab', 'Jira', 'Figma', 'Adobe XD', 'Sketch');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 팀 전문 분야
DO $$ BEGIN
    CREATE TYPE team_specialty AS ENUM ('웹 개발', '앱 개발', '인공지능', '서버 개발', '클라우드', 'CI/CD', '데이터베이스', '디자인', '보안');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 견적 상태
DO $$ BEGIN
    CREATE TYPE estimate_status AS ENUM ('pending', 'accept', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. 프로필 관련 테이블
-- ============================================

-- accounts 테이블 (프리랜서/기업 프로필)
CREATE TABLE IF NOT EXISTS accounts (
  profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_type profile_type,
  username VARCHAR NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'NONE',
  is_active BOOLEAN DEFAULT true,
  profile_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  main_job TEXT[],
  expertise TEXT[],
  badges TEXT[] DEFAULT '{}',
  availability_status VARCHAR(20) DEFAULT 'available',
  profile_image_url TEXT,
  contact_phone VARCHAR,
  contact_email VARCHAR,
  contact_website TEXT
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_profile_type ON accounts(profile_type);
CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_accounts_deleted_at ON accounts(deleted_at) WHERE deleted_at IS NULL;

-- UNIQUE 제약조건: 한 유저는 같은 타입의 프로필을 1개만 가질 수 있음
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_user_profile_type 
ON accounts(user_id, profile_type) 
WHERE profile_type IS NOT NULL AND deleted_at IS NULL;

-- client 테이블 (기업 정보)
CREATE TABLE IF NOT EXISTS client (
  user_id VARCHAR PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR,
  contact_person VARCHAR,
  contact_phone VARCHAR,
  email VARCHAR,
  address TEXT,
  website VARCHAR,
  free_estimate_views_remaining INTEGER DEFAULT 3,
  client_status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_user_id ON client(user_id);

-- account_educations 테이블 (학력 정보)
CREATE TABLE IF NOT EXISTS account_educations (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR NOT NULL REFERENCES accounts(profile_id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  content TEXT NOT NULL,
  start_date VARCHAR NOT NULL,
  end_date VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_educations_profile_id ON account_educations(profile_id);

-- account_work_experiences 테이블 (경력 정보)
CREATE TABLE IF NOT EXISTS account_work_experiences (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR NOT NULL REFERENCES accounts(profile_id) ON DELETE CASCADE,
  company_name VARCHAR,
  position VARCHAR,
  content JSONB,
  start_date VARCHAR NOT NULL,
  end_date VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_work_experiences_profile_id ON account_work_experiences(profile_id);

-- account_license 테이블 (자격증 정보)
CREATE TABLE IF NOT EXISTS account_license (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR NOT NULL REFERENCES accounts(profile_id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  acquisition_date VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_license_profile_id ON account_license(profile_id);

-- ============================================
-- 3. 프로젝트 상담 관련 테이블
-- ============================================

-- counsel 테이블 (프로젝트 상담 요청)
CREATE TABLE IF NOT EXISTS counsel (
  counsel_id SERIAL PRIMARY KEY,
  client_id VARCHAR NOT NULL REFERENCES client(user_id) ON DELETE CASCADE,
  company_profile_id VARCHAR REFERENCES accounts(profile_id) ON DELETE SET NULL,
  title VARCHAR,
  outline TEXT,
  counsel_status counsel_status DEFAULT 'pending',
  start_date VARCHAR NOT NULL,
  due_date VARCHAR NOT NULL,
  cost counsel_cost,
  period counsel_period,
  feild project_feild,
  skill skill[],
  output TEXT,
  counsel_date VARCHAR,
  counsel_type VARCHAR,
  requested_team_id INTEGER,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_counsel_client_id ON counsel(client_id);
CREATE INDEX IF NOT EXISTS idx_counsel_company_profile_id ON counsel(company_profile_id);
CREATE INDEX IF NOT EXISTS idx_counsel_status ON counsel(counsel_status);
CREATE INDEX IF NOT EXISTS idx_counsel_requested_team_id ON counsel(requested_team_id);
CREATE INDEX IF NOT EXISTS idx_counsel_deleted_at ON counsel(deleted_at) WHERE deleted_at IS NULL;

-- counsel_status_events 테이블 (상담 상태 이벤트 로그)
CREATE TABLE IF NOT EXISTS counsel_status_events (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  counsel_id INTEGER NOT NULL REFERENCES counsel(counsel_id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  meta JSONB,
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_counsel_status_events_counsel_id ON counsel_status_events(counsel_id);
CREATE INDEX IF NOT EXISTS idx_counsel_status_events_created_at ON counsel_status_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_counsel_status_events_event ON counsel_status_events(event);

-- ============================================
-- 4. 견적서 관련 테이블
-- ============================================

-- estimate 테이블 (견적서)
CREATE TABLE IF NOT EXISTS estimate (
  estimate_id SERIAL PRIMARY KEY,
  team_id INTEGER,
  counsel_id INTEGER NOT NULL REFERENCES counsel(counsel_id) ON DELETE CASCADE,
  client_id VARCHAR NOT NULL REFERENCES client(user_id) ON DELETE CASCADE,
  company_profile_id VARCHAR REFERENCES accounts(profile_id) ON DELETE SET NULL,
  manager_id VARCHAR,
  manager_profile_id VARCHAR REFERENCES accounts(profile_id) ON DELETE SET NULL,
  estimate_status estimate_status DEFAULT 'pending',
  estimate_date VARCHAR,
  estimate_start_date VARCHAR,
  estimate_due_date VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estimate_team_id ON estimate(team_id);
CREATE INDEX IF NOT EXISTS idx_estimate_counsel_id ON estimate(counsel_id);
CREATE INDEX IF NOT EXISTS idx_estimate_client_id ON estimate(client_id);
CREATE INDEX IF NOT EXISTS idx_estimate_manager_id ON estimate(manager_id);
CREATE INDEX IF NOT EXISTS idx_estimate_status ON estimate(estimate_status);

-- estimate_version 테이블 (견적서 버전)
CREATE TABLE IF NOT EXISTS estimate_version (
  estimate_version_id SERIAL PRIMARY KEY,
  estimate_id INTEGER NOT NULL REFERENCES estimate(estimate_id) ON DELETE CASCADE,
  total_amount INTEGER,
  detail TEXT,
  start_date VARCHAR,
  end_date VARCHAR,
  version_date VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estimate_version_estimate_id ON estimate_version(estimate_id);

-- ============================================
-- 5. 마일스톤 및 지급 관련 테이블
-- ============================================

-- milestone 테이블 (마일스톤)
CREATE TABLE IF NOT EXISTS milestone (
  milestone_id SERIAL PRIMARY KEY,
  estimate_id INTEGER NOT NULL REFERENCES estimate(estimate_id) ON DELETE CASCADE,
  estimate_version_id INTEGER REFERENCES estimate_version(estimate_version_id) ON DELETE SET NULL,
  title VARCHAR NOT NULL,
  detail TEXT,
  payment_amount INTEGER,
  milestone_start_date VARCHAR,
  milestone_due_date VARCHAR,
  milestone_status VARCHAR DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestone_estimate_id ON milestone(estimate_id);
CREATE INDEX IF NOT EXISTS idx_milestone_estimate_version_id ON milestone(estimate_version_id);

-- payment 테이블 (지급 내역)
CREATE TABLE IF NOT EXISTS payment (
  payment_id SERIAL PRIMARY KEY,
  milestone_id INTEGER NOT NULL REFERENCES milestone(milestone_id) ON DELETE CASCADE,
  payment_amount INTEGER NOT NULL,
  payment_date VARCHAR,
  payment_method VARCHAR,
  payment_status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_milestone_id ON payment(milestone_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment(payment_status);

-- ============================================
-- 6. 팀 관련 테이블
-- ============================================

-- teams 테이블 (팀 정보)
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  manager_id VARCHAR NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manager_profile_id VARCHAR REFERENCES accounts(profile_id) ON DELETE SET NULL,
  bio TEXT,
  specialty team_specialty[],
  sub_specialty TEXT[],
  prefered TEXT[],
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_manager_id ON teams(manager_id);
CREATE INDEX IF NOT EXISTS idx_teams_manager_profile_id ON teams(manager_profile_id);
CREATE INDEX IF NOT EXISTS idx_teams_deleted_at ON teams(deleted_at) WHERE deleted_at IS NULL;

-- team_members 테이블 (팀 멤버)
CREATE TABLE IF NOT EXISTS team_members (
  id BIGSERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  profile_id VARCHAR REFERENCES accounts(profile_id) ON DELETE CASCADE,
  maker_id VARCHAR REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'pending',
  request_type VARCHAR(20) DEFAULT 'invite',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_profile_id ON team_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_team_members_maker_id ON team_members(maker_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_request_type ON team_members(request_type);

-- team_proposals 테이블 (팀 제안)
CREATE TABLE IF NOT EXISTS team_proposals (
  id BIGSERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  manager_id VARCHAR NOT NULL,
  maker_id VARCHAR NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, maker_id)
);

CREATE INDEX IF NOT EXISTS idx_team_proposals_team_id ON team_proposals(team_id);
CREATE INDEX IF NOT EXISTS idx_team_proposals_manager_id ON team_proposals(manager_id);
CREATE INDEX IF NOT EXISTS idx_team_proposals_maker_id ON team_proposals(maker_id);
CREATE INDEX IF NOT EXISTS idx_team_proposals_created_at ON team_proposals(created_at DESC);

-- team_counsel 테이블 (팀별 상담 연결)
CREATE TABLE IF NOT EXISTS team_counsel (
  team_counsel_id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  client_id VARCHAR NOT NULL REFERENCES client(user_id) ON DELETE CASCADE,
  counsel_id INTEGER REFERENCES counsel(counsel_id) ON DELETE SET NULL,
  counsel_status VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_counsel_team_id ON team_counsel(team_id);
CREATE INDEX IF NOT EXISTS idx_team_counsel_client_id ON team_counsel(client_id);
CREATE INDEX IF NOT EXISTS idx_team_counsel_counsel_id ON team_counsel(counsel_id);

-- ============================================
-- 7. 프로젝트 멤버 관련 테이블
-- ============================================

-- project_members 테이블 (프로젝트 멤버)
CREATE TABLE IF NOT EXISTS project_members (
  id SERIAL PRIMARY KEY,
  counsel_id INTEGER NOT NULL REFERENCES counsel(counsel_id) ON DELETE CASCADE,
  profile_id VARCHAR NOT NULL REFERENCES accounts(user_id) ON DELETE CASCADE,
  role project_role NOT NULL,
  status project_member_status NOT NULL DEFAULT 'pending',
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(counsel_id, profile_id, role)
);

CREATE INDEX IF NOT EXISTS idx_project_members_counsel_id ON project_members(counsel_id);
CREATE INDEX IF NOT EXISTS idx_project_members_profile_id ON project_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);
CREATE INDEX IF NOT EXISTS idx_project_members_status ON project_members(status);

-- career_verification_requests 테이블 (경력 인증 요청)
CREATE TABLE IF NOT EXISTS career_verification_requests (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR NOT NULL REFERENCES accounts(user_id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  badge_type VARCHAR(100) NOT NULL,
  description TEXT,
  status verification_status NOT NULL DEFAULT 'PENDING',
  reviewed_by VARCHAR REFERENCES accounts(user_id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_verification_profile_id ON career_verification_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_career_verification_status ON career_verification_requests(status);

-- ============================================
-- 8. 채팅 관련 테이블
-- ============================================

-- chat 테이블 (채팅방)
CREATE TABLE IF NOT EXISTS chat (
  chat_id SERIAL PRIMARY KEY,
  counsel_id INTEGER REFERENCES counsel(counsel_id) ON DELETE SET NULL,
  team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  client_id VARCHAR REFERENCES client(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_counsel_id ON chat(counsel_id);
CREATE INDEX IF NOT EXISTS idx_chat_team_id ON chat(team_id);
CREATE INDEX IF NOT EXISTS idx_chat_client_id ON chat(client_id);

-- chat_message 테이블 (채팅 메시지)
CREATE TABLE IF NOT EXISTS chat_message (
  message_id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL REFERENCES chat(chat_id) ON DELETE CASCADE,
  sender_id VARCHAR NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_message_chat_id ON chat_message(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_sender_id ON chat_message(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_created_at ON chat_message(created_at DESC);

-- ============================================
-- 9. 구독 및 결제 관련 테이블
-- ============================================

-- subscriptions 테이블 (구독 정보)
CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan VARCHAR(50) DEFAULT 'basic',
  price INTEGER NOT NULL DEFAULT 2000,
  status VARCHAR(20) DEFAULT 'active',
  auto_renew BOOLEAN DEFAULT true,
  customer_uid VARCHAR UNIQUE,
  is_first_month_free BOOLEAN DEFAULT true,
  first_month_used BOOLEAN DEFAULT false,
  portone_merchant_uid VARCHAR,
  portone_schedule_id VARCHAR,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_uid ON subscriptions(customer_uid);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);

-- payments 테이블 (결제 내역)
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id BIGINT REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'KRW',
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending',
  pg_provider VARCHAR(50),
  pg_transaction_id VARCHAR,
  portone_imp_uid VARCHAR,
  portone_merchant_uid VARCHAR UNIQUE,
  is_first_month BOOLEAN DEFAULT false,
  receipt_url TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_portone_imp_uid ON payments(portone_imp_uid);
CREATE INDEX IF NOT EXISTS idx_payments_portone_merchant_uid ON payments(portone_merchant_uid);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);

-- ============================================
-- 10. 알림 관련 테이블
-- ============================================

-- notifications 테이블 (알림)
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  sender_team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  sender_client_id VARCHAR REFERENCES client(user_id) ON DELETE SET NULL,
  target_team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  target_client_id VARCHAR REFERENCES client(user_id) ON DELETE SET NULL,
  counsel_id INTEGER REFERENCES counsel(counsel_id) ON DELETE SET NULL,
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'PENDING'
);

CREATE INDEX IF NOT EXISTS idx_notifications_target_client_id ON notifications(target_client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_team_id ON notifications(target_team_id);
CREATE INDEX IF NOT EXISTS idx_notifications_counsel_id ON notifications(counsel_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- 11. 기타 테이블
-- ============================================

-- manager_bookmarks 테이블 (매니저 북마크)
CREATE TABLE IF NOT EXISTS manager_bookmarks (
  id SERIAL PRIMARY KEY,
  manager_id VARCHAR NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id VARCHAR NOT NULL REFERENCES accounts(profile_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(manager_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_manager_bookmarks_manager_id ON manager_bookmarks(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_bookmarks_profile_id ON manager_bookmarks(profile_id);

-- magazine 테이블 (잡지)
CREATE TABLE IF NOT EXISTS magazine (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- account_portfolios 테이블 (포트폴리오)
CREATE TABLE IF NOT EXISTS account_portfolios (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR NOT NULL REFERENCES accounts(profile_id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  image_url TEXT,
  project_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_portfolios_profile_id ON account_portfolios(profile_id);

-- ============================================
-- 12. 외래 키 제약조건 추가
-- ============================================

-- counsel.requested_team_id 외래 키
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'counsel_requested_team_id_fkey'
    ) THEN
        ALTER TABLE counsel
        ADD CONSTRAINT counsel_requested_team_id_fkey
        FOREIGN KEY (requested_team_id) REFERENCES teams(id) ON DELETE SET NULL;
    END IF;
END $$;

-- estimate.team_id 외래 키
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'estimate_team_id_fkey'
    ) THEN
        ALTER TABLE estimate
        ADD CONSTRAINT estimate_team_id_fkey
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================
-- 13. 트리거 함수 생성
-- ============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- accounts 테이블 트리거
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- client 테이블 트리거
DROP TRIGGER IF EXISTS update_client_updated_at ON client;
CREATE TRIGGER update_client_updated_at
  BEFORE UPDATE ON client
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- counsel 테이블 트리거
DROP TRIGGER IF EXISTS update_counsel_updated_at ON counsel;
CREATE TRIGGER update_counsel_updated_at
  BEFORE UPDATE ON counsel
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- estimate 테이블 트리거
DROP TRIGGER IF EXISTS update_estimate_updated_at ON estimate;
CREATE TRIGGER update_estimate_updated_at
  BEFORE UPDATE ON estimate
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- teams 테이블 트리거
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 14. 코멘트 추가 (문서화)
-- ============================================

COMMENT ON TABLE accounts IS '프리랜서/기업 프로필 정보';
COMMENT ON TABLE client IS '기업 클라이언트 정보';
COMMENT ON TABLE counsel IS '프로젝트 상담 요청';
COMMENT ON TABLE estimate IS '견적서';
COMMENT ON TABLE teams IS '프리랜서 팀 정보';
COMMENT ON TABLE team_members IS '팀 멤버';
COMMENT ON TABLE subscriptions IS '구독 정보';
COMMENT ON TABLE payments IS '결제 내역';

-- ============================================
-- 완료
-- ============================================

