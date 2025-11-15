# RAG 관련 테이블 분석 보고서

## 📊 개요

이 프로젝트는 RAG(Retrieval-Augmented Generation) 시스템을 구현하기 위해 **`announcements`** 테이블을 중심으로 문서를 저장하고 벡터 검색을 수행합니다.

> **참고**: 코드에서는 `docs` 테이블을 참조하지만, 실제 데이터베이스에는 `announcements` 테이블이 사용됩니다.

---

## 🗂️ 테이블 구조

### 1. `announcements` 테이블 (메인 문서 테이블)

공고 문서의 메타데이터를 저장하는 메인 테이블입니다.

#### 컬럼 구조

| 컬럼명 | 데이터 타입 | NULL 허용 | 기본값 | 설명 |
|--------|------------|----------|--------|------|
| `id` | `uuid` | NO | `gen_random_uuid()` | 기본 키 |
| `source` | `text` | YES | - | 문서 출처 ('narajangter', 'ntis', 'pdf', 'internal' 등) |
| `external_id` | `text` | YES | - | 원천 시스템의 외부 ID |
| `title` | `text` | YES | - | 문서 제목 |
| `agency` | `text` | YES | - | 발주기관명 |
| `budget_min` | `bigint` | YES | - | 최소 예산 |
| `budget_max` | `bigint` | YES | - | 최대 예산 |
| `start_date` | `timestamptz` | YES | - | 시작일 |
| `end_date` | `timestamptz` | YES | - | 종료일 |
| `version` | `integer` | YES | `1` | 문서 버전 (중복/업데이트 관리) |
| `content_hash` | `text` | YES | - | 본문 해시값 (중복 검사용) |
| `status` | `text` | YES | `'active'` | 상태 ('active', 'inactive' 등) |
| `created_at` | `timestamptz` | YES | `now()` | 생성일시 |
| `updated_at` | `timestamptz` | YES | `now()` | 수정일시 |
| `storage_file_path` | `text` | YES | - | Supabase Storage 파일 경로 |
| `storage_bucket` | `text` | YES | `'announcements'` | Storage 버킷명 |
| `file_name` | `text` | YES | - | 원본 파일명 |
| `file_mime_type` | `text` | YES | - | 파일 MIME 타입 |

#### 인덱스

- **Primary Key**: `announcements_pkey` (id)
- **인덱스**:
  - `idx_announcements_created_at` (created_at)
  - `idx_announcements_external_id` (external_id)
  - `idx_announcements_source` (source)
  - `idx_announcements_status` (status)
  - `idx_announcements_storage_path` (storage_file_path)

#### 특징

- **버전 관리**: `version`과 `content_hash`를 통해 동일 문서의 업데이트를 추적
- **중복 방지**: `source` + `external_id` + `content_hash` 조합으로 중복 검사
- **파일 관리**: Supabase Storage와 연동하여 원본 파일 저장

---

### 2. `announcement_chunks` 테이블 (벡터 저장소)

문서를 청크로 분할하고 임베딩 벡터를 저장하는 테이블입니다.

#### 컬럼 구조

| 컬럼명 | 데이터 타입 | NULL 허용 | 기본값 | 설명 |
|--------|------------|----------|--------|------|
| `id` | `uuid` | NO | `gen_random_uuid()` | 기본 키 |
| `announcement_id` | `uuid` | YES | - | announcements 테이블 외래키 |
| `chunk_index` | `integer` | YES | - | 청크 순서 인덱스 |
| `content` | `text` | YES | - | 청크 텍스트 내용 |
| `embedding` | `vector` | YES | - | 임베딩 벡터 (pgvector 타입) |
| `metadata` | `jsonb` | YES | `'{}'::jsonb` | 청크 메타데이터 (JSON) |
| `created_at` | `timestamptz` | YES | `now()` | 생성일시 |

#### 인덱스

- **Primary Key**: `announcement_chunks_pkey` (id)
- **Foreign Key**: `announcement_chunks_announcement_id_fkey` → `announcements(id) ON DELETE CASCADE`
- **인덱스**:
  - `idx_announcement_chunks_announcement_id` (announcement_id)
  - `idx_announcement_chunks_embedding` (embedding) - **IVFFlat 인덱스** (벡터 검색 최적화)

#### 특징

- **벡터 검색**: pgvector 확장을 사용하여 코사인 유사도 기반 검색
- **CASCADE 삭제**: announcements 삭제 시 관련 청크 자동 삭제
- **메타데이터**: JSONB 형식으로 청크별 추가 정보 저장 가능

---

### 3. `announcement_bodies` 테이블 (원본 본문)

문서의 원본 본문 텍스트를 저장하는 테이블입니다.

#### 컬럼 구조

| 컬럼명 | 데이터 타입 | NULL 허용 | 기본값 | 설명 |
|--------|------------|----------|--------|------|
| `id` | `uuid` | NO | `gen_random_uuid()` | 기본 키 |
| `announcement_id` | `uuid` | YES | - | announcements 테이블 외래키 |
| `text` | `text` | YES | - | 원본 본문 텍스트 |
| `mime` | `text` | YES | - | MIME 타입 |
| `language` | `text` | YES | - | 언어 코드 |
| `created_at` | `timestamptz` | YES | - | 생성일시 |

