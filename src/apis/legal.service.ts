/**
 * 법률 RAG API 서비스
 * 백엔드 법률 분석 API와 통신
 */

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
const LEGAL_API_BASE = `${BACKEND_API_URL}/api/v1/legal`;
const LEGAL_API_BASE_V2 = `${BACKEND_API_URL}/api/v2/legal`;

export interface LegalCasePreview {
  id: string;
  title: string;
  situation: string;
  main_issues: string[];
}

export interface LegalIssue {
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  legal_basis: string[];
}

export interface LegalRecommendation {
  title: string;
  description: string;
  steps: string[];
}

export interface LegalGroundingChunk {
  source_id: string;
  source_type: 'law' | 'manual' | 'case';
  title: string;
  snippet: string;
  score: number;
}

export interface LegalAnalysisResult {
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  summary: string;
  issues: LegalIssue[];
  recommendations: LegalRecommendation[];
  grounding: LegalGroundingChunk[];
}

export interface LegalSearchResponse {
  query: string;
  cases: LegalCasePreview[];
}

/**
 * 케이스 검색
 */
export const searchLegalCases = async (
  query: string,
  limit: number = 5
): Promise<LegalCasePreview[]> => {
  try {
    const url = `${LEGAL_API_BASE}/search-cases`;
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
    });

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`케이스 검색 실패: ${response.status} - ${errorText}`);
    }

    const data: LegalSearchResponse = await response.json();
    return data.cases;
  } catch (error) {
    console.error('케이스 검색 오류:', error);
    throw error;
  }
};

/**
 * 상황 분석 (레거시 - 간단한 텍스트만)
 */
export const analyzeLegalSituation = async (
  text: string
): Promise<LegalAnalysisResult> => {
  try {
    const url = `${LEGAL_API_BASE}/analyze-situation`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`상황 분석 실패: ${response.status} - ${errorText}`);
    }

    const data: LegalAnalysisResult = await response.json();
    return data;
  } catch (error) {
    console.error('상황 분석 오류:', error);
    throw error;
  }
};

/**
 * 상황 기반 진단 (상세 정보 포함)
 */
export const analyzeSituationDetailed = async (
  request: import('@/types/legal').SituationAnalysisRequest
): Promise<import('@/types/legal').SituationAnalysisResponse> => {
  try {
    const url = `${LEGAL_API_BASE}/situation/analyze`;
    
    // 프론트엔드 camelCase를 백엔드 snake_case로 변환
    const backendRequest = {
      category_hint: request.categoryHint,
      situation_text: request.situationText, // summary + details를 합친 텍스트
      ...(request.summary && { summary: request.summary }),
      ...(request.details && { details: request.details }),
      ...(request.employmentType && { employment_type: request.employmentType }),
      ...(request.workPeriod && { work_period: request.workPeriod }),
      ...(request.weeklyHours && { weekly_hours: request.weeklyHours }),
      ...(request.isProbation !== undefined && { is_probation: request.isProbation }),
      ...(request.socialInsurance && { social_insurance: request.socialInsurance }),
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`상황 진단 실패: ${response.status} - ${errorText}`);
    }

    const backendData: any = await response.json();
    
    // 백엔드 snake_case를 프론트엔드 camelCase로 변환
    const data: import('@/types/legal').SituationAnalysisResponse = {
      classifiedType: backendData.classified_type,
      riskScore: backendData.risk_score,
      summary: backendData.summary,
      criteria: backendData.criteria || [],
      actionPlan: {
        steps: (backendData.action_plan?.steps || []).map((step: any) => ({
          title: step.title,
          items: step.items || [],
        })),
      },
      scripts: {
        toCompany: backendData.scripts?.to_company,
        toAdvisor: backendData.scripts?.to_advisor,
      },
      relatedCases: (backendData.related_cases || []).map((caseItem: any) => ({
        id: caseItem.id,
        title: caseItem.title,
        summary: caseItem.summary,
      })),
      sources: (backendData.sources || []).map((source: any) => ({
        sourceId: source.source_id || source.sourceId,
        sourceType: source.source_type || source.sourceType,
        title: source.title,
        snippet: source.snippet,
        score: source.score,
      })),
    };
    
    return data;
  } catch (error) {
    console.error('상황 진단 오류:', error);
    throw error;
  }
};

