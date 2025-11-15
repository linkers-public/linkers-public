-- migrations/001_bidding_schema.sql
-- 공공입찰 특화 스키마

-- 공고 메타데이터 (구조화된 데이터)
CREATE TABLE IF NOT EXISTS announcement_metadata (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    doc_id BIGINT REFERENCES docs(id) ON DELETE CASCADE,
    
    -- 기본 정보
    project_name TEXT NOT NULL,
    organization TEXT,
    budget_min BIGINT,
    budget_max BIGINT,
    start_date DATE,
    end_date DATE,
    duration_months INTEGER,
    
    -- 기술 정보
    tech_stack JSONB DEFAULT '[]'::jsonb,  -- ["React", "Node.js", ...]
    required_skills JSONB DEFAULT '{}'::jsonb,  -- {frontend: 2, backend: 3, ...}
    team_size_min INTEGER,
    team_size_max INTEGER,
    
    -- 분석 결과
    difficulty_score FLOAT DEFAULT 0.5,  -- 0-1
    risk_level TEXT DEFAULT 'medium',  -- low, medium, high
    
    -- 메타데이터
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_announcement_budget 
    ON announcement_metadata(budget_min, budget_max);
CREATE INDEX IF NOT EXISTS idx_announcement_tech 
    ON announcement_metadata USING gin(tech_stack);
CREATE INDEX IF NOT EXISTS idx_announcement_skills 
    ON announcement_metadata USING gin(required_skills);
CREATE INDEX IF NOT EXISTS idx_announcement_doc_id 
    ON announcement_metadata(doc_id);

-- 과거 입찰 이력 (ChromaDB 메타데이터 동기화용)
CREATE TABLE IF NOT EXISTS bidding_history (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    announcement_id UUID REFERENCES announcement_metadata(id),
    team_id BIGINT REFERENCES teams(id),
    
    -- 입찰 정보
    bid_amount BIGINT,
    estimated_effort JSONB DEFAULT '{}'::jsonb,  -- {frontend: 40, backend: 80, ...}
    win_probability FLOAT DEFAULT 0.5,
    
    -- 결과
    is_won BOOLEAN DEFAULT FALSE,
    actual_amount BIGINT,
    
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_bidding_announcement 
    ON bidding_history(announcement_id);
CREATE INDEX IF NOT EXISTS idx_bidding_team 
    ON bidding_history(team_id);
CREATE INDEX IF NOT EXISTS idx_bidding_won 
    ON bidding_history(is_won) WHERE is_won = TRUE;

-- 견적 템플릿
CREATE TABLE IF NOT EXISTS estimate_templates (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    team_id BIGINT REFERENCES teams(id),
    
    -- 템플릿 정보
    name TEXT NOT NULL,
    category TEXT,  -- web, app, ai, ...
    
    -- 템플릿 구조
    sections JSONB DEFAULT '[]'::jsonb,  -- 견적서 섹션 구조
    pricing_model JSONB DEFAULT '{}'::jsonb,  -- 단가 정보
    
    -- 통계
    usage_count INTEGER DEFAULT 0,
    avg_win_rate FLOAT DEFAULT 0.0,
    
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_template_team 
    ON estimate_templates(team_id);
CREATE INDEX IF NOT EXISTS idx_template_category 
    ON estimate_templates(category);

-- RLS 정책
ALTER TABLE announcement_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE bidding_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_templates ENABLE ROW LEVEL SECURITY;

-- announcement_metadata: 소유자만 조회 가능
DROP POLICY IF EXISTS "Users can view own announcement metadata" ON announcement_metadata;
CREATE POLICY "Users can view own announcement metadata"
    ON announcement_metadata
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM doc_owners 
            WHERE doc_owners.doc_id = announcement_metadata.doc_id
            AND doc_owners.user_id = auth.uid()
        )
    );

-- bidding_history: 자신의 팀 입찰만 조회 가능
DROP POLICY IF EXISTS "Users can view own team bids" ON bidding_history;
CREATE POLICY "Users can view own team bids"
    ON bidding_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = bidding_history.team_id
            AND team_members.maker_id = auth.uid()
        )
    );

-- estimate_templates: 자신의 팀 템플릿만 조회 가능
DROP POLICY IF EXISTS "Users can view own team templates" ON estimate_templates;
CREATE POLICY "Users can view own team templates"
    ON estimate_templates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = estimate_templates.team_id
            AND team_members.maker_id = auth.uid()
        )
    );

