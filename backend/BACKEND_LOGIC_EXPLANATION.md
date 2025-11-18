# 백엔드 로직 상세 설명

## 개요
이 문서는 백엔드의 핵심 로직인 청킹(Chunking), RAG 구성, 벡터 검색에 대해 상세히 설명합니다.

## ⚠️ 중요 사항

**현재 프로젝트는 법률 리스크 분석에 집중하고 있으며, 공고 관련 기능은 레거시입니다.**

- ✅ **현재 사용 중**: `legal_chunks` 테이블 (법률 문서 검색)
- ⚠️ **레거시 (사용 안 함)**: `announcement_chunks` 테이블 (공고 검색)
- ✅ **현재 사용 중**: `contract_analyses`, `contract_issues` 테이블 (계약서 분석 결과)

## 📄 1. 문서 처리 및 청킹 (Chunking)

### 1.1 문서 처리 파이프라인

```
파일 업로드 → 텍스트 추출 → 청크 분할 → 임베딩 생성 → 벡터 저장
```

### 1.2 텍스트 추출

**지원 파일 형식:**
- PDF: PyMuPDF → pdfplumber → pypdf → OCR (순차 시도)
- HWP/HWPX/HWPS: XML 파싱 또는 외부 변환 서비스
- HTML: HTML 파서로 텍스트 추출
- TXT: 직접 읽기

**코드 위치:** `core/document_processor_v2.py`

```python
# PDF 처리 예시
def pdf_to_text(self, pdf_path: str) -> str:
    # 1. PyMuPDF 시도 (가장 강력)
    # 2. pdfplumber 시도 (표 처리에 좋음)
    # 3. pypdf 시도 (기본 방법)
    # 4. OCR 시도 (스캔된 PDF용)
```

### 1.3 청킹 (Chunking) 전략

**청킹 알고리즘:**
- **방식**: Recursive Character Text Splitter (간단한 구현)
- **청크 크기**: 기본 1000자 (`CHUNK_SIZE` 환경 변수로 조정)
- **오버랩**: 기본 200자 (`CHUNK_OVERLAP` 환경 변수로 조정)
- **구분자 우선순위**: `["\n\n", "\n", ". ", " ", ""]`

**청킹 과정:**

```python
# core/document_processor_v2.py의 SimpleTextSplitter

1. 텍스트를 chunk_size 단위로 분할
2. 각 청크의 끝에서 구분자(줄바꿈, 문장 끝 등)를 찾아 자연스러운 분할
3. 오버랩을 고려하여 다음 청크 시작 위치 결정
4. 빈 청크 제거 및 정제
```

**청킹 예시:**
```
원본 텍스트 (3000자)
↓
청크 1: 0-1000자 (구분자에서 분할)
청크 2: 800-1800자 (200자 오버랩)
청크 3: 1600-2600자 (200자 오버랩)
청크 4: 2400-3000자 (마지막)
```

**청킹 메타데이터:**
각 청크는 다음 메타데이터를 포함합니다:
- `chunk_index`: 청크 순서 (0부터 시작)
- `chunk_size`: 청크 길이
- `total_chunks`: 전체 청크 개수
- `source`: 문서 출처
- `external_id`: 외부 ID
- `title`: 문서 제목

### 1.4 텍스트 정제

```python
def _clean_text(self, text: str) -> str:
    # 중복 공백 제거
    text = re.sub(r'\s+', ' ', text)
    # 불필요한 특수문자 제거 (한글, 영문, 숫자, 기본 구두점만 유지)
    text = re.sub(r'[^\w\s가-힣.,()%\-:/]', '', text)
    return text.strip()
```

## 🔍 2. RAG (Retrieval-Augmented Generation) 구성

### 2.1 RAG 아키텍처

