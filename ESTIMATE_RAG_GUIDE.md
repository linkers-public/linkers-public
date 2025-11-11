# 견적서 RAG 시스템 사용 가이드

## 📋 개요

견적서를 위한 RAG (Retrieval-Augmented Generation) 시스템을 구축했습니다. 이 시스템은 벡터 임베딩을 사용하여 자연어로 견적서를 검색할 수 있게 해줍니다.

## 🏗️ 시스템 구조

### 1. 데이터베이스 구조

- **테이블**: `estimate_embeddings`
  - 견적서 데이터를 벡터 임베딩으로 변환하여 저장
  - Supabase의 `pgvector` 확장 기능 사용
  - HNSW 인덱스로 빠른 유사도 검색 지원

### 2. 주요 컴포넌트

- **`src/apis/estimate-rag.service.ts`**: RAG 관련 서비스 함수
- **`src/app/api/rag/embed/route.ts`**: 텍스트를 벡터로 변환하는 API
- **`src/app/api/rag/search/route.ts`**: RAG 검색 API
- **`src/components/EstimateRAGSearch.tsx`**: 검색 UI 컴포넌트

## 🚀 설정 방법

### 1. 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```env
# OpenAI API 키 (필수)
OPENAI_API_KEY=your_openai_api_key_here
```

**OpenAI API 키 발급 방법:**
1. [OpenAI Platform](https://platform.openai.com) 접속
2. API Keys 메뉴로 이동
3. "Create new secret key" 클릭
4. 생성된 키를 복사하여 환경 변수에 설정

### 2. 데이터베이스 마이그레이션

Supabase SQL Editor에서 다음 파일을 실행하세요:

```bash
database_estimate_rag_migration.sql
```

또는 Supabase 대시보드에서:
1. SQL Editor로 이동
2. `database_estimate_rag_migration.sql` 파일 내용 복사
3. 실행

**주요 내용:**
- `pgvector` 확장 기능 활성화
- `estimate_embeddings` 테이블 생성
- 벡터 검색 인덱스 생성
- RLS (Row Level Security) 정책 설정
- 벡터 검색 함수 생성

### 3. 패키지 설치

```bash
npm install
```

OpenAI 패키지가 자동으로 설치됩니다.

## 💻 사용 방법

### 1. 견적서 생성 시 자동 임베딩

견적서를 생성하면 자동으로 벡터 임베딩이 생성됩니다:

```typescript
import { insertEstimate } from '@/apis/estimate.service';

// 견적서 생성 (자동으로 임베딩 생성됨)
const result = await insertEstimate({
  clientId: '...',
  counselId: 123,
  // ... 기타 필드
});
```

### 2. 수동으로 임베딩 생성

기존 견적서에 대해 임베딩을 생성하려면:

```typescript
import { createEstimateEmbedding } from '@/apis/estimate-rag.service';

await createEstimateEmbedding(estimateId, estimateVersionId);
```

### 3. RAG 검색 사용

#### 방법 1: 서비스 함수 사용

```typescript
import { searchEstimatesByRAG } from '@/apis/estimate-rag.service';

const results = await searchEstimatesByRAG('웹사이트 개발 견적서', {
  matchThreshold: 0.7, // 유사도 임계값 (0~1)
  matchCount: 10, // 반환할 결과 수
  filterEstimateIds: [1, 2, 3], // 특정 견적서만 검색 (선택사항)
});

console.log(results);
// [
//   {
//     estimate_id: 123,
//     estimate_version_id: 456,
//     content_text: '...',
//     similarity: 0.85,
//     metadata: { ... }
//   },
//   ...
// ]
```

#### 방법 2: API 엔드포인트 사용

```typescript
const response = await fetch('/api/rag/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: '웹사이트 개발 견적서',
    options: {
      matchThreshold: 0.7,
      matchCount: 10,
    },
  }),
});

const data = await response.json();
console.log(data.results);
```

#### 방법 3: React 컴포넌트 사용

```tsx
import EstimateRAGSearch from '@/components/EstimateRAGSearch';

