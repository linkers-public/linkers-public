-- 새로운 결제 모델 마이그레이션
-- 건별: 2,000원, 월 구독: 9,900원, 무료: 3회

-- 1. 가격표 테이블 (운영자가 조정 가능)
CREATE TABLE IF NOT EXISTS public.pricing (
  id BIGSERIAL PRIMARY KEY,
  plan TEXT NOT NULL CHECK (plan IN ('ppv', 'subscription')),
  label TEXT NOT NULL,
  amount_krw INTEGER NOT NULL,          -- 2000, 9900
  interval TEXT CHECK (interval IN ('month')) DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 기본 가격 데이터 삽입
INSERT INTO public.pricing (plan, label, amount_krw, interval, is_active) VALUES
  ('ppv', '건별 열람권', 2000, NULL, true),
  ('subscription', '월 구독', 9900, 'month', true)
ON CONFLICT DO NOTHING;

-- 2. 사용자별 무료 열람 카운트
CREATE TABLE IF NOT EXISTS public.free_quota (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted INTEGER NOT NULL DEFAULT 3,   -- 부여량
  used INTEGER NOT NULL DEFAULT 0,      -- 사용량
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 기존 client.free_estimate_views_remaining 데이터 마이그레이션
INSERT INTO public.free_quota (user_id, granted, used, updated_at)
SELECT 
  c.user_id,
  COALESCE(c.free_estimate_views_remaining, 3) as granted,
  (
    SELECT COUNT(*) 
    FROM public.estimate_views ev 
    WHERE ev.client_id = c.user_id 
      AND ev.view_type = 'free'
  ) as used,
  now()
FROM public.client c
WHERE EXISTS (SELECT 1 FROM auth.users u WHERE u.id = c.user_id)
ON CONFLICT (user_id) DO NOTHING;

-- 3. 결제(영수) 로그 테이블 업데이트
-- 기존 payments 테이블이 있다면 컬럼 추가, 없으면 생성
DO $$
BEGIN
  -- purpose 컬럼 추가 (없는 경우)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'payments' 
      AND column_name = 'purpose'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN purpose TEXT CHECK (purpose IN ('ppv', 'subscription'));
  END IF;

  -- estimate_id 컬럼 추가 (없는 경우)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'payments' 
      AND column_name = 'estimate_id'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN estimate_id BIGINT NULL;
  END IF;

  -- amount_krw 컬럼 추가 (없는 경우, 기존 amount와 병행)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'payments' 
      AND column_name = 'amount_krw'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN amount_krw INTEGER;
    -- 기존 amount 값을 amount_krw로 복사
    UPDATE public.payments SET amount_krw = amount WHERE amount_krw IS NULL;
  END IF;

  -- pg_tid 컬럼 추가 (없는 경우)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'payments' 
      AND column_name = 'pg_tid'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN pg_tid TEXT;
  END IF;

  -- meta 컬럼 추가 (없는 경우)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'payments' 
      AND column_name = 'meta'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN meta JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  -- 유니크 제약조건 추가 (pg_provider, pg_tid)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payments_pg_provider_tid_unique'
  ) THEN
    ALTER TABLE public.payments 
    ADD CONSTRAINT payments_pg_provider_tid_unique 
    UNIQUE (pg_provider, pg_tid);
  END IF;
END $$;

-- 기존 payments 데이터의 purpose 설정 (subscription_id가 있으면 'subscription', 없으면 'ppv'로 추정)
UPDATE public.payments 
SET purpose = CASE 
  WHEN subscription_id IS NOT NULL THEN 'subscription'
  ELSE 'ppv'
END
WHERE purpose IS NULL;

-- 4. 구독 테이블 업데이트
DO $$
BEGIN
  -- billing_key 컬럼 추가 (없는 경우)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'subscriptions' 
      AND column_name = 'billing_key'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN billing_key TEXT;
  END IF;

  -- amount_krw 컬럼 추가 (없는 경우)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'subscriptions' 
      AND column_name = 'amount_krw'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN amount_krw INTEGER;
    -- 기존 price 값을 amount_krw로 복사
    UPDATE public.subscriptions SET amount_krw = price WHERE amount_krw IS NULL;
  END IF;

  -- current_period_start 컬럼 추가 (없는 경우)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'subscriptions' 
      AND column_name = 'current_period_start'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN current_period_start TIMESTAMPTZ;
    -- 기존 created_at을 current_period_start로 설정
    UPDATE public.subscriptions 
    SET current_period_start = created_at 
    WHERE current_period_start IS NULL;
  END IF;

  -- current_period_end 컬럼 추가 (없는 경우)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'subscriptions' 
      AND column_name = 'current_period_end'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN current_period_end TIMESTAMPTZ;
    -- 기존 next_billing_date를 current_period_end로 설정
    UPDATE public.subscriptions 
    SET current_period_end = COALESCE(next_billing_date, created_at + INTERVAL '1 month')
    WHERE current_period_end IS NULL;
  END IF;

  -- cancel_at_period_end 컬럼 추가 (없는 경우)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'subscriptions' 
      AND column_name = 'cancel_at_period_end'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- 5. 열람 권한 테이블 (영구 권리)
CREATE TABLE IF NOT EXISTS public.estimate_access (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estimate_id BIGINT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('free', 'paid', 'subscription')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, estimate_id)  -- 중복 결제 방지
);

