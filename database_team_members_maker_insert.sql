-- team_members 테이블에 메이커가 자신을 팀원으로 추가할 수 있는 정책 추가
-- (팀 제안 수락 시 사용)
CREATE POLICY "Makers can insert themselves as team members" ON team_members
  FOR INSERT WITH CHECK (
    auth.uid() = maker_id
  );

