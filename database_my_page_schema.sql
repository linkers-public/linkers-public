-- ============================================
-- 마이페이지 스키마 마이그레이션
-- 프리랜서 및 기업 프로필 마이페이지에 필요한 테이블 생성
-- ============================================

-- ============================================
-- 1. 프리랜서 프로필 관련 테이블
-- ============================================

-- 1-1. 프로젝트 북마크 테이블
CREATE TABLE IF NOT EXISTS project_bookmarks (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR NOT NULL REFERENCES accounts(profile_id) ON DELETE CASCADE,
  counsel_id INTEGER NOT NULL REFERENCES counsel(counsel_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, counsel_id)
);

CREATE INDEX IF NOT EXISTS idx_project_bookmarks_profile_id ON project_bookmarks(profile_id);
CREATE INDEX IF NOT EXISTS idx_project_bookmarks_counsel_id ON project_bookmarks(counsel_id);

-- RLS 활성화
ALTER TABLE project_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인의 북마크만 조회/수정/삭제 가능
CREATE POLICY "Users can view their own project bookmarks" ON project_bookmarks
  FOR SELECT USING (
    profile_id IN (
      SELECT profile_id FROM accounts 
      WHERE user_id = auth.uid()::text AND is_active = true
    )
  );

CREATE POLICY "Users can insert their own project bookmarks" ON project_bookmarks
  FOR INSERT WITH CHECK (
    profile_id IN (
      SELECT profile_id FROM accounts 
      WHERE user_id = auth.uid()::text AND is_active = true
    )
  );

CREATE POLICY "Users can delete their own project bookmarks" ON project_bookmarks
  FOR DELETE USING (
    profile_id IN (
      SELECT profile_id FROM accounts 
      WHERE user_id = auth.uid()::text AND is_active = true
    )
  );

-- 1-2. 기업 북마크 테이블
CREATE TABLE IF NOT EXISTS company_bookmarks (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR NOT NULL REFERENCES accounts(profile_id) ON DELETE CASCADE,
  company_profile_id VARCHAR NOT NULL REFERENCES accounts(profile_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, company_profile_id),
  CHECK (profile_id != company_profile_id) -- 자기 자신 북마크 방지
);

CREATE INDEX IF NOT EXISTS idx_company_bookmarks_profile_id ON company_bookmarks(profile_id);
CREATE INDEX IF NOT EXISTS idx_company_bookmarks_company_profile_id ON company_bookmarks(company_profile_id);

-- RLS 활성화
ALTER TABLE company_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인의 북마크만 조회/수정/삭제 가능
CREATE POLICY "Users can view their own company bookmarks" ON company_bookmarks
  FOR SELECT USING (
    profile_id IN (
      SELECT profile_id FROM accounts 
      WHERE user_id = auth.uid()::text AND is_active = true
    )
  );

CREATE POLICY "Users can insert their own company bookmarks" ON company_bookmarks
  FOR INSERT WITH CHECK (
    profile_id IN (
      SELECT profile_id FROM accounts 
      WHERE user_id = auth.uid()::text AND is_active = true
    )
  );

CREATE POLICY "Users can delete their own company bookmarks" ON company_bookmarks
  FOR DELETE USING (
    profile_id IN (
      SELECT profile_id FROM accounts 
      WHERE user_id = auth.uid()::text AND is_active = true
    )
  );

-- 1-3. 사용자 설정 테이블 (알림 설정)
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  web_push_enabled BOOLEAN DEFAULT true,
  kakao_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- RLS 활성화
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인의 설정만 조회/수정 가능
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at_trigger
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- ============================================
-- 2. 기업 프로필 관련 테이블
-- ============================================

-- 2-1. client 테이블 컬럼 추가
ALTER TABLE client
ADD COLUMN IF NOT EXISTS contact_person VARCHAR,
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS website VARCHAR,
ADD COLUMN IF NOT EXISTS client_status VARCHAR(20) DEFAULT 'active';

-- 2-2. 기업 팀 멤버 테이블
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

CREATE INDEX IF NOT EXISTS idx_company_team_members_company_user_id ON company_team_members(company_user_id);
CREATE INDEX IF NOT EXISTS idx_company_team_members_member_user_id ON company_team_members(member_user_id);
CREATE INDEX IF NOT EXISTS idx_company_team_members_status ON company_team_members(status);

-- RLS 활성화
ALTER TABLE company_team_members ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 기업 소유자와 멤버만 조회 가능
CREATE POLICY "Company owners can view their team members" ON company_team_members
  FOR SELECT USING (
    company_user_id = auth.uid()::text OR member_user_id = auth.uid()::text
  );

CREATE POLICY "Company owners can insert team members" ON company_team_members
  FOR INSERT WITH CHECK (company_user_id = auth.uid()::text);

CREATE POLICY "Company owners can update team members" ON company_team_members
  FOR UPDATE USING (company_user_id = auth.uid()::text)
  WITH CHECK (company_user_id = auth.uid()::text);

CREATE POLICY "Company owners can delete team members" ON company_team_members
  FOR DELETE USING (company_user_id = auth.uid()::text);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_company_team_members_updated_at_trigger
  BEFORE UPDATE ON company_team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- 2-3. 구독 정보 테이블
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

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);

-- RLS 활성화
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인의 구독 정보만 조회/수정 가능
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_subscriptions_updated_at_trigger
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- 2-4. 결제 내역 테이블
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

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);

-- RLS 활성화
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인의 결제 내역만 조회 가능
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_payments_updated_at_trigger
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- 2-5. 연락처 구매 기록 테이블
CREATE TABLE IF NOT EXISTS contact_purchases (
  id SERIAL PRIMARY KEY,
  buyer_user_id VARCHAR NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_profile_id VARCHAR NOT NULL REFERENCES accounts(profile_id) ON DELETE CASCADE,
  seller_profile_id VARCHAR NOT NULL REFERENCES accounts(profile_id) ON DELETE CASCADE,
  price INTEGER NOT NULL, -- 구매 금액 (원)
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_purchases_buyer_user_id ON contact_purchases(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_contact_purchases_buyer_profile_id ON contact_purchases(buyer_profile_id);
CREATE INDEX IF NOT EXISTS idx_contact_purchases_seller_profile_id ON contact_purchases(seller_profile_id);
CREATE INDEX IF NOT EXISTS idx_contact_purchases_purchased_at ON contact_purchases(purchased_at);

-- RLS 활성화
ALTER TABLE contact_purchases ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 구매자만 자신의 구매 기록 조회 가능
CREATE POLICY "Buyers can view their own contact purchases" ON contact_purchases
  FOR SELECT USING (auth.uid()::text = buyer_user_id);

CREATE POLICY "Users can insert their own contact purchases" ON contact_purchases
  FOR INSERT WITH CHECK (auth.uid()::text = buyer_user_id);

-- ============================================
-- 3. 주석 추가
-- ============================================

COMMENT ON TABLE project_bookmarks IS '프리랜서가 북마크한 프로젝트 목록';
COMMENT ON TABLE company_bookmarks IS '프리랜서가 북마크한 기업 목록';
COMMENT ON TABLE user_settings IS '사용자 알림 설정';
COMMENT ON TABLE company_team_members IS '기업 계정의 멀티 사용자 관리';
COMMENT ON TABLE subscriptions IS '기업 구독 정보';
COMMENT ON TABLE payments IS '결제 내역 및 영수증';
COMMENT ON TABLE contact_purchases IS '연락처 구매 기록';

