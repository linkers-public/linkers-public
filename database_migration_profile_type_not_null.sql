-- ============================================
-- accounts 테이블 profile_type을 NOT NULL로 변경
-- ============================================

-- 1. 기존 NULL 값 확인
-- SELECT user_id, COUNT(*) 
-- FROM accounts 
-- WHERE profile_type IS NULL 
-- GROUP BY user_id 
-- HAVING COUNT(*) > 1;

-- 2. profile_type이 NULL인 레코드 처리
-- 기본값으로 'FREELANCER' 설정 (또는 사용자에게 선택하게 하기)
-- 주의: 실제 데이터를 확인한 후 적절한 값으로 변경해야 함
UPDATE accounts 
SET profile_type = 'FREELANCER'
WHERE profile_type IS NULL;

-- 3. NOT NULL 제약조건 추가
ALTER TABLE accounts 
  ALTER COLUMN profile_type SET NOT NULL;

-- 4. 제약조건 확인
-- SELECT 
--   conname AS constraint_name,
--   contype AS constraint_type
-- FROM pg_constraint
-- WHERE conrelid = 'accounts'::regclass
--   AND conname LIKE '%profile_type%';

-- 5. 인덱스 확인 (이미 존재하는 부분 UNIQUE 인덱스)
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'accounts'
--   AND indexname LIKE '%profile_type%';

-- 참고:
-- - 기존 부분 UNIQUE 인덱스는 그대로 유지됨
-- - UNIQUE 제약조건도 정상 작동함
-- - profile_type이 NULL인 레코드는 더 이상 생성될 수 없음

