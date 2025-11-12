/**
 * RAG 역할 정의
 * Frontend와 Backend의 역할을 명확히 분리
 */

export enum RAGRole {
  /** 문서 미리보기 - 빠른 메타데이터 추출 */
  DOCUMENT_PREVIEW = 'document_preview',
  
  /** 빠른 검색 - 실시간 검색 */
  QUICK_SEARCH = 'quick_search',
  
  /** 메타데이터 추출 - 구조화된 정보 추출 */
  METADATA_EXTRACTION = 'metadata_extraction',
  
  /** 심층 분석 - 복잡한 분석 작업 */
  DEEP_ANALYSIS = 'deep_analysis',
  
  /** 견적 생성 - 자동 견적서 생성 */
  ESTIMATE_GENERATION = 'estimate_generation',
  
  /** 팀 매칭 - 적합한 팀 추천 */
  TEAM_MATCHING = 'team_matching',
}

/**
 * Frontend RAG 역할
 * - 경량 작업
 * - 실시간 응답
 * - 기본 정보 추출
 */
export const FRONTEND_RAG_ROLES = [
  RAGRole.DOCUMENT_PREVIEW,
  RAGRole.QUICK_SEARCH,
  RAGRole.METADATA_EXTRACTION,
] as const;

/**
 * Backend RAG 역할
 * - 복잡한 분석
 * - 배치 작업
 * - 견적 생성
 */
export const BACKEND_RAG_ROLES = [
  RAGRole.DEEP_ANALYSIS,
  RAGRole.ESTIMATE_GENERATION,
  RAGRole.TEAM_MATCHING,
] as const;

