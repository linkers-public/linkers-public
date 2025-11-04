-- ============================================
-- 프리랜서 팀 프로젝트 관리 시스템 리팩토링
-- 프로필 분리 및 프로젝트 단위 역할 관리 구조
-- ============================================

-- ============================================
-- 1. ENUM 타입 정의
-- ============================================

-- 프로필 타입
CREATE TYPE profile_type AS ENUM ('freelancer', 'company');

-- 프로젝트 멤버 역할
CREATE TYPE project_role AS ENUM ('MAKER', 'MANAGER');

-- 프로젝트 멤버 상태
CREATE TYPE project_member_status AS ENUM ('pending', 'invited', 'active', 'completed', 'declined');

-- 경력 인증 상태
CREATE TYPE verification_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- ============================================
-- 2. 프로필 테이블 구조 변경
-- ============================================

-- 기존 accounts 테이블을 profiles로 확장
-- accounts는 유지하되, 프로필 타입 필드 추가

-- 프로필 타입 컬럼 추가
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS profile_type profile_type;

-- 배지 배열 필드 추가 (경력 인증 승인된 배지들)
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';

-- 프로필 활성 상태 (현재 사용 중인 프로필인지)
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 프로필 생성일 (나중에 정렬/필터링용)
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS profile_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 제약조건: 한 유저는 같은 타입의 프로필을 1개만 가질 수 있음
-- UNIQUE 제약조건은 아래에서 추가

-- ============================================
-- 3. 프로젝트 멤버 테이블 생성
-- ============================================

-- 프로젝트별 멤버 및 역할 관리 테이블
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
  
  -- 같은 프로젝트에 같은 프로필이 중복 참여 불가
  UNIQUE(counsel_id, profile_id, role)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_project_members_counsel_id ON project_members(counsel_id);
CREATE INDEX IF NOT EXISTS idx_project_members_profile_id ON project_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);
CREATE INDEX IF NOT EXISTS idx_project_members_status ON project_members(status);
CREATE INDEX IF NOT EXISTS idx_project_members_counsel_profile ON project_members(counsel_id, profile_id);

-- ============================================
-- 4. 경력 인증 요청 테이블 생성
-- ============================================

