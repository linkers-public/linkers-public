# Linkus Public RAG Backend

공공입찰 자동 분석 및 팀 매칭을 위한 RAG 파이프라인 백엔드 서버입니다.

## 📑 목차

1. [빠른 시작](#-빠른-시작)
2. [프로젝트 구조](#-프로젝트-구조)
3. [API 엔드포인트](#-api-엔드포인트)
4. [테스트](#-테스트)
5. [설정](#-설정)
6. [주요 기능](#-주요-기능)
7. [아키텍처 개선 사항](#️-아키텍처-개선-사항)
8. [계약서 히스토리 저장 및 조회](#-계약서-히스토리-저장-및-조회)
9. [문제 해결](#-문제-해결)
10. [추가 도움말](#-추가-도움말)
11. [관련 문서](#-관련-문서)
12. [라이선스](#-라이선스)

---

## 🚀 빠른 시작

### 1. 환경 설정

#### Python 버전 확인
Python 3.9 이상이 필요합니다:
```bash
python --version
```

#### 가상환경 생성 및 활성화

**Windows:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
```

**Linux/Mac:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
```

#### 의존성 설치
```bash
pip install -r requirements.txt
```

### 2. 환경 변수 설정

프로젝트 루트(`backend/`)에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase 설정 (필수)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url

# OpenAI API (선택, Ollama 사용 시 불필요)
OPENAI_API_KEY=your_openai_api_key_here

# Ollama 설정 (로컬 LLM 사용, 기본값)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
USE_OLLAMA=true

# Embedding Model (선택, 기본값: BAAI/bge-small-en-v1.5)
LOCAL_EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
USE_LOCAL_EMBEDDING=true

# LLM Model (선택, 기본값: gpt-4o-mini)
LLM_MODEL=gpt-4o-mini
LLM_TEMPERATURE=0.1

# Chunk Settings (선택)
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# Server Settings (선택)
HOST=0.0.0.0
PORT=8000

# Logging Settings (선택)
LOG_LEVEL=INFO  # INFO, DEBUG, WARNING, ERROR
```

**중요:** 
- Supabase 설정은 필수입니다 (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- 로컬 LLM 사용 시 Ollama가 설치되어 있어야 합니다
- 로깅 레벨은 `LOG_LEVEL` 환경 변수로 제어할 수 있습니다

### 3. 서버 실행

#### 방법 1: Python 직접 실행
```bash
python main.py
```

#### 방법 2: 실행 스크립트 사용

**Windows:**
```bash
run.bat
```

**Linux/Mac:**
```bash
chmod +x run.sh
./run.sh
```

#### 방법 3: Uvicorn 직접 실행
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. 서버 확인

서버가 정상적으로 실행되면 다음 URL에서 확인할 수 있습니다:

- **API 문서 (Swagger UI)**: http://localhost:8000/docs
- **ReDoc 문서**: http://localhost:8000/redoc
- **헬스 체크**: http://localhost:8000/api/health
- **루트 엔드포인트**: http://localhost:8000/

### 5. 실행 확인

터미널에서 다음 명령어로 서버 상태를 확인하세요:

```bash
# 헬스 체크
curl http://localhost:8000/api/health

# 또는 브라우저에서
# http://localhost:8000/api/health 접속
```

정상 응답 예시:
```json
{
  "status": "ok",
  "message": "Linkus Public RAG API is running"
}
```

---

## 📁 프로젝트 구조

```
backend/
├── main.py                 # FastAPI 메인
├── config.py               # 설정
├── requirements.txt
│
├── core/
│   ├── exceptions.py          # 커스텀 예외 클래스
│   ├── error_handler.py      # 공통 에러 핸들러
│   ├── logging_config.py     # 로깅 설정 통합
│   ├── dependencies.py       # 의존성 주입 패턴
│   ├── document_processor_v2.py  # 문서 처리
│   ├── supabase_vector_store.py   # 벡터 DB (Supabase)
│   ├── generator_v2.py       # LLM 생성
│   ├── orchestrator_v2.py    # RAG 통합
│   ├── legal_rag_service.py  # 법률 RAG 서비스
│   ├── contract_storage.py   # 계약서 저장 서비스
│   ├── async_tasks.py        # 비동기 작업 관리
│   └── tools/                # 계약서 분석 도구들
│
├── models/
│   └── schemas.py              # Pydantic 모델
│
├── api/
│   ├── routes_v2.py          # 공고 RAG API 엔드포인트
│   ├── routes_legal.py       # 법률 RAG API (v1)
│   └── routes_legal_v2.py    # 법률 RAG API (v2)
│
└── data/
    ├── chroma_db/              # 벡터 DB 저장소 (레거시)
    ├── temp/                   # 임시 파일
    └── legal/                  # 법률 문서 데이터
```

---

## 🔌 API 엔드포인트

### 공고 관련 API

#### 1. 공고 업로드 및 분석

```bash
POST /api/announcements/upload
Content-Type: multipart/form-data

file: [PDF 파일]
```

**응답:**
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

#### 2. 팀 매칭

```bash
GET /api/announcements/{announcement_id}/match
```

**응답:**
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

#### 3. 견적서 생성

```bash
POST /api/estimates/generate
Content-Type: application/json

{
  "announcement_id": "anno_abc123",
  "team_id": "team_001"
}
```

### 4. 계약서 분석 (법률 RAG v2)

#### 계약서 업로드 및 분석
```bash
POST /api/v2/legal/analyze-contract
Content-Type: multipart/form-data
X-User-Id: [사용자 ID (선택)]

file: [PDF/HWPX 파일]
title: [문서 이름 (선택)]
doc_type: [문서 타입 (선택: employment, freelance 등)]
```

**응답:**
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

#### 계약서 분석 결과 조회
```bash
GET /api/v2/legal/contracts/{doc_id}
```

#### 계약서 히스토리 조회
```bash
GET /api/v2/legal/contracts/history?limit=20&offset=0
X-User-Id: [사용자 ID (필수)]
```

**응답:**
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

**참고:**
- 계약서 분석 시 자동으로 DB에 저장됩니다
- 사용자 ID가 없어도 분석은 가능하지만, 히스토리 조회에는 사용자 ID가 필요합니다
- 프론트엔드는 사용자 ID가 없을 경우 로컬 스토리지에서 히스토리를 조회합니다

---

## 🧪 테스트

### Swagger UI 사용 (권장)

1. 브라우저에서 http://localhost:8000/docs 접속
2. 각 API 엔드포인트를 클릭하여 "Try it out" 버튼 클릭
3. 필요한 파라미터 입력 후 "Execute" 버튼 클릭
4. 응답 결과 확인

### cURL 예제

#### 1. 헬스 체크
```bash
curl http://localhost:8000/api/health
```

#### 2. 공고 업로드 및 분석
```bash
curl -X POST "http://localhost:8000/api/announcements/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample_announcement.pdf"
```

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
      "preferred_skills": ["AWS", "Docker"],
      "summary": "프로젝트 요약..."
    }
  }
}
```

#### 3. 팀 매칭
```bash
curl "http://localhost:8000/api/announcements/anno_abc123/match"
```

**응답 예시:**
```json
{
  "status": "success",
  "message": "3개 팀 매칭 완료",
  "data": {
    "matched_teams": [
      {
        "team_id": "team_001",
        "name": "프론트엔드 전문팀",
        "match_score": 85.5,
        "rationale": "✓ React 전문 경력 5년\n✓ 유사 프로젝트 경험 다수\n✓ 높은 평점(4.8/5.0)",
        "skills": ["React", "TypeScript", "Next.js"],
        "rating": 4.8,
        "experience_years": 5
      }
    ]
  }
}
```

#### 4. 견적서 생성
```bash
curl -X POST "http://localhost:8000/api/estimates/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "announcement_id": "anno_abc123",
    "team_id": "team_001"
  }'
```

**응답 예시:**
```json
{
  "status": "success",
  "message": "견적서 생성 완료",
  "data": {
    "estimate": "## 1. 사업 개요\n...\n## 2. 투입 인력 및 비용\n...\n## 3. 세부 견적 내역\n...\n## 4. 총 예상 금액\n..."
  }
}
```

#### 5. 계약서 분석
```bash
curl -X POST "http://localhost:8000/api/v2/legal/analyze-contract" \
  -H "X-User-Id: user-123" \
  -F "file=@contract.pdf" \
  -F "title=근로계약서" \
  -F "doc_type=employment"
```

**응답 예시:**
```json
{
  "docId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "근로계약서",
  "contractText": "제1조 (근로기간)...",
  "riskScore": 65.5,
  "riskLevel": "medium",
  "summary": "이 계약서는 전반적으로...",
  "issues": [
    {
      "id": "issue-1",
      "category": "working_hours",
      "severity": "high",
      "summary": "근로시간 조항에 문제가 있습니다",
      "explanation": "주 52시간 근무를 초과하는 조항이...",
      "legalBasis": ["근로기준법 제50조..."],
      "suggestedRevision": "주 40시간을 초과하지 않도록..."
    }
  ],
  "clauses": [...],
  "highlightedTexts": [...],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### 6. 계약서 히스토리 조회
```bash
curl "http://localhost:8000/api/v2/legal/contracts/history?limit=10&offset=0" \
  -H "X-User-Id: user-123"
```

**응답 예시:**
```json
[
  {
    "doc_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "근로계약서",
    "original_filename": "contract.pdf",
    "risk_score": 65.5,
    "risk_level": "medium",
    "summary": "이 계약서는 전반적으로...",
    "created_at": "2024-01-01T00:00:00Z",
    "issue_count": 5
  }
]
```

### Python 클라이언트 예제

```python
import requests

# 1. 공고 업로드
with open('sample_announcement.pdf', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/announcements/upload',
        files={'file': f}
    )
    result = response.json()
    announcement_id = result['data']['announcement_id']

# 2. 팀 매칭
response = requests.get(
    f'http://localhost:8000/api/announcements/{announcement_id}/match'
)
matched_teams = response.json()

# 3. 견적 생성
response = requests.post(
    'http://localhost:8000/api/estimates/generate',
    json={
        'announcement_id': announcement_id,
        'team_id': 'team_001'
    }
)
estimate = response.json()
```

---

## 🔧 설정

### 환경 변수

#### 필수 설정
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 역할 키
- `DATABASE_URL`: PostgreSQL 데이터베이스 URL

#### LLM 설정
- `USE_OLLAMA`: Ollama 사용 여부 (기본: `true`)
- `OLLAMA_BASE_URL`: Ollama 서버 주소 (기본: `http://localhost:11434`)
- `OLLAMA_MODEL`: Ollama 모델명 (기본: `llama3`)
- `OPENAI_API_KEY`: OpenAI API 키 (Ollama 미사용 시)
- `LLM_MODEL`: LLM 모델 (기본: `gpt-4o-mini`)
- `LLM_TEMPERATURE`: LLM 온도 (기본: `0.1`)

#### 임베딩 설정
- `USE_LOCAL_EMBEDDING`: 로컬 임베딩 사용 여부 (기본: `true`)
- `LOCAL_EMBEDDING_MODEL`: 로컬 임베딩 모델 (기본: `BAAI/bge-small-en-v1.5`)

#### 청크 설정
- `CHUNK_SIZE`: 청크 크기 (기본: `1000`)
- `CHUNK_OVERLAP`: 청크 오버랩 (기본: `200`)

#### 서버 설정
- `HOST`: 서버 호스트 (기본: `0.0.0.0`)
- `PORT`: 서버 포트 (기본: `8000`)

#### 로깅 설정
- `LOG_LEVEL`: 로그 레벨 (기본: `INFO`, 선택: `DEBUG`, `INFO`, `WARNING`, `ERROR`)

---

## 📝 주요 기능

1. **문서 처리**: PDF/HWP/HWPX 업로드 및 텍스트 추출
2. **벡터 저장**: Supabase pgvector를 사용한 임베딩 저장
3. **유사도 검색**: 벡터 유사도 기반 검색
4. **LLM 생성**: Ollama/OpenAI를 사용한 분석 및 견적 생성
5. **팀 매칭**: 요구사항 기반 팀 추천
6. **법률 리스크 분석**: 계약서 위험도 분석 및 조항 검토
7. **계약서 히스토리 관리**: 분석 결과 자동 저장 및 조회
   - 분석 완료 시 자동으로 DB에 저장
   - 사용자별 히스토리 조회 지원
   - 프론트엔드에서 로컬 스토리지 fallback 지원
8. **공통 에러 핸들러**: 일관된 에러 응답 형식
9. **로깅 통합**: 중앙화된 로깅 설정 및 파일 로테이션
10. **의존성 주입**: 싱글톤 패턴 기반 서비스 관리

## 🏗️ 아키텍처 개선 사항

### 공통 에러 핸들러
- 모든 예외를 일관된 JSON 형식으로 처리
- 커스텀 예외 클래스 지원 (`core/exceptions.py`)
- 상세한 에러 로깅 및 디버깅 정보 제공

### 로깅 설정 통합
- 중앙화된 로깅 설정 (`core/logging_config.py`)
- 파일 및 콘솔 동시 로깅
- 로그 파일 자동 로테이션 (10MB, 5개 백업)
- 환경 변수로 로그 레벨 제어

### 의존성 주입 패턴
- 싱글톤 패턴으로 서비스 인스턴스 관리 (`core/dependencies.py`)
- FastAPI Depends 지원
- 테스트 용이성 및 코드 재사용성 향상

자세한 내용은 [ARCHITECTURE_IMPROVEMENTS.md](./ARCHITECTURE_IMPROVEMENTS.md)를 참고하세요.

---

## 💾 계약서 히스토리 저장 및 조회

### 저장 메커니즘

계약서 분석 시 자동으로 다음 위치에 저장됩니다:

1. **백엔드 DB 저장** (자동)
   - `/api/v2/legal/analyze-contract` 엔드포인트 호출 시
   - `contract_analyses` 테이블에 분석 결과 저장
   - `contract_issues` 테이블에 이슈별 상세 정보 저장
   - 사용자 ID가 제공된 경우 `user_id`와 함께 저장

2. **프론트엔드 로컬 스토리지** (자동)
   - 분석 완료 후 `localStorage`에 저장
   - 키 형식: `contract_analysis_{docId}`
   - 로그인하지 않은 사용자도 로컬에서 히스토리 확인 가능

### 히스토리 조회

#### 백엔드 API 조회
```bash
GET /api/v2/legal/contracts/history
X-User-Id: [사용자 ID]
```

- 사용자 ID가 필수입니다
- 해당 사용자의 분석 히스토리만 반환됩니다

#### 프론트엔드 Fallback 메커니즘

프론트엔드는 다음 순서로 히스토리를 조회합니다:

1. **백엔드 v2 API 조회 시도**
   - 사용자 ID가 있는 경우 백엔드에서 조회
   - 성공 시 DB에 저장된 히스토리 반환

2. **로컬 스토리지 Fallback**
   - API 조회 실패 또는 사용자 ID가 없는 경우
   - `localStorage`에서 `contract_analysis_`로 시작하는 키 조회
   - 최신순으로 정렬하여 반환

### 주의사항

- **사용자 ID 없이 분석**: 분석은 가능하지만 히스토리 조회 시 로컬 스토리지만 사용
- **로그인 후 분석**: 사용자 ID와 함께 저장되어 다른 기기에서도 조회 가능
- **로컬 스토리지 제한**: 브라우저별 저장 용량 제한이 있으므로 오래된 데이터는 정리 필요

---

## 🚨 문제 해결

### 서버가 시작되지 않는 경우

#### 1. 포트가 이미 사용 중인 경우
```bash
# Windows: 포트 사용 중인 프로세스 확인
netstat -ano | findstr :8000

# Linux/Mac: 포트 사용 중인 프로세스 확인
lsof -i :8000

# 다른 포트 사용 (예: 8001)
# .env 파일에서 PORT=8001로 변경
```

#### 2. Python 버전 오류
- Python 3.9 이상이 필요합니다
- `python --version`으로 버전 확인
- 필요시 Python 업그레이드

#### 3. 의존성 설치 오류
```bash
# pip 업그레이드
pip install --upgrade pip

# 의존성 재설치
pip install -r requirements.txt --force-reinstall
```

### ChromaDB 오류

#### 벡터 DB 디렉토리 생성 실패
```bash
# 수동으로 디렉토리 생성
mkdir -p data/chroma_db
mkdir -p data/temp

# 권한 확인 (Linux/Mac)
chmod -R 755 data/
```

#### ChromaDB 버전 호환성 문제
```bash
# ChromaDB 재설치
pip uninstall chromadb
pip install chromadb==0.4.22
```

### OpenAI API 오류

#### API 키 오류
- `.env` 파일에 `OPENAI_API_KEY`가 올바르게 설정되었는지 확인
- API 키 앞뒤 공백 제거
- 환경 변수 로드 확인:
  ```python
  from config import settings
  print(settings.openai_api_key[:10] + "...")  # 키 일부만 출력
  ```

#### API 사용량 제한
- OpenAI 대시보드에서 사용량 확인
- 필요시 더 높은 등급의 API 키 사용
- Rate limit 오류 시 재시도 로직 추가 고려

#### 모델 이름 오류
- `EMBEDDING_MODEL`과 `LLM_MODEL`이 올바른지 확인
- 사용 가능한 모델 목록: https://platform.openai.com/docs/models

### PDF 처리 오류

#### PDF 파일을 읽을 수 없는 경우
- PDF 파일이 손상되지 않았는지 확인
- 다른 PDF 뷰어로 파일 열기 테스트
- 스캔된 PDF의 경우 OCR이 필요할 수 있음

#### 메모리 부족 오류
- 큰 PDF 파일의 경우 청크 크기 조정:
  ```env
  CHUNK_SIZE=500
  CHUNK_OVERLAP=100
  ```

### 기타 오류

#### 모듈을 찾을 수 없는 경우
```bash
# 현재 디렉토리 확인
pwd  # Linux/Mac
cd   # Windows

# backend 디렉토리에서 실행하는지 확인
ls main.py  # 파일 존재 확인
```

#### 가상환경이 활성화되지 않은 경우
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# 활성화 확인 (프롬프트에 (venv) 표시됨)
```

#### CORS 오류 (프론트엔드 연동 시)
- `main.py`의 CORS 설정 확인
- 프론트엔드 도메인을 `allow_origins`에 추가:
  ```python
  allow_origins=["http://localhost:3000", "https://your-domain.com"]
  ```

---

## 📞 추가 도움말

### 로그 확인
- 로그 파일 위치: `./logs/server_YYYYMMDD.log`
- 로그 레벨 변경: `.env` 파일에서 `LOG_LEVEL=DEBUG` 설정
- 실시간 로그 확인: 터미널 출력 또는 로그 파일 모니터링

### 에러 처리
- 모든 에러는 일관된 JSON 형식으로 반환됩니다
- 에러 응답 형식:
  ```json
  {
    "status": "error",
    "message": "에러 메시지",
    "detail": "상세 정보",
    "path": "/api/endpoint"
  }
  ```

### 문제 해결
문제가 지속되면:
1. 로그 확인: `./logs/` 디렉토리의 로그 파일 확인
2. API 문서 확인: http://localhost:8000/docs
3. 아키텍처 문서 확인: [ARCHITECTURE_IMPROVEMENTS.md](./ARCHITECTURE_IMPROVEMENTS.md)
4. 이슈 리포트: GitHub Issues에 문제 상세 내용 작성

---

## 📚 관련 문서

- [ARCHITECTURE_IMPROVEMENTS.md](./ARCHITECTURE_IMPROVEMENTS.md) - 아키텍처 개선 사항
- [BACKEND_LOGIC_CLEANUP.md](./BACKEND_LOGIC_CLEANUP.md) - 백엔드 로직 정리 보고서

---

## 📄 라이선스

MIT License