/**
 * 계약서 분석
 */
export const analyzeContract = async (
  file: File,
  description?: string
): Promise<LegalAnalysisResult> => {
  try {
    const url = `${LEGAL_API_BASE}/analyze-contract`;
    
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`계약서 분석 실패: ${response.status} - ${errorText}`);
    }

    const data: LegalAnalysisResult = await response.json();
    return data;
  } catch (error) {
    console.error('계약서 분석 오류:', error);
    throw error;
  }
};

// ========== v2 API (가이드 스펙) ==========

export interface LegalSearchResultV2 {
  legal_document_id: string;
  section_title?: string;
  text: string;
  score: number;
  source?: string;
  doc_type?: string;
  title?: string;
}

export interface LegalSearchResponseV2 {
  results: LegalSearchResultV2[];
  count: number;
  query: string;
}

export interface SituationRequestV2 {
  situation: string;
  category?: string;
  employmentType?: string;
  companySize?: string;
  workPeriod?: string;
  hasWrittenContract?: boolean;
  socialInsurance?: string[];
}

export interface LegalBasisItemV2 {
  title: string;
  snippet: string;
  sourceType?: string;
  // 백엔드에서 status(violation/likely 등)를 내려줄 수 있으므로 여유 있게 string 허용
  status?: string;
  filePath?: string; // 원본 파일 경로
}

export interface SituationAnalysisV2 {
  summary: string;
  legalBasis: LegalBasisItemV2[];
  recommendations: string[];
}

export interface RelatedCaseV2 {
  id: string;
  title: string;
  summary: string;
  link?: string;
}

export interface ScriptsV2 {
  toCompany?: string;
  toAdvisor?: string;
}

export interface SourceItemV2 {
  sourceId: string;
  sourceType: 'law' | 'manual' | 'case';
  title: string;
  snippet: string;
  score: number;
}

export interface SituationResponseV2 {
  id?: string;  // situation_analyses 테이블의 ID
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  tags: string[];
  analysis: SituationAnalysisV2;
  checklist: string[];
  scripts?: ScriptsV2;
  relatedCases: RelatedCaseV2[];
  sources?: SourceItemV2[]; // RAG 검색 출처
}

export interface ContractIssueV2 {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  summary: string;
  originalText: string;
  legalBasis: string[];
  explanation: string;
  suggestedRevision: string;
  clauseId?: string;  // 연결된 조항 ID
  startIndex?: number;  // 원문에서 시작 위치
  endIndex?: number;  // 원문에서 종료 위치
  toxicClauseDetail?: ToxicClauseDetail;  // 독소조항 상세 정보
}

export interface ClauseV2 {
  id: string;
  title: string;  // "제1조 (목적)"
  content: string;
  articleNumber?: number;
  startIndex: number;
  endIndex: number;
  category?: string;
}

export interface HighlightedTextV2 {
  text: string;
  startIndex: number;
  endIndex: number;
  severity: 'low' | 'medium' | 'high';
  issueId: string;
}

// 독소조항 관련 타입 추가
export interface ToxicClauseDetail {
  clauseLocation: string;
  contentSummary: string;
  whyRisky: string;
  realWorldProblems: string;
  suggestedRevisionLight: string;
  suggestedRevisionFormal: string;
}

export interface RiskSummaryItem {
  item: string;
  riskLevel: 'low' | 'medium' | 'high';
  problemPoint: string;
  simpleExplanation: string;
  revisionKeyword: string;
}

// v2 API용 별칭 (호환성)
export type RiskSummaryItemV2 = RiskSummaryItem;

