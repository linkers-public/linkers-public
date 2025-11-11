-- 공공 프로젝트 AI 견적 자동화를 위한 데이터베이스 마이그레이션

-- 1. 공고(Announcement) 테이블 생성
CREATE TABLE IF NOT EXISTS public_announcements (
  id SERIAL PRIMARY KEY,
  
  -- 기본 정보
  title TEXT NOT NULL,
  source_url TEXT, -- 나라장터/NTIS URL
  source_type VARCHAR(50) DEFAULT '나라장터', -- '나라장터', 'NTIS', '기타'
  announcement_number VARCHAR(100), -- 공고번호
  
  -- 원본 파일/데이터
  pdf_file_url TEXT, -- Supabase Storage URL
  raw_text TEXT, -- 파싱된 원본 텍스트
  
  -- AI 분석 결과 (JSONB)
  ai_analysis JSONB DEFAULT '{}'::jsonb, -- 요구기술, 예산, 기간 등
  
  -- 메타데이터
  organization_name TEXT, -- 발주기관
  deadline DATE, -- 마감일
  budget_min BIGINT, -- 최소 예산
  budget_max BIGINT, -- 최대 예산
  duration_months INTEGER, -- 기간 (개월)
  required_skills TEXT[], -- 요구 기술 스택
  location TEXT, -- 지역
  
  -- 상태
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'analyzed', 'matched', 'completed'
  analyzed_at TIMESTAMP WITH TIME ZONE,
  
  -- 생성 정보
  created_by UUID REFERENCES auth.users(id), -- 업로드한 사용자
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 공고 임베딩 테이블 (RAG용)
CREATE TABLE IF NOT EXISTS announcement_embeddings (
  id SERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL REFERENCES public_announcements(id) ON DELETE CASCADE,
  
  -- 벡터 임베딩
  embedding vector(1536),
  
  -- 원본 텍스트 청크
  content_text TEXT NOT NULL,
  chunk_index INTEGER, -- 청크 순서
  chunk_type VARCHAR(50), -- 'title', 'requirements', 'budget', 'timeline', 'full'
  
  -- 메타데이터
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. AI 매칭 결과 테이블
CREATE TABLE IF NOT EXISTS announcement_team_matches (
  id SERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL REFERENCES public_announcements(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- 매칭 점수
  match_score FLOAT NOT NULL, -- 0~1 사이 점수
  match_reasons JSONB, -- 매칭 사유 (기술 스택, 경력, 지역 등)
  
  -- AI 생성 견적 초안
  auto_estimate_draft JSONB, -- 자동 생성된 견적 초안
  
  -- 상태
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewed', 'accepted', 'rejected'
  
  -- 생성 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(announcement_id, team_id)
);

-- 4. 공고-견적서 연결 테이블 (자동 생성된 견적서)
CREATE TABLE IF NOT EXISTS announcement_estimates (
  id SERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL REFERENCES public_announcements(id) ON DELETE CASCADE,
  estimate_id INTEGER NOT NULL REFERENCES estimate(estimate_id) ON DELETE CASCADE,
  match_id INTEGER REFERENCES announcement_team_matches(id),
  
  -- 생성 방식
  generation_type VARCHAR(50) DEFAULT 'auto', -- 'auto', 'manual', 'hybrid'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS announcement_embeddings_announcement_id_idx 
ON announcement_embeddings(announcement_id);

CREATE INDEX IF NOT EXISTS announcement_embeddings_embedding_idx 
ON announcement_embeddings USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS announcement_team_matches_announcement_id_idx 
ON announcement_team_matches(announcement_id);

CREATE INDEX IF NOT EXISTS announcement_team_matches_team_id_idx 
ON announcement_team_matches(team_id);

CREATE INDEX IF NOT EXISTS announcement_team_matches_match_score_idx 
ON announcement_team_matches(match_score DESC);

-- 6. RLS 정책 설정
ALTER TABLE public_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_team_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_estimates ENABLE ROW LEVEL SECURITY;

-- 공고는 생성자와 매칭된 팀만 조회 가능
CREATE POLICY "공고는 생성자와 매칭된 팀만 조회 가능"
ON public_announcements
FOR SELECT
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM announcement_team_matches atm
    JOIN teams t ON atm.team_id = t.id
    WHERE atm.announcement_id = public_announcements.id
    AND t.manager_profile_id IN (
      SELECT profile_id FROM accounts 
      WHERE user_id = auth.uid() 
      AND profile_type = 'FREELANCER'
    )
  )
);

-- 임베딩은 공고 접근 권한과 동일
CREATE POLICY "임베딩은 공고 접근 권한과 동일"
ON announcement_embeddings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public_announcements pa
    WHERE pa.id = announcement_embeddings.announcement_id
    AND (
      pa.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM announcement_team_matches atm
        JOIN teams t ON atm.team_id = t.id
        WHERE atm.announcement_id = pa.id
        AND t.manager_profile_id IN (
          SELECT profile_id FROM accounts 
          WHERE user_id = auth.uid() 
          AND profile_type = 'FREELANCER'
        )
      )
    )
  )
);

