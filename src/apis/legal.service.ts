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
  sourceType: string;
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

export interface SituationResponseV2 {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  tags: string[];
  analysis: SituationAnalysisV2;
  checklist: string[];
  relatedCases: RelatedCaseV2[];
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
}

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
  createdAt: string;
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
    authHeaders['Content-Type'] = 'application/json';

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: authHeaders,
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
  userId?: string | null
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

    // 인증 헤더 가져오기 (Authorization + X-User-Id)
    const authHeaders = await getAuthHeaders();
    
    // user_id가 명시적으로 제공된 경우 덮어쓰기
    if (userId !== undefined) {
      authHeaders['X-User-Id'] = userId;
    }

    // FormData 전송 시 Content-Type은 브라우저가 자동으로 설정하므로 제거
    // (multipart/form-data boundary는 브라우저가 자동 생성)
    const headersForFormData: HeadersInit = { ...authHeaders };
    delete (headersForFormData as any)['Content-Type'];

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
 * 계약서 상세 조회 (v2)
 */
export const getContractAnalysisV2 = async (
  docId: string
): Promise<ContractAnalysisResponseV2> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/contracts/${docId}`;

    // 인증 헤더 가져오기
    const authHeaders = await getAuthHeaders();
    authHeaders['Content-Type'] = 'application/json';

    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders,
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
    authHeaders['Content-Type'] = 'application/json';
    
    // user_id가 명시적으로 제공된 경우 덮어쓰기
    if (userId !== undefined) {
      authHeaders['X-User-Id'] = userId;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: authHeaders,
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
    authHeaders['Content-Type'] = 'application/json';
    
    // user_id가 명시적으로 제공된 경우 덮어쓰기
    if (userId !== undefined) {
      authHeaders['X-User-Id'] = userId;
    }
    
    // user_id가 없으면 에러
    if (!authHeaders['X-User-Id']) {
      throw new Error('사용자 ID가 필요합니다. 로그인해주세요.');
    }
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: authHeaders,
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

