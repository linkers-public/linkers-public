-- counsel 테이블에 requested_team_id 컬럼 추가
-- 기업이 특정 팀에게 견적을 요청할 때 사용

ALTER TABLE counsel 
ADD COLUMN IF NOT EXISTS requested_team_id INTEGER REFERENCES teams(id);

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_counsel_requested_team_id ON counsel(requested_team_id);

-- 코멘트 추가
COMMENT ON COLUMN counsel.requested_team_id IS '견적을 요청받은 팀 ID. NULL이면 모든 팀에게 공개된 프로젝트';