```
┌─────────────────┐
│  사용자 쿼리     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 쿼리 임베딩 생성 │ (sentence-transformers)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 벡터 유사도 검색 │ (Supabase pgvector)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 관련 문서 청크   │ (Top-K 검색)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ LLM 컨텍스트 구성│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ LLM 답변 생성    │ (Ollama/OpenAI)
└─────────────────┘
```

### 2.2 RAG 파이프라인 상세

**코드 위치:** `core/orchestrator_v2.py`

#### 단계 1: 문서 인입 및 저장
```python
def process_announcement(meta, text):
    # 1. 중복/버전 판별 (content_hash)
    announcement_id = store.upsert_announcement(meta, text)
    
    # 2. 텍스트 → 청크 분할
    chunks = processor.to_chunks(text, base_meta)
    
    # 3. 청크 → 임베딩 생성
    embeddings = generator.embed(chunk_texts)
    
    # 4. 벡터 저장 (pgvector)
    store.bulk_upsert_chunks(announcement_id, chunk_payload)
    
    # 5. LLM 구조화 분석
    analysis_result = generator.analyze_announcement(text, seed_meta)
    
    # 6. 분석 결과 저장
    store.save_analysis(announcement_id, analysis_result, score)
```

#### 단계 2: 검색 및 답변 생성
```python
def search_similar_announcements(query, top_k=5):
    # 1. 쿼리 임베딩 생성
    query_embedding = generator.embed_one(query)
    
    # 2. 벡터 검색
    results = store.search_similar_chunks(
        query_embedding,
        top_k=top_k,
        filters=filters
    )
    
    return results
```

### 2.3 임베딩 생성

**임베딩 모델:**
- **로컬 임베딩**: `sentence-transformers` 사용
- **기본 모델**: `BAAI/bge-small-en-v1.5` (384차원)
- **문서 임베딩**: `BAAI/bge-m3` (1024차원, 다국어 지원)
- **기업 임베딩**: `BAAI/bge-small-en-v1.5` (384차원, 빠름)

**코드 위치:** `core/generator_v2.py`

```python
def embed(self, texts: List[str]) -> List[List[float]]:
    # sentence-transformers 사용
    model = SentenceTransformer(settings.local_embedding_model)
    embeddings = model.encode(texts, convert_to_numpy=True)
    return embeddings.tolist()
```

### 2.4 벡터 저장

**저장소:**
- **Supabase pgvector**: PostgreSQL의 pgvector 확장 사용
- **현재 사용 중인 테이블:**
  - ✅ `legal_chunks`: 법률 문서 청크 및 임베딩 (현재 사용 중)
  - ⚠️ `announcement_chunks`: 공고 청크 및 임베딩 (레거시, 사용하지 않음)
  - ⚠️ `team_embeddings`: 팀 임베딩 (레거시, 사용하지 않음)

**코드 위치:** `core/supabase_vector_store.py`

**법률 문서 청크 저장 예시:**
```python
# legal_chunks 테이블에 저장
def upsert_legal_chunks(chunks):
    payload = [{
        "external_id": chunk["external_id"],
        "source_type": chunk["source_type"],  # "law", "manual", "case"
        "title": chunk["title"],
        "content": chunk["content"],
        "embedding": chunk["embedding"],  # float[] 배열 (384차원)
        "metadata": chunk.get("metadata", {}),
        "chunk_index": chunk.get("chunk_index", 0)
    } for chunk in chunks]
    
    sb.table("legal_chunks").upsert(payload, on_conflict="external_id,chunk_index").execute()
```

**레거시 코드 (참고용):**
```python
# announcement_chunks는 더 이상 사용하지 않음
def bulk_upsert_chunks(announcement_id, chunks):  # 레거시
    payload = [{
        "announcement_id": announcement_id,
        "chunk_index": c["chunk_index"],
        "content": c["content"],
        "embedding": c["embedding"],
        "metadata": c.get("metadata", {})
    } for c in chunks]
    
    sb.table("announcement_chunks").insert(payload).execute()  # 사용 안 함
```

