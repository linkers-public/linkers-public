# 메시지 테이블 구조 개선 완료 요약

## ✅ 완료된 작업

### 1. 데이터베이스 마이그레이션

#### `team_proposals` 테이블 개선
- ✅ 외래 키 제약조건 추가: `team_id` → `teams.id`
- ✅ 중복 제안 방지: `UNIQUE(team_id, maker_id)` 제약조건 추가
- ✅ 성능 최적화 인덱스 추가

#### `team_members` 테이블 개선
- ✅ `request_type` 컬럼 추가: 'invite' (매니저 초대) / 'request' (메이커 신청)
- ✅ 기존 데이터 마이그레이션 완료
- ✅ CHECK 제약조건 추가: 유효한 값만 허용
- ✅ 인덱스 추가: `request_type`, `status`, `(team_id, status)`

### 2. 코드 업데이트

#### `src/apis/team.service.ts`
- ✅ `requestTeamJoin`: `request_type: 'request'` 추가
- ✅ `addTeamMember`: `request_type: 'invite'` 추가

#### `src/apis/proposal.service.ts`
- ✅ `acceptTeamProposal`: `request_type: 'invite'` 추가 (제안 수락 시)

#### `src/app/(home)/my/messages/MessagesClient.tsx`
- ✅ 팀 초대 조회: `request_type = 'invite'` 필터 추가
- ✅ 보낸 합류 신청 조회: `request_type = 'request'` 필터 추가
- ✅ 받은 합류 신청 조회: `request_type = 'request'` 필터 추가

## 📊 개선 효과

### 데이터 무결성 향상
- 외래 키 제약조건으로 참조 무결성 보장
- UNIQUE 제약조건으로 중복 제안 방지
- CHECK 제약조건으로 유효한 값만 허용

### 역할 구분 명확화
- `request_type` 컬럼으로 초대/신청 구분 명확
- 쿼리 성능 향상 (필터링 조건 명확)

### 코드 가독성 향상
- 초대와 신청을 명확히 구분하여 코드 이해도 향상
- 유지보수성 향상

## 📝 변경 사항 상세

### 데이터베이스 스키마

```sql
-- team_proposals 테이블
ALTER TABLE team_proposals
ADD CONSTRAINT team_proposals_team_id_fkey
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE team_proposals
ADD CONSTRAINT team_proposals_unique_proposal
UNIQUE(team_id, maker_id);

-- team_members 테이블
ALTER TABLE team_members
ADD COLUMN request_type VARCHAR(20) DEFAULT 'invite' NOT NULL;

ALTER TABLE team_members
ADD CONSTRAINT team_members_request_type_check
CHECK (request_type IN ('invite', 'request'));
```

### 코드 변경 예시

**이전:**
```typescript
.insert({
  team_id: teamId,
  profile_id: profileId,
  status: 'pending',
})
```

**이후:**
```typescript
.insert({
  team_id: teamId,
  profile_id: profileId,
  status: 'pending',
  request_type: 'request', // 명확한 역할 구분
})
```

## 🎯 다음 단계 (선택사항)

1. **`maker_id` 컬럼 제거 검토**
   - 현재 `profile_id`로 충분하지만 하위 호환성을 위해 유지 중
   - 향후 제거 가능

2. **통합 메시지 테이블 검토**
   - 장기적으로 모든 메시지 타입을 하나의 테이블로 통합 검토

3. **이벤트 로깅 테이블 추가**
   - 메시지 상태 변경 이력 추적
   - 감사(audit) 목적

## ✅ 검증 완료

- ✅ 마이그레이션 적용 완료
- ✅ 코드 업데이트 완료
- ✅ 린터 에러 없음
- ✅ 타입 안정성 유지

