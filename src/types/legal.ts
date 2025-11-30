/**
 * 법률 분석 관련 타입 정의
 */

export type LegalCategory = 
  | 'working_hours' 
  | 'wage' 
  | 'probation' 
  | 'stock_option' 
  | 'ip' 
  | 'harassment'
  | 'job_stability'  // 고용안정
  | 'dismissal'      // 해고·해지
  | 'payment'        // 보수·수당 (wage와 유사하지만 별도)
  | 'non_compete'    // 경업금지
  | 'liability'      // 손해배상
  | 'dispute'        // 분쟁해결
  | 'nda'            // 비밀유지
  | 'other'

export type Severity = 'low' | 'medium' | 'high'
export type Priority = 'low' | 'medium' | 'high'

export interface LegalIssueLocation {
  page?: number
  clauseNumber?: string
  startIndex?: number
  endIndex?: number
  lineNumber?: number
}

export interface LegalIssueMetrics {
  legalRisk: number // 0-5
  ambiguity: number // 0-5
  negotiability: number // 0-5
  priority: Priority
}

// 법적 근거 항목 (구조화된 형식) - RAG Citation 객체
export interface LegalBasisItem {
  sourceType: 'law' | 'manual' | 'case' | 'standard_contract' | string
  title: string             // legal_chunks.title (문서 이름)
  snippet: string           // legal_chunks.content 일부 (참조한 텍스트)
  filePath: string          // 스토리지 object key (예: "law/xxx.pdf")
  externalId?: string       // legal_chunks.external_id
  chunkIndex?: number       // legal_chunks.chunk_index
  similarityScore?: number  // (선택) 벡터 유사도
  reason?: string           // 이 이슈에 이 근거를 붙인 이유 (LLM 한 줄 설명)
  status?: string           // "likely" | "unclear" | "unlikely" (레거시 호환)
}

export interface LegalIssue {
  id: string
  category: LegalCategory
  severity: Severity
  summary: string
  location: LegalIssueLocation
  metrics: LegalIssueMetrics
  originalText: string
  suggestedText?: string
  rationale?: string
  suggestedQuestions?: string[]
  legalBasis?: string[] | LegalBasisItem[]  // string[] 또는 구조화된 형식 지원
}

export interface ContractAnalysisResult {
  contractText: string // 전체 계약서 텍스트
  issues: LegalIssue[]
  summary: string
  riskScore: number
  totalIssues: number
  highRiskCount: number
  mediumRiskCount: number
  lowRiskCount: number
}

// 상황 기반 진단 타입
export type SituationCategory = 
  | 'harassment'      // 직장 내 괴롭힘 / 모욕
  | 'unpaid_wage'     // 임금체불 / 수당 미지급
  | 'unfair_dismissal' // 부당해고 / 계약해지
  | 'overtime'        // 근로시간 / 야근 / 휴게시간 문제
  | 'probation'       // 수습·인턴 관련 문제
  | 'unknown'         // 기타 / 잘 모르겠음

export type EmploymentType = 
  | 'regular'        // 정규직
  | 'contract'       // 계약직
  | 'intern'         // 인턴
  | 'freelancer'     // 프리랜서
  | 'part_time'      // 알바
  | 'other'          // 기타

export type WorkPeriod = 
  | 'under_3_months'  // 3개월 미만
  | '3_12_months'    // 3~12개월
  | '1_3_years'       // 1~3년
  | 'over_3_years'    // 3년 이상

export type SocialInsurance = 
  | 'all'            // 모두 가입
  | 'partial'        // 일부만
  | 'none'           // 전혀 없음
  | 'unknown'        // 모름

export interface SituationAnalysisRequest {
  categoryHint: SituationCategory
  summary: string // 한 줄 요약
  details?: string // 자세한 설명 (선택)
  employmentType?: EmploymentType
  workPeriod?: WorkPeriod
  weeklyHours?: number
  isProbation?: boolean
  socialInsurance?: SocialInsurance
  situationText: string // summary + details를 합친 전체 텍스트 (백엔드 호환성)
}

export interface CriteriaItem {
  name: string
  status: 'likely' | 'unclear' | 'unlikely'
  reason: string
}

