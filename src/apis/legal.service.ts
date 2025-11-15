/**
 * 법률 RAG API 서비스
 * 백엔드 법률 분석 API와 통신
 */

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
const LEGAL_API_BASE = `${BACKEND_API_URL}/api/v1/legal`;

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

