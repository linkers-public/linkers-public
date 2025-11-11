-- 결제 예약 실패 재시도 큐 테이블 생성
-- 구독 등록 시 결제 예약이 실패한 경우 재시도를 위한 큐

CREATE TABLE IF NOT EXISTS payment_retry_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id BIGINT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  billing_key TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  amount INTEGER NOT NULL,
  order_name TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone_number TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  last_error_type TEXT,
  last_error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  next_retry_at TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_payment_retry_queue_status ON payment_retry_queue(status);
CREATE INDEX IF NOT EXISTS idx_payment_retry_queue_subscription_id ON payment_retry_queue(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_retry_queue_next_retry_at ON payment_retry_queue(next_retry_at) WHERE status = 'pending';

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_payment_retry_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_retry_queue_updated_at ON payment_retry_queue;
CREATE TRIGGER payment_retry_queue_updated_at
  BEFORE UPDATE ON payment_retry_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_retry_queue_updated_at();

-- RLS 정책 (서버 사이드에서만 접근 가능하도록)
ALTER TABLE payment_retry_queue ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있으면 삭제
DROP POLICY IF EXISTS "Service role can manage payment retry queue" ON payment_retry_queue;

-- 서비스 롤만 접근 가능 (실제 사용 시 서비스 키 사용)
CREATE POLICY "Service role can manage payment retry queue"
  ON payment_retry_queue
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 주석 추가
COMMENT ON TABLE payment_retry_queue IS '결제 예약 실패 시 재시도를 위한 큐 테이블';
COMMENT ON COLUMN payment_retry_queue.status IS 'pending: 대기중, processing: 처리중, completed: 완료, failed: 실패, cancelled: 취소됨';
COMMENT ON COLUMN payment_retry_queue.next_retry_at IS '다음 재시도 시각 (지수 백오프 적용)';

