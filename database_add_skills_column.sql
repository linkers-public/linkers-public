-- 스킬 칼럼 추가 마이그레이션
-- accounts 테이블에 skills 배열 칼럼 추가

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';

-- 인덱스 추가 (스킬 검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_accounts_skills ON accounts USING GIN (skills);

-- 코멘트 추가
COMMENT ON COLUMN accounts.skills IS '사용자 스킬 목록 (배열)';