## 🔎 3. 벡터 검색 (Vector Search)

### 3.1 검색 방식

**검색은 쿼리 중심 (Query-based)입니다.**

1. **사용자 쿼리** → **임베딩 벡터 변환**
2. **임베딩 벡터** → **코사인 유사도 계산**
3. **유사도 순 정렬** → **Top-K 결과 반환**

### 3.2 검색 프로세스

**코드 위치:** `core/supabase_vector_store.py`

#### ✅ 현재 사용 중: 법률 문서 검색 (`legal_chunks`)

```python
def search_similar_legal_chunks(query_embedding, top_k=5, filters=None):
    # legal_chunks 테이블에서 검색
    query = sb.table("legal_chunks").select("*")
    
    # source_type 필터링 (law, manual, case 등)
    if filters and "source_type" in filters:
        query = query.eq("source_type", filters["source_type"])
    
    chunks = query.execute().data
    
    # 클라이언트 측 코사인 유사도 계산
    import numpy as np
    query_vec = np.array(query_embedding, dtype=np.float32)
    
    results = []
    for chunk in chunks:
        if chunk.get("embedding"):
            chunk_vec = np.array(chunk["embedding"], dtype=np.float32)
            
            # 코사인 유사도 = dot product / (norm1 * norm2)
            similarity = np.dot(query_vec, chunk_vec) / (
                np.linalg.norm(query_vec) * np.linalg.norm(chunk_vec)
            )
            
            if similarity > 0.7:  # 임계값
                results.append({
                    "id": chunk["id"],
                    "external_id": chunk.get("external_id", ""),
                    "source_type": chunk.get("source_type", "law"),
                    "title": chunk.get("title", ""),
                    "content": chunk.get("content", ""),
                    "score": float(similarity),
                    "metadata": chunk.get("metadata", {})
                })
    
    # 유사도 순 정렬
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]
```

**Supabase RPC 함수 예시 (SQL) - legal_chunks용:**
```sql
CREATE OR REPLACE FUNCTION match_legal_chunks(
    query_embedding vector(384),
    match_threshold float,
    match_count int,
    source_type_filter text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    external_id text,
    source_type text,
    title text,
    content text,
    similarity float,
    metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        lc.id,
        lc.external_id,
        lc.source_type,
        lc.title,
        lc.content,
        1 - (lc.embedding <=> query_embedding) as similarity,
        lc.metadata
    FROM legal_chunks lc
    WHERE 1 - (lc.embedding <=> query_embedding) > match_threshold
        AND (source_type_filter IS NULL OR lc.source_type = source_type_filter)
    ORDER BY lc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

#### ⚠️ 레거시: 공고 검색 (`announcement_chunks` - 사용하지 않음)

```python
# 레거시 코드 (참고용, 더 이상 사용하지 않음)
def search_similar_chunks(query_embedding, top_k=5, filters=None):  # 레거시
    rpc_params = {
        "query_embedding": query_embedding,
        "match_threshold": 0.7,
        "match_count": top_k,
        "filters": filters or {}
    }
    
    result = sb.rpc("match_announcement_chunks", rpc_params).execute()  # 사용 안 함
    return result.data
```

### 3.3 코사인 유사도 (Cosine Similarity)

**공식:**
```
similarity = (A · B) / (||A|| × ||B||)
```

- `A · B`: 두 벡터의 내적 (dot product)
- `||A||`: 벡터 A의 크기 (norm)
- `||B||`: 벡터 B의 크기 (norm)
- 결과값: -1 ~ 1 (1에 가까울수록 유사)

**pgvector 연산자:**
- `<=>`: 코사인 거리 (1 - similarity)
- `<=>` 값이 작을수록 유사함

### 3.4 검색 최적화

#### 인덱싱 (현재 사용 중)

```sql
-- legal_chunks 벡터 인덱스 (IVFFlat)
CREATE INDEX IF NOT EXISTS legal_chunks_embedding_idx 
ON legal_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- source_type 인덱스
CREATE INDEX IF NOT EXISTS legal_chunks_source_type_idx 
ON legal_chunks (source_type);
```

#### 필터링 (현재 사용 중)

```python
# 법률 문서 검색 필터
filters = {
    "source_type": "law"  # "law", "manual", "case"
}

