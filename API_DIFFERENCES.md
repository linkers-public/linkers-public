# 기존 Upload → Analysis vs 현재 Legal/Contract API 차이점

## 📋 개요

### 기존 방식 (공공입찰 공고)
- **경로**: `/public-announcements/upload` → `/analysis/[docId]`
- **용도**: 공공입찰 공고 분석 및 팀 매칭

### 현재 방식 (법률 계약서)
- **경로**: `/legal/contract` → `/legal/contract/[docId]`
- **용도**: 계약서 법률 위험도 분석

---

## 🔄 API 호출 플로우 비교

### 기존 방식 (공공입찰)

```
1. 파일 업로드
   └─> Supabase Storage에 파일 저장
   └─> public_announcements 테이블에 메타데이터 저장
   └─> API: uploadAnnouncement() (Supabase 직접 호출)

2. RAG 인덱싱
   └─> /api/rag/ingest (Next.js API Route)
   └─> 백엔드: /api/v2/announcements/upload
   └─> 벡터 임베딩 생성 및 저장

3. AI 분석
   └─> /api/public-announcement/analyze (Next.js API Route)
   └─> 백엔드: /api/v2/announcements/analyze (추정)
   └─> 요구사항, 예산, 기간 추출
   └─> Supabase DB에 분석 결과 저장

4. 상세 페이지
   └─> /analysis/[docId]
   └─> 하드코딩된 더미 데이터 표시
   └─> /api/rag/query 사용 (RAG 쿼리)
```

### 현재 방식 (법률 계약서)

```
1. 파일 선택
   └─> 파일만 선택 (저장 안 함)
   └─> 클라이언트에서 직접 처리

2. 분석
   └─> analyzeContract() (프론트엔드 서비스)
   └─> 백엔드: /api/v1/legal/analyze-contract (직접 호출)
   └─> 파일 → 텍스트 추출 → RAG 검색 → LLM 분석
   └─> LegalAnalysisResult 반환

3. 결과 저장
   └─> 로컬 스토리지에 저장
   └─> 키: contract_analysis_{docId}

4. 상세 페이지
   └─> /legal/contract/[docId]
   └─> 로컬 스토리지에서 로드
   └─> 없으면 /api/rag/query 사용 (fallback)
```

---

## 🔍 주요 차이점

### 1. 파일 저장 방식

| 항목 | 기존 (공공입찰) | 현재 (법률) |
|------|----------------|------------|
| **저장 위치** | Supabase Storage | 저장 안 함 |
| **메타데이터** | Supabase DB | 없음 |
| **파일 URL** | 공개 URL 생성 | 없음 |

### 2. API 호출 구조

| 항목 | 기존 (공공입찰) | 현재 (법률) |
|------|----------------|------------|
| **업로드 API** | Supabase 직접 호출 | 없음 |
| **인덱싱 API** | `/api/rag/ingest` → 백엔드 | 없음 |
| **분석 API** | `/api/public-announcement/analyze` (Next.js Route) | `/api/v1/legal/analyze-contract` (백엔드 직접) |
| **프록시** | Next.js API Route 사용 | 프론트엔드에서 직접 호출 |

### 3. 데이터 저장

| 항목 | 기존 (공공입찰) | 현재 (법률) |
|------|----------------|------------|
| **분석 결과** | Supabase DB | 로컬 스토리지 |
| **영구 저장** | ✅ 예 | ❌ 아니오 (브라우저 종료 시 삭제) |
| **공유 가능** | ✅ 예 (DB 기반) | ❌ 아니오 (로컬만) |

### 4. 벡터 인덱싱

| 항목 | 기존 (공공입찰) | 현재 (법률) |
|------|----------------|------------|
| **RAG 인덱싱** | ✅ 별도 API 호출 | ❌ 없음 (분석 시 자동) |
| **벡터 저장** | Supabase 벡터 DB | 분석 시에만 검색 |

### 5. 상세 페이지 데이터 로드

| 항목 | 기존 (공공입찰) | 현재 (법률) |
|------|----------------|------------|
| **데이터 소스** | 하드코딩된 더미 데이터 | 로컬 스토리지 |
| **Fallback** | 없음 | `/api/rag/query` 사용 |
| **실제 분석 결과** | 표시 안 함 | 표시함 |

---

## 📊 API 엔드포인트 비교

### 기존 (공공입찰)

```typescript
// 1. 업로드
uploadAnnouncement(file, url, title)
  → Supabase Storage + DB

// 2. 인덱싱
POST /api/rag/ingest
  → POST /api/v2/announcements/upload (백엔드)

// 3. 분석
POST /api/public-announcement/analyze
  → 백엔드 분석 API (추정)

// 4. 쿼리
POST /api/rag/query
  → GET /api/v2/announcements/search (백엔드)
```

### 현재 (법률)

```typescript
// 1. 분석 (업로드 + 분석 통합)
analyzeContract(file, description?)
  → POST /api/v1/legal/analyze-contract (백엔드 직접)

// 2. 쿼리 (fallback)
POST /api/rag/query
  → GET /api/v2/announcements/search (백엔드)
```

---

## ⚠️ 주요 차이점 요약

### 기존 방식의 특징
1. **영구 저장**: Supabase에 파일과 메타데이터 저장
2. **단계별 처리**: 업로드 → 인덱싱 → 분석 (3단계)
3. **Next.js 프록시**: 대부분의 API가 Next.js Route를 거침
4. **DB 기반**: 모든 데이터가 Supabase에 저장
5. **공유 가능**: 다른 사용자와 공유 가능

### 현재 방식의 특징
1. **임시 저장**: 로컬 스토리지만 사용
2. **통합 처리**: 파일 선택 → 분석 (1단계)
3. **직접 호출**: 백엔드 API를 프론트엔드에서 직접 호출
4. **로컬 기반**: 브라우저 로컬 스토리지 사용
5. **개인 전용**: 브라우저별로 독립적

---

## 🔧 개선 제안

### 현재 방식의 한계
1. **데이터 손실**: 브라우저 삭제 시 데이터 손실
2. **공유 불가**: 다른 기기에서 접근 불가
3. **히스토리 없음**: 이전 분석 결과 조회 불가

### 개선 방안
1. **선택적 저장**: 사용자가 원할 때만 Supabase에 저장
2. **하이브리드**: 로컬 스토리지 + DB 옵션 제공
3. **세션 관리**: 로그인 사용자는 자동으로 DB 저장