export interface ContractAnalysisResponseV2 {
  docId: string;
  title: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  sections: {
    working_hours?: number;
    wage?: number;
    probation_termination?: number;
    stock_option_ip?: number;
  };
  issues: ContractIssueV2[];
  summary: string;
  retrievedContexts: Array<{
    sourceType: string;
    title: string;
    snippet: string;
  }>;
  contractText?: string;  // 계약서 원문 텍스트
  clauses?: ClauseV2[];  // 조항 목록 (자동 분류)
  highlightedTexts?: HighlightedTextV2[];  // 하이라이트된 텍스트
  createdAt: string;
  fileUrl?: string;  // Supabase Storage에 저장된 원본 파일 URL
  // 새로운 독소조항 탐지 필드
  oneLineSummary?: string;  // 한 줄 총평
  riskTrafficLight?: string;  // 리스크 신호등: 🟢 | 🟡 | 🔴
  top3ActionPoints?: string[];  // 지금 당장 확인하거나 물어봐야 할 포인트 3개
  riskSummaryTable?: RiskSummaryItem[];  // 리스크 요약 테이블
  toxicClauses?: ToxicClauseDetail[];  // 독소조항 상세 목록
  negotiationQuestions?: string[];  // 협상 시 질문 리스트
}

export interface ContractComparisonRequestV2 {
  oldContractId: string;
  newContractId: string;
}

export interface ContractComparisonResponseV2 {
  oldContract: ContractAnalysisResponseV2;
  newContract: ContractAnalysisResponseV2;
  changedClauses: Array<{
    type: 'added' | 'removed' | 'modified';
    clauseId: string;
    title: string;
    content?: string;
    oldContent?: string;
    newContent?: string;
  }>;
  riskChange: {
    oldRiskScore: number;
    newRiskScore: number;
    oldRiskLevel: string;
    newRiskLevel: string;
    riskScoreDelta: number;
  };
  summary: string;
}

export interface ClauseRewriteRequestV2 {
  clauseId: string;
  originalText: string;
  issueId?: string;
}

export interface ClauseRewriteResponseV2 {
  originalText: string;
  rewrittenText: string;
  explanation: string;
  legalBasis: string[];
}

/**
 * 법령/케이스 검색 (v2)
 */
