-- 기존 견적서 열람 데이터 초기화
-- 모든 사용자의 견적서 열람 권한과 기록을 삭제하여 결제 전 상태로 되돌림

-- 1. estimate_access 테이블의 모든 데이터 삭제 (열람 권한 제거)
DELETE FROM public.estimate_access;

-- 2. estimate_views 테이블의 모든 데이터 삭제 (열람 기록 제거)
DELETE FROM public.estimate_views;

-- 3. free_quota 테이블의 used 카운트 초기화 (무료 열람 횟수 리셋)
UPDATE public.free_quota
SET used = 0,
    updated_at = now();

-- 4. payments 테이블의 상태는 유지 (결제 기록은 보존)
-- 필요시 특정 결제만 취소하려면:
-- UPDATE public.payments SET status = 'cancelled' WHERE purpose = 'ppv' AND status = 'paid';

-- 5. subscriptions 테이블의 상태는 유지 (구독 기록은 보존)
-- 필요시 구독만 취소하려면:
-- UPDATE public.subscriptions SET status = 'canceled' WHERE status = 'active';

-- 확인 쿼리
-- SELECT COUNT(*) as access_count FROM public.estimate_access;
-- SELECT COUNT(*) as views_count FROM public.estimate_views;
-- SELECT user_id, granted, used, (granted - used) as remaining FROM public.free_quota;

