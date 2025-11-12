-- 벡터 검색 RPC 함수 (성능 최적화)

CREATE OR REPLACE FUNCTION match_announcement_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  announcement_id uuid,
  chunk_index int,
  content text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ac.announcement_id,
    ac.chunk_index,
    ac.content,
    1 - (ac.embedding <=> query_embedding) as similarity,
    ac.metadata
  FROM announcement_chunks ac
  INNER JOIN announcements a ON a.id = ac.announcement_id
  WHERE 
    a.status = 'active'
    AND 1 - (ac.embedding <=> query_embedding) > match_threshold
    -- 필터 적용 (예산, 기간 등)
    AND (
      filters = '{}'::jsonb OR
      (filters ? 'budget_min' AND a.budget_min >= (filters->>'budget_min')::bigint) OR
      (filters ? 'budget_max' AND a.budget_max <= (filters->>'budget_max')::bigint)
    )
  ORDER BY ac.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 함수 설명 추가
COMMENT ON FUNCTION match_announcement_chunks IS '공고 청크 벡터 검색 함수 (코사인 유사도)';