export const searchLegalV2 = async (
  query: string,
  limit: number = 5,
  docType?: string
): Promise<LegalSearchResponseV2> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/search`;
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });
    if (docType) {
      params.append('doc_type', docType);
    }

    // 인증 헤더 가져오기 (선택적 - 검색은 인증 없이도 가능)
    const authHeaders = await getAuthHeaders();
    const headers = {
      ...(authHeaders as Record<string, string>),
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`법령 검색 실패: ${response.status} - ${errorText}`);
    }

    const data: LegalSearchResponseV2 = await response.json();
    return data;
  } catch (error) {
    console.error('법령 검색 오류:', error);
    throw error;
  }
};

/**
 * 사용자 ID 가져오기 (Supabase)
 */
const getUserId = async (): Promise<string | null> => {
  try {
    const { createSupabaseBrowserClient } = await import('@/supabase/supabase-client');
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.warn('사용자 ID 가져오기 실패:', error);
    return null;
  }
};

/**
 * 인증 헤더 가져오기 (Supabase 액세스 토큰)
 */
const getAuthHeaders = async (): Promise<HeadersInit> => {
  const headers: HeadersInit = {};
  
  try {
    const { createSupabaseBrowserClient } = await import('@/supabase/supabase-client');
    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    // user_id도 함께 추가
    const userId = await getUserId();
    if (userId) {
      headers['X-User-Id'] = userId;
    }
  } catch (error) {
    console.warn('인증 헤더 가져오기 실패:', error);
  }
  
  return headers;
};

/**
 * 계약서 분석 (v2)
 */
export const analyzeContractV2 = async (
  file: File,
  title?: string,
  docType?: string,
  userId?: string | null,
  contractType?: 'freelancer' | 'part_time' | 'regular' | 'service' | 'other',
  userRole?: 'worker' | 'employer',
  field?: 'it_dev' | 'design' | 'marketing' | 'other',
  concerns?: string
): Promise<ContractAnalysisResponseV2> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/analyze-contract`;
    
    const formData = new FormData();
    formData.append('file', file);
    if (title) {
      formData.append('title', title);
    }
    if (docType) {
      formData.append('doc_type', docType);
    }
    if (contractType) {
      formData.append('contract_type', contractType);
    }
    if (userRole) {
      formData.append('user_role', userRole);
    }
    if (field) {
      formData.append('field', field);
    }
    if (concerns) {
      formData.append('concerns', concerns);
    }

    // 인증 헤더 가져오기 (Authorization + X-User-Id)
    const authHeaders = await getAuthHeaders();
    
    // user_id가 명시적으로 제공된 경우 덮어쓰기
    const headersForFormData: Record<string, string> = {
      ...(authHeaders as Record<string, string>),
    };
    if (userId !== undefined && userId !== null) {
      headersForFormData['X-User-Id'] = userId;
    }

    // FormData 전송 시 Content-Type은 브라우저가 자동으로 설정하므로 제거
    // (multipart/form-data boundary는 브라우저가 자동 생성)
    delete headersForFormData['Content-Type'];

    const response = await fetch(url, {
      method: 'POST',
      headers: headersForFormData,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[계약서 분석] API 에러:', response.status, errorText);
      throw new Error(`계약서 분석 실패: ${response.status} - ${errorText}`);
    }

    const data: ContractAnalysisResponseV2 = await response.json();
    
    // 응답 검증
    if (!data || typeof data !== 'object') {
      console.error('[계약서 분석] 잘못된 응답 형식:', data);
      throw new Error('서버에서 잘못된 형식의 응답을 받았습니다.');
    }
    
    // 📋 백엔드 응답 전체를 JSON으로 출력 (브라우저에서 펼쳐서 볼 수 있음)
    console.group('📋 [계약서 분석] 백엔드 API 응답 전체');
    console.log('전체 응답 객체:', data);
    console.log('JSON 문자열:', JSON.stringify(data, null, 2));
    console.log('응답 키 목록:', Object.keys(data));
    console.groupEnd();
    
    // contractText 확인
    const hasContractText = !!(data.contractText && data.contractText.trim().length > 0);
    console.log('🔍 [계약서 분석] API 응답 요약:', {
      docId: data.docId,
      hasContractText,
      contractTextLength: data.contractText?.length || 0,
      contractTextPreview: data.contractText?.substring(0, 200) || '(없음)',
      riskScore: data.riskScore,
      riskLevel: data.riskLevel,
      issuesCount: data.issues?.length || 0,
      hasSummary: !!data.summary,
      summaryPreview: data.summary?.substring(0, 100) || '(없음)',
      responseKeys: Object.keys(data)
    });
    
    if (!hasContractText) {
      console.warn('⚠️ [계약서 분석] API 응답에 contractText가 없습니다!', {
        docId: data.docId,
        responseKeys: Object.keys(data),
        contractText: data.contractText,
        contractTextType: typeof data.contractText,
        contractTextIsEmpty: data.contractText === '' || data.contractText === null || data.contractText === undefined
      });
    }
    
    if (!data.docId) {
      console.warn('[계약서 분석] docId가 응답에 없음:', data);
      // docId가 없으면 임시 ID 생성
      data.docId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    return data;
  } catch (error) {
    console.error('계약서 분석 오류:', error);
    throw error;
  }
};

/**
 * 계약서 비교 (v2)
 */
export const compareContractsV2 = async (
  oldContractId: string,
  newContractId: string
): Promise<ContractComparisonResponseV2> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/compare-contracts`
    const authHeaders = await getAuthHeaders()
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        oldContractId,
        newContractId,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`계약서 비교 실패: ${response.status} - ${errorText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('계약서 비교 오류:', error)
    throw error
  }
}

/**
 * 조항 리라이트 (v2)
 */
