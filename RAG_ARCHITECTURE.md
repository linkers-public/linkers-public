# Linkus Public — RAG Architecture & Project Structure

> 목표: 공고 PDF/URL 업로드 → 텍스트/메타 추출 → 청크/임베딩(pgvector) → 검색+생성(RAG) → 견적 초안/매칭 사유/비교 대시보드

---

## 📁 프로젝트 구조

```
src/
├─ app/
│  ├─ upload/page.tsx               # 공고 업로드 UI
│  ├─ match/page.tsx                # 매칭/비교/견적 UI
│  └─ api/rag/
│     ├─ ingest/route.ts            # 인덱싱(업로드→청크→임베딩)
│     ├─ query/route.ts             # 검색→생성(요약/견적/매칭)
│     └─ teams/route.ts             # 팀 임베딩 갱신/조회
├─ lib/rag/
│  ├─ extractor.ts                  # PDF→텍스트, 표 파싱, 메타 추출
│  ├─ chunker.ts                    # 문장 분리·슬라이딩 윈도우
│  ├─ embedder.ts                   # 임베딩 래퍼(OpenAI/bge)
│  ├─ retriever.ts                  # pgvector 검색+재랭킹(MMR)
│  ├─ prompts.ts                    # 요약/견적/매칭 프롬프트
│  └─ scoring.ts                    # 팀 매칭 스코어 계산
└─ types/rag.ts                     # DTO/타입 정의
```

---

## 🗄️ 데이터 모델

### 테이블 구조

1. **docs** - 원문 문서
   - `id`, `source`, `doc_url`, `title`, `project_code`, `published_at`, `raw_text`

2. **doc_chunks** - 청크 및 임베딩
   - `id`, `doc_id`, `chunk_index`, `text`, `meta`, `embedding vector(1536)`

3. **team_embeddings** - 팀 임베딩(매칭용)
   - `team_id`, `summary`, `meta`, `embedding vector(1536)`

4. **doc_owners** - 문서 소유자 매핑 (RLS용)
   - `id`, `doc_id`, `user_id`

5. **rag_audit_logs** - 감사 로그
   - `id`, `query`, `mode`, `used_chunk_ids`, `answer`, `user_id`

### RPC 함수

- `search_chunks_cosine(query_vec, k, filter_doc_ids)` - 코사인 유사도 검색
- `search_chunks_mmr(query_vec, k, lambda, filter_doc_ids)` - MMR 검색
- `search_teams_cosine(query_vec, k)` - 팀 검색

---

## 🔌 API 엔드포인트

### POST /api/rag/ingest

**요청:**
```typescript
FormData {
  file: File
  source: 'narajangter' | 'ntis' | 'pdf' | 'internal'
  title?: string
  publishedAt?: string
  docUrl?: string
}
```

**응답:**
```typescript
{
  docId: number
  chunks: number
}
```

### POST /api/rag/query

**요청:**
```typescript
{
  mode: 'summary' | 'estimate' | 'match'
  query: string
  topK?: number
  withTeams?: boolean
  docIds?: number[]
}
```

**응답:**
```typescript
{
  answer: string
  usedChunks: { id: number, doc_id: number, score: number }[]
  teams?: { team_id: number, score: number, reason?: string }[]
}
```

### POST /api/rag/teams

**요청:**
```typescript
{
  teamId: number
  summary: string
  meta: Record<string, any>
}
```

**응답:**
```typescript
{
  success: boolean
}
```

---

## 🧩 핵심 모듈

### extractor.ts
- PDF 텍스트 추출 (`pdf-parse`)
- 메타데이터 추출 (예산, 기간, 기술 스택, 지역 등)
- 표 파싱 (간단한 구현)

### chunker.ts
- 문장 단위 분리
- 슬라이딩 윈도우 (500자 청크, 100자 오버랩)
- 표/숫자 보존

### embedder.ts
- OpenAI 임베딩 API 래퍼
- 배치 처리 지원
- 모델 교체 가능 (text-embedding-3-small 기본)

### retriever.ts
- pgvector 검색
- MMR (Maximum Marginal Relevance) 지원
- 하이브리드 검색 (키워드 + 벡터)

### prompts.ts
- 요약/견적/매칭 프롬프트 템플릿
- 근거 [id:##] 강제 표기
- "정보 없음" 처리

### scoring.ts
- 팀 매칭 스코어 계산
- 가중치: 의미유사도(0.4) + 기술스택(0.3) + 평점(0.2) + 지역(0.1)

---

## 🔐 보안 (RLS)

- `docs`, `doc_chunks`: 소유자만 조회 가능
- `doc_owners`: 자신의 소유권만 조회
- `team_embeddings`: 모든 인증 사용자 조회 가능 (매칭용)
- `rag_audit_logs`: 자신의 로그만 조회

---

## 🚀 사용 방법

### 1. 환경 변수 설정

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
EMBED_MODEL=text-embedding-3-small
CHAT_MODEL=gpt-4o-mini
```

### 2. 문서 업로드

1. `/upload` 페이지 접속
2. PDF 파일 선택
3. 출처 선택 (나라장터/NTIS/PDF/내부)
4. 업로드 및 인덱싱

### 3. 질의 및 매칭

1. `/match` 페이지 접속
2. 모드 선택 (요약/견적/매칭)
3. 질의 입력
4. 결과 확인

### 4. 팀 임베딩 갱신

```typescript
await fetch('/api/rag/teams', {
  method: 'POST',
  body: JSON.stringify({
    teamId: 1,
    summary: '팀 요약...',
    meta: { stacks: ['React', 'Node.js'], regions: ['서울'] }
  })
})
```

---

## 📊 성능 최적화

- **인덱스**: HNSW 인덱스 사용 (벡터 검색)
- **배치 처리**: 임베딩 생성 시 배치 처리
- **캐싱**: (선택) 쿼리+컨텍스트 해시 기반 캐싱
- **비동기 처리**: (선택) 임베딩 워커 분리

---

## 🎯 데모 체크리스트

- [x] 데이터 모델 스키마 생성
- [x] RAG 핵심 모듈 구현
- [x] API 엔드포인트 구현
- [x] UI 컴포넌트 생성
- [x] RPC 함수 및 인덱스 생성
- [ ] 샘플 공고 PDF 3개 업로드
- [ ] 팀 프로필 5개 임베딩 완료
- [ ] 90초 데모 시나리오 테스트

---

## 🔄 향후 개선 사항

1. **OCR 지원**: 스캔 PDF 품질 개선
2. **Cross-Encoder 재랭킹**: 검색 정확도 향상
3. **캐싱 시스템**: 성능 최적화
4. **비동기 워커**: 대용량 처리
5. **URL 크롤링**: 나라장터/NTIS 자동 크롤링

