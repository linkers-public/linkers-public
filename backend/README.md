# Linkus Public RAG Backend

공공입찰 자동 분석 및 팀 매칭을 위한 RAG 파이프라인 백엔드 서버입니다.

## 📑 목차

1. [빠른 시작](#-빠른-시작)
2. [프로젝트 구조](#-프로젝트-구조)
3. [주요 기능](#-주요-기능)
4. [관련 문서](#-관련-문서)
5. [라이선스](#-라이선스)

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

API 엔드포인트에 대한 상세 설명은 [API_REFERENCE.md](./API_REFERENCE.md)를 참고하세요.

**주요 엔드포인트:**
- `POST /api/announcements/upload` - 공고 업로드 및 분석
- `GET /api/announcements/{announcement_id}/match` - 팀 매칭
- `POST /api/estimates/generate` - 견적서 생성
- `POST /api/v2/legal/analyze-contract` - 계약서 분석
- `GET /api/v2/legal/contracts/{doc_id}` - 계약서 분석 결과 조회
- `GET /api/v2/legal/contracts/history` - 계약서 히스토리 조회

**API 문서:** http://localhost:8000/docs

---

## 🧪 테스트

테스트 방법 및 예제는 [TESTING.md](./TESTING.md)를 참고하세요.

**빠른 테스트:**
- Swagger UI: http://localhost:8000/docs
- 헬스 체크: `curl http://localhost:8000/api/health`

---

## 🔧 설정

환경 변수 및 설정에 대한 상세 설명은 [CONFIGURATION.md](./CONFIGURATION.md)를 참고하세요.

**필수 설정:**
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`

**주요 설정:**
- LLM 설정 (Ollama/OpenAI)
- 임베딩 설정
- 청크 설정
- 서버 설정
- 로깅 설정

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

## 🏗️ 아키텍처

아키텍처 개선 사항에 대한 상세 내용은 [ARCHITECTURE_IMPROVEMENTS.md](./ARCHITECTURE_IMPROVEMENTS.md)를 참고하세요.

**주요 개선 사항:**
- 공통 에러 핸들러
- 로깅 설정 통합
- 의존성 주입 패턴

---

## 🚨 문제 해결

문제 해결 가이드는 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)를 참고하세요.

**일반적인 문제:**
- 서버 시작 오류
- 의존성 설치 오류
- ChromaDB 관련 문제
- OpenAI API 관련 문제
- PDF 처리 관련 문제

---

## 📚 관련 문서

### 핵심 문서
- [API_REFERENCE.md](./API_REFERENCE.md) - API 엔드포인트 상세 설명
- [TESTING.md](./TESTING.md) - 테스트 방법 및 예제
- [CONFIGURATION.md](./CONFIGURATION.md) - 환경 변수 및 설정 가이드
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 문제 해결 가이드

### 아키텍처 및 로직 문서
- [BACKEND_LOGIC_EXPLANATION.md](./BACKEND_LOGIC_EXPLANATION.md) - 백엔드 로직 상세 설명 (청킹, RAG, 검색)
- [ARCHITECTURE_IMPROVEMENTS.md](./ARCHITECTURE_IMPROVEMENTS.md) - 아키텍처 개선 사항
- [BACKEND_LOGIC_CLEANUP.md](./BACKEND_LOGIC_CLEANUP.md) - 백엔드 로직 정리 보고서

---

## 📄 라이선스

MIT License