export const rewriteClauseV2 = async (
  clauseId: string,
  originalText: string,
  issueId?: string,
  legalBasis?: string[]
): Promise<ClauseRewriteResponseV2> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/rewrite-clause`
    const authHeaders = await getAuthHeaders()
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clauseId,
        originalText,
        issueId,
        legalBasis: legalBasis || undefined,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`조항 리라이트 실패: ${response.status} - ${errorText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('조항 리라이트 오류:', error)
    throw error
  }
}

/**
 * 계약서 상세 조회 (v2)
 */
export const getContractAnalysisV2 = async (
  docId: string
): Promise<ContractAnalysisResponseV2> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/contracts/${docId}`;

    // 인증 헤더 가져오기
    const authHeaders = await getAuthHeaders();
    const headers = {
      ...(authHeaders as Record<string, string>),
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`계약서 조회 실패: ${response.status} - ${errorText}`);
    }

    const data: ContractAnalysisResponseV2 = await response.json();
    return data;
  } catch (error) {
    console.error('계약서 조회 오류:', error);
    throw error;
  }
};

/**
 * 상황별 법률 분석 (v2)
 */
export const analyzeSituationV2 = async (
  request: SituationRequestV2,
  userId?: string | null
): Promise<SituationResponseV2> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/analyze-situation`;
    
    // 인증 헤더 가져오기 (Authorization + X-User-Id)
    const authHeaders = await getAuthHeaders();
    const headers: Record<string, string> = {
      ...(authHeaders as Record<string, string>),
      'Content-Type': 'application/json',
    };
    
    // user_id가 명시적으로 제공된 경우 덮어쓰기
    if (userId !== undefined && userId !== null) {
      headers['X-User-Id'] = userId;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`상황 분석 실패: ${response.status} - ${errorText}`);
    }

    const data: SituationResponseV2 = await response.json();
    return data;
  } catch (error) {
    console.error('상황 분석 오류:', error);
    throw error;
  }
};

/**
 * 사용자별 계약서 분석 히스토리 조회 (v2)
 */
export const getContractHistoryV2 = async (
  limit: number = 20,
  offset: number = 0,
  userId?: string | null
): Promise<Array<{
  id: string;
  doc_id: string;
  title: string;
  original_filename: string;
  risk_score: number;
  risk_level: string;
  summary: string;
  created_at: string;
  issue_count: number;
}>> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/contracts/history`;
    
    // 인증 헤더 가져오기 (Authorization + X-User-Id)
    const authHeaders = await getAuthHeaders();
    const headers: Record<string, string> = {
      ...(authHeaders as Record<string, string>),
      'Content-Type': 'application/json',
    };
    
    // user_id가 명시적으로 제공된 경우 덮어쓰기
    if (userId !== undefined && userId !== null) {
      headers['X-User-Id'] = userId;
    }
    
    // user_id가 없으면 빈 배열 반환 (에러 대신)
    if (!headers['X-User-Id']) {
      console.warn('사용자 ID가 없어 히스토리를 조회할 수 없습니다. 로컬 스토리지를 확인하세요.');
      return [];
    }
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`히스토리 조회 실패: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('히스토리 조회 오류:', error);
    throw error;
  }
};

/**
 * 사용자별 상황 분석 히스토리 조회 (v2)
 */
export const getSituationHistoryV2 = async (
  limit: number = 20,
  offset: number = 0,
  userId?: string | null
): Promise<Array<{
  id: string;
  situation: string;
  category: string;
  risk_score: number;
  risk_level: string;
  summary: string;
  created_at: string;
}>> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/situations/history`;
    
    const authHeaders = await getAuthHeaders();
    const headers: Record<string, string> = {
      ...(authHeaders as Record<string, string>),
      'Content-Type': 'application/json',
    };
    
    if (userId !== undefined && userId !== null) {
      headers['X-User-Id'] = userId;
    }
    
    if (!headers['X-User-Id']) {
      console.warn('사용자 ID가 없어 히스토리를 조회할 수 없습니다.');
      return [];
    }
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`히스토리 조회 실패: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('히스토리 조회 오류:', error);
    throw error;
  }
};

