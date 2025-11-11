# 공공 프로젝트 AI 견적 자동화 가이드

## 📋 개요

Linkus Public은 공공 IT/SI 발주 공고를 AI로 분석하고, 자동으로 팀을 매칭하고 견적서를 생성하는 플랫폼입니다.

## 🏗️ 시스템 구조

### 데이터베이스 스키마

1. **public_announcements**: 공고 정보
   - 원본 파일/URL
   - AI 분석 결과 (JSONB)
   - 요구 기술, 예산, 기간 등

2. **announcement_embeddings**: 공고 벡터 임베딩 (RAG용)
   - 청크 단위로 저장
   - pgvector로 유사도 검색

3. **announcement_team_matches**: AI 매칭 결과
   - 팀별 매칭 점수
   - 매칭 사유
   - 자동 생성 견적 초안

4. **announcement_estimates**: 공고-견적서 연결

### API 엔드포인트

- `POST /api/public-announcement/extract-pdf` - PDF 텍스트 추출
- `POST /api/public-announcement/analyze` - 공고 AI 분석
- `POST /api/public-announcement/match-teams` - 팀 매칭
- `POST /api/public-announcement/generate-estimate` - 견적 초안 생성

## 🚀 사용 방법

### 1. 데이터베이스 마이그레이션

```sql
-- Supabase SQL Editor에서 실행
-- database_public_announcement_migration.sql
```

### 2. 환경 변수 설정

`.env.local`에 다음이 설정되어 있어야 합니다:
```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3. 패키지 설치

```bash
npm install pdf-parse  # PDF 파싱용 (선택사항)
```

### 4. 공고 업로드

```tsx
import PublicAnnouncementUpload from '@/components/PublicAnnouncementUpload'

<PublicAnnouncementUpload
  onUploadComplete={(announcementId) => {
    console.log('공고 ID:', announcementId)
    // 매칭 페이지로 이동
  }}
/>
```

## 🔍 주요 기능

### 1. 공고 업로드 & AI 분석

- PDF 파일 또는 URL 업로드
- 자동 텍스트 추출
- GPT-4o-mini로 요구사항 분석
  - 요구 기술 스택
  - 예산 범위
  - 프로젝트 기간
  - 발주기관, 마감일, 지역

### 2. AI 매칭 추천

- 의미기반 검색 (벡터 유사도)
- 기술 스택 매칭
- 경력/평점 반영
- 상위 N팀 추천

### 3. 견적 자동 초안 생성

- 공고 + 팀 정보 기반
- 과거 유사 프로젝트 참고 (RAG)
- 표준 양식으로 초안 생성
- 마일스톤 자동 구성

### 4. RAG 전략

- **R(검색)**: 공고/과거 사례/팀 이력 청크화 → pgvector Top-K
- **A(증강)**: 검색 근거를 LLM 컨텍스트에 주입
- **G(생성)**: 요구사항 요약·견적 범위·매칭 사유 생성
  - 반드시 `[id:##]` 형식으로 근거 표기

## 📊 데이터 흐름

```
1. 공고 업로드 (PDF/URL)
   ↓
2. 텍스트 추출
   ↓
3. AI 분석 (요구사항 추출)
   ↓
4. 벡터 임베딩 생성 & 저장
   ↓
5. 팀 매칭 (의미기반 검색)
   ↓
6. 견적 초안 자동 생성
   ↓
7. 견적 비교 & 선택
```

## 🔧 고급 설정

### 하이브리드 검색

키워드 검색 + 의미기반 검색을 결합:

```sql
SELECT * FROM hybrid_search_announcements(
  '웹 개발 프로젝트',  -- 키워드
  '[0.1, 0.2, ...]',  -- 벡터 임베딩
  0.3,  -- 키워드 가중치
  0.7,  -- 의미 가중치
  10    -- 결과 수
);
```

### RAG 튜닝

- **청크 크기**: 500-1000자 권장
- **청크 오버랩**: 100-200자
- **Top-K**: 5-10개
- **임계값**: 0.7 이상

### 평가 지표

- **Faithfulness**: 생성 내용이 검색 근거와 일치하는지
- **Relevancy**: 생성 내용이 질문과 관련 있는지
- RAGAS 프레임워크로 측정 가능

## 🐛 문제 해결

### PDF 추출 실패

- `pdf-parse` 패키지 설치 확인
- PDF 파일이 손상되지 않았는지 확인
- 파일 크기 제한 확인 (Supabase Storage)

### AI 분석 실패

- OpenAI API 키 확인
- API 크레딧 확인
- 텍스트 길이 제한 (8000자)

### 매칭 결과 없음

- 팀 데이터가 충분한지 확인
- 임계값 조정 (match_threshold)
- 기술 스택 태그 일치 확인

## 📈 향후 개선 사항

- [ ] 재랭커(Reranker) 추가
- [ ] 실시간 매칭 알림
- [ ] 견적 비교 시각화 개선
- [ ] 리뷰→토큰 보상 시스템
- [ ] 나라장터/NTIS API 연동
- [ ] 다국어 지원