function MyComponent() {
  const handleResultSelect = (estimateId: number, estimateVersionId: number) => {
    console.log('선택된 견적서:', estimateId, estimateVersionId);
    // 견적서 상세 페이지로 이동하거나 다른 작업 수행
  };

  return (
    <EstimateRAGSearch
      onResultSelect={handleResultSelect}
      placeholder="견적서를 검색하세요..."
    />
  );
}
```

## 🔍 검색 예시

다양한 자연어 쿼리로 검색할 수 있습니다:

- **프로젝트 유형**: "웹사이트 개발", "모바일 앱", "쇼핑몰 구축"
- **예산 범위**: "100만원 이하", "500만원 이상", "200만원대"
- **기간**: "3개월 이내", "6개월 프로젝트"
- **기능**: "결제 시스템", "사용자 인증", "관리자 페이지"
- **복합 검색**: "웹사이트 개발 100만원 이하 3개월"

## 📊 검색 결과

검색 결과는 다음 정보를 포함합니다:

- `estimate_id`: 견적서 ID
- `estimate_version_id`: 견적서 버전 ID
- `content_text`: 견적서 내용 (미리보기)
- `similarity`: 유사도 점수 (0~1)
- `metadata`: 메타데이터
  - `total_amount`: 총 금액
  - `start_date`: 시작일
  - `end_date`: 종료일
  - `milestone_count`: 마일스톤 개수

## ⚙️ 고급 설정

### 유사도 임계값 조정

검색 결과의 품질을 조정하려면 `matchThreshold` 값을 변경하세요:

- **높은 값 (0.8~0.9)**: 매우 유사한 결과만 반환 (정확도 높음, 결과 적음)
- **중간 값 (0.6~0.7)**: 적절한 균형 (기본값)
- **낮은 값 (0.4~0.5)**: 더 많은 결과 반환 (정확도 낮음, 결과 많음)

### 임베딩 모델 변경

기본 모델은 `text-embedding-3-small`입니다. 다른 모델을 사용하려면:

`src/app/api/rag/embed/route.ts` 파일에서:

```typescript
const response = await openai.embeddings.create({
  model: 'text-embedding-ada-002', // 또는 다른 모델
  input: text,
});
```

**사용 가능한 모델:**
- `text-embedding-3-small` (기본, 저렴, 빠름)
- `text-embedding-3-large` (더 정확, 비쌈)
- `text-embedding-ada-002` (이전 모델)

## 🔒 보안 고려사항

1. **RLS 정책**: 데이터베이스 레벨에서 접근 제어
   - 기업 사용자는 자신의 견적서만 조회 가능
   - 매니저는 자신의 팀 견적서만 조회 가능

2. **API 키 보안**: 
   - `OPENAI_API_KEY`는 서버 사이드에서만 사용
   - 절대 프론트엔드에 노출하지 마세요

3. **인증**: 모든 API 호출은 인증된 사용자만 가능

## 🐛 문제 해결

### 임베딩 생성 실패

- OpenAI API 키가 올바르게 설정되었는지 확인
- API 키에 충분한 크레딧이 있는지 확인
- 네트워크 연결 확인

### 검색 결과가 없음

- `matchThreshold` 값을 낮춰보세요
- 견적서에 임베딩이 생성되었는지 확인
- 데이터베이스 마이그레이션이 완료되었는지 확인

### 벡터 타입 오류

- Supabase에서 `pgvector` 확장이 활성화되었는지 확인
- 데이터베이스 마이그레이션 SQL이 실행되었는지 확인

## 📈 성능 최적화

1. **인덱스**: HNSW 인덱스가 자동으로 생성되어 빠른 검색 지원
2. **배치 처리**: 여러 견적서의 임베딩을 한 번에 생성하려면 배치 API 사용 고려
3. **캐싱**: 자주 검색되는 쿼리는 캐싱 고려

## 🔄 향후 개선 사항

- [ ] 검색 결과 하이라이팅
- [ ] 필터링 기능 추가 (금액, 기간 등)
- [ ] 검색 히스토리 저장
- [ ] 추천 견적서 기능
- [ ] 다국어 지원

## 📚 참고 자료

- [OpenAI Embeddings 문서](https://platform.openai.com/docs/guides/embeddings)
- [Supabase pgvector 문서](https://supabase.com/docs/guides/database/extensions/pgvector)
- [RAG 패턴 가이드](https://www.pinecone.io/learn/retrieval-augmented-generation/)

