-- Makers B2B MVP를 위한 데이터베이스 스키마 업데이트

-- 1. accounts 테이블에 연락 가능 여부 필드 추가
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20) DEFAULT 'available' 
CHECK (availability_status IN ('available', 'busy'));

-- 2. 프로젝트 참여 의향 테이블 생성
CREATE TABLE IF NOT EXISTS project_participation (
  id SERIAL PRIMARY KEY,
  counsel_id INTEGER NOT NULL REFERENCES counsel(counsel_id) ON DELETE CASCADE,
  maker_id VARCHAR NOT NULL REFERENCES accounts(user_id) ON DELETE CASCADE,
  participation_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (participation_status IN ('pending', 'interested', 'not_interested')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(counsel_id, maker_id)
);

-- 3. 프로젝트 할당 테이블 생성 (운영자가 메이커에게 프로젝트 할당)
CREATE TABLE IF NOT EXISTS project_assignments (
  id SERIAL PRIMARY KEY,
  counsel_id INTEGER NOT NULL REFERENCES counsel(counsel_id) ON DELETE CASCADE,
  maker_id VARCHAR NOT NULL REFERENCES accounts(user_id) ON DELETE CASCADE,
  assigned_by VARCHAR NOT NULL REFERENCES accounts(user_id) ON DELETE CASCADE,
  assignment_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (assignment_status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(counsel_id, maker_id)
);

-- 4. 메이커 개별 견적 테이블 생성
CREATE TABLE IF NOT EXISTS maker_estimates (
  id SERIAL PRIMARY KEY,
  counsel_id INTEGER NOT NULL REFERENCES counsel(counsel_id) ON DELETE CASCADE,
  maker_id VARCHAR NOT NULL REFERENCES accounts(user_id) ON DELETE CASCADE,
  estimate_amount INTEGER NOT NULL CHECK (estimate_amount > 0),
  estimate_period VARCHAR(50) NOT NULL,
  estimate_details TEXT NOT NULL,
  estimate_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (estimate_status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(counsel_id, maker_id)
);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_project_participation_counsel_id ON project_participation(counsel_id);
CREATE INDEX IF NOT EXISTS idx_project_participation_maker_id ON project_participation(maker_id);
CREATE INDEX IF NOT EXISTS idx_project_participation_status ON project_participation(participation_status);

CREATE INDEX IF NOT EXISTS idx_project_assignments_counsel_id ON project_assignments(counsel_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_maker_id ON project_assignments(maker_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_status ON project_assignments(assignment_status);

CREATE INDEX IF NOT EXISTS idx_maker_estimates_counsel_id ON maker_estimates(counsel_id);
CREATE INDEX IF NOT EXISTS idx_maker_estimates_maker_id ON maker_estimates(maker_id);
CREATE INDEX IF NOT EXISTS idx_maker_estimates_status ON maker_estimates(estimate_status);

CREATE INDEX IF NOT EXISTS idx_accounts_availability_status ON accounts(availability_status);

-- 6. RLS (Row Level Security) 정책 설정
ALTER TABLE project_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maker_estimates ENABLE ROW LEVEL SECURITY;

-- project_participation RLS 정책
CREATE POLICY "Users can view their own participation" ON project_participation
  FOR SELECT USING (auth.uid()::text = maker_id);

CREATE POLICY "Users can insert their own participation" ON project_participation
  FOR INSERT WITH CHECK (auth.uid()::text = maker_id);

CREATE POLICY "Users can update their own participation" ON project_participation
  FOR UPDATE USING (auth.uid()::text = maker_id);

-- project_assignments RLS 정책
CREATE POLICY "Users can view their own assignments" ON project_assignments
  FOR SELECT USING (auth.uid()::text = maker_id);

CREATE POLICY "Users can update their own assignment status" ON project_assignments
  FOR UPDATE USING (auth.uid()::text = maker_id);

-- maker_estimates RLS 정책
CREATE POLICY "Users can view their own estimates" ON maker_estimates
  FOR SELECT USING (auth.uid()::text = maker_id);

CREATE POLICY "Users can insert their own estimates" ON maker_estimates
  FOR INSERT WITH CHECK (auth.uid()::text = maker_id);

CREATE POLICY "Users can update their own estimates" ON maker_estimates
  FOR UPDATE USING (auth.uid()::text = maker_id);

-- 7. 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. 업데이트 트리거 적용
CREATE TRIGGER update_project_participation_updated_at 
  BEFORE UPDATE ON project_participation 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_assignments_updated_at 
  BEFORE UPDATE ON project_assignments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maker_estimates_updated_at 
  BEFORE UPDATE ON maker_estimates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. 기존 데이터에 대한 기본값 설정
UPDATE accounts 
SET availability_status = 'available' 
WHERE availability_status IS NULL;

-- 10. 뷰 생성 (편의성을 위한 조인 뷰)
CREATE OR REPLACE VIEW project_participation_with_details AS
SELECT 
  pp.*,
  c.title as project_title,
  c.cost as project_cost,
  c.period as project_period,
  c.feild as project_field,
  a.username as maker_username,
  a.main_job as maker_main_job,
  a.expertise as maker_expertise
FROM project_participation pp
JOIN counsel c ON pp.counsel_id = c.counsel_id
JOIN accounts a ON pp.maker_id = a.user_id;

CREATE OR REPLACE VIEW project_assignments_with_details AS
SELECT 
  pa.*,
  c.title as project_title,
  c.cost as project_cost,
  c.period as project_period,
  c.feild as project_field,
  a.username as maker_username,
  a.main_job as maker_main_job,
  a.expertise as maker_expertise,
  a.availability_status as maker_availability,
  ab.username as assigned_by_username
FROM project_assignments pa
JOIN counsel c ON pa.counsel_id = c.counsel_id
JOIN accounts a ON pa.maker_id = a.user_id
JOIN accounts ab ON pa.assigned_by = ab.user_id;

CREATE OR REPLACE VIEW maker_estimates_with_details AS
SELECT 
  me.*,
  c.title as project_title,
  c.cost as project_cost,
  c.period as project_period,
  c.feild as project_field,
  a.username as maker_username,
  a.main_job as maker_main_job,
  a.expertise as maker_expertise
FROM maker_estimates me
JOIN counsel c ON me.counsel_id = c.counsel_id
JOIN accounts a ON me.maker_id = a.user_id;
