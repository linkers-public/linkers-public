# Counsel 테이블 분석 보고서

## 1. 테이블 구조

### 주요 컬럼
```typescript
counsel: {
  counsel_id: number (PK)
  client_id: string → client.user_id 참조
  company_profile_id: string | null → accounts.profile_id 참조
  title: string | null
  outline: string | null
  counsel_status: "pending" | "recruiting" | "end"
  start_date: string
  due_date: string
  cost: counsel_cost enum | null
  period: counsel_period enum | null
  feild: project_feild enum | null
  skill: skill[] | null
  output: string | null
  counsel_date: string | null
  counsel_type: string | null
  requested_team_id: number | null (마이그레이션 후 추가)
}
```

### Enum 타입
- `counsel_status`: `"pending" | "recruiting" | "end"`
- `counsel_cost`: `"500만원 이하" | "500만원 ~ 1000만원" | "1000만원 ~ 5000만원" | "5000만원 ~ 1억원"`
- `counsel_period`: `"1개월 이하" | "1개월 ~ 3개월" | "3개월 ~ 6개월" | "6개월 ~ 1년"`
- `project_feild`: `"웹 개발" | "앱 개발" | "인공지능" | "서버 개발" | "클라우드" | "CI/CD" | "데이터베이스" | "디자인" | "보안"`

## 2. Counsel 생성 시점 분석

### ✅ 케이스 1: 기업이 상담 신청 폼 작성
**위치**: `src/app/enterprise/counsel-form/page.tsx`
```typescript
// counsel 테이블에 데이터 저장
const { data, error } = await supabase
  .from('counsel')
  .insert({
    client_id: clientData.user_id,
    title: formData.projectServiceName,
    outline: formData.functionality,
    period: formData.period,
    cost: formData.cost,
    feild: formData.serviceType,
    counsel_status: 'pending'  // ⚠️ pending 상태로 생성
    // ⚠️ company_profile_id가 없음!
  })
```

**특징**:
- `counsel_status`: `'pending'`
- `company_profile_id`: **NULL** (설정하지 않음)
- 목적: 기업이 프로젝트를 공개적으로 등록

### ⚠️ 케이스 2: 기업이 특정 팀에게 견적 요청
**위치**: `src/apis/company-project.service.ts` - `requestEstimate()`
```typescript
// counsel 생성 (프로젝트 정보) - 견적 요청만
const { data: counselData, error: counselError } = await supabase
  .from('counsel')
  .insert({
    client_id: client.user_id,
    company_profile_id: profile.profile_id,  // ✅ 설정됨
    title: projectInfo.title,
    outline: projectInfo.outline,
    counsel_status: 'recruiting',  // ⚠️ recruiting 상태로 생성
    requested_team_id: teamId,  // 특정 팀 지정
  })
```

**특징**:
- `counsel_status`: `'recruiting'`
- `company_profile_id`: **설정됨**
- `requested_team_id`: 특정 팀 ID
- 목적: 기업이 특정 팀에게만 견적 요청

**문제점**:
- 이미 존재하는 프로젝트에 대해 특정 팀에게 견적을 요청하는 경우도 있음
- 하지만 현재는 항상 새로운 `counsel`을 생성함

### ❌ 케이스 3: 팀이 기업에게 견적 요청
**위치**: `src/app/(home)/c/teams/[id]/TeamDetailClient.tsx` - `handleSubmitProposal()`
```typescript
const counselInsertData: any = {
  client_id: user.id,  // ⚠️ 팀 매니저의 user_id
  company_profile_id: companyProfile.profile_id,
  title: `${teamData.name} 팀 견적 요청`,
  outline: proposalMessage || '팀 견적을 요청합니다.',
  counsel_status: 'recruiting',
  requested_team_id: teamData.id,
}
```

**특징**:
- `counsel_status`: `'recruiting'`
- `client_id`: **팀 매니저의 user_id** (기업의 user_id가 아님!)
- `company_profile_id`: 기업 프로필 ID
- 목적: 팀이 기업에게 "우리 팀에게 견적을 요청해주세요"라고 요청

**문제점**:
- 이것은 프로젝트가 아니라 **메시지/알림**이어야 함
- `counsel`을 생성하는 것은 잘못된 설계
- 기업의 "내 프로젝트"에 표시되는 문제 발생

## 3. Counsel 조회 패턴 분석

### 조회 케이스별 분석

#### 1. 기업이 자신의 프로젝트 조회
**위치**: `src/apis/company-project.service.ts` - `getCompanyCounsels()`
```typescript
// 기업이 직접 등록한 프로젝트만 조회
.eq('company_profile_id', profile.profile_id)
.eq('client_id', client.user_id)
```

**필터 조건**:
- `company_profile_id` = 현재 기업 프로필
- `client_id` = 기업의 user_id

**문제점**:
- 케이스 1 (상담 신청 폼)에서 생성된 `counsel`은 `company_profile_id`가 NULL이므로 조회되지 않음!

