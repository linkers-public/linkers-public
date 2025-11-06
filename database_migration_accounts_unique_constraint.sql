-- accounts 테이블에 UNIQUE (user_id, profile_type) 제약조건 추가
-- 한 사용자가 FREELANCER와 COMPANY 프로필을 각각 1개씩 가질 수 있도록 보장

-- 기존 UNIQUE 제약조건이 있다면 제거 (필요시)
-- ALTER TABLE accounts DROP CONSTRAINT IF EXISTS uq_accounts_user_type;

-- UNIQUE 제약조건 추가
ALTER TABLE accounts
  ADD CONSTRAINT uq_accounts_user_type UNIQUE (user_id, profile_type);

-- 인덱스 확인 (UNIQUE 제약조건이 자동으로 인덱스를 생성하지만, 명시적으로 확인)
-- CREATE INDEX IF NOT EXISTS idx_accounts_user_type ON accounts(user_id, profile_type);

