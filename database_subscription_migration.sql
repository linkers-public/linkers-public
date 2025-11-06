-- 구독 테이블에 포트원 정기 결제 관련 컬럼 추가
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS customer_uid VARCHAR UNIQUE,
ADD COLUMN IF NOT EXISTS is_first_month_free BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS first_month_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS portone_merchant_uid VARCHAR,
ADD COLUMN IF NOT EXISTS portone_schedule_id VARCHAR;

-- customer_uid 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_uid ON subscriptions(customer_uid);

-- 결제 내역 테이블에 포트원 관련 컬럼 추가
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS portone_imp_uid VARCHAR,
ADD COLUMN IF NOT EXISTS portone_merchant_uid VARCHAR UNIQUE,
ADD COLUMN IF NOT EXISTS is_first_month BOOLEAN DEFAULT false;

-- 포트원 거래 ID 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_payments_portone_imp_uid ON payments(portone_imp_uid);
CREATE INDEX IF NOT EXISTS idx_payments_portone_merchant_uid ON payments(portone_merchant_uid);

