-- ============================================
-- 메시지 테이블 구조 개선 마이그레이션
-- ============================================

-- ============================================
-- 1. team_proposals 테이블 개선
-- ============================================

-- 1-1. 외래 키 제약조건 추가
-- team_id → teams.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'team_proposals_team_id_fkey'
    ) THEN
        ALTER TABLE team_proposals
        ADD CONSTRAINT team_proposals_team_id_fkey
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 1-2. 중복 제안 방지 UNIQUE 제약조건 추가
-- 같은 팀에 같은 메이커에게 중복 제안 불가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'team_proposals_unique_proposal'
    ) THEN
        ALTER TABLE team_proposals
        ADD CONSTRAINT team_proposals_unique_proposal
        UNIQUE(team_id, maker_id);
    END IF;
END $$;

-- 1-3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_team_proposals_team_id ON team_proposals(team_id);
CREATE INDEX IF NOT EXISTS idx_team_proposals_manager_id ON team_proposals(manager_id);
CREATE INDEX IF NOT EXISTS idx_team_proposals_maker_id ON team_proposals(maker_id);
CREATE INDEX IF NOT EXISTS idx_team_proposals_created_at ON team_proposals(created_at DESC);

-- ============================================
-- 2. team_members 테이블 개선
-- ============================================

-- 2-1. request_type 컬럼 추가 (초대/신청 구분)
-- 'invite': 매니저가 메이커를 초대
-- 'request': 메이커가 팀에 합류 신청
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'team_members' 
        AND column_name = 'request_type'
    ) THEN
        ALTER TABLE team_members
        ADD COLUMN request_type VARCHAR(20) DEFAULT 'invite';
        
        -- 기존 데이터 마이그레이션
        -- maker_id가 있으면 'request', 없으면 'invite'
        UPDATE team_members
        SET request_type = CASE 
            WHEN maker_id IS NOT NULL THEN 'request'
            ELSE 'invite'
        END;
        
        -- NOT NULL 제약조건 추가
        ALTER TABLE team_members
        ALTER COLUMN request_type SET NOT NULL;
    END IF;
END $$;

-- 2-2. request_type 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_team_members_request_type ON team_members(request_type);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_team_status ON team_members(team_id, status);

-- 2-3. CHECK 제약조건 추가 (유효한 값만 허용)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'team_members_request_type_check'
    ) THEN
        ALTER TABLE team_members
        ADD CONSTRAINT team_members_request_type_check
        CHECK (request_type IN ('invite', 'request'));
    END IF;
END $$;

-- ============================================
-- 3. 코멘트 추가 (문서화)
-- ============================================

COMMENT ON COLUMN team_members.request_type IS '요청 유형: invite(매니저가 초대), request(메이커가 신청)';
COMMENT ON COLUMN team_members.status IS '멤버 상태: pending(대기), active(활성), declined(거절)';
COMMENT ON COLUMN team_proposals.message IS '팀 제안 메시지 내용';
COMMENT ON TABLE team_proposals IS '매니저가 메이커에게 보낸 팀 제안';

