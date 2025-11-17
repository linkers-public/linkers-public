# Linkus Legal - 청년 법률 리스크 탐지 플랫폼

AI 기반 계약/노동 리스크 분석 시스템으로, 청년 근로자들을 위한 법률 서비스를 제공합니다.

## 📋 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#️-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [빠른 시작](#-빠른-시작)
- [환경 설정](#-환경-설정)
- [백엔드 설정](#-백엔드-설정)
- [Legal RAG 모드](#-legal-rag-모드)
- [API 사용 가이드](#-api-사용-가이드)
- [문제 해결](#-문제-해결)

## 🚀 주요 기능

### 법률 서비스 (Linkus Legal)
- **법률 문제 분석**: 계약서나 법률 문서를 업로드하여 AI가 자동으로 법적 위험 요소를 분석합니다
- **위험도 점검**: 문서 분석 후 법적 위험도를 0~100점으로 제공하고 색상으로 구분합니다
- **법적 리스크 설명**: 분석된 리스크 항목과 해당 법적 근거를 상세히 제공합니다
- **추천 대응 방법**: 각 법적 문제에 대한 구체적인 해결책과 대응 방법을 제시합니다
- **법률 검색**: RAG 시스템을 통해 입력한 법적 상황에 대한 관련 법률 시나리오와 대응 방법을 조회합니다
- **상황별 분석**: 고용 형태, 근무 기간, 사회보험 등 상세 정보를 입력하여 맞춤형 법률 분석을 제공합니다

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
│   │   ├── legal/              # 법률/계약 RAG용 데이터
│   │   │   ├── laws/           # 근로기준법, 노동법 요약, 청년 노동 가이드
│   │   │   ├── standard_contracts/ # 표준 근로·용역·프리랜서·콘텐츠 계약서
│   │   │   ├── manuals/        # 직장 내 괴롭힘/성희롭 등 매뉴얼
│   │   │   └── cases/          # 가공된 시나리오/케이스 텍스트
│   │   ├── indexed/            # 인덱싱 완료 리포트
│   │   └── temp/               # 임시 파일
│   ├── main.py                 # FastAPI 메인 앱
│   ├── config.py               # 설정 관리
│   └── requirements.txt        # Python 의존성
│
├── src/                        # Next.js 프론트엔드
│   ├── app/                    # Next.js App Router
│   │   ├── legal/              # 법률 서비스 (Linkus Legal)
│   │   │   ├── page.tsx       # 법률 서비스 홈페이지
│   │   │   ├── layout.tsx     # 법률 서비스 레이아웃
│   │   │   ├── analysis/       # 법률 문제 분석 페이지
│   │   │   ├── search/        # 법률 검색 페이지
│   │   │   └── situation/     # 상황별 법률 분석 페이지
│   ├── components/            # React 컴포넌트
│   │   ├── legal/             # 법률 서비스 전용 컴포넌트
│   │   │   ├── FileUpload.tsx      # 파일 업로드
│   │   │   ├── RiskScore.tsx       # 위험도 점수 표시
│   │   │   ├── AnalysisResultCard.tsx  # 분석 결과 카드
│   │   │   └── SearchResultCard.tsx    # 검색 결과 카드
│   │   └── ui/                # 공통 UI 컴포넌트
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

> **⚠️ 중요**: `venv` 폴더는 `.gitignore`에 포함되어 있어 GitHub에 올라가지 않습니다.  
> 따라서 **처음 클론한 경우** 반드시 가상환경을 새로 생성하고 의존성을 설치해야 합니다.

#### Python 버전 확인
Python 3.9 이상이 필요합니다:
```bash
python --version
```

#### 가상환경 생성 및 활성화

**처음 클론한 경우 (필수):**
```bash
cd backend
python -m venv venv  # 가상환경 생성 (처음 한 번만)
```

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

> **참고**: 이미 가상환경이 생성되어 있다면 생성 단계는 생략하고 활성화만 하면 됩니다.

#### 의존성 설치 (필수)
```bash
# 가상환경 활성화 후 반드시 실행
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
법률 문서를 벡터 DB에 인덱싱하려면:

```bash
# PDF 파일을 backend/data/legal/ 폴더에 넣고
python scripts/batch_ingest.py data/legal --mode legal
```

## 🔧 환경 설정

### Frontend 환경 변수 (.env.local)

**최소 설정:**

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

### Backend 환경 변수 (backend/.env)

#### 기본 설정 (무료 스택)

**최소 설정** (Supabase만 설정):
```env
# Supabase 설정 (필수)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**기본값으로 활성화된 설정**:
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

### 기본 설정 (무료 스택)

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
-- 법률/계약 벡터 컬럼 설정 (legal RAG 모드 사용 시)
ALTER TABLE legal_chunks DROP COLUMN IF EXISTS embedding;
ALTER TABLE legal_chunks ADD COLUMN embedding vector(384);
```

**법률/계약 RAG 모드 사용 시 테이블 생성:**

```sql
-- legal_documents 테이블
CREATE TABLE IF NOT EXISTS legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    source TEXT,  -- 'moel', 'mss', 'mcst' 등
    file_path TEXT,
    doc_type TEXT,  -- 'law', 'standard_contract', 'manual', 'case'
    content_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- legal_chunks 테이블
CREATE TABLE IF NOT EXISTS legal_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
    section_title TEXT,  -- '제1조 (목적)' 등
    chunk_index INTEGER,
    text TEXT,
    embedding vector(384),
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_legal_chunks_document_id ON legal_chunks(legal_document_id);
CREATE INDEX IF NOT EXISTS idx_legal_chunks_embedding ON legal_chunks USING ivfflat (embedding vector_cosine_ops);

-- 선택사항: legal_document_bodies 테이블 (원본 본문 저장)
CREATE TABLE IF NOT EXISTS legal_document_bodies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
    text TEXT,
    mime TEXT DEFAULT 'text/plain',
    language TEXT DEFAULT 'ko',
    created_at TIMESTAMPTZ DEFAULT now()
);
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
# PDF 파일을 backend/data/legal/ 폴더에 넣고
python scripts/batch_ingest.py data/legal --mode legal
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

## 📚 Legal RAG 모드 (청년 법률/계약 네비게이터)

법률/계약 문서를 RAG로 인덱싱하고 검색/분석할 수 있는 모드입니다.

### 데이터 폴더 구조

```
backend/data/legal/
├── laws/              # 근로기준법, 노동법 요약, 청년 노동 가이드
├── standard_contracts/ # 표준 근로·용역·프리랜서·콘텐츠 계약서
├── manuals/           # 직장 내 괴롭힘/성희롭 등 매뉴얼
└── cases/             # 가공된 시나리오/케이스 텍스트 (직접 만든 md/txt)
```

### 인덱싱 방법

```bash
cd backend

# 법률 문서 인덱싱
python scripts/batch_ingest.py data/legal --mode legal

# 특정 폴더만 인덱싱 (예: laws 폴더만)
python scripts/batch_ingest.py data/legal/laws --mode legal

# 특정 형식만 처리 (예: PDF만)
python scripts/batch_ingest.py data/legal --mode legal --extensions .pdf
```

### 검색/분석 API

#### 1. 법률 문서 검색

```bash
GET /api/v2/legal/search?q=근로시간&limit=5&doc_type=law
```

**응답:**
```json
{
  "results": [
    {
      "legal_document_id": "uuid",
      "section_title": "제1조 (목적)",
      "text": "청크 텍스트...",
      "score": 0.85,
      "source": "moel",
      "doc_type": "law",
      "title": "근로기준법"
    }
  ],
  "count": 5,
  "query": "근로시간"
}
```

#### 2. 계약서 분석

```bash
POST /api/v2/legal/analyze-contract
Content-Type: multipart/form-data

file: [계약서 PDF]
title: "프리랜서 계약서" (선택)
```

**응답:**
```json
{
  "risk_score": 65.5,
  "risks": [
    {
      "clause": "계약 해지 조항",
      "risk_level": "high",
      "description": "일방적 해지 가능 조항이 포함되어 있습니다",
      "related_law": "제1조 (목적)"
    }
  ],
  "summary": "전체 요약...",
  "references": [
    {
      "section_title": "제1조 (목적)",
      "source": "moel",
      "text": "관련 법률 조문..."
    }
  ],
  "title": "프리랜서 계약서"
}
```

#### 3. 상황별 법률 분석

```bash
POST /api/v2/legal/analyze-situation
Content-Type: application/json

{
  "situation": "인턴 기간 중 해고당했습니다",
  "category": "probation",
  "employment_type": "intern",
  "work_period": "under_3_months",
  "social_insurance": ["employment", "health"]
}
```

### 특징

- **제n조 기준 청킹**: 법률 문서를 조(제n조) 단위로 자동 분할
- **섹션 제목 보존**: 각 청크에 조문 제목(section_title) 포함
- **벡터 검색**: pgvector 기반 유사도 검색
- **계약서 분석**: 업로드한 계약서의 위험 조항 자동 분석
- **상황별 맞춤 분석**: 고용 형태, 근무 기간 등 상세 정보 기반 분석

### 사용 예시

```bash
# 법률 문서 인덱싱
cd backend
python scripts/batch_ingest.py data/legal --mode legal

# 법률 검색 테스트
curl "http://localhost:8000/api/v2/legal/search?q=근로시간&limit=5"

# 계약서 분석 테스트
curl -X POST "http://localhost:8000/api/v2/legal/analyze-contract" \
  -F "file=@contract.pdf" \
  -F "title=프리랜서 계약서"
```

## 📱 주요 페이지

### 법률 서비스 (Linkus Legal)
- `/legal` - 법률 서비스 홈페이지 (Landing Page)
  - 서비스 소개 및 기능 안내
  - 법적 리스크 점검, 계약서 분석, 법적 시나리오 제공 소개
  - CTA 버튼 (문서 업로드, 법률 문제 분석 시작하기)
- `/legal/analysis` - 법률 문제 분석 페이지
  - 계약서/법률 문서 파일 업로드 (드래그 앤 드롭 지원)
  - 법적 상황 텍스트 입력
  - 위험도 점수 표시 (0~100점, 색상 구분)
  - 법적 리스크 설명 (법적 근거 포함)
  - 추천 대응 방법 제시
  - 관련 법적 시나리오 제공
- `/legal/search` - 법률 검색 페이지
  - 법적 상황 검색 입력
  - RAG 시스템 기반 검색 결과 제공
  - 각 시나리오별 법적 근거, 추천 대응 방법, 관련 법률 목록 표시
  - 위험도 레벨 표시 (높음/보통/낮음)
- `/legal/situation` - 상황별 법률 분석 페이지
  - 고용 형태, 근무 기간, 사회보험 등 상세 정보 입력
  - 법적 상황 텍스트 입력
  - 맞춤형 법률 분석 결과 제공
  - 관련 케이스 및 대응 방법 제시

## ⚖️ 법률 서비스 UI (Linkus Legal)

법률 서비스는 청년 법률 리스크 탐지를 위한 AI 기반 계약/노동 리스크 분석 시스템입니다.

### 주요 페이지

#### 1. 홈페이지 (`/legal`)
- **Hero Section**: 서비스 소개 및 강조된 CTA 버튼
- **기능 소개 카드**: 법적 리스크 점검, 계약서 분석, 법적 시나리오 제공
- **서비스 소개**: 각 기능에 대한 상세 설명
- **CTA Section**: 문서 업로드 및 법률 검색 버튼

#### 2. 법률 문제 분석 페이지 (`/legal/analysis`)
- **파일 업로드 섹션**: 
  - 드래그 앤 드롭 지원
  - PDF, DOC, DOCX, TXT 파일 지원
  - 파일 크기 제한 (기본 10MB)
- **텍스트 입력 섹션**: 
  - 법적 상황을 직접 텍스트로 입력
  - 파일 업로드와 텍스트 입력 중 선택 가능
- **분석 결과 표시**:
  - 위험도 점수 (0~100점, 색상 구분: 높음/보통/낮음)
  - 법적 리스크 설명 (제목, 설명, 법적 근거, 추천 대응 방법)
  - 관련 법적 시나리오 목록

#### 3. 법률 검색 페이지 (`/legal/search`)
- **검색 입력**: 법적 상황을 텍스트로 입력
- **검색 결과 카드**: 
  - 각 시나리오별로 카드 형태로 표시
  - 법적 근거 섹션
  - 추천 대응 방법 섹션
  - 관련 법률 목록
  - 위험도 레벨 표시 (높음/보통/낮음)

#### 4. 상황별 법률 분석 페이지 (`/legal/situation`)
- **상세 정보 입력**: 
  - 고용 형태 (정규직, 계약직, 인턴, 프리랜서 등)
  - 근무 기간 (3개월 미만, 3~12개월, 1~3년, 3년 이상)
  - 사회보험 가입 여부
  - 법적 상황 카테고리 선택
- **법적 상황 입력**: 
  - 상황을 자세히 텍스트로 입력
- **맞춤형 분석 결과**:
  - 위험도 점수 및 레벨
  - 법적 리스크 상세 설명
  - 관련 법률 조문
  - 추천 대응 방법
  - 유사 케이스 제공

### UI 컴포넌트

#### 공통 컴포넌트
- `Card`: 재사용 가능한 카드 컴포넌트 (`src/components/ui/card.tsx`)
- `Button`: 버튼 컴포넌트 (기존)
- `Input`: 입력 필드 컴포넌트 (기존)
- `Textarea`: 텍스트 영역 컴포넌트 (기존)

#### 법률 서비스 전용 컴포넌트
- `FileUpload` (`src/components/legal/FileUpload.tsx`): 
  - 파일 업로드 컴포넌트
  - 드래그 앤 드롭 지원
  - 파일 선택 및 제거 기능
- `RiskScore` (`src/components/legal/RiskScore.tsx`): 
  - 위험도 점수 표시 컴포넌트
  - 점수에 따른 색상 및 레벨 표시
  - 진행 바 표시
- `AnalysisResultCard` (`src/components/legal/AnalysisResultCard.tsx`): 
  - 분석 결과 카드 컴포넌트
  - 법적 리스크 설명 표시
  - 법적 근거 및 추천 대응 방법 포함
  - 관련 법적 시나리오 표시
- `SearchResultCard` (`src/components/legal/SearchResultCard.tsx`): 
  - 검색 결과 카드 컴포넌트
  - 시나리오, 법적 근거, 추천 대응 방법, 관련 법률 표시
  - 위험도 레벨 표시

### 레이아웃

법률 서비스는 전용 레이아웃을 사용합니다 (`src/app/legal/layout.tsx`):
- **헤더**: Linkus Legal 로고 및 네비게이션 메뉴
- **네비게이션**: 홈, 법률 문제 분석, 법률 검색, 상황별 분석 페이지 간 이동
- **푸터**: 저작권 정보

### 사용 방법

1. **법률 서비스 접속**: `/legal` 경로로 접속
2. **법률 문제 분석**:
   - `/legal/analysis` 페이지로 이동
   - 파일 업로드 또는 텍스트 입력
   - "분석 시작하기" 버튼 클릭
   - 분석 결과 확인
3. **법률 검색**:
   - `/legal/search` 페이지로 이동
   - 법적 상황을 검색창에 입력
   - "검색" 버튼 클릭 또는 Enter 키 입력
   - 검색 결과 확인
4. **상황별 분석**:
   - `/legal/situation` 페이지로 이동
   - 고용 형태, 근무 기간 등 상세 정보 입력
   - 법적 상황을 텍스트로 입력
   - "분석 시작하기" 버튼 클릭
   - 맞춤형 분석 결과 확인

### API 연동

현재는 시뮬레이션 데이터를 사용하고 있습니다. 실제 백엔드 API와 연동하려면:

1. **법률 문제 분석 API 연동**:
   - `src/app/legal/analysis/page.tsx`의 `handleAnalyze` 함수 수정
   - 백엔드 API 엔드포인트 호출 추가
   - 예: `POST /api/v2/legal/analyze-contract`

2. **법률 검색 API 연동**:
   - `src/app/legal/search/page.tsx`의 `handleSearch` 함수 수정
   - RAG 검색 API 엔드포인트 호출 추가
   - 예: `GET /api/v2/legal/search?q={query}`

3. **상황별 분석 API 연동**:
   - `src/app/legal/situation/page.tsx`의 `handleAnalyze` 함수 수정
   - 백엔드 API 엔드포인트 호출 추가
   - 예: `POST /api/v2/legal/analyze-situation`

### 디자인 특징

- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **일관된 UI**: Tailwind CSS 기반 디자인 시스템
- **사용자 경험**: 로딩 상태, 에러 처리, 직관적인 인터페이스
- **접근성**: 명확한 레이블, 색상 대비, 키보드 네비게이션 지원

## 📝 데이터 폴더 설명

### `backend/data/legal/`
법률/계약 RAG용 데이터 폴더입니다. 근로기준법, 표준 계약서, 매뉴얼 등을 넣고 legal 모드로 인덱싱합니다.

**사용 방법:**
```bash
cd backend
# 법률 문서 인덱싱
python scripts/batch_ingest.py data/legal --mode legal

# 특정 폴더만 인덱싱
python scripts/batch_ingest.py data/legal/laws --mode legal
```

**지원 형식:**
- PDF (`.pdf`)
- HWPX (`.hwpx`)
- HWP (`.hwp`)
- HTML (`.html`, `.htm`)
- TXT (`.txt`)
- Markdown (`.md`)

**폴더 구조:**
- `laws/`: 근로기준법, 노동법 요약, 청년 노동 가이드
- `standard_contracts/`: 표준 근로·용역·프리랜서·콘텐츠 계약서
- `manuals/`: 직장 내 괴롭힘/성희롭 등 매뉴얼
- `cases/`: 가공된 시나리오/케이스 텍스트

## 🔌 API 사용 가이드

### Backend API 엔드포인트

#### 1. 법률 문서 검색

```bash
GET /api/v2/legal/search?q=근로시간&limit=5&doc_type=law
```

**응답:**
```json
{
  "results": [
    {
      "legal_document_id": "uuid",
      "section_title": "제1조 (목적)",
      "text": "청크 텍스트...",
      "score": 0.85,
      "source": "moel",
      "doc_type": "law",
      "title": "근로기준법"
    }
  ],
  "count": 5,
  "query": "근로시간"
}
```

#### 2. 계약서 분석

```bash
POST /api/v2/legal/analyze-contract
Content-Type: multipart/form-data

file: [계약서 PDF]
title: "프리랜서 계약서" (선택)
```

**응답:**
```json
{
  "risk_score": 65.5,
  "risks": [
    {
      "clause": "계약 해지 조항",
      "risk_level": "high",
      "description": "일방적 해지 가능 조항이 포함되어 있습니다",
      "related_law": "제1조 (목적)"
    }
  ],
  "summary": "전체 요약...",
  "references": [
    {
      "section_title": "제1조 (목적)",
      "source": "moel",
      "text": "관련 법률 조문..."
    }
  ],
  "title": "프리랜서 계약서"
}
```

#### 3. 상황별 법률 분석

```bash
POST /api/v2/legal/analyze-situation
Content-Type: application/json

{
  "situation": "인턴 기간 중 해고당했습니다",
  "category": "probation",
  "employment_type": "intern",
  "work_period": "under_3_months",
  "social_insurance": ["employment", "health"]
}
```

**응답:**
```json
{
  "risk_score": 75.0,
  "risk_level": "high",
  "analysis": {
    "summary": "인턴 기간 중 해고는 법적으로 제한됩니다...",
    "legal_basis": "근로기준법 제27조...",
    "recommendations": [
      "해고 사유를 명확히 요구하세요",
      "근로감독관에 신고하세요"
    ]
  },
  "related_cases": [
    {
      "title": "인턴 해고 사례",
      "description": "...",
      "risk_level": "high"
    }
  ]
}
```

### cURL 예제

#### 1. 헬스 체크
```bash
curl http://localhost:8000/api/health
```

#### 2. 법률 검색
```bash
curl "http://localhost:8000/api/v2/legal/search?q=근로시간&limit=5"
```

#### 3. 계약서 분석
```bash
curl -X POST "http://localhost:8000/api/v2/legal/analyze-contract" \
  -F "file=@contract.pdf" \
  -F "title=프리랜서 계약서"
```

#### 4. 상황별 분석
```bash
curl -X POST "http://localhost:8000/api/v2/legal/analyze-situation" \
  -H "Content-Type: application/json" \
  -d '{
    "situation": "인턴 기간 중 해고당했습니다",
    "category": "probation",
    "employment_type": "intern",
    "work_period": "under_3_months",
    "social_insurance": ["employment", "health"]
  }'
```

### Swagger UI 사용 (권장)

1. 브라우저에서 http://localhost:8000/docs 접속
2. 각 API 엔드포인트를 클릭하여 "Try it out" 버튼 클릭
3. 필요한 파라미터 입력 후 "Execute" 버튼 클릭
4. 응답 결과 확인

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

### Ollama 연결 실패
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
