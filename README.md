# Linkus Public - 공공입찰 자동 분석 및 팀 매칭 플랫폼

메이커와 기업을 연결하는 프로젝트 매칭 플랫폼으로, RAG 기반 AI를 활용한 공공입찰 자동 분석 및 팀 매칭 시스템입니다.

## 📋 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#️-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [빠른 시작](#-빠른-시작)
- [환경 설정](#-환경-설정)
- [백엔드 설정](#-백엔드-설정)
- [RAG 사용 가이드](#-rag-사용-가이드)
- [배치 처리](#-배치-처리)
- [API 사용 가이드](#-api-사용-가이드)
- [문제 해결](#-문제-해결)

## 🚀 주요 기능

### 기업 고객 (Enterprise)
- **프로젝트 상담 신청**: 요구사항, 예산, 기간을 입력하여 프로젝트 상담을 신청할 수 있습니다
- **메이커 검색**: 간단한 태그/직무 필터를 통해 적합한 메이커를 검색할 수 있습니다
- **견적서 관리**: 받은 견적서를 검토하고 수락할 수 있습니다
- **프로젝트 진행 관리**: 마일스톤 기반으로 프로젝트 진행 상황을 관리할 수 있습니다
- **실시간 채팅**: 메이커 팀과 실시간으로 소통할 수 있습니다
- **공고 자동 분석**: RAG 기반 AI로 공공입찰 공고를 자동 분석하고 적합한 팀을 매칭합니다

### 메이커 (Maker)
- **프로필 관리**: 개인/팀 프로필을 등록하고 관리할 수 있습니다
- **프로젝트 검색**: 관심 있는 프로젝트를 검색하고 지원할 수 있습니다
- **견적서 작성**: 상담 요청에 대한 견적서를 작성하고 제출할 수 있습니다
- **프로젝트 진행**: 수락된 프로젝트의 진행 상황을 관리할 수 있습니다

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: React 18, Tailwind CSS
- **State Management**: Zustand
- **UI Components**: Radix UI

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.9+
- **RAG**: LangChain
- **Vector DB**: Supabase pgvector (기본값) 또는 ChromaDB
- **LLM**: Ollama (기본값, 무료) 또는 OpenAI (선택)
- **Embedding**: sentence-transformers (기본값, 무료) 또는 OpenAI (선택)
- **Document Processing**: PyPDF, pdfplumber

### Database & Storage
- **Database**: Supabase (PostgreSQL)
- **Vector Search**: pgvector (Supabase)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage

### Payment
- **Payment Gateway**: 사용 안 함 (해커톤 모드)

### Deployment
- **Frontend**: Vercel
- **Backend**: 독립 서버 또는 Vercel Serverless

## 📁 프로젝트 구조

```
linkers-public/
├── backend/                    # FastAPI 백엔드 서버
│   ├── api/                    # API 라우터
│   ├── core/                   # 핵심 RAG 모듈
│   ├── models/                 # 데이터 모델
│   ├── scripts/                # 배치 처리 스크립트
│   ├── data/                   # 데이터 저장소
│   │   ├── announcements/     # 공고 문서 폴더
│   │   ├── sample_data/        # 샘플 데이터
│   │   └── chroma_db/          # 벡터 DB (자동 생성)
│   ├── main.py                 # FastAPI 메인 앱
│   ├── config.py               # 설정 관리
│   └── requirements.txt        # Python 의존성
│
├── src/                        # Next.js 프론트엔드
│   ├── app/                    # Next.js App Router
│   │   ├── (home)/            # 홈페이지 및 일반 사용자 페이지
│   │   ├── enterprise/        # 기업 고객 전용
│   │   ├── upload/            # 공고 업로드
│   │   ├── analysis/[docId]/  # AI 분석 결과
│   │   └── match/[docId]/     # 팀 매칭
│   ├── components/            # React 컴포넌트
│   ├── lib/                   # 유틸리티 및 라이브러리
│   │   └── rag/               # RAG 라이브러리
│   ├── apis/                  # API 서비스 함수
│   ├── stores/                # 상태 관리
│   └── supabase/              # Supabase 클라이언트
│
├── package.json               # Node.js 의존성
└── README.md                  # 이 문서
```

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone [repository-url]
cd linkers-public
```

### 2. Frontend 설정

#### 의존성 설치
```bash
npm install
```

#### 환경 변수 설정
프로젝트 루트에 `.env.local` 파일을 생성:

```env
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Backend API URL (선택, 기본값: http://localhost:8000)
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000

# Site URL (OAuth 리다이렉트용, 선택)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

```

#### 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 3. Backend 설정

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

#### 환경 변수 설정
`backend/.env` 파일을 생성 (최소 설정):

```env
# Supabase 설정 (필수)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**참고**: 다음 설정들은 기본값으로 이미 활성화되어 있습니다:
- ✅ 로컬 임베딩 (sentence-transformers)
- ✅ Ollama LLM (로컬)
- ✅ Supabase pgvector

**선택적 설정** (필요시 추가):
```env
# Ollama 설정 (기본값: http://localhost:11434, llama3)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# 로컬 임베딩 모델 (기본값: BAAI/bge-small-en-v1.5)
LOCAL_EMBEDDING_MODEL=BAAI/bge-small-en-v1.5

# ChromaDB 사용하려면
USE_CHROMADB=true
CHROMA_PERSIST_DIR=./data/chroma_db

# Server Settings (선택)
HOST=0.0.0.0
PORT=8000
```

#### 서버 실행
```bash
python main.py
```

또는:

```bash
python -m uvicorn main:app --reload
```

서버가 정상적으로 실행되면:
- **API 문서 (Swagger UI)**: http://localhost:8000/docs
- **헬스 체크**: http://localhost:8000/api/health
- **프론트엔드**: http://localhost:3000 (별도 터미널에서 `npm run dev`)

#### 문서 인덱싱 (선택)
문서를 벡터 DB에 인덱싱하려면:

```bash
# PDF 파일을 backend/data/announcements/ 폴더에 넣고
python scripts/simple_ingest.py
```

## 🔧 환경 설정

### Frontend 환경 변수 (.env.local)

**해커톤 모드 최소 설정:**

프로젝트 루트에 `.env.local` 파일을 생성:

```env
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Backend API URL (선택, 기본값: http://localhost:8000)
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000

# Site URL (OAuth 리다이렉트용, 선택)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**참고:**
- OpenAI API 키가 필요 없습니다 (무료 스택 사용)
- 포트원 관련 설정도 필요 없습니다

**선택적 설정:**
```env
# Storage (선택)
NEXT_PUBLIC_STORAGE_BUCKET=your_bucket_name
```

### Backend 환경 변수 (backend/.env)

#### 기본 설정 (해커톤 모드 - 무료 스택)

**최소 설정** (Supabase만 설정):
```env
# Supabase 설정 (필수)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**기본값으로 활성화된 설정**:
- ✅ 해커톤 모드 (무료 스택)
- ✅ 로컬 임베딩 (sentence-transformers)
- ✅ Ollama LLM (로컬)
- ✅ Supabase pgvector

**선택적 설정** (필요시 추가):
```env
# Ollama 설정 (기본값: http://localhost:11434, llama3)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3  # 또는 mistral, phi3

# 로컬 임베딩 모델 (기본값: BAAI/bge-small-en-v1.5)
LOCAL_EMBEDDING_MODEL=BAAI/bge-small-en-v1.5

# ChromaDB 사용하려면
USE_CHROMADB=true
CHROMA_PERSIST_DIR=./data/chroma_db

# Chunk Settings (선택)
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# Server Settings (선택)
HOST=0.0.0.0
PORT=8000
```


### 🔐 보안 주의사항

1. **절대 커밋하지 마세요**
   - `.env.local`과 `backend/.env`는 `.gitignore`에 포함되어 있습니다
   - 실제 API 키는 절대 Git에 커밋하지 마세요

2. **환경별 분리**
   - 개발: `.env.local`
   - 프로덕션: Vercel 환경 변수 설정 사용

## 🖥️ 백엔드 설정

### 기본 설정 (해커톤 모드 - 무료 스택)

#### 1. 의존성 설치

```bash
cd backend
pip install -r requirements.txt
```

**Windows에서 sentence-transformers 설치 오류 시:**
- Windows Long Path 활성화 필요 (관리자 PowerShell):
  ```powershell
  New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
  ```
- 재시작 후 `pip install sentence-transformers` 재시도

#### 2. 환경 변수 설정

`backend/.env` 파일 생성 (최소 설정):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### 3. Ollama 설치 (선택 - LLM 답변 생성용)

**Ollama 없이도 검색 기능은 작동합니다!**

LLM 답변 생성을 원하면:
```bash
# Ollama 설치 (https://ollama.ai/download)
# Windows: 다운로드 후 설치
# Mac: brew install ollama
# Linux: curl -fsSL https://ollama.com/install.sh | sh

# 모델 다운로드 (한국어 성능 순서)
ollama pull mistral   # 4.1GB, 한국어 성능 가장 좋음 (추천)
ollama pull llama3    # 4.7GB, 영어 중심
ollama pull phi3      # 2.3GB, 매우 빠름, 한국어 제한적
```

**한국어 답변 품질 개선:**
- `mistral` 모델이 한국어 성능이 가장 좋습니다
- 모델 변경 후 `.env` 파일에서 `OLLAMA_MODEL=mistral`로 설정

#### 4. Supabase 벡터 컬럼 설정

Supabase SQL Editor에서 실행:
```sql
-- 벡터 컬럼을 384차원으로 설정 (bge-small-en-v1.5 사용 시)
ALTER TABLE announcement_chunks DROP COLUMN IF EXISTS embedding;
ALTER TABLE announcement_chunks ADD COLUMN embedding vector(384);
```

#### 5. 서버 실행

```bash
python main.py
```

또는:

```bash
python -m uvicorn main:app --reload
```

#### 6. 문서 인덱싱 (선택)

```bash
# PDF 파일을 backend/data/announcements/ 폴더에 넣고
python scripts/simple_ingest.py
```

### 서버 실행 방법

#### 방법 1: Python 직접 실행
```bash
cd backend
python main.py
```

#### 방법 2: Uvicorn 직접 실행
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 방법 3: 실행 스크립트 사용 (Windows)
```bash
cd backend
START_SERVER.bat
```

### 서버 확인

서버가 정상적으로 실행되면 다음 URL에서 확인할 수 있습니다:

- **API 문서 (Swagger UI)**: http://localhost:8000/docs
- **ReDoc 문서**: http://localhost:8000/redoc
- **헬스 체크**: http://localhost:8000/api/health

터미널에서 헬스 체크:
```bash
curl http://localhost:8000/api/health
```

정상 응답 예시:
```json
{
  "status": "ok",
  "message": "Linkus Public RAG API is running"
}
```

## 📚 RAG 사용 가이드

### 빠른 시작 (해커톤 모드)

#### 1단계: 환경 설정 (이미 완료)
- ✅ 해커톤 모드 기본값 활성화
- ✅ Supabase 설정 완료

#### 2단계: 문서 준비 및 인덱싱
```bash
# PDF 파일을 backend/data/announcements/ 폴더에 넣고
cd backend
python scripts/simple_ingest.py
```

#### 3단계: 서버 실행
```bash
# Backend 서버
cd backend
python main.py

# Frontend 서버 (별도 터미널)
npm run dev

# Streamlit UI (선택, 별도 터미널)
cd frontend
python -m streamlit run streamlit_app.py
```

#### 4단계: 검색 테스트

**Streamlit UI 사용:**
- 브라우저에서 `http://localhost:8501` 접속하여 질문 입력

**또는 API 직접 사용:**
```bash
curl "http://localhost:8000/api/v2/announcements/search?query=문서의%20핵심%20내용은&limit=5"
```

### 완료 확인

```sql
-- Supabase SQL Editor에서
SELECT COUNT(*) FROM announcements;        -- 1 이상이어야 함
SELECT COUNT(*) FROM announcement_chunks;  -- 1 이상이어야 함
```

### 이제 할 수 있는 것

- ✅ 문서 검색 (벡터 검색)
- ✅ 관련 문서 찾기
- ✅ LLM 답변 생성 (Ollama 설치 시)
- ✅ 문서 업로드 및 인덱싱

## 📦 배치 처리

### 빠른 시작

#### 방법 1: 간단한 인덱싱 (추천)

```bash
# 1. 공고 PDF들을 폴더에 모음
mkdir -p backend/data/announcements
# PDF 파일들을 복사

# 2. 인덱싱 실행
cd backend
python scripts/simple_ingest.py
```

#### 방법 2: 배치 처리 (일괄 인입)

```bash
# 1. 공고 PDF들을 폴더에 모음
mkdir -p backend/data/announcements
# PDF 파일들을 복사

# 2. 배치 처리 실행
cd backend
python scripts/batch_ingest.py data/announcements
```

#### 방법 3: 폴더 감시 (자동 인입)

```bash
# 1. 감시 폴더 설정
cd backend
python scripts/watch_folder.py data/announcements

# 2. 새 파일을 폴더에 드롭
# 자동으로 처리됨!

# 3. 종료: Ctrl+C
```

### 폴더 구조 예시

```
backend/data/
└── announcements/
    ├── 나라장터_2024-001_웹사이트구축.pdf
    ├── 조달청_2024-002_모바일앱개발.hwpx
    ├── 수기_샘플공고.hwp
    ├── 기타공고.txt
    ├── 공고문_2024-003_시스템개발.html
    └── ...
```

**지원 형식**: 
- ✅ **PDF** (`.pdf`) - PyPDF로 텍스트 추출
- ✅ **HWPX** (`.hwpx`) - ZIP 압축 해제 후 XML에서 텍스트 추출 (권장)
- ✅ **HWP** (`.hwp`) - 바이너리 형식, 외부 변환 서비스 권장
- ✅ **HTML** (`.html`, `.htm`) - HTML 파서로 텍스트 추출
- ✅ **TXT** (`.txt`) - 직접 텍스트 읽기

### 사용 방법

#### 배치 처리

```bash
# 기본 (모든 지원 형식 처리: PDF, TXT, HWP, HWPX, HTML)
python scripts/batch_ingest.py ./data/announcements

# 특정 형식만 처리
python scripts/batch_ingest.py ./data/announcements --extensions .pdf
python scripts/batch_ingest.py ./data/announcements --extensions .hwpx
python scripts/batch_ingest.py ./data/announcements --extensions .html .htm

# HWPX와 HTML 함께 처리
python scripts/batch_ingest.py ./data/announcements --extensions .hwpx .html

# 병렬 처리 (빠름)
python scripts/batch_ingest.py ./data/announcements --parallel --max-workers 5

# 리포트 저장
python scripts/batch_ingest.py ./data/announcements --report ./reports/batch.json
```

#### 폴더 감시

```bash
# 기본 (모든 지원 형식 감시: PDF, TXT, HWP, HWPX, HTML)
python scripts/watch_folder.py ./data/announcements

# 특정 형식만 감시
python scripts/watch_folder.py ./data/announcements --extensions .pdf
python scripts/watch_folder.py ./data/announcements --extensions .hwpx
python scripts/watch_folder.py ./data/announcements --extensions .html .htm
```

### 파일명 규칙

파일명에서 메타데이터를 자동 추출:

**형식**: `{source}_{external_id}_{title}.{확장자}`

**예시**:
- `나라장터_2024-001_웹사이트구축.pdf`
  - source: 나라장터
  - external_id: 2024-001
  - title: 웹사이트구축
- `조달청_2024-002_모바일앱개발.hwpx`
  - source: 조달청
  - external_id: 2024-002
  - title: 모바일앱개발
- `정보통신시스템_2024-003_유지관리.html`
  - source: 정보통신시스템
  - external_id: 2024-003
  - title: 유지관리

**기본값** (규칙을 따르지 않으면):
- source: batch_upload
- external_id: 파일명
- title: 파일명

**지원 형식 상세**:
- **PDF** (`.pdf`): PyPDF로 텍스트 추출
- **HWPX** (`.hwpx`): ZIP 압축 해제 후 XML에서 텍스트 추출 (권장)
- **HWP** (`.hwp`): 바이너리 형식, 외부 변환 서비스 권장
- **HTML** (`.html`, `.htm`): HTML 파서로 텍스트 추출
- **TXT** (`.txt`): 직접 텍스트 읽기

### 확인 방법

```sql
-- Supabase SQL Editor에서
SELECT COUNT(*) FROM announcements;
SELECT COUNT(*) FROM announcement_chunks;

-- 최근 처리된 공고
SELECT id, title, source, created_at 
FROM announcements 
ORDER BY created_at DESC 
LIMIT 10;
```

### 검색 API 사용

```bash
# 질문하기
curl "http://localhost:8000/api/v2/announcements/search?query=문서의%20핵심%20내용은&limit=5"
```

## 🔌 API 사용 가이드

### Backend API 엔드포인트

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

### cURL 예제

#### 1. 헬스 체크
```bash
curl http://localhost:8000/api/health
```

#### 2. 공고 검색 (RAG Q&A)
```bash
curl "http://localhost:8000/api/v2/announcements/search?query=문서의%20핵심%20내용은&limit=5"
```

#### 3. 공고 업로드 및 분석
```bash
curl -X POST "http://localhost:8000/api/v2/announcements/upload" \
  -F "file=@sample_announcement.pdf" \
  -F "title=샘플 공고" \
  -F "source=나라장터"
```

### Swagger UI 사용 (권장)

1. 브라우저에서 http://localhost:8000/docs 접속
2. 각 API 엔드포인트를 클릭하여 "Try it out" 버튼 클릭
3. 필요한 파라미터 입력 후 "Execute" 버튼 클릭
4. 응답 결과 확인

## 📱 주요 페이지

### 일반 사용자
- `/` - 랜딩 페이지
- `/search-projects` - 프로젝트 검색
- `/search-makers` - 메이커 검색
- `/profile/[username]` - 프로필 보기
- `/my/profile` - 내 프로필 관리

### 기업 고객
- `/enterprise` - 기업 홈
- `/enterprise/counsel-form` - 상담 신청
- `/enterprise/my-counsel` - 상담 목록
- `/enterprise/(dashboard)/estimate-list/[counselId]` - 견적서 목록
- `/enterprise/(dashboard)/manager-team/[counselId]` - 프로젝트 진행 관리

### RAG 기능
- `/upload` - 공고 업로드
- `/analysis/[docId]` - AI 분석
- `/match/[docId]` - 팀 매칭
- `/compare/[docId]` - 견적 비교

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

#### API 사용량 제한
- OpenAI 대시보드에서 사용량 확인
- 필요시 더 높은 등급의 API 키 사용

### Ollama 연결 실패 (해커톤 모드)
```bash
# Ollama 서버 실행 확인
ollama serve

# 다른 터미널에서 테스트
ollama run llama3
```

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
- 프론트엔드 도메인을 `allow_origins`에 추가

## 📝 데이터 폴더 설명

### `backend/data/announcements/`
공고 문서 파일(PDF, HWPX, HWP, HTML, TXT)을 넣고 배치 처리 스크립트를 실행하면 자동으로 RAG에 반영됩니다.

**지원 형식**:
- PDF (`.pdf`)
- HWPX (`.hwpx`) - 권장, XML 기반으로 정확한 텍스트 추출
- HWP (`.hwp`) - 바이너리 형식, 외부 변환 서비스 권장
- HTML (`.html`, `.htm`)
- TXT (`.txt`)

**사용 방법:**
```bash
cd backend
# 모든 지원 형식 처리
python scripts/batch_ingest.py data/announcements

# 특정 형식만 처리 (예: HWPX만)
python scripts/batch_ingest.py data/announcements --extensions .hwpx
```

### `backend/data/sample_data/`
테스트용 샘플 데이터를 저장하는 폴더입니다.

**필요한 샘플 데이터:**
1. **공고 PDF 파일**
   - `sample_announcement_1.pdf`
   - `sample_announcement_2.pdf`
   - `sample_announcement_3.pdf`

2. **팀 프로필 데이터** (JSON 형식)
   - `teams.json`

## 🚀 배포

### Vercel 배포 (Frontend)
```bash
npm run build
```

Vercel 플랫폼을 사용하여 쉽게 배포할 수 있습니다.

### Backend 배포
- 독립 서버 (AWS EC2, Google Cloud, Azure 등)
- Vercel Serverless Functions
- Docker 컨테이너

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 추가 도움말

문제가 지속되면:
1. 로그 확인: 터미널에 출력되는 오류 메시지 확인
2. API 문서 확인: http://localhost:8000/docs
3. 이슈 리포트: GitHub Issues에 문제 상세 내용 작성