/**
 * 특정 상황 분석 결과 조회 (v2)
 */
export const getSituationAnalysisByIdV2 = async (
  situationId: string,
  userId?: string | null
): Promise<SituationResponseV2> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/situations/${situationId}`;
    
    const authHeaders = await getAuthHeaders();
    const headers: Record<string, string> = {
      ...(authHeaders as Record<string, string>),
      'Content-Type': 'application/json',
    };
    
    if (userId !== undefined && userId !== null) {
      headers['X-User-Id'] = userId;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`분석 결과 조회 실패: ${response.status} - ${errorText}`);
    }

    const data: SituationResponseV2 = await response.json();
    return data;
  } catch (error) {
    console.error('분석 결과 조회 오류:', error);
    throw error;
  }
};

// 레거시 API 함수 제거됨 - 새 테이블 구조(legal_chat_sessions, legal_chat_messages) 사용

/**
 * 법률 상담 챗 (v2) - Dual RAG 지원
 */
export interface LegalChatRequestV2 {
  query: string
  docIds: string[]
  selectedIssueId?: string
  selectedIssue?: {
    category?: string
    summary?: string
    severity?: string
    originalText?: string
    legalBasis?: LegalBasisItemV2[]  // string[]에서 LegalBasisItemV2[]로 변경
  }
  analysisSummary?: string
  riskScore?: number
  totalIssues?: number
  topK?: number
  // 🔥 컨텍스트 타입 및 ID 추가
  contextType?: 'none' | 'situation' | 'contract'
  contextId?: string | null
}

export interface LegalChatResponseV2 {
  answer: string
  markdown?: string
  query: string
  usedChunks?: {
    contract: Array<{
      id?: string
      source_type?: string
      title?: string
      content?: string
      score?: number
    }>
    legal: Array<{
      id?: string
      source_type?: string
      title?: string
      content?: string
      score?: number
    }>
  }
}

export const chatWithContractV2 = async (
  request: LegalChatRequestV2
): Promise<LegalChatResponseV2> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/chat`
    
    // 인증 헤더 가져오기
    const authHeaders = await getAuthHeaders()
    const headers = {
      ...(authHeaders as Record<string, string>),
      'Content-Type': 'application/json',
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`법률 상담 챗 실패: ${response.status} - ${errorText}`)
    }

    const data: LegalChatResponseV2 = await response.json()
    return data
  } catch (error) {
    console.error('법률 상담 챗 오류:', error)
    throw error
  }
}

/**
 * 헬스 체크 (v2)
 */
export const healthCheckV2 = async (): Promise<{ status: string; message: string }> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/health`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`헬스 체크 실패: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('헬스 체크 오류:', error);
    throw error;
  }
};

// ============================================================================
// 새로운 통합 챗 시스템 API (legal_chat_sessions, legal_chat_messages)
// ============================================================================

export interface ChatSession {
  id: string
  user_id: string
  initial_context_type: 'none' | 'situation' | 'contract'
  initial_context_id?: string | null
  title?: string | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  user_id: string
  sender_type: 'user' | 'assistant'
  message: string
  sequence_number: number
  context_type: 'none' | 'situation' | 'contract'
  context_id?: string | null
  metadata?: any
  created_at: string
}

export interface CreateChatSessionRequest {
  initial_context_type?: 'none' | 'situation' | 'contract'
  initial_context_id?: string | null
  title?: string | null
}

export interface SaveChatMessageRequest {
  sender_type: 'user' | 'assistant'
  message: string
  sequence_number: number
  context_type?: 'none' | 'situation' | 'contract'
  context_id?: string | null
}

/**
 * 챗 세션 생성
 */
export const createChatSession = async (
  request: CreateChatSessionRequest,
  userId: string
): Promise<{ id: string; success: boolean }> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/chat/sessions`
    
    const authHeaders = await getAuthHeaders()
    const headers: Record<string, string> = {
      ...(authHeaders as Record<string, string>),
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`챗 세션 생성 실패: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('챗 세션 생성 오류:', error)
    throw error
  }
}