-- 매칭 결과는 관련된 팀과 공고 생성자만 조회 가능
CREATE POLICY "매칭 결과는 관련 팀과 공고 생성자만 조회 가능"
ON announcement_team_matches
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public_announcements pa
    WHERE pa.id = announcement_team_matches.announcement_id
    AND pa.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = announcement_team_matches.team_id
    AND t.manager_profile_id IN (
      SELECT profile_id FROM accounts 
      WHERE user_id = auth.uid() 
      AND profile_type = 'FREELANCER'
    )
  )
);

-- 7. 벡터 검색 함수 (공고용)
CREATE OR REPLACE FUNCTION match_announcement_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_announcement_ids int[] DEFAULT NULL
)
RETURNS TABLE (
  announcement_id int,
  content_text text,
  chunk_type varchar,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ae.announcement_id,
    ae.content_text,
    ae.chunk_type,
    1 - (ae.embedding <=> query_embedding) as similarity,
    ae.metadata
  FROM announcement_embeddings ae
  WHERE 
    1 - (ae.embedding <=> query_embedding) > match_threshold
    AND (filter_announcement_ids IS NULL OR ae.announcement_id = ANY(filter_announcement_ids))
  ORDER BY ae.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 8. 하이브리드 검색 함수 (키워드 + 의미기반)
CREATE OR REPLACE FUNCTION hybrid_search_announcements(
  query_text TEXT,
  query_embedding vector(1536),
  keyword_weight FLOAT DEFAULT 0.3,
  semantic_weight FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  announcement_id INT,
  title TEXT,
  combined_score FLOAT,
  keyword_score FLOAT,
  semantic_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH keyword_matches AS (
    SELECT 
      pa.id,
      ts_rank(to_tsvector('korean', COALESCE(pa.title, '') || ' ' || COALESCE(pa.raw_text, '')), 
              plainto_tsquery('korean', query_text)) as score
    FROM public_announcements pa
    WHERE 
      to_tsvector('korean', COALESCE(pa.title, '') || ' ' || COALESCE(pa.raw_text, '')) 
      @@ plainto_tsquery('korean', query_text)
  ),
  semantic_matches AS (
    SELECT 
      ae.announcement_id,
      AVG(1 - (ae.embedding <=> query_embedding)) as score
    FROM announcement_embeddings ae
    GROUP BY ae.announcement_id
  )
  SELECT 
    pa.id as announcement_id,
    pa.title,
    (COALESCE(km.score, 0) * keyword_weight + COALESCE(sm.score, 0) * semantic_weight) as combined_score,
    COALESCE(km.score, 0) as keyword_score,
    COALESCE(sm.score, 0) as semantic_score
  FROM public_announcements pa
  LEFT JOIN keyword_matches km ON pa.id = km.id
  LEFT JOIN semantic_matches sm ON pa.id = sm.announcement_id
  WHERE km.score IS NOT NULL OR sm.score IS NOT NULL
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

