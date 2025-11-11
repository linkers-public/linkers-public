# Supabase 연결 테스트 가이드

## 🔗 제공된 연결 정보

```
NEXT_PUBLIC_SUPABASE_URL=https://eppwaqburvobrybkmlkv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwcHdhcWJ1cnZvYnJ5YmttbGt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDQwMTAsImV4cCI6MjA3ODQyMDAxMH0.t-SpMryaq37IDMNCzxjI3ddAGZkj_j8m0EY3x6rExpY
```

## ✅ 환경 변수 설정 완료

`.env.local` 파일에 위 정보가 저장되었습니다.

## 🧪 연결 테스트 방법

### 방법 1: API 엔드포인트로 테스트

개발 서버가 실행 중일 때:

```bash
# 브라우저에서 접속
http://localhost:3000/api/test-supabase

# 또는 curl 사용
curl http://localhost:3000/api/test-supabase
```

### 방법 2: 직접 Supabase 클라이언트 테스트

```typescript
import { createSupabaseBrowserClient } from '@/supabase/supabase-client';

const supabase = createSupabaseBrowserClient();

// 간단한 테스트
const { data, error } = await supabase
  .from('accounts')
  .select('profile_id')
  .limit(1);

if (error) {
  console.error('연결 실패:', error);
} else {
  console.log('연결 성공:', data);
}
```

## 📊 테스트 API 응답 예시

성공 시:
```json
{
  "success": true,
  "message": "Supabase 연결 성공",
  "connection": {
    "url": "https://eppwaqburvobrybkmlkv.supabase.co",
    "keyPrefix": "eyJhbGciOiJIUzI1NiIs..."
  },
  "tests": {
    "healthCheck": {
      "success": true,
      "error": null
    },
    "accountsTable": {
      "success": true,
      "error": null
    },
    "estimateTable": {
      "success": true,
      "error": null
    },
    "estimateEmbeddingsTable": {
      "exists": false,
      "error": "테이블이 존재하지 않습니다"
    }
  },
  "recommendations": [
    "estimate_embeddings 테이블이 없습니다. database_estimate_rag_migration.sql을 실행하세요."
  ]
}
```

## 🔍 확인 사항

테스트 API는 다음을 확인합니다:

1. ✅ **환경 변수 설정**: URL과 키가 올바르게 설정되었는지
2. ✅ **기본 연결**: Supabase 서버에 연결할 수 있는지
3. ✅ **accounts 테이블**: 기본 테이블에 접근할 수 있는지
4. ✅ **estimate 테이블**: 견적서 테이블이 존재하는지
5. ⚠️ **estimate_embeddings 테이블**: RAG용 테이블이 생성되었는지

## 🚀 다음 단계

### RAG 시스템을 사용하려면:

1. **데이터베이스 마이그레이션 실행**
   - Supabase 대시보드 > SQL Editor
   - `database_estimate_rag_migration.sql` 파일 내용 실행

2. **OpenAI API 키 설정** (RAG 검색 사용 시)
   ```env
   OPENAI_API_KEY=sk-your_key_here
   ```

3. **테스트 재실행**
   - `estimateEmbeddingsTable.exists`가 `true`가 되어야 함

## 🐛 문제 해결

### 연결 실패 시

1. **환경 변수 확인**
   - `.env.local` 파일이 프로젝트 루트에 있는지 확인
   - 개발 서버 재시작 (`npm run dev`)

2. **Supabase 프로젝트 확인**
   - Supabase 대시보드에서 프로젝트가 활성화되어 있는지 확인
   - API 키가 올바른지 확인

3. **네트워크 확인**
   - 인터넷 연결 확인
   - 방화벽 설정 확인

### 테이블이 없다는 오류

- 해당 테이블의 마이그레이션 SQL을 실행해야 합니다
- RLS 정책이 올바르게 설정되었는지 확인

