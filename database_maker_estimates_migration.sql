-- maker_estimates 테이블 생성 마이그레이션
-- 메이커 개별 견적 기능을 위한 테이블 및 RLS 정책 설정

-- 1. maker_estimates 테이블 생성
CREATE TABLE IF NOT EXISTS maker_estimates (
  id SERIAL PRIMARY KEY,
  counsel_id INTEGER NOT NULL REFERENCES counsel(counsel_id) ON DELETE CASCADE,
  maker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estimate_amount INTEGER NOT NULL CHECK (estimate_amount > 0),
  estimate_period VARCHAR(50) NOT NULL,
  estimate_details TEXT NOT NULL,
  estimate_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (estimate_status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(counsel_id, maker_id)
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_maker_estimates_counsel_id ON maker_estimates(counsel_id);
CREATE INDEX IF NOT EXISTS idx_maker_estimates_maker_id ON maker_estimates(maker_id);
CREATE INDEX IF NOT EXISTS idx_maker_estimates_status ON maker_estimates(estimate_status);

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE maker_estimates ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 설정
-- 메이커는 자신의 견적을 조회할 수 있음
CREATE POLICY "Makers can view their own estimates" ON maker_estimates
  FOR SELECT USING (auth.uid() = maker_id);

-- 프로젝트 소유자(기업)는 해당 프로젝트의 모든 견적을 조회할 수 있음
CREATE POLICY "Company can view estimates for their projects" ON maker_estimates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM counsel c
      JOIN accounts a ON c.company_profile_id = a.profile_id
      WHERE c.counsel_id = maker_estimates.counsel_id
        AND a.user_id = auth.uid()
        AND a.profile_type = 'COMPANY'
    )
  );

-- 메이커는 자신의 견적을 생성할 수 있음
CREATE POLICY "Makers can insert their own estimates" ON maker_estimates
  FOR INSERT WITH CHECK (auth.uid() = maker_id);

-- 메이커는 자신의 견적을 수정할 수 있음
CREATE POLICY "Makers can update their own estimates" ON maker_estimates
  FOR UPDATE USING (auth.uid() = maker_id)
  WITH CHECK (auth.uid() = maker_id);

-- 프로젝트 소유자(기업)는 견적 상태를 수정할 수 있음 (accept/reject)
CREATE POLICY "Company can update estimate status" ON maker_estimates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM counsel c
      JOIN accounts a ON c.company_profile_id = a.profile_id
      WHERE c.counsel_id = maker_estimates.counsel_id
        AND a.user_id = auth.uid()
        AND a.profile_type = 'COMPANY'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM counsel c
      JOIN accounts a ON c.company_profile_id = a.profile_id
      WHERE c.counsel_id = maker_estimates.counsel_id
        AND a.user_id = auth.uid()
        AND a.profile_type = 'COMPANY'
    )
  );

-- 5. updated_at 자동 업데이트 트리거 함수 (이미 존재할 수 있음)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_maker_estimates_updated_at ON maker_estimates;
CREATE TRIGGER update_maker_estimates_updated_at 
  BEFORE UPDATE ON maker_estimates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. 뷰 생성 (편의성을 위한 조인 뷰)
CREATE OR REPLACE VIEW maker_estimates_with_details AS
SELECT 
  me.*,
  c.title as project_title,
  c.cost as project_cost,
  c.period as project_period,
  c.feild as project_field,
  c.counsel_status,
  a.username as maker_username,
  a.main_job as maker_main_job,
  a.expertise as maker_expertise,
  a.profile_id as maker_profile_id
FROM maker_estimates me
JOIN counsel c ON me.counsel_id = c.counsel_id
JOIN accounts a ON me.maker_id = a.user_id
WHERE a.profile_type = 'FREELANCER';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'maker_estimates 테이블 및 RLS 정책이 성공적으로 생성되었습니다.';
END $$;