-- 기존 estimate_views 데이터를 estimate_access로 마이그레이션
INSERT INTO public.estimate_access (user_id, estimate_id, source, created_at)
SELECT DISTINCT ON (ev.client_id, ev.estimate_id)
  ev.client_id as user_id,
  ev.estimate_id,
  CASE ev.view_type
    WHEN 'free' THEN 'free'
    WHEN 'paid' THEN 'paid'
    WHEN 'subscription' THEN 'subscription'
    ELSE 'free'
  END as source,
  MIN(ev.created_at) as created_at
FROM public.estimate_views ev
WHERE ev.client_id IS NOT NULL
GROUP BY ev.client_id, ev.estimate_id, ev.view_type
ON CONFLICT (user_id, estimate_id) DO NOTHING;

-- 6. estimate_views 테이블 업데이트 (user_id 컬럼 추가)
DO $$
BEGIN
  -- user_id 컬럼 추가 (없는 경우, 기존 client_id와 병행)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'estimate_views' 
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.estimate_views ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    -- 기존 client_id를 user_id로 복사
    UPDATE public.estimate_views SET user_id = client_id WHERE user_id IS NULL;
  END IF;
END $$;

-- 7. RLS 정책 설정
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.free_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_access ENABLE ROW LEVEL SECURITY;

-- pricing: 모든 인증된 사용자가 조회 가능
DROP POLICY IF EXISTS "pricing_select" ON public.pricing;
CREATE POLICY "pricing_select" ON public.pricing
  FOR SELECT USING (auth.role() = 'authenticated');

-- free_quota: 본인만 조회/기록
DROP POLICY IF EXISTS "own_free_quota" ON public.free_quota;
CREATE POLICY "own_free_quota" ON public.free_quota
  FOR SELECT USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- estimate_access: 본인만 조회/기록
DROP POLICY IF EXISTS "own_access" ON public.estimate_access;
CREATE POLICY "own_access" ON public.estimate_access
  FOR SELECT USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- estimate_views: user_id 기반으로 정책 업데이트
DROP POLICY IF EXISTS "own_views_user" ON public.estimate_views;
CREATE POLICY "own_views_user" ON public.estimate_views
  FOR SELECT USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
  ON public.subscriptions (user_id, status);

CREATE INDEX IF NOT EXISTS idx_estimate_access_user 
  ON public.estimate_access (user_id);

CREATE INDEX IF NOT EXISTS idx_estimate_access_estimate 
  ON public.estimate_access (estimate_id);

CREATE INDEX IF NOT EXISTS idx_estimate_views_user 
  ON public.estimate_views (user_id);

CREATE INDEX IF NOT EXISTS idx_payments_user_purpose 
  ON public.payments (user_id, purpose);