export interface ActionStep {
  title: string
  items: string[]
}

export interface ActionPlan {
  steps: ActionStep[]
}

export interface Scripts {
  toCompany?: string
  toAdvisor?: string
}

export interface RelatedCase {
  id: string
  title: string
  summary: string
  link?: string
  externalId?: string  // 파일 ID (스토리지 경로 생성용, id와 동일)
  fileUrl?: string  // 스토리지 Signed URL (파일 다운로드용)
}

export interface SourceItem {
  sourceId: string
  sourceType: 'law' | 'manual' | 'case' | 'standard_contract'
  title: string
  snippet: string
  score: number
  externalId?: string  // 파일 ID (스토리지 경로 생성용)
  fileUrl?: string  // 스토리지 Signed URL (파일 다운로드용)
}

export interface OrganizationInfo {
  id: string
  name: string
  description: string
  capabilities: string[]
  requiredDocs: string[]
  legalBasis?: string
  website?: string
  phone?: string
}

export interface SituationAnalysisResponse {
  classifiedType: SituationCategory
  riskScore: number // 0~100
  summary: string
  criteria: CriteriaItem[]
  actionPlan: ActionPlan
  scripts: Scripts
  relatedCases: RelatedCase[]
  sources?: SourceItem[] // RAG 검색 출처
  organizations?: OrganizationInfo[] // 추천 기관 목록
}

// ========== 상황 분석 결과 페이지용 타입 정의 ==========

/**
 * 법적 판단 기준 항목 (체크리스트)
 */
export interface LegalCriteria {
  id: string
  name: string
  status: 'fulfilled' | 'unclear' | 'not_fulfilled'
  description?: string
}

/**
 * RAG 근거 자료 (Paper UI용 - 논문 각주 스타일)
 */
export interface RAGReference {
  chunk_id: string
  title: string
  summary: string
  source_agency?: string // 예: "고용노동부"
  download_info?: {
    external_id: string
    source_type: 'law' | 'manual' | 'case'
  }
}

/**
 * 증거 아카이빙 항목 (파일 업로드 UI용)
 */
export interface EvidenceItem {
  key: string
  label: string
  status: 'missing' | 'secured' | 'pending'
  required: boolean
  file_url?: string // 업로드된 파일 URL
  file_name?: string // 파일명
  uploaded_at?: string // 업로드 일시
}

/**
 * 행동 가이드 항목
 */
export interface ActionGuide {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  completed?: boolean
}

/**
 * 관할 기관 정보
 */
export interface AgencyInfo {
  name: string
  address: string
  tel: string
  coordinates?: {
    lat: number
    lng: number
  }
  map_image_url?: string // 정적 지도 이미지 URL
}

/**
 * 실전 대응 대시보드 데이터
 */
export interface DashboardData {
  action_guides?: ActionGuide[] // 행동 가이드 체크리스트
  evidence_map: EvidenceItem[]
  agency_info: AgencyInfo
}

/**
 * 상황 분석 요약 정보
 */
export interface SituationSummary {
  category: string // 예: "직장 내 괴롭힘"
  summary_text: string // 요약 멘트
  risk_level: 'high' | 'medium' | 'low'
}

/**
 * situation_analyses.analysis JSONB 컬럼 구조
 * DB에 저장되는 전체 분석 결과 데이터
 */
export interface AnalysisJSON {
  // 기본 정보
  summary: string
  risk_score: number
  situation_summary?: SituationSummary
  
  // 좌측: 상황 분석
  legal_criteria?: LegalCriteria[] // 법적 판단 기준 체크리스트
  
  // 우측/하단: 근거 자료
  rag_references?: RAGReference[] // RAG Sources (논문 각주 스타일)
  
  // 실전 대응 대시보드
  dashboard_data?: DashboardData
  
  // 메타데이터
  analysis_date?: string
  report_id?: string
}

/**
 * 상황 분석 결과 전체 데이터 (DB에서 조회한 전체 레코드)
 */
export interface SituationAnalysisResult {
  id: string
  user_id?: string
  situation?: string
  category?: string
  risk_score?: number
  risk_level?: string
  analysis: AnalysisJSON
  created_at: string
  updated_at?: string
}

