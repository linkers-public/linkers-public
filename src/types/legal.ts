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
  legalBasis?: string[]
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
}

export interface SituationAnalysisResponse {
  classifiedType: SituationCategory
  riskScore: number // 0~100
  summary: string
  criteria: CriteriaItem[]
  actionPlan: ActionPlan
  scripts: Scripts
  relatedCases: RelatedCase[]
}