/**
 * 챗 세션 목록 조회
 */
export const getChatSessions = async (
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<ChatSession[]> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/chat/sessions`
    
    const authHeaders = await getAuthHeaders()
    const headers: Record<string, string> = {
      ...(authHeaders as Record<string, string>),
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    }
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    })
    
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`챗 세션 목록 조회 실패: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('챗 세션 목록 조회 오류:', error)
    throw error
  }
}

/**
 * 특정 챗 세션 조회
 */
export const getChatSession = async (
  sessionId: string,
  userId?: string | null
): Promise<ChatSession> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/chat/sessions/${sessionId}`
    
    const authHeaders = await getAuthHeaders()
    const headers: Record<string, string> = {
      ...(authHeaders as Record<string, string>),
      'Content-Type': 'application/json',
    }
    
    if (userId) {
      headers['X-User-Id'] = userId
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`챗 세션 조회 실패: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('챗 세션 조회 오류:', error)
    throw error
  }
}

/**
 * 챗 메시지 저장
 */
export const saveChatMessage = async (
  sessionId: string,
  request: SaveChatMessageRequest,
  userId: string
): Promise<{ id: string; success: boolean }> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/chat/sessions/${sessionId}/messages`
    
    const authHeaders = await getAuthHeaders()
    const headers: Record<string, string> = {
      ...(authHeaders as Record<string, string>),
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`챗 메시지 저장 실패: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('챗 메시지 저장 오류:', error)
    throw error
  }
}

/**
 * 챗 메시지 목록 조회
 */
export const getChatMessages = async (
  sessionId: string,
  userId?: string | null
): Promise<ChatMessage[]> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/chat/sessions/${sessionId}/messages`
    
    const authHeaders = await getAuthHeaders()
    const headers: Record<string, string> = {
      ...(authHeaders as Record<string, string>),
      'Content-Type': 'application/json',
    }
    
    if (userId) {
      headers['X-User-Id'] = userId
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`챗 메시지 조회 실패: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('챗 메시지 조회 오류:', error)
    throw error
  }
}

/**
 * 챗 세션 업데이트
 */
export const updateChatSession = async (
  sessionId: string,
  title: string,
  userId: string
): Promise<{ success: boolean }> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/chat/sessions/${sessionId}`
    
    const authHeaders = await getAuthHeaders()
    const headers: Record<string, string> = {
      ...(authHeaders as Record<string, string>),
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    }
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ title }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`챗 세션 업데이트 실패: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('챗 세션 업데이트 오류:', error)
    throw error
  }
}

/**
 * 챗 세션 삭제
 */
export const deleteChatSession = async (
  sessionId: string,
  userId: string
): Promise<{ success: boolean }> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/chat/sessions/${sessionId}`
    
    const authHeaders = await getAuthHeaders()
    const headers: Record<string, string> = {
      ...(authHeaders as Record<string, string>),
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    }
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`챗 세션 삭제 실패: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('챗 세션 삭제 오류:', error)
    throw error
  }
}

// ============================================================================
// 상황 분석 리포트 저장/조회 (Supabase)
// ============================================================================

export interface SituationReport {
  id: string;
  user_id?: string;
  question: string;
  answer: string;
  summary?: string;
  details?: string;
  category_hint?: string;
  employment_type?: string;
  work_period?: string;
  social_insurance?: string;
  risk_score?: number;
  classified_type?: string;
  legal_basis?: string[];
  recommendations?: string[];
  tags?: string[];
  analysis_result?: any;
  created_at: string;
  updated_at: string;
}

/**
 * 상황 분석 리포트를 Supabase에 저장
 */