# Supabase 쿼리
result = sb.table("legal_chunks")\
    .select("*")\
    .eq("source_type", filters["source_type"])\
    .execute()
```

### 3.5 법률 문서 검색 (현재 사용 중)

**코드 위치:** `core/supabase_vector_store.py::search_similar_legal_chunks`

법률 문서 검색은 `legal_chunks` 테이블을 사용하며, 계약서 분석과 법률 상담에 활용됩니다:

```python
def search_similar_legal_chunks(
    query_embedding: List[float],
    top_k: int = 5,
    filters: Optional[Dict] = None
):
    # source_type 필터링 (law, manual, case 등)
    query = sb.table("legal_chunks").select("*")
    
    if filters and "source_type" in filters:
        query = query.eq("source_type", filters["source_type"])
    
    chunks = query.execute().data
    
    # 클라이언트 측 코사인 유사도 계산
    # (RPC 함수가 있으면 우선 사용)
    ...
```

**사용 예시:**
- 계약서 분석 시 관련 법령 검색
- 법률 상담 챗에서 관련 조문 검색
- 상황 분석 시 유사 케이스 검색

## 🔄 4. 전체 플로우 예시

### 4.1 ✅ 현재 사용 중: 계약서 분석 및 법률 검색

#### 계약서 분석 플로우

```
1. 계약서 파일 업로드 (PDF/HWPX)
   ↓
2. 텍스트 추출 (PyMuPDF/HWPX 파서)
   "제1조 (근로기간)... 제2조 (근로시간)..."
   ↓
3. RAG 검색 (legal_chunks에서 관련 법령 검색)
   - 쿼리: 계약서 본문 일부
   - 검색: legal_chunks 테이블에서 유사 조문 검색
   ↓
4. LLM 위험 분석 (Ollama)
   - 검색된 법령 조문을 컨텍스트로 사용
   - 위험 조항 식별 및 분석
   ↓
5. 분석 결과 저장
   - contract_analyses 테이블에 저장
   - contract_issues 테이블에 이슈별 상세 저장
```

#### 법률 검색 플로우

```
1. 사용자 쿼리
   "수습 기간 해고 조건은 어떻게 되나요?"
   ↓
2. 쿼리 임베딩 생성
   "수습 기간 해고 조건은 어떻게 되나요?"
   → [0.15, 0.25, ..., 0.85] (384차원)
   ↓
3. 벡터 검색 (legal_chunks 테이블)
   - source_type="law" 필터링
   - 코사인 유사도 계산
   - 청크 A: similarity = 0.92 (근로기준법 제27조)
   - 청크 B: similarity = 0.88 (근로기준법 시행령)
   ↓
4. Top-K 결과 선택 (top_k=5)
   [청크 A, 청크 B, ...]
   ↓
5. LLM 컨텍스트 구성
   "관련 법령:
   - 근로기준법 제27조: 수습기간 중 해고...
   - 근로기준법 시행령: 수습기간은...
   ..."
   ↓
6. LLM 답변 생성 (Ollama)
   "수습 기간 중 해고에 대한 법적 기준은 다음과 같습니다:
   1. 근로기준법 제27조에 따르면...
   ..."
```

### 4.2 ⚠️ 레거시: 공고 업로드 및 인덱싱 (사용하지 않음)

```
⚠️ 이 플로우는 더 이상 사용하지 않습니다.

1. 파일 업로드 (PDF)
   ↓
2. 텍스트 추출
   ↓
3. 청크 분할
   ↓
4. 임베딩 생성
   ↓
5. 벡터 저장 (announcement_chunks)  ← 레거시
   ↓