---

### 4. `announcement_analysis` 테이블 (LLM 분석 결과)

LLM을 통한 구조화된 분석 결과를 저장하는 테이블입니다.

#### 컬럼 구조

| 컬럼명 | 데이터 타입 | NULL 허용 | 기본값 | 설명 |
|--------|------------|----------|--------|------|
| `id` | `uuid` | NO | `gen_random_uuid()` | 기본 키 |
| `announcement_id` | `uuid` | YES | - | announcements 테이블 외래키 |
| `result` | `jsonb` | YES | - | 분석 결과 (JSON) |
| `score` | `double precision` | YES | - | 분석 점수 |
| `created_at` | `timestamptz` | YES | - | 생성일시 |
| `updated_at` | `timestamptz` | YES | - | 수정일시 |

---

## 📈 현재 데이터 현황

### 데이터 통계

- **announcements**: **0개** (빈 테이블)
- **announcement_chunks**: **0개** (빈 테이블)
- **announcement_bodies**: 데이터 없음
- **announcement_analysis**: 데이터 없음

### 테이블 크기

- `announcements`: 56 kB
- `announcement_chunks`: 992 kB (인덱스 포함)
- `announcement_bodies`: 24 kB
- `announcement_analysis`: 24 kB

> **참고**: 현재 데이터가 없지만, 인덱스와 테이블 구조는 이미 생성되어 있습니다.

---

## 🔗 테이블 관계도

```
announcements (1)
    ├── announcement_chunks (N) [CASCADE DELETE]
    ├── announcement_bodies (1)
    └── announcement_analysis (1)
```

---

## 🔍 벡터 검색 기능

### RPC 함수: `match_announcement_chunks`

```sql
match_announcement_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filters jsonb DEFAULT '{}'::jsonb
)
```

**기능**:
- 코사인 유사도 기반 벡터 검색
- 필터링 지원 (예산, 기간 등)
- 활성 상태 공고만 검색 (`status = 'active'`)

**반환값**:
- `announcement_id`: 공고 ID
- `chunk_index`: 청크 인덱스
- `content`: 청크 내용
- `similarity`: 유사도 점수
- `metadata`: 메타데이터

---

## 📝 데이터 처리 파이프라인

### 1. 문서 업로드
```
파일/텍스트 입력
    ↓
텍스트 추출 (PDF/HWPX 등)
    ↓
announcements 테이블에 메타데이터 저장
    ↓
announcement_bodies 테이블에 원본 본문 저장
```

### 2. 청킹 및 임베딩
```
원본 텍스트
    ↓
청크 분할 (500자 단위, 100자 오버랩)
    ↓
임베딩 생성 (OpenAI/BAAI 모델)
    ↓
announcement_chunks 테이블에 저장
```

### 3. LLM 분석
```
구조화된 메타데이터 추출
    ↓
난이도, 리스크, 기술스택 분석
    ↓
announcement_analysis 테이블에 저장
```

---

## 🛠️ 주요 API 엔드포인트

### 문서 조회
- **GET** `/api/rag/docs` - 문서 목록 조회 (announcements 테이블 사용)
- **GET** `/api/rag/docs/[docId]` - 특정 문서 상세 조회

### 문서 업로드
- **POST** `/api/announcements/upload` - 파일 업로드 및 처리
- **POST** `/api/announcements/text` - 텍스트 직접 입력

---

## ⚠️ 주의사항

1. **테이블명 불일치**: 
   - 코드 타입 정의(`src/types/rag.ts`)에서는 `Doc` 인터페이스가 `docs` 테이블을 가정하지만, 실제로는 `announcements` 테이블을 사용합니다.

2. **데이터 부재**: 
   - 현재 모든 테이블이 비어있어 RAG 기능을 사용하려면 먼저 문서를 업로드해야 합니다.

3. **임베딩 차원**: 
   - 벡터 검색 함수는 `vector(1536)` 차원을 가정하지만, 실제 사용 모델에 따라 조정이 필요할 수 있습니다.

---

## 📚 관련 파일

- **타입 정의**: `src/types/rag.ts`
- **API 라우트**: `src/app/api/rag/docs/route.ts`
- **벡터 스토어**: `backend/core/supabase_vector_store.py`
- **오케스트레이터**: `backend/core/orchestrator_v2.py`
- **벡터 검색 RPC**: `supabase/migrations/003_vector_search_rpc.sql`

---

## 🎯 다음 단계 권장사항

1. **문서 업로드**: 샘플 공고 문서를 업로드하여 테이블에 데이터 추가
2. **임베딩 모델 확인**: 사용 중인 임베딩 모델의 차원이 1536인지 확인
3. **테이블명 통일**: 코드와 데이터베이스 간 테이블명 일치 여부 검토
4. **RLS 정책**: Row Level Security 정책이 필요한지 확인

---

**생성일**: 2025-01-27
**분석 대상**: Supabase 데이터베이스 RAG 관련 테이블

