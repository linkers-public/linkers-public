-- ============================================
-- 견적서 열람 접근 제어 마이그레이션
-- 날짜: 2024
-- 목적: 견적서 열람 MVP 구현
-- 요구사항:
--   1. 가격: 1만원 (건별)
--   2. 건별 열람권 + 무제한 열람(구독제)
--   3. 최초 n회는 무료로 열람 가능
-- ============================================

-- 1. estimate_views 테이블 생성 (견적서 열람 기록)
CREATE TABLE IF NOT EXISTS public.estimate_views (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id UUID NOT NULL REFERENCES public.client(user_id) ON DELETE CASCADE,
  estimate_id INTEGER NOT NULL REFERENCES public.estimate(estimate_id) ON DELETE CASCADE,
  view_type TEXT NOT NULL CHECK (view_type IN ('free', 'paid', 'subscription')),
  -- 'free': 무료 열람, 'paid': 건별 결제, 'subscription': 구독으로 열람
  amount_paid INTEGER DEFAULT 0, -- 결제 금액 (무료는 0)
  payment_id INTEGER NULL REFERENCES public.payments(id), -- 건별 결제 시 결제 ID
  subscription_id INTEGER NULL REFERENCES public.subscriptions(id), -- 구독으로 열람 시 구독 ID
  UNIQUE(client_id, estimate_id) -- 같은 견적서는 한 번만 열람 기록
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_estimate_views_client_id ON public.estimate_views(client_id);
CREATE INDEX IF NOT EXISTS idx_estimate_views_estimate_id ON public.estimate_views(estimate_id);
CREATE INDEX IF NOT EXISTS idx_estimate_views_created_at ON public.estimate_views(created_at DESC);

-- 코멘트 추가
COMMENT ON TABLE public.estimate_views IS '견적서 열람 기록 테이블';
COMMENT ON COLUMN public.estimate_views.view_type IS '열람 타입: free(무료), paid(건별 결제), subscription(구독)';
COMMENT ON COLUMN public.estimate_views.amount_paid IS '결제 금액 (무료는 0)';

-- 2. client 테이블에 무료 열람 횟수 컬럼 추가
ALTER TABLE public.client
ADD COLUMN IF NOT EXISTS free_estimate_views_remaining INTEGER DEFAULT 3; -- 기본 3회 무료

COMMENT ON COLUMN public.client.free_estimate_views_remaining IS '남은 무료 견적서 열람 횟수 (기본 3회)';

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE public.estimate_views ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 클라이언트는 자신의 열람 기록만 조회 가능
CREATE POLICY "Clients can view their own estimate view records"
ON public.estimate_views
FOR SELECT
USING (auth.uid() = client_id);

-- RLS 정책: 클라이언트는 자신의 열람 기록을 생성할 수 있음
CREATE POLICY "Clients can insert their own estimate view records"
ON public.estimate_views
FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- 4. 견적서 열람 권한 체크 함수 (선택적 - 애플리케이션 레벨에서도 구현 가능)
CREATE OR REPLACE FUNCTION public.can_view_estimate(
  p_client_id UUID,
  p_estimate_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_viewed BOOLEAN;
  v_free_views_remaining INTEGER;
  v_has_active_subscription BOOLEAN;
BEGIN
  -- 이미 열람한 경우 true
  SELECT EXISTS(
    SELECT 1 FROM public.estimate_views
    WHERE client_id = p_client_id
      AND estimate_id = p_estimate_id
  ) INTO v_has_viewed;
  
  IF v_has_viewed THEN
    RETURN TRUE;
  END IF;
  
  -- 무료 열람 횟수 확인
  SELECT free_estimate_views_remaining
  INTO v_free_views_remaining
  FROM public.client
  WHERE user_id = p_client_id;
  
  IF v_free_views_remaining > 0 THEN
    RETURN TRUE;
  END IF;
  
  -- 활성 구독 확인
  SELECT EXISTS(
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_client_id
      AND status = 'active'
      AND (next_billing_date IS NULL OR next_billing_date > now())
  ) INTO v_has_active_subscription;
  
  IF v_has_active_subscription THEN
    RETURN TRUE;
  END IF;
  
  -- 건별 결제는 애플리케이션 레벨에서 처리 (결제 완료 후 열람 기록 생성)
  RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION public.can_view_estimate IS '견적서 열람 권한 체크 함수';

