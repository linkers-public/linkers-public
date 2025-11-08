-- ============================================
-- 잘못 생성된 counsel 정리 스크립트
-- "팀→기업 견적 요청"으로 생성된 counsel을 notifications로 변환
-- ============================================

-- 1. 잘못 생성된 counsel 식별
-- 조건: 
-- - estimate가 없음
-- - outline이 '팀 견적을 요청%' 패턴
-- - client_id가 기업이 아닌 팀 매니저의 user_id

-- 먼저 확인용 쿼리 (실제 삭제 전 확인)
SELECT 
  c.counsel_id,
  c.title,
  c.outline,
  c.client_id,
  c.created_at,
  (SELECT COUNT(*) FROM estimate e WHERE e.counsel_id = c.counsel_id) as estimate_count,
  (SELECT COUNT(*) FROM teams t 
   JOIN accounts a ON t.manager_profile_id = a.profile_id 
   WHERE a.user_id = c.client_id) as is_team_manager
FROM counsel c
WHERE 
  c.outline LIKE '%팀 견적을 요청%'
  AND NOT EXISTS (
    SELECT 1 FROM estimate e WHERE e.counsel_id = c.counsel_id
  )
  AND EXISTS (
    SELECT 1 FROM teams t 
    JOIN accounts a ON t.manager_profile_id = a.profile_id 
    WHERE a.user_id = c.client_id
  )
  AND c.deleted_at IS NULL;

-- 2. 위 쿼리 결과를 확인한 후, 아래 스크립트 실행
-- 주의: 실제 데이터를 삭제하기 전에 백업 권장

-- 잘못 생성된 counsel을 notifications로 변환 후 아카이브
DO $$
DECLARE
  invalid_counsel RECORD;
  target_client_id UUID;
BEGIN
  FOR invalid_counsel IN 
    SELECT 
      c.counsel_id,
      c.title,
      c.outline,
      c.client_id as team_manager_user_id,
      c.company_profile_id,
      c.created_at
    FROM counsel c
    WHERE 
      c.outline LIKE '%팀 견적을 요청%'
      AND NOT EXISTS (
        SELECT 1 FROM estimate e WHERE e.counsel_id = c.counsel_id
      )
      AND EXISTS (
        SELECT 1 FROM teams t 
        JOIN accounts a ON t.manager_profile_id = a.profile_id 
        WHERE a.user_id = c.client_id
      )
      AND c.deleted_at IS NULL
  LOOP
    -- company_profile_id로 기업의 user_id 찾기
    SELECT a.user_id INTO target_client_id
    FROM accounts a
    WHERE a.profile_id = invalid_counsel.company_profile_id
      AND a.profile_type = 'COMPANY'
    LIMIT 1;

    -- target_client_id를 찾았으면 notifications 생성
    IF target_client_id IS NOT NULL THEN
      -- 팀 ID 찾기
      DECLARE
        team_id_val INTEGER;
      BEGIN
        SELECT t.id INTO team_id_val
        FROM teams t
        JOIN accounts a ON t.manager_profile_id = a.profile_id
        WHERE a.user_id = invalid_counsel.team_manager_user_id
        LIMIT 1;

        -- notifications 생성
        INSERT INTO notifications (
          type,
          sender_type,
          sender_team_id,
          target_client_id,
          payload,
          status,
          created_at
        ) VALUES (
          'TEAM_TO_CLIENT_ESTIMATE_REQUEST',
          'TEAM',
          team_id_val,
          target_client_id,
          jsonb_build_object(
            'note', invalid_counsel.outline,
            'original_counsel_id', invalid_counsel.counsel_id
          ),
          'PENDING',
          invalid_counsel.created_at
        );
      END;
    END IF;

    -- counsel 아카이브 (deleted_at 설정)
    UPDATE counsel
    SET deleted_at = NOW()
    WHERE counsel_id = invalid_counsel.counsel_id;
  END LOOP;
END $$;

-- 3. 정리 결과 확인
SELECT 
  COUNT(*) as archived_counsels,
  (SELECT COUNT(*) FROM notifications WHERE type = 'TEAM_TO_CLIENT_ESTIMATE_REQUEST') as created_notifications
FROM counsel
WHERE deleted_at IS NOT NULL
  AND outline LIKE '%팀 견적을 요청%';

