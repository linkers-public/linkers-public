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

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
 * 계약서 분석 (v2)
 */
export const analyzeContractV2 = async (
  file: File,
  title?: string,
  docType?: string
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

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`계약서 분석 실패: ${response.status} - ${errorText}`);
    }

    const data: ContractAnalysisResponseV2 = await response.json();
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

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
  request: SituationRequestV2
): Promise<SituationResponseV2> => {
  try {
    const url = `${LEGAL_API_BASE_V2}/analyze-situation`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