6. LLM 분석
   ↓
7. 분석 결과 저장 (announcement_analysis)  ← 레거시
```

## 📊 5. 데이터베이스 스키마

### 5.1 주요 테이블

#### ⚠️ 레거시 테이블 (사용하지 않음)

**`announcements`** (레거시)
- 공고 관련 기능은 더 이상 사용하지 않습니다
- `id`: UUID (PK)
- `source`: 출처
- `external_id`: 외부 시스템 ID
- `title`: 제목
- `version`: 버전 번호
- `content_hash`: 내용 해시 (중복 감지)

**`announcement_chunks`** (레거시)
- 공고 청크 및 임베딩 저장 테이블 (더 이상 사용하지 않음)
- `id`: UUID (PK)
- `announcement_id`: 공고 ID (FK)
- `chunk_index`: 청크 순서
- `content`: 청크 텍스트
- `embedding`: vector(384) - 임베딩 벡터
- `metadata`: JSONB - 메타데이터

#### ✅ 현재 사용 중인 테이블

**`legal_chunks`** (현재 사용 중)
- 법률 문서 청크 및 임베딩 저장 테이블
- 계약서 분석, 법률 검색에 사용
- `id`: UUID (PK)
- `external_id`: 외부 문서 ID
- `source_type`: 문서 타입 (law, manual, case)
- `title`: 문서 제목
- `content`: 청크 텍스트
- `embedding`: vector(384) - 임베딩 벡터
- `metadata`: JSONB - 메타데이터
- `chunk_index`: 청크 순서
- `file_path`: 원본 파일 경로

**`contract_analyses`** (현재 사용 중)
- 계약서 분석 결과 저장
- `id`: UUID (PK)
- `doc_id`: 문서 ID
- `title`: 계약서 제목
- `risk_score`: 위험도 점수
- `risk_level`: 위험도 레벨
- `contract_text`: 계약서 원문 텍스트
- `summary`: 분석 요약
- `user_id`: 사용자 ID (선택)

**`contract_issues`** (현재 사용 중)
- 계약서 이슈 상세 정보
- `id`: UUID (PK)
- `contract_analysis_id`: 계약서 분석 ID (FK)
- `issue_id`: 이슈 ID
- `category`: 이슈 카테고리
- `severity`: 위험도
- `summary`: 이슈 요약
- `legal_basis`: 법적 근거

### 5.2 인덱스

#### ✅ 현재 사용 중: legal_chunks 인덱스

```sql
-- 벡터 인덱스 (IVFFlat) - legal_chunks
CREATE INDEX IF NOT EXISTS legal_chunks_embedding_idx 
ON legal_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- source_type 인덱스
CREATE INDEX IF NOT EXISTS legal_chunks_source_type_idx 
ON legal_chunks (source_type);

