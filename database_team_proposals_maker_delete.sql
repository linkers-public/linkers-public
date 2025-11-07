-- team_proposals 테이블에 메이커가 자신의 제안을 삭제할 수 있는 정책 추가
CREATE POLICY "Makers can delete proposals sent to them" ON team_proposals
  FOR DELETE USING (
    auth.uid() = maker_id
  );