export const saveSituationReport = async (
  report: Omit<SituationReport, 'id' | 'created_at' | 'updated_at'>
): Promise<SituationReport> => {
  try {
    const { createSupabaseBrowserClient } = await import('@/supabase/supabase-client');
    const supabase = createSupabaseBrowserClient();
    
    // 사용자 ID 가져오기 (선택사항)
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    const { data, error } = await supabase
      .from('situation_reports')
      .insert({
        user_id: userId,
        question: report.question,
        answer: report.answer,
        summary: report.summary,
        details: report.details,
        category_hint: report.category_hint,
        employment_type: report.employment_type,
        work_period: report.work_period,
        social_insurance: report.social_insurance,
        risk_score: report.risk_score,
        classified_type: report.classified_type,
        legal_basis: report.legal_basis,
        recommendations: report.recommendations,
        tags: report.tags,
        analysis_result: report.analysis_result,
      })
      .select()
      .single();

    if (error) {
      console.error('리포트 저장 실패:', error);
      throw new Error(`리포트 저장 실패: ${error.message}`);
    }

    return data as SituationReport;
  } catch (error) {
    console.error('리포트 저장 오류:', error);
    throw error;
  }
};

/**
 * 사용자의 상황 분석 리포트 목록 조회
 */
export const getSituationReports = async (limit: number = 50): Promise<SituationReport[]> => {
  try {
    const { createSupabaseBrowserClient } = await import('@/supabase/supabase-client');
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from('situation_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('리포트 조회 실패:', error);
      throw new Error(`리포트 조회 실패: ${error.message}`);
    }

    return (data || []) as SituationReport[];
  } catch (error) {
    console.error('리포트 조회 오류:', error);
    throw error;
  }
};

/**
 * 특정 리포트 조회
 */
export const getSituationReport = async (reportId: string): Promise<SituationReport | null> => {
  try {
    const { createSupabaseBrowserClient } = await import('@/supabase/supabase-client');
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from('situation_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 리포트를 찾을 수 없음
        return null;
      }
      console.error('리포트 조회 실패:', error);
      throw new Error(`리포트 조회 실패: ${error.message}`);
    }

    return data as SituationReport;
  } catch (error) {
    console.error('리포트 조회 오류:', error);
    throw error;
  }
};

/**
 * 리포트 삭제
 */
export const deleteSituationReport = async (reportId: string): Promise<void> => {
  try {
    const { createSupabaseBrowserClient } = await import('@/supabase/supabase-client');
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase
      .from('situation_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      console.error('리포트 삭제 실패:', error);
      throw new Error(`리포트 삭제 실패: ${error.message}`);
    }
  } catch (error) {
    console.error('리포트 삭제 오류:', error);
    throw error;
  }
};

// ============================================================================
// 상황 분석 결과 조회 (Supabase - situation_analyses 테이블)
// ============================================================================

/**
 * 상황 분석 결과 조회 (situation_analyses 테이블에서)
 * @param analysisId situation_analyses.id
 * @returns 상황 분석 결과 전체 데이터
 */
export const getAnalysisResult = async (
  analysisId: string
): Promise<import('@/types/legal').SituationAnalysisResult | null> => {
  try {
    const { createSupabaseBrowserClient } = await import('@/supabase/supabase-client');
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from('situation_analyses')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 레코드를 찾을 수 없음
        return null;
      }
      console.error('분석 결과 조회 실패:', error);
      throw new Error(`분석 결과 조회 실패: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // analysis JSONB 필드 파싱 (이미 객체일 수도 있음)
    let analysis: import('@/types/legal').AnalysisJSON;
    if (typeof data.analysis === 'string') {
      try {
        analysis = JSON.parse(data.analysis);
      } catch (parseError) {
        console.error('analysis JSON 파싱 실패:', parseError);
        // 기본값으로 fallback
        analysis = {
          summary: data.answer || data.situation || '',
          risk_score: data.risk_score || 0,
        };
      }
    } else {
      analysis = data.analysis || {
        summary: data.answer || data.situation || '',
        risk_score: data.risk_score || 0,
      };
    }

    return {
      id: data.id,
      user_id: data.user_id,
      situation: data.situation,
      category: data.category || data.category_hint,
      risk_score: data.risk_score,
      risk_level: data.risk_level,
      analysis,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error('분석 결과 조회 오류:', error);
    throw error;
  }
};

