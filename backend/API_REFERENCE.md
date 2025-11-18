# API 참조 문서

Linkus Public RAG Backend의 모든 API 엔드포인트에 대한 상세 설명입니다.

## 📑 목차

1. [공고 관련 API](#공고-관련-api)
2. [계약서 분석 API](#계약서-분석-api-법률-rag-v2)

---

## 공고 관련 API

### 1. 공고 업로드 및 분석

공고 문서를 업로드하고 자동으로 분석합니다.

**엔드포인트:**
```bash
POST /api/announcements/upload
Content-Type: multipart/form-data
```

**요청 파라미터:**
- `file` (필수): PDF 파일

**응답 예시:**
```json
{
  "status": "success",
  "message": "공고 분석 완료",
  "data": {
    "announcement_id": "anno_abc123",
    "analysis": {
      "project_name": "프로젝트명",
      "budget_range": "5억 원",
      "duration": "6개월",
      "essential_skills": ["React", "Node.js"],
      ...
    }
  }
}
```

---

### 2. 팀 매칭

분석된 공고에 맞는 팀을 추천합니다.

**엔드포인트:**
```bash
GET /api/announcements/{announcement_id}/match
```

**경로 파라미터:**
- `announcement_id` (필수): 공고 ID

**응답 예시:**
```json
{
  "status": "success",
  "message": "3개 팀 매칭 완료",
  "data": {
    "matched_teams": [
      {
        "team_id": "team_001",
        "name": "팀명",
        "match_score": 85.5,
        "rationale": "매칭 사유...",
        ...
      }
    ]
  }
}
```

---

### 3. 견적서 생성

공고와 팀 정보를 기반으로 견적서를 생성합니다.

**엔드포인트:**
```bash
POST /api/estimates/generate
Content-Type: application/json
```

**요청 본문:**
```json
{
  "announcement_id": "anno_abc123",
  "team_id": "team_001"
}
```

**응답 예시:**
```json
{
  "status": "success",
  "message": "견적서 생성 완료",
  "data": {
    "estimate": "## 1. 사업 개요\n...\n## 2. 투입 인력 및 비용\n..."
  }
}
```

---

## 계약서 분석 API (법률 RAG v2)

### 4. 계약서 업로드 및 분석

계약서를 업로드하고 법률 리스크를 분석합니다.

**엔드포인트:**
```bash
POST /api/v2/legal/analyze-contract
Content-Type: multipart/form-data
X-User-Id: [사용자 ID (선택)]
```

**요청 파라미터:**
- `file` (필수): PDF/HWPX 파일
- `title` (선택): 문서 이름
- `doc_type` (선택): 문서 타입 (employment, freelance 등)

**헤더:**
- `X-User-Id` (선택): 사용자 ID

**응답 예시:**
```json
{
  "docId": "uuid-string",
  "title": "계약서명",
  "contractText": "계약서 전문 텍스트...",
  "riskScore": 65.5,
  "riskLevel": "medium",
  "summary": "계약서 요약...",
  "issues": [
    {
      "id": "issue-1",
      "category": "working_hours",
      "severity": "high",
      "summary": "위험 조항 요약",
      "explanation": "상세 설명...",
      "legalBasis": ["관련 법령..."],
      "suggestedRevision": "수정 제안..."
    }
  ],
  "clauses": [...],
  "highlightedTexts": [...],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**참고:**
- 계약서 분석 시 자동으로 DB에 저장됩니다
- 사용자 ID가 없어도 분석은 가능하지만, 히스토리 조회에는 사용자 ID가 필요합니다
- 프론트엔드는 사용자 ID가 없을 경우 로컬 스토리지에서 히스토리를 조회합니다

---

### 5. 계약서 분석 결과 조회

특정 계약서의 분석 결과를 조회합니다.

**엔드포인트:**
```bash
GET /api/v2/legal/contracts/{doc_id}
```

**경로 파라미터:**
- `doc_id` (필수): 문서 ID

**응답:**
계약서 분석 결과 전체 데이터를 반환합니다.

---

### 6. 계약서 히스토리 조회

사용자의 계약서 분석 히스토리를 조회합니다.

**엔드포인트:**
```bash
GET /api/v2/legal/contracts/history?limit=20&offset=0
X-User-Id: [사용자 ID (필수)]
```

**쿼리 파라미터:**
- `limit` (선택): 조회할 항목 수 (기본값: 20)
- `offset` (선택): 시작 위치 (기본값: 0)

**헤더:**
- `X-User-Id` (필수): 사용자 ID

**응답 예시:**
```json
[
  {
    "doc_id": "uuid-string",
    "title": "계약서명",
    "original_filename": "contract.pdf",
    "risk_score": 65.5,
    "risk_level": "medium",
    "summary": "계약서 요약...",
    "created_at": "2024-01-01T00:00:00Z",
    "issue_count": 5
  }
]
```

---

## 추가 정보

- 모든 API는 Swagger UI에서 테스트할 수 있습니다: http://localhost:8000/docs
- 에러 응답은 일관된 JSON 형식으로 반환됩니다
- 자세한 테스트 예제는 [TESTING.md](./TESTING.md)를 참고하세요

