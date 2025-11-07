-- team_proposals 테이블에 message 필드 추가
-- 팀 제안 시 메시지를 포함할 수 있도록 함

ALTER TABLE team_proposals
ADD COLUMN IF NOT EXISTS message TEXT;

-- 메시지 필드에 대한 코멘트 추가
COMMENT ON COLUMN team_proposals.message IS '팀 제안 메시지 내용';

