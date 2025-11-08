-- ============================================
-- Counsel 테이블 리팩토링 마이그레이션
-- 날짜: 2024
-- 목적: 스키마 정합성 개선 및 알림 분리
-- ============================================

-- A-0) 스키마 불일치 정리
-- company_profile_id는 실제 스키마에 없으므로 client_id만 사용
-- (필요시 나중에 추가 가능)

-- A-1) counsel: 기존 프로젝트 대상 팀 지정
ALTER TABLE public.counsel
ADD COLUMN IF NOT EXISTS requested_team_id INTEGER NULL;

ALTER TABLE public.counsel
ADD CONSTRAINT IF NOT EXISTS counsel_requested_team_id_fkey
FOREIGN KEY (requested_team_id) REFERENCES public.teams (id);

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_counsel_requested_team_id ON public.counsel(requested_team_id);

-- 코멘트 추가
COMMENT ON COLUMN public.counsel.requested_team_id IS '견적을 요청받은 팀 ID. NULL이면 모든 팀에게 공개된 프로젝트';

-- A-2) 팀→기업 "견적 요청"은 counsel 생성 금지 → 알림 테이블로 분리
CREATE TABLE IF NOT EXISTS public.notifications (
  id               BIGSERIAL PRIMARY KEY,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  type             TEXT NOT NULL,          -- 'TEAM_TO_CLIENT_ESTIMATE_REQUEST' | 'CLIENT_TO_TEAM_ESTIMATE_REQUEST' | ...
  sender_type      TEXT NOT NULL,          -- 'TEAM' | 'CLIENT'
  sender_team_id   INTEGER NULL,
  sender_client_id TEXT NULL,              -- client.user_id
  target_team_id   INTEGER NULL,
  target_client_id TEXT NULL,              -- client.user_id
  counsel_id       INTEGER NULL,           -- 기존 프로젝트 연결 시
  payload          JSONB NULL,             -- 요구스택/기간/예산/메시지 등
  status           TEXT NOT NULL DEFAULT 'PENDING'  -- 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELED'
);

-- Foreign Key 제약조건
ALTER TABLE public.notifications
  ADD CONSTRAINT IF NOT EXISTS notifications_sender_team_fkey
  FOREIGN KEY (sender_team_id) REFERENCES public.teams (id);

ALTER TABLE public.notifications
  ADD CONSTRAINT IF NOT EXISTS notifications_target_team_fkey
  FOREIGN KEY (target_team_id) REFERENCES public.teams (id);

ALTER TABLE public.notifications
  ADD CONSTRAINT IF NOT EXISTS notifications_target_client_fkey
  FOREIGN KEY (target_client_id) REFERENCES public.client (user_id);

ALTER TABLE public.notifications
  ADD CONSTRAINT IF NOT EXISTS notifications_counsel_fkey
  FOREIGN KEY (counsel_id) REFERENCES public.counsel (counsel_id);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_notifications_target_client_id ON public.notifications(target_client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_team_id ON public.notifications(target_team_id);
CREATE INDEX IF NOT EXISTS idx_notifications_counsel_id ON public.notifications(counsel_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 코멘트 추가
COMMENT ON TABLE public.notifications IS '견적 요청 및 기타 알림을 관리하는 테이블';
COMMENT ON COLUMN public.notifications.type IS '알림 타입: TEAM_TO_CLIENT_ESTIMATE_REQUEST, CLIENT_TO_TEAM_ESTIMATE_REQUEST 등';
COMMENT ON COLUMN public.notifications.status IS '알림 상태: PENDING, ACCEPTED, DECLINED, CANCELED';

-- A-3) 상태(enum) vs 이벤트(추천)
-- UI에서 쓰는 estimate_received, contract_progress는 DB enum에 없어 깨집니다.
-- 선호안: 상태는 최소(enum 유지: pending | recruiting | end)로 두고, 이벤트 로그로 확장합니다.

CREATE TABLE IF NOT EXISTS public.counsel_status_events (
  id           BIGSERIAL PRIMARY KEY,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  counsel_id   INTEGER NOT NULL REFERENCES public.counsel (counsel_id) ON DELETE CASCADE,
  event        TEXT NOT NULL,  -- 'ESTIMATE_RECEIVED' | 'CONTRACT_PROGRESS' | 'ESTIMATE_ACCEPTED' | ...
  meta         JSONB NULL,     -- 추가 메타데이터 (estimate_id, team_id 등)
  created_by   TEXT NULL       -- 이벤트를 생성한 사용자/시스템 정보
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_counsel_status_events_counsel_id ON public.counsel_status_events(counsel_id);
CREATE INDEX IF NOT EXISTS idx_counsel_status_events_created_at ON public.counsel_status_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_counsel_status_events_event ON public.counsel_status_events(event);

-- 코멘트 추가
COMMENT ON TABLE public.counsel_status_events IS 'counsel 상태 변경 이벤트 로그';
COMMENT ON COLUMN public.counsel_status_events.event IS '이벤트 타입: ESTIMATE_RECEIVED, CONTRACT_PROGRESS, ESTIMATE_ACCEPTED 등';

-- D. 마이그레이션 & 백필(운영 데이터 정리)

-- 잘못 생성된 counsel 정리
-- "팀→기업 견적 요청"으로 생긴 비어있는 counsel 판별 및 아카이브
-- (실제 삭제는 하지 않고, 추후 수동 확인 후 처리)

-- deleted_at 컬럼 추가 (아카이브용)
ALTER TABLE public.counsel
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_counsel_deleted_at ON public.counsel(deleted_at);

-- RLS (Row Level Security) 정책은 별도로 설정 필요
-- 여기서는 스키마 변경만 수행

