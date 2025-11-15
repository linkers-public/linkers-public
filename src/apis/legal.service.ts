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
 * 상황 분석
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