#### 2. 모든 프로젝트 조회 (공개 프로젝트)
**위치**: `src/apis/counsel.service.ts` - `fetchAllCounsel()`
```typescript
const { data, error } = await supabase
  .from('counsel')
  .select('*')
```

**필터 조건**: 없음 (모든 counsel 조회)

#### 3. 매니저가 견적 요청 조회
**위치**: `src/app/(home)/my/estimate-requests/EstimateRequestsClient.tsx`
```typescript
const { data: counselData } = await supabase
  .from('counsel')
  .select('*')
  .in('counsel_status', ['pending', 'recruiting'])
```

**필터 조건**:
- `counsel_status` IN ('pending', 'recruiting')
- `requested_team_id`가 NULL이거나 자신의 팀 ID

## 4. Counsel Status 사용 패턴

### 정의된 Status
```typescript
counsel_status: "pending" | "recruiting" | "end"
```

### 실제 사용되는 Status
코드에서 확인된 사용:
- `pending`: 상담 신청 폼에서 생성 시
- `recruiting`: 견적 요청 시
- `end`: 완료된 프로젝트

### UI에서 표시되는 Status (추가로 사용됨)
**위치**: `src/app/enterprise/my-counsel/my-counsel.client.tsx`
```typescript
case 'pending': return { text: '접수됨' }
case 'recruiting': return { text: '매칭 중' }
case 'estimate_received': return { text: '견적 도착' }  // ⚠️ DB에 없음!
case 'contract_progress': return { text: '계약 진행' }  // ⚠️ DB에 없음!
case 'end': return { text: '완료' }
```

**문제점**:
- `estimate_received`, `contract_progress`는 DB enum에 없음
- UI에서만 사용되는 가상의 상태

## 5. 주요 문제점 정리

### 🔴 심각한 문제

1. **상담 신청 폼에서 생성된 counsel이 기업 프로젝트에 표시되지 않음**
   - `company_profile_id`가 NULL로 생성됨
   - `getCompanyCounsels()`에서 필터링되어 조회되지 않음

2. **팀이 기업에게 견적 요청 시 counsel 생성**
   - 프로젝트가 아니라 메시지/알림이어야 함
   - 잘못된 데이터가 "내 프로젝트"에 표시됨

3. **기업이 특정 팀에게 견적 요청 시 항상 새 counsel 생성**
   - 이미 존재하는 프로젝트에 대해 견적 요청하는 경우 처리 불가

### ⚠️ 개선 필요

4. **Status 불일치**
   - DB enum: `pending | recruiting | end`
   - UI에서 사용: `estimate_received`, `contract_progress` (DB에 없음)

5. **company_profile_id NULL 문제**
   - 상담 신청 폼에서 생성 시 NULL
   - 기업 프로젝트 조회 시 필터링되어 누락

## 6. 개선 방안

### 방안 1: 상담 신청 폼 수정
```typescript
// counsel-form/page.tsx 수정
.insert({
  client_id: clientData.user_id,
  company_profile_id: profile.profile_id,  // ✅ 추가
  // ... 나머지 필드
  counsel_status: 'pending'
})
```

### 방안 2: 팀의 견적 요청을 메시지로 변경
```typescript
// TeamDetailClient.tsx 수정
// counsel 생성 ❌
// 메시지/알림 생성 ✅
// 또는 별도 테이블 생성 (estimate_requests)
```

### 방안 3: 기존 프로젝트에 견적 요청 기능 추가
```typescript
// 기존 counsel에 requested_team_id 업데이트
.update({ requested_team_id: teamId })
.eq('counsel_id', existingCounselId)
```

### 방안 4: Status enum 확장
```sql
ALTER TYPE counsel_status ADD VALUE 'estimate_received';
ALTER TYPE counsel_status ADD VALUE 'contract_progress';
```

또는 별도 상태 관리 테이블 생성

## 7. Counsel 생성 플로우 정리

### 올바른 플로우 (제안)

```
1. 기업이 프로젝트 등록
   → counsel 생성 (status: 'pending', company_profile_id 설정)

2. 기업이 특정 팀에게 견적 요청
   → 기존 counsel의 requested_team_id 업데이트
   → 또는 새 프로젝트 등록 시 requested_team_id 설정

3. 팀이 기업에게 견적 요청
   → counsel 생성 ❌
   → 메시지/알림 생성 ✅

4. 매니저가 견적서 작성
   → estimate 생성 (counsel_id 참조)
   → counsel.status 업데이트 ('recruiting' → 'estimate_received')
```

## 8. 데이터 일관성 체크리스트

- [ ] 모든 counsel에 `company_profile_id` 설정
- [ ] `client_id`가 항상 기업의 user_id인지 확인
- [ ] 팀의 견적 요청이 counsel로 생성되지 않도록 수정
- [ ] Status enum과 UI 표시 일치
- [ ] 기존 프로젝트에 견적 요청 기능 추가

