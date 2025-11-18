# 백엔드 로직 상세 설명

## 개요
이 문서는 백엔드의 핵심 로직인 청킹(Chunking), RAG 구성, 벡터 검색에 대해 상세히 설명합니다.

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
- **테이블 구조:**
  - `announcement_chunks`: 공고 청크 및 임베딩
  - `legal_chunks`: 법률 문서 청크 및 임베딩
  - `team_embeddings`: 팀 임베딩

**코드 위치:** `core/supabase_vector_store.py`

```python
def bulk_upsert_chunks(announcement_id, chunks):
    payload = [{
        "announcement_id": announcement_id,
        "chunk_index": c["chunk_index"],
        "content": c["content"],
        "embedding": c["embedding"],  # float[] 배열
        "metadata": c.get("metadata", {})
    } for c in chunks]
    
    sb.table("announcement_chunks").insert(payload).execute()
```

## 🔎 3. 벡터 검색 (Vector Search)

### 3.1 검색 방식

**검색은 쿼리 중심 (Query-based)입니다.**

1. **사용자 쿼리** → **임베딩 벡터 변환**
2. **임베딩 벡터** → **코사인 유사도 계산**
3. **유사도 순 정렬** → **Top-K 결과 반환**

### 3.2 검색 프로세스

**코드 위치:** `core/supabase_vector_store.py`

#### 방법 1: Supabase RPC 함수 사용 (권장)

```python
def search_similar_chunks(query_embedding, top_k=5, filters=None):
    rpc_params = {
        "query_embedding": query_embedding,  # float[] 배열
        "match_threshold": 0.7,  # 최소 유사도 임계값
        "match_count": top_k,
        "filters": filters or {}
    }
    
    result = sb.rpc("match_announcement_chunks", rpc_params).execute()
    return result.data
```

**Supabase RPC 함수 예시 (SQL):**
```sql
CREATE OR REPLACE FUNCTION match_announcement_chunks(
    query_embedding vector(384),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id uuid,
    content text,
    similarity float,
    metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ac.id,
        ac.content,
        1 - (ac.embedding <=> query_embedding) as similarity,
        ac.metadata
    FROM announcement_chunks ac
    WHERE 1 - (ac.embedding <=> query_embedding) > match_threshold
    ORDER BY ac.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

#### 방법 2: 클라이언트 측 계산 (Fallback)

RPC 함수가 없는 경우, 모든 청크를 가져와서 클라이언트에서 유사도 계산:

```python
# 모든 청크 가져오기
chunks = sb.table("announcement_chunks").select("*").execute()

# 코사인 유사도 계산
import numpy as np
query_vec = np.array(query_embedding, dtype=np.float32)

results = []
for chunk in chunks:
    chunk_vec = np.array(chunk["embedding"], dtype=np.float32)
    
    # 코사인 유사도 = dot product / (norm1 * norm2)
    similarity = np.dot(query_vec, chunk_vec) / (
        np.linalg.norm(query_vec) * np.linalg.norm(chunk_vec)
    )
    
    if similarity > threshold:
        results.append({
            "id": chunk["id"],
            "content": chunk["content"],
            "similarity": float(similarity),
            "metadata": chunk["metadata"]
        })

# 유사도 순 정렬
results.sort(key=lambda x: x["similarity"], reverse=True)
return results[:top_k]
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

#### 인덱싱
```sql
-- 벡터 인덱스 생성 (IVFFlat)
CREATE INDEX ON announcement_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

#### 필터링
```python
# 메타데이터 필터 적용
filters = {
    "source": "나라장터",
    "budget_min": 10000000
}

# Supabase 쿼리
result = sb.table("announcement_chunks")\
    .select("*")\
    .eq("metadata->>source", filters["source"])\
    .gte("metadata->>budget_min", filters["budget_min"])\
    .execute()
```

### 3.5 법률 문서 검색

**코드 위치:** `core/supabase_vector_store.py::search_similar_legal_chunks`

법률 문서 검색은 동일한 벡터 검색 방식을 사용하지만, `legal_chunks` 테이블을 대상으로 합니다:

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
    
    # 클라이언트 측 유사도 계산
    # (RPC 함수가 있으면 사용)
    ...
```

