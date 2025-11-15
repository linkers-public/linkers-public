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