-- external_id 인덱스
CREATE INDEX IF NOT EXISTS legal_chunks_external_id_idx 
ON legal_chunks (external_id);
```

#### ⚠️ 레거시: announcement_chunks 인덱스 (사용하지 않음)

```sql
-- 벡터 인덱스 (IVFFlat) - 레거시
-- CREATE INDEX announcement_chunks_embedding_idx 
-- ON announcement_chunks 
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);
```

## 🎯 6. 검색 전략 비교

### 6.1 벡터 검색 (Vector Search)
- **방식**: 임베딩 벡터의 코사인 유사도
- **장점**: 의미 기반 검색, 동의어 처리 가능
- **단점**: 정확한 키워드 매칭은 약함

### 6.2 하이브리드 검색 (Hybrid Search)
- **방식**: 벡터 검색 + 키워드 검색 (BM25)
- **장점**: 의미 검색 + 정확한 키워드 매칭
- **구현**: `core/tools/vector_search_tool.py`

### 6.3 MMR 재랭킹 (Maximal Marginal Relevance)
- **방식**: 유사도 + 다양성 고려
- **장점**: 중복 결과 제거, 다양한 결과 제공
- **구현**: `core/tools/vector_search_tool.py`

## 🔧 7. 설정 및 튜닝

### 7.1 청킹 파라미터

```env
# .env 파일
CHUNK_SIZE=1000      # 청크 크기 (문자 수)
CHUNK_OVERLAP=200    # 오버랩 크기 (문자 수)
```

**권장값:**
- **짧은 문서**: `CHUNK_SIZE=500, CHUNK_OVERLAP=100`
- **긴 문서**: `CHUNK_SIZE=2000, CHUNK_OVERLAP=400`
- **법률 문서**: `CHUNK_SIZE=1500, CHUNK_OVERLAP=300`

### 7.2 검색 파라미터

```python
# 검색 시
top_k = 5              # 반환할 결과 개수
match_threshold = 0.7  # 최소 유사도 임계값
```

**권장값:**
- **일반 검색**: `top_k=5, match_threshold=0.7`
- **정밀 검색**: `top_k=3, match_threshold=0.85`
- **광범위 검색**: `top_k=10, match_threshold=0.6`

### 7.3 임베딩 모델 선택

```env
# 문서 임베딩 (공고문, 계약서)
LOCAL_EMBEDDING_MODEL=BAAI/bge-m3          # 1024차원, 다국어

# 기업 임베딩 (팀, 기업)
COMPANY_EMBED_MODEL=BAAI/bge-small-en-v1.5  # 384차원, 빠름
```

## 📝 8. 주요 코드 참조

### 8.1 청킹
- `core/document_processor_v2.py::to_chunks()` - 청크 분할
- `core/document_processor_v2.py::SimpleTextSplitter` - 분할 알고리즘
- `core/legal_chunker.py` - 법률 문서 전용 청킹 (선택사항)

### 8.2 임베딩
- `core/generator_v2.py::embed()` - 배치 임베딩
- `core/generator_v2.py::embed_one()` - 단일 임베딩

### 8.3 벡터 검색 (현재 사용 중)
- ✅ `core/supabase_vector_store.py::search_similar_legal_chunks()` - 법률 검색 (현재 사용)
- ✅ `core/legal_rag_service.py::_search_legal_chunks()` - 법률 RAG 검색 (현재 사용)
- ⚠️ `core/supabase_vector_store.py::search_similar_chunks()` - 공고 검색 (레거시, 사용 안 함)
- ⚠️ `core/orchestrator_v2.py::search_similar_announcements()` - 공고 검색 (레거시, 사용 안 함)

### 8.4 RAG 파이프라인 (현재 사용 중)
- ✅ `core/legal_rag_service.py::analyze_contract()` - 계약서 분석 RAG (현재 사용)
- ✅ `core/legal_rag_service.py::chat_with_context()` - 법률 상담 챗 (현재 사용)
- ✅ `core/legal_rag_service.py::analyze_situation_detailed()` - 상황 분석 (현재 사용)
- ⚠️ `core/orchestrator_v2.py::process_announcement()` - 공고 처리 (레거시, 사용 안 함)

## 🚀 9. 성능 최적화

### 9.1 벡터 인덱스
- IVFFlat 인덱스 사용 (빠른 근사 검색)
- `lists` 파라미터 조정 (100-1000 권장)

### 9.2 배치 처리
- 임베딩 생성 시 배치 처리 (`embed()` 메서드)
- 벡터 저장 시 일괄 삽입 (`bulk_upsert_chunks()`)

### 9.3 캐싱
- 임베딩 모델 지연 로드 (싱글톤 패턴)
- Supabase 클라이언트 지연 초기화

## 📚 참고 자료

- [Supabase pgvector 문서](https://supabase.com/docs/guides/ai/vector-columns)
- [sentence-transformers 문서](https://www.sbert.net/)
- [LangChain RAG 가이드](https://python.langchain.com/docs/use_cases/question_answering/)

