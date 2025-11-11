-- ============================================
-- 프리랜서/기업 프로필 2개 보유 시 테이블 설계 개선
-- ============================================

-- ============================================
-- 1. profile_type NOT NULL 제약조건 추가
-- ============================================

-- 1-1. 기존 NULL 값 확인
-- SELECT user_id, COUNT(*) 
-- FROM accounts 
-- WHERE profile_type IS NULL 
-- GROUP BY user_id 
-- HAVING COUNT(*) > 1;

-- 1-2. profile_type이 NULL인 레코드 처리
-- 기본값으로 'FREELANCER' 설정
-- 주의: 실제 데이터를 확인한 후 적절한 값으로 변경해야 함
UPDATE accounts 
SET profile_type = 'FREELANCER'::profile_type
WHERE profile_type IS NULL;

-- 1-3. NOT NULL 제약조건 추가
ALTER TABLE accounts 
  ALTER COLUMN profile_type SET NOT NULL;

-- ============================================
-- 2. 단일 활성 프로필 보장 (부분 UNIQUE 인덱스)
-- ============================================

-- 한 사용자는 활성 프로필을 1개만 가질 수 있음
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_user_active_profile 
ON accounts(user_id) 
WHERE is_active = true AND deleted_at IS NULL;

-- ============================================
-- 3. 프로필 전환 자동화 트리거 (선택사항)
-- ============================================

-- 프로필을 활성화하면 다른 프로필을 자동으로 비활성화
CREATE OR REPLACE FUNCTION ensure_single_active_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- is_active가 true로 변경되는 경우에만 처리
  IF NEW.is_active = true AND (OLD.is_active IS NULL OR OLD.is_active = false) THEN
    -- 같은 user_id의 다른 프로필 비활성화
    UPDATE accounts
    SET is_active = false,
        updated_at = NOW()
    WHERE user_id = NEW.user_id
      AND profile_id != NEW.profile_id
      AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (기존 트리거가 있으면 제거 후 재생성)
DROP TRIGGER IF EXISTS trg_ensure_single_active_profile ON accounts;

CREATE TRIGGER trg_ensure_single_active_profile
  BEFORE INSERT OR UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_profile();

-- ============================================
-- 4. 기존 데이터 정리 (선택사항)
-- ============================================

-- 4-1. 여러 프로필이 동시에 활성화된 경우 확인
-- SELECT user_id, COUNT(*) as active_count
-- FROM accounts
-- WHERE is_active = true AND deleted_at IS NULL
-- GROUP BY user_id
-- HAVING COUNT(*) > 1;

-- 4-2. 여러 활성 프로필이 있는 경우, 가장 최근에 생성된 프로필만 활성화
-- WITH ranked_profiles AS (
--   SELECT 
--     profile_id,
--     user_id,
--     ROW_NUMBER() OVER (
--       PARTITION BY user_id 
--       ORDER BY profile_created_at DESC
--     ) as rn
--   FROM accounts
--   WHERE is_active = true AND deleted_at IS NULL
-- )
-- UPDATE accounts
-- SET is_active = false
-- WHERE profile_id IN (
--   SELECT profile_id 
--   FROM ranked_profiles 
--   WHERE rn > 1
-- );

-- ============================================
-- 5. 검증 쿼리
-- ============================================

-- 5-1. profile_type이 NULL인 레코드 확인 (없어야 함)
-- SELECT COUNT(*) as null_profile_type_count
-- FROM accounts
-- WHERE profile_type IS NULL;

-- 5-2. 여러 활성 프로필을 가진 사용자 확인 (없어야 함)
-- SELECT user_id, COUNT(*) as active_count
-- FROM accounts
-- WHERE is_active = true AND deleted_at IS NULL
-- GROUP BY user_id
-- HAVING COUNT(*) > 1;

-- 5-3. 같은 타입의 프로필을 여러 개 가진 사용자 확인 (없어야 함)
-- SELECT user_id, profile_type, COUNT(*) as count
-- FROM accounts
-- WHERE deleted_at IS NULL
-- GROUP BY user_id, profile_type
-- HAVING COUNT(*) > 1;

-- ============================================
-- 6. 인덱스 확인 및 최적화
-- ============================================

-- 6-1. 기존 인덱스 확인
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'accounts'
-- ORDER BY indexname;

-- 6-2. is_active 필터링 성능 최적화 (이미 존재할 수 있음)
CREATE INDEX IF NOT EXISTS idx_accounts_user_active 
ON accounts(user_id, is_active) 
WHERE deleted_at IS NULL;

-- 6-3. profile_type 필터링 성능 최적화
CREATE INDEX IF NOT EXISTS idx_accounts_profile_type 
ON accounts(profile_type) 
WHERE deleted_at IS NULL;

-- ============================================
-- 완료 메시지
-- ============================================

-- 모든 마이그레이션이 완료되었습니다.
-- 다음 단계:
-- 1. 검증 쿼리 실행하여 데이터 무결성 확인
-- 2. 애플리케이션 코드에서 프로필 전환 로직 확인
-- 3. 성능 테스트 수행