CREATE TABLE IF NOT EXISTS career_verification_requests (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR NOT NULL REFERENCES accounts(user_id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  badge_type VARCHAR(100) NOT NULL, -- 예: 'Senior Dev', 'PM 5yrs', '외주 1억 경험' 등
  description TEXT,
  status verification_status NOT NULL DEFAULT 'PENDING',
  reviewed_by VARCHAR REFERENCES accounts(user_id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_career_verification_profile_id ON career_verification_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_career_verification_status ON career_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_career_verification_badge_type ON career_verification_requests(badge_type);

-- ============================================
-- 5. 제약조건 추가
-- ============================================

-- 한 유저는 같은 타입의 프로필을 최대 1개만 가질 수 있음
-- 단, freelancer와 company는 각각 1개씩 가능 (최대 2개)
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_user_profile_type 
ON accounts(user_id, profile_type) 
WHERE profile_type IS NOT NULL AND deleted_at IS NULL;

-- ============================================
-- 6. RLS (Row Level Security) 정책 설정
-- ============================================

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_verification_requests ENABLE ROW LEVEL SECURITY;

-- project_members RLS 정책
-- 사용자는 자신이 참여한 프로젝트 멤버 정보를 볼 수 있음
CREATE POLICY "Users can view project members of their projects" ON project_members
  FOR SELECT USING (
    auth.uid()::text = profile_id OR
    auth.uid()::text IN (
      SELECT profile_id FROM project_members 
      WHERE counsel_id = project_members.counsel_id
    )
  );

-- 사용자는 자신의 프로필로 프로젝트 참여 신청 가능
CREATE POLICY "Users can insert their own project participation" ON project_members
  FOR INSERT WITH CHECK (auth.uid()::text = profile_id);

-- 사용자는 자신의 프로젝트 참여 정보를 업데이트 가능
CREATE POLICY "Users can update their own project participation" ON project_members
  FOR UPDATE USING (auth.uid()::text = profile_id);

-- career_verification_requests RLS 정책
-- 사용자는 자신의 경력 인증 요청을 볼 수 있음
CREATE POLICY "Users can view their own verification requests" ON career_verification_requests
  FOR SELECT USING (auth.uid()::text = profile_id);

-- 사용자는 자신의 경력 인증 요청을 생성 가능
CREATE POLICY "Users can insert their own verification requests" ON career_verification_requests
  FOR INSERT WITH CHECK (auth.uid()::text = profile_id);

-- 사용자는 자신의 경력 인증 요청을 업데이트 가능 (PENDING 상태일 때만)
CREATE POLICY "Users can update their own pending requests" ON career_verification_requests
  FOR UPDATE USING (auth.uid()::text = profile_id AND status = 'PENDING');

-- ============================================
-- 7. 트리거 함수 (업데이트 시간 자동 갱신)
-- ============================================

-- 이미 존재하는 함수는 재사용
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
CREATE TRIGGER update_project_members_updated_at 
  BEFORE UPDATE ON project_members 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_career_verification_updated_at 
  BEFORE UPDATE ON career_verification_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. 경력 인증 승인 시 프로필에 배지 추가하는 함수
-- ============================================

CREATE OR REPLACE FUNCTION approve_career_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- 승인 시 프로필의 badges 배열에 추가
  IF NEW.status = 'APPROVED' AND OLD.status != 'APPROVED' THEN
    UPDATE accounts
    SET badges = array_append(badges, NEW.badge_type)
    WHERE user_id = NEW.profile_id
      AND (badges IS NULL OR NOT (NEW.badge_type = ANY(badges)));
    
    -- reviewed_at 업데이트
    NEW.reviewed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER approve_career_verification_trigger
  BEFORE UPDATE ON career_verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION approve_career_verification();

-- ============================================
-- 9. 뷰 생성 (편의성을 위한 조인 뷰)
-- ============================================

-- 프로젝트 멤버 상세 정보 뷰
CREATE OR REPLACE VIEW project_members_with_details AS
SELECT 
  pm.*,
  c.title as project_title,
  c.counsel_status as project_status,
  a.username as profile_username,
  a.profile_type,
  a.main_job,
  a.expertise,
  a.badges,
  a.availability_status
FROM project_members pm
JOIN counsel c ON pm.counsel_id = c.counsel_id
JOIN accounts a ON pm.profile_id = a.user_id;

-- 경력 인증 요청 상세 정보 뷰
CREATE OR REPLACE VIEW career_verification_with_details AS
SELECT 
  cv.*,
  a.username as profile_username,
  a.profile_type,
  a.badges as current_badges,
  reviewer.username as reviewer_username
FROM career_verification_requests cv
JOIN accounts a ON cv.profile_id = a.user_id
LEFT JOIN accounts reviewer ON cv.reviewed_by = reviewer.user_id;

-- ============================================
-- 10. 마이그레이션: 기존 데이터 처리
-- ============================================

-- 기존 accounts 데이터에 기본 프로필 타입 설정
-- role이 'MAKER'면 freelancer, 'MANAGER'면 company로 설정
-- 'NONE'이거나 NULL이면 기본값으로 freelancer 설정
UPDATE accounts
SET profile_type = CASE
  WHEN role = 'MAKER' THEN 'freelancer'::profile_type
  WHEN role = 'MANAGER' THEN 'company'::profile_type
  ELSE 'freelancer'::profile_type
END
WHERE profile_type IS NULL;

-- 기존 badges가 NULL인 경우 빈 배열로 설정
UPDATE accounts
SET badges = '{}'
WHERE badges IS NULL;

-- 기존 project_participation 데이터를 project_members로 마이그레이션 (선택사항)
-- 필요시 아래 주석을 해제하여 실행
/*
INSERT INTO project_members (counsel_id, profile_id, role, status, created_at)
SELECT 
  counsel_id,
  maker_id,
  'MAKER'::project_role,
  CASE 
    WHEN participation_status = 'interested' THEN 'active'::project_member_status
    WHEN participation_status = 'pending' THEN 'pending'::project_member_status
    ELSE 'declined'::project_member_status
  END,
  created_at
FROM project_participation
ON CONFLICT (counsel_id, profile_id, role) DO NOTHING;
*/

-- ============================================
-- 11. 편의 함수들
-- ============================================

-- 사용자의 모든 프로필 조회 함수
CREATE OR REPLACE FUNCTION get_user_profiles(p_user_id VARCHAR)
RETURNS TABLE (
  user_id VARCHAR,
  username VARCHAR,
  profile_type profile_type,
  bio TEXT,
  main_job TEXT[],
  expertise TEXT[],
  badges TEXT[],
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.user_id,
    a.username,
    a.profile_type,
    a.bio,
    a.main_job,
    a.expertise,
    a.badges,
    a.is_active
  FROM accounts a
  WHERE a.user_id = p_user_id
    AND a.profile_type IS NOT NULL
    AND a.deleted_at IS NULL
  ORDER BY a.profile_created_at;
END;
$$ LANGUAGE plpgsql;

-- 프로젝트에 참여 중인 모든 멤버 조회 함수
CREATE OR REPLACE FUNCTION get_project_members(p_counsel_id INTEGER)
RETURNS TABLE (
  profile_id VARCHAR,
  username VARCHAR,
  profile_type profile_type,
  role project_role,
  status project_member_status,
  badges TEXT[],
  joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.profile_id,
    a.username,
    a.profile_type,
    pm.role,
    pm.status,
    a.badges,
    pm.joined_at
  FROM project_members pm
  JOIN accounts a ON pm.profile_id = a.user_id
  WHERE pm.counsel_id = p_counsel_id
    AND pm.status = 'active'
  ORDER BY pm.joined_at;
END;
$$ LANGUAGE plpgsql;

