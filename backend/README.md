# Linkus Public RAG Backend

공공입찰 자동 분석 및 팀 매칭을 위한 RAG 파이프라인 백엔드 서버입니다.

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
# OpenAI API (필수)
OPENAI_API_KEY=your_openai_api_key_here

# Vector DB 저장 경로 (선택, 기본값: ./data/chroma_db)
CHROMA_PERSIST_DIR=./data/chroma_db

# Embedding Model (선택, 기본값: text-embedding-3-small)
EMBEDDING_MODEL=text-embedding-3-small

# LLM Model (선택, 기본값: gpt-4o-mini)
LLM_MODEL=gpt-4o-mini
LLM_TEMPERATURE=0.1

# Chunk Settings (선택)
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# Server Settings (선택)
HOST=0.0.0.0
PORT=8000
```

**중요:** `.env` 파일은 반드시 생성해야 하며, `OPENAI_API_KEY`는 필수입니다.

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

## 📁 프로젝트 구조

```
backend/
├── main.py                 # FastAPI 메인
├── config.py               # 설정
├── requirements.txt
│
├── core/
│   ├── document_processor.py   # 문서 처리
│   ├── vector_store.py         # 벡터 DB
│   ├── retriever.py            # 검색 엔진
│   ├── generator.py            # LLM 생성
│   └── orchestrator.py         # RAG 통합
│
├── models/
│   └── schemas.py              # Pydantic 모델
│
├── api/
│   └── routes.py               # API 엔드포인트
│
└── data/
    ├── chroma_db/              # 벡터 DB 저장소
    ├── temp/                   # 임시 파일
    └── sample_data/            # 샘플 데이터
```

## 🔌 API 엔드포인트

### 1. 공고 업로드 및 분석

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

### 2. 팀 매칭

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

### 3. 견적서 생성

```bash
POST /api/estimates/generate
Content-Type: application/json

{
  "announcement_id": "anno_abc123",
  "team_id": "team_001"
}
```

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

## 🔧 설정

### 환경 변수

- `OPENAI_API_KEY`: OpenAI API 키 (필수)
- `CHROMA_PERSIST_DIR`: ChromaDB 저장 경로 (기본: `./data/chroma_db`)
- `EMBEDDING_MODEL`: 임베딩 모델 (기본: `text-embedding-3-small`)
- `LLM_MODEL`: LLM 모델 (기본: `gpt-4o-mini`)
- `CHUNK_SIZE`: 청크 크기 (기본: 1000)
- `CHUNK_OVERLAP`: 청크 오버랩 (기본: 200)

## 📝 주요 기능

1. **문서 처리**: PDF 업로드 및 텍스트 추출
2. **벡터 저장**: ChromaDB를 사용한 임베딩 저장
3. **유사도 검색**: 벡터 유사도 기반 검색
4. **LLM 생성**: GPT를 사용한 분석 및 견적 생성
5. **팀 매칭**: 요구사항 기반 팀 추천

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

## 📞 추가 도움말

문제가 지속되면:
1. 로그 확인: 터미널에 출력되는 오류 메시지 확인
2. API 문서 확인: http://localhost:8000/docs
3. 이슈 리포트: GitHub Issues에 문제 상세 내용 작성

## 📄 라이선스

MIT License

