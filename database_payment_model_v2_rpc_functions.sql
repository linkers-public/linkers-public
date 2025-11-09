-- 핵심 비즈니스 로직 SQL RPC 함수들

-- A. 사용 가능 여부 판단: can_view_estimate(user_id, estimate_id)
CREATE OR REPLACE FUNCTION public.can_view_estimate(p_user UUID, p_estimate BIGINT)
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
AS $$
  WITH sub AS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = p_user
      AND status = 'active'
      AND now() >= current_period_start
      AND now() < current_period_end
    LIMIT 1
  ),
  acc AS (
    SELECT 1
    FROM public.estimate_access
    WHERE user_id = p_user AND estimate_id = p_estimate
    LIMIT 1
  )
  SELECT EXISTS(SELECT * FROM sub) OR EXISTS(SELECT * FROM acc);
$$;

-- B. 무료 열람 소진 + 권리 부여: grant_free_view(user_id, estimate_id)
CREATE OR REPLACE FUNCTION public.grant_free_view(p_user UUID, p_estimate BIGINT)
RETURNS BOOLEAN 
LANGUAGE PLPGSQL 
SECURITY DEFINER 
AS $$
DECLARE
  v_granted INT;
  v_used INT;
BEGIN
  SELECT granted, used INTO v_granted, v_used
  FROM public.free_quota 
  WHERE user_id = p_user 
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.free_quota(user_id, granted, used) 
    VALUES (p_user, 3, 0)
    RETURNING granted, used INTO v_granted, v_used;
  END IF;

  IF v_used >= v_granted THEN
    RETURN false;
  END IF;

  -- 권리 부여(중복 방지 유니크)
  INSERT INTO public.estimate_access(user_id, estimate_id, source)
  VALUES (p_user, p_estimate, 'free')
  ON CONFLICT (user_id, estimate_id) DO NOTHING;

  -- 열람 기록
  INSERT INTO public.estimate_views(user_id, estimate_id, view_type, amount_paid)
  VALUES (p_user, p_estimate, 'free', 0);

  -- 카운트 +1
  UPDATE public.free_quota 
  SET used = used + 1, updated_at = now()
  WHERE user_id = p_user;

  RETURN true;
END;
$$;

-- C. 결제 후 권리 부여(건별): grant_ppv_after_payment(payment_id)
CREATE OR REPLACE FUNCTION public.grant_ppv_after_payment(p_payment_id BIGINT)
RETURNS VOID 
LANGUAGE PLPGSQL 
SECURITY DEFINER 
AS $$
DECLARE
  v_user UUID;
  v_est BIGINT;
  v_status TEXT;
  v_amount INT;
BEGIN
  SELECT user_id, estimate_id, status, amount_krw
  INTO v_user, v_est, v_status, v_amount
  FROM public.payments 
  WHERE id = p_payment_id;

  IF v_status <> 'paid' THEN
    RAISE EXCEPTION 'payment not paid';
  END IF;

  IF v_est IS NULL THEN
    RAISE EXCEPTION 'estimate_id is required for ppv payment';
  END IF;

  INSERT INTO public.estimate_access(user_id, estimate_id, source)
  VALUES (v_user, v_est, 'paid')
  ON CONFLICT (user_id, estimate_id) DO NOTHING;

  INSERT INTO public.estimate_views(user_id, estimate_id, view_type, amount_paid, payment_id)
  VALUES (v_user, v_est, 'paid', v_amount, p_payment_id);
END;
$$;

-- D. 구독 갱신/활성화 시: activate_subscription(user_id, amount, billing_key, period_start, period_end)
CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_user UUID, 
  p_amount INT, 
  p_billing_key TEXT, 
  p_start TIMESTAMPTZ, 
  p_end TIMESTAMPTZ
) 
RETURNS BIGINT 
LANGUAGE PLPGSQL 
SECURITY DEFINER 
AS $$
DECLARE 
  v_id BIGINT;
BEGIN
  INSERT INTO public.subscriptions(
    user_id, 
    status, 
    amount_krw, 
    billing_key,
    current_period_start, 
    current_period_end
  )
  VALUES (
    p_user, 
    'active', 
    p_amount, 
    p_billing_key, 
    p_start, 
    p_end
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- E. 무료 열람 횟수 조회
CREATE OR REPLACE FUNCTION public.get_free_quota(p_user UUID)
RETURNS TABLE(granted INT, used INT, remaining INT)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(granted, 3) as granted,
    COALESCE(used, 0) as used,
    COALESCE(granted, 3) - COALESCE(used, 0) as remaining
  FROM public.free_quota
  WHERE user_id = p_user;
$$;

-- F. 견적 열람 시도 (통합 함수)
CREATE OR REPLACE FUNCTION public.attempt_estimate_view(p_user UUID, p_estimate BIGINT)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  v_can_view BOOLEAN;
  v_free_granted BOOLEAN;
  v_free_quota JSONB;
BEGIN
  -- 이미 권리 있는지 확인
  SELECT can_view_estimate(p_user, p_estimate) INTO v_can_view;
  
  IF v_can_view THEN
    -- 열람 기록만 추가
    INSERT INTO public.estimate_views(user_id, estimate_id, view_type, amount_paid)
    VALUES (p_user, p_estimate, 'subscription', 0)
    ON CONFLICT DO NOTHING;
    
    RETURN jsonb_build_object(
      'ok', true,
      'access', 'granted',
      'type', 'existing'
    );
  END IF;

  -- 무료 열람 시도
  SELECT grant_free_view(p_user, p_estimate) INTO v_free_granted;
  
  IF v_free_granted THEN
    SELECT get_free_quota(p_user) INTO v_free_quota;
    
    RETURN jsonb_build_object(
      'ok', true,
      'access', 'granted_free',
      'free_quota', v_free_quota
    );
  END IF;

  -- 결제 필요
  RETURN jsonb_build_object(
    'ok', false,
    'reason', 'payment_required',
    'options', jsonb_build_array(
      jsonb_build_object('type', 'ppv', 'price', 2000),
      jsonb_build_object('type', 'subscription', 'price', 9900)
    )
  );
END;
$$;

