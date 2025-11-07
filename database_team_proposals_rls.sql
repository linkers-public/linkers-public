-- team_proposals 테이블 RLS 정책 설정
-- 팀 제안 기능을 위한 보안 정책 추가

-- RLS 활성화
ALTER TABLE team_proposals ENABLE ROW LEVEL SECURITY;

-- SELECT 정책: 매니저는 자신이 보낸 제안을 조회할 수 있고, 메이커는 자신에게 온 제안을 조회할 수 있음
CREATE POLICY "Managers can view their own proposals" ON team_proposals
  FOR SELECT USING (
    auth.uid()::text = manager_id
  );

CREATE POLICY "Makers can view proposals sent to them" ON team_proposals
  FOR SELECT USING (
    auth.uid()::text = maker_id
  );

-- INSERT 정책: 매니저만 자신의 팀 제안을 생성할 수 있음
CREATE POLICY "Managers can insert their own proposals" ON team_proposals
  FOR INSERT WITH CHECK (
    auth.uid()::text = manager_id
  );

-- UPDATE 정책: 매니저는 자신이 보낸 제안을 수정할 수 있음
CREATE POLICY "Managers can update their own proposals" ON team_proposals
  FOR UPDATE USING (
    auth.uid()::text = manager_id
  )
  WITH CHECK (
    auth.uid()::text = manager_id
  );

-- DELETE 정책: 매니저는 자신이 보낸 제안을 삭제할 수 있음
CREATE POLICY "Managers can delete their own proposals" ON team_proposals
  FOR DELETE USING (
    auth.uid()::text = manager_id
  );

