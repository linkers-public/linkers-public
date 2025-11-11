-- 견적서 RAG 시스템을 위한 데이터베이스 마이그레이션
-- Supabase pgvector 확장 기능 사용

-- 1. pgvector 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 견적서 벡터 임베딩 저장 테이블 생성
CREATE TABLE IF NOT EXISTS estimate_embeddings (
  id SERIAL PRIMARY KEY,
  estimate_id INTEGER NOT NULL REFERENCES estimate(estimate_id) ON DELETE CASCADE,
  estimate_version_id INTEGER REFERENCES estimate_version(estimate_version_id) ON DELETE CASCADE,
  
  -- 벡터 임베딩 (1536차원은 OpenAI text-embedding-3-small 기준)
  embedding vector(1536),
  
  -- 원본 텍스트 (검색 결과 표시용)
  content_text TEXT NOT NULL,
  
  -- 메타데이터
  content_type VARCHAR(50) NOT NULL, -- 'detail', 'milestone', 'title' 등
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 인덱스 최적화를 위한 UNIQUE 제약조건
  UNIQUE(estimate_id, estimate_version_id, content_type)
);

-- 3. 벡터 검색을 위한 인덱스 생성 (HNSW 알고리즘 사용)
CREATE INDEX IF NOT EXISTS estimate_embeddings_embedding_idx 
ON estimate_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- 4. estimate_id로 빠른 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS estimate_embeddings_estimate_id_idx 
ON estimate_embeddings(estimate_id);

-- 5. RLS (Row Level Security) 정책 설정
ALTER TABLE estimate_embeddings ENABLE ROW LEVEL SECURITY;

-- 기업 사용자는 자신의 견적서만 조회 가능
CREATE POLICY "기업은 자신의 견적서 임베딩 조회 가능"
ON estimate_embeddings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM estimate e
    JOIN client c ON e.client_id = c.user_id
    WHERE e.estimate_id = estimate_embeddings.estimate_id
    AND c.user_id = auth.uid()
  )
);

-- 매니저는 자신의 팀 견적서 임베딩 조회 가능
CREATE POLICY "매니저는 자신의 팀 견적서 임베딩 조회 가능"
ON estimate_embeddings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM estimate e
    JOIN teams t ON e.team_id = t.id
    WHERE e.estimate_id = estimate_embeddings.estimate_id
    AND t.manager_profile_id IN (
      SELECT profile_id FROM accounts 
      WHERE user_id = auth.uid() 
      AND profile_type = 'FREELANCER'
    )
  )
);

-- 6. 벡터 검색을 위한 함수 생성
CREATE OR REPLACE FUNCTION match_estimate_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_estimate_ids int[] DEFAULT NULL
)
RETURNS TABLE (
  estimate_id int,
  estimate_version_id int,
  content_text text,
  content_type varchar,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ee.estimate_id,
    ee.estimate_version_id,
    ee.content_text,
    ee.content_type,
    1 - (ee.embedding <=> query_embedding) as similarity,
    ee.metadata
  FROM estimate_embeddings ee
  WHERE 
    -- 유사도 임계값 필터링
    1 - (ee.embedding <=> query_embedding) > match_threshold
    -- 선택적 estimate_id 필터링
    AND (filter_estimate_ids IS NULL OR ee.estimate_id = ANY(filter_estimate_ids))
  ORDER BY ee.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 7. 벡터 배열을 vector 타입으로 변환하는 헬퍼 함수 (선택사항)
-- Supabase 클라이언트가 배열을 직접 처리할 수 있지만, 필요시 사용
CREATE OR REPLACE FUNCTION array_to_vector(arr float[])
RETURNS vector AS $$
BEGIN
  RETURN arr::vector;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 8. 견적서 업데이트 시 임베딩 자동 갱신을 위한 트리거 함수 (선택사항)
-- 주의: 실제로는 애플리케이션 레벨에서 임베딩을 재생성하는 것이 권장됨
CREATE OR REPLACE FUNCTION update_estimate_embedding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE estimate_embeddings
  SET updated_at = NOW()
  WHERE estimate_id = NEW.estimate_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (estimate_version 업데이트 시)
-- 주의: 이 트리거는 타임스탬프만 업데이트하며, 실제 임베딩은 재생성되지 않음
-- 임베딩 재생성은 애플리케이션 레벨에서 처리해야 함
CREATE TRIGGER estimate_version_updated
AFTER UPDATE ON estimate_version
FOR EACH ROW
EXECUTE FUNCTION update_estimate_embedding_timestamp();