## 🔄 4. 전체 플로우 예시

### 4.1 공고 업로드 및 인덱싱

```
1. 파일 업로드 (PDF)
   ↓
2. 텍스트 추출 (PyMuPDF)
   "공고 내용 텍스트..."
   ↓
3. 청크 분할 (1000자씩, 200자 오버랩)
   - 청크 1: "공고 내용 텍스트..." (0-1000자)
   - 청크 2: "...텍스트..." (800-1800자)
   - 청크 3: "...내용..." (1600-2600자)
   ↓
4. 임베딩 생성 (sentence-transformers)
   - 청크 1 → [0.1, 0.2, ..., 0.9] (384차원)
   - 청크 2 → [0.2, 0.1, ..., 0.8] (384차원)
   - 청크 3 → [0.3, 0.2, ..., 0.7] (384차원)
   ↓
5. 벡터 저장 (Supabase)
   INSERT INTO announcement_chunks (embedding, content, ...)
   ↓
6. LLM 분석 (Ollama)
   - 프로젝트명, 예산, 기술 스택 추출
   ↓
7. 분석 결과 저장
   INSERT INTO announcement_analysis (result, ...)
```

### 4.2 검색 및 답변 생성

```
1. 사용자 쿼리
   "React 개발자가 필요한 공고 찾아줘"
   ↓
2. 쿼리 임베딩 생성
   "React 개발자가 필요한 공고 찾아줘" 
   → [0.15, 0.25, ..., 0.85] (384차원)
   ↓
3. 벡터 검색 (코사인 유사도)
   - 청크 A: similarity = 0.92
   - 청크 B: similarity = 0.88
   - 청크 C: similarity = 0.85
   ↓
4. Top-K 결과 선택 (top_k=5)
   [청크 A, 청크 B, 청크 C, ...]
   ↓
5. LLM 컨텍스트 구성
   "관련 문서:
   - 청크 A: React 개발자 모집...
   - 청크 B: 프론트엔드 개발...
   ..."
   ↓
6. LLM 답변 생성 (Ollama)
   "다음 공고들이 React 개발자를 모집하고 있습니다:
   1. [공고명] - React, TypeScript 경력 3년 이상
   ..."
```

## 📊 5. 데이터베이스 스키마

### 5.1 주요 테이블

#### `announcements`
- `id`: UUID (PK)
- `source`: 출처
- `external_id`: 외부 시스템 ID
- `title`: 제목
- `version`: 버전 번호
- `content_hash`: 내용 해시 (중복 감지)

#### `announcement_chunks`
- `id`: UUID (PK)
- `announcement_id`: 공고 ID (FK)
- `chunk_index`: 청크 순서
- `content`: 청크 텍스트
- `embedding`: vector(384) - 임베딩 벡터
- `metadata`: JSONB - 메타데이터

#### `legal_chunks`
- `id`: UUID (PK)
- `external_id`: 외부 문서 ID
- `source_type`: 문서 타입 (law, manual, case)
- `title`: 문서 제목
- `content`: 청크 텍스트
- `embedding`: vector(384) - 임베딩 벡터
- `metadata`: JSONB - 메타데이터

### 5.2 인덱스

```sql
-- 벡터 인덱스 (IVFFlat)
CREATE INDEX announcement_chunks_embedding_idx 
ON announcement_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 메타데이터 인덱스
CREATE INDEX announcement_chunks_metadata_idx 
ON announcement_chunks 
USING gin (metadata);
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

### 8.2 임베딩
- `core/generator_v2.py::embed()` - 배치 임베딩
- `core/generator_v2.py::embed_one()` - 단일 임베딩

### 8.3 벡터 검색
- `core/supabase_vector_store.py::search_similar_chunks()` - 공고 검색
- `core/supabase_vector_store.py::search_similar_legal_chunks()` - 법률 검색
- `core/orchestrator_v2.py::search_similar_announcements()` - 검색 오케스트레이션

### 8.4 RAG 파이프라인
- `core/orchestrator_v2.py::process_announcement()` - 전체 파이프라인
- `core/legal_rag_service.py::analyze_contract()` - 계약서 분석 RAG

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

