# backend/models/schemas.py

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class AnnouncementAnalysis(BaseModel):
    """공고 분석 결과"""
    project_name: str = Field(description="프로젝트명")
    budget_range: str = Field(description="예산 범위")
    duration: str = Field(description="수행 기간")
    essential_skills: List[str] = Field(description="필수 기술")
    preferred_skills: List[str] = Field(default=[], description="우대 기술")
    submission_docs: List[str] = Field(default=[], description="제출 서류")
    summary: str = Field(description="요약")
    deadline: Optional[str] = Field(default=None, description="입찰 마감일")


class TeamProfile(BaseModel):
    """팀 프로필"""
    team_id: str
    name: str
    skills: List[str]
    experience_years: int
    rating: float
    location: str
    projects: List[str]
    description: str


class MatchedTeam(BaseModel):
    """매칭된 팀 정보"""
    team_id: str
    name: str
    match_score: float
    rationale: str
    estimated_cost: Optional[str] = None


class EstimateRequest(BaseModel):
    """견적 생성 요청"""
    announcement_id: str
    team_id: str


class APIResponse(BaseModel):
    """API 응답 공통 형식"""
    status: str
    message: Optional[str] = None
    data: Optional[dict] = None


# ========== Legal RAG 스키마 ==========

class LegalIssue(BaseModel):
    """법적 이슈"""
    name: str = Field(..., description="법적 이슈명 (예: 부당해고, 초과근로 수당 미지급)")
    description: str
    severity: str = Field(..., description="low | medium | high 등급")
    legal_basis: List[str] = Field(default_factory=list, description="관련 법 조항/근거")
    start_index: Optional[int] = Field(None, description="계약서 텍스트 내 시작 인덱스")
    end_index: Optional[int] = Field(None, description="계약서 텍스트 내 종료 인덱스")
    suggested_text: Optional[str] = Field(None, description="권장 수정 문구")
    rationale: Optional[str] = Field(None, description="수정 이유/근거")
    suggested_questions: List[str] = Field(default_factory=list, description="협상/질문 스크립트")


class LegalRecommendation(BaseModel):
    """법적 권고사항"""
    title: str
    description: str
    steps: List[str] = Field(default_factory=list)


class LegalGroundingChunk(BaseModel):
    """RAG 검색 결과 청크"""
    source_id: str
    source_type: str  # "law" | "manual" | "case"
    title: str
    snippet: str
    score: float


class LegalAnalysisResult(BaseModel):
    """법률 리스크 분석 결과"""
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: str  # "low" | "medium" | "high"
    summary: str
    contract_text: Optional[str] = Field(None, description="전체 계약서 텍스트")
    issues: List[LegalIssue] = Field(default_factory=list)
    recommendations: List[LegalRecommendation] = Field(default_factory=list)
    grounding: List[LegalGroundingChunk] = Field(
        default_factory=list,
        description="RAG로 가져온 근거 텍스트 목록",
    )


class LegalAnalyzeContractRequest(BaseModel):
    """계약서 분석 요청 (JSON용)"""
    description: Optional[str] = Field(
        None,
        description="사용자가 설명한 법적 상황/걱정 포인트",
    )


class LegalAnalyzeSituationRequest(BaseModel):
    """상황 분석 요청"""
    text: str = Field(
        ...,
        description="현재 겪고 있는 법적 상황 설명",
        min_length=10,
    )


class LegalCasePreview(BaseModel):
    """법률 케이스 프리뷰"""
    id: str
    title: str
    situation: str
    main_issues: List[str]


class LegalSearchResponse(BaseModel):
    """케이스 검색 응답"""
    query: str
    cases: List[LegalCasePreview] = Field(default_factory=list)


class LegalChatRequest(BaseModel):
    """법률 상담 챗 요청"""
    query: str = Field(..., description="사용자 질문")
    doc_ids: List[str] = Field(default_factory=list, description="계약서 문서 ID 목록")
    selected_issue_id: Optional[str] = Field(None, description="선택된 이슈 ID")
    selected_issue: Optional[dict] = Field(None, description="선택된 이슈 정보")
    analysis_summary: Optional[str] = Field(None, description="분석 요약")
    risk_score: Optional[int] = Field(None, description="위험도 점수")
    total_issues: Optional[int] = Field(None, description="총 이슈 개수")
    top_k: int = Field(8, description="RAG 검색 결과 개수")


class LegalChatResponse(BaseModel):
    """법률 상담 챗 응답"""
    answer: str = Field(..., description="AI 답변 (마크다운 형식)")
    markdown: Optional[str] = Field(None, description="마크다운 형식 답변")
    query: str = Field(..., description="원본 질문")
    used_chunks: List[dict] = Field(default_factory=list, description="사용된 RAG 청크")


# ========== 상황 기반 진단 스키마 ==========

class SituationAnalysisRequest(BaseModel):
    """상황 기반 진단 요청"""
    category_hint: str = Field(..., description="상황 카테고리 힌트 (harassment, unpaid_wage, unfair_dismissal, overtime, probation, unknown)")
    summary: Optional[str] = Field(None, description="한 줄 요약")
    details: Optional[str] = Field(None, description="자세한 설명 (선택)")
    employment_type: Optional[str] = Field(None, description="고용 형태 (regular, contract, intern, freelancer, part_time, other)")
    work_period: Optional[str] = Field(None, description="근무 기간 (under_3_months, 3_12_months, 1_3_years, over_3_years)")
    weekly_hours: Optional[int] = Field(None, description="주당 근로시간")
    is_probation: Optional[bool] = Field(None, description="수습 여부")
    social_insurance: Optional[str] = Field(None, description="4대보험 (all, partial, none, unknown)")
    situation_text: str = Field(..., description="상황 상세 설명 (summary + details 또는 전체 텍스트)")


class CriteriaItem(BaseModel):
    """판단 기준 항목"""
    name: str = Field(..., description="기준명")
    status: str = Field(..., description="충족 여부 (likely, unclear, unlikely)")
    reason: str = Field(..., description="판단 이유")


class ActionStep(BaseModel):
    """행동 가이드 단계"""
    title: str = Field(..., description="단계 제목")
    items: List[str] = Field(..., description="항목 목록")


class ActionPlan(BaseModel):
    """행동 가이드"""
    steps: List[ActionStep] = Field(..., description="단계 목록")


class Scripts(BaseModel):
    """스크립트/템플릿"""
    to_company: Optional[str] = Field(None, description="회사에 보낼 메시지 초안")
    to_advisor: Optional[str] = Field(None, description="상담 시 쓸 설명 템플릿")


class RelatedCase(BaseModel):
    """유사 사례"""
    id: str = Field(..., description="케이스 ID")
    title: str = Field(..., description="케이스 제목")
    summary: str = Field(..., description="케이스 요약")


class SituationAnalysisResponse(BaseModel):
    """상황 기반 진단 응답"""
    classified_type: str = Field(..., description="최종 분류된 유형")
    risk_score: int = Field(..., ge=0, le=100, description="위험도 점수 (0~100)")
    summary: str = Field(..., description="한 줄 요약")
    criteria: List[CriteriaItem] = Field(..., description="법적 판단 기준")
    action_plan: ActionPlan = Field(..., description="행동 가이드")
    scripts: Scripts = Field(..., description="스크립트/템플릿")
    related_cases: List[RelatedCase] = Field(default_factory=list, description="유사 사례")


# ========== API v2 스키마 (가이드 스펙) ==========

class LegalSearchResult(BaseModel):
    """법률 검색 결과 (v2)"""
    legal_document_id: str
    section_title: Optional[str] = None
    text: str
    score: float
    source: Optional[str] = None
    doc_type: Optional[str] = None
    title: Optional[str] = None


class LegalSearchResponseV2(BaseModel):
    """법률 검색 응답 (v2)"""
    results: List[LegalSearchResult]
    count: int
    query: str


class SituationRequestV2(BaseModel):
    """상황 분석 요청 (v2)"""
    situation: str
    category: Optional[str] = None
    employmentType: Optional[str] = None
    companySize: Optional[str] = None
    workPeriod: Optional[str] = None
    hasWrittenContract: Optional[bool] = None
    socialInsurance: Optional[List[str]] = None


class LegalBasisItem(BaseModel):
    """법적 근거 항목"""
    title: str
    snippet: str
    sourceType: str


class SituationAnalysisV2(BaseModel):
    """상황 분석 결과 (v2)"""
    summary: str
    legalBasis: List[LegalBasisItem]
    recommendations: List[str]


class RelatedCaseV2(BaseModel):
    """유사 사례 (v2)"""
    id: str
    title: str
    summary: str
    link: Optional[str] = None


class ScriptsV2(BaseModel):
    """스크립트/템플릿 (v2)"""
    toCompany: Optional[str] = Field(None, description="회사에 보낼 메시지 초안")
    toAdvisor: Optional[str] = Field(None, description="상담 시 쓸 설명 템플릿")


class SituationResponseV2(BaseModel):
    """상황 분석 응답 (v2)"""
    riskScore: float
    riskLevel: str  # "low" | "medium" | "high"
    tags: List[str]
    analysis: SituationAnalysisV2
    checklist: List[str]
    scripts: Optional[ScriptsV2] = None
    relatedCases: List[RelatedCaseV2]


class ClauseV2(BaseModel):
    """계약서 조항 (v2)"""
    id: str
    title: str  # "제1조 (목적)"
    content: str  # 조항 본문
    articleNumber: Optional[int] = None  # 조 번호
    startIndex: int = 0  # 원문에서 시작 위치
    endIndex: int = 0  # 원문에서 종료 위치
    category: Optional[str] = None  # "working_hours", "wage" 등


class HighlightedTextV2(BaseModel):
    """하이라이트된 텍스트"""
    text: str
    startIndex: int
    endIndex: int
    severity: str  # "low" | "medium" | "high"
    issueId: str  # 연결된 issue ID


class ContractIssueV2(BaseModel):
    """계약서 이슈 (v2)"""
    id: str
    category: str
    severity: str  # "low" | "medium" | "high"
    summary: str
    originalText: str
    legalBasis: List[str]
    explanation: str
    suggestedRevision: str
    clauseId: Optional[str] = None  # 연결된 조항 ID
    startIndex: Optional[int] = None  # 원문에서 시작 위치
    endIndex: Optional[int] = None  # 원문에서 종료 위치


class ContractAnalysisResponseV2(BaseModel):
    """계약서 분석 응답 (v2)"""
    docId: str
    title: str
    riskScore: float
    riskLevel: str  # "low" | "medium" | "high"
    sections: dict  # {working_hours: 80, wage: 70, ...}
    issues: List[ContractIssueV2]
    summary: str
    retrievedContexts: List[dict]
    contractText: str = ""  # 계약서 원문 텍스트 (기본값: 빈 문자열, Optional 제거)
    clauses: List[ClauseV2] = []  # 조항 목록 (자동 분류)
    highlightedTexts: List[HighlightedTextV2] = []  # 하이라이트된 텍스트
    createdAt: str


class ContractComparisonRequestV2(BaseModel):
    """계약서 비교 요청 (v2)"""
    oldContractId: str  # 이전 계약서 docId
    newContractId: str  # 새 계약서 docId


class ContractComparisonResponseV2(BaseModel):
    """계약서 비교 응답 (v2)"""
    oldContract: ContractAnalysisResponseV2
    newContract: ContractAnalysisResponseV2
    changedClauses: List[dict]  # 변경된 조항
    riskChange: dict  # 위험도 변화
    summary: str  # 비교 요약


class ClauseRewriteRequestV2(BaseModel):
    """조항 리라이트 요청 (v2)"""
    clauseId: str
    originalText: str
    issueId: Optional[str] = None  # 관련 issue ID


class ClauseRewriteResponseV2(BaseModel):
    """조항 리라이트 응답 (v2)"""
    originalText: str
    rewrittenText: str
    explanation: str  # 수정 이유
    legalBasis: List[str]  # 법적 근거


class LegalChatRequestV2(BaseModel):
    """법률 상담 챗 요청 (v2)"""
    query: str = Field(..., description="사용자 질문")
    docIds: List[str] = Field(default_factory=list, description="계약서 문서 ID 목록")
    selectedIssueId: Optional[str] = Field(None, description="선택된 이슈 ID")
    selectedIssue: Optional[dict] = Field(None, description="선택된 이슈 정보")
    analysisSummary: Optional[str] = Field(None, description="분석 요약")
    riskScore: Optional[int] = Field(None, description="위험도 점수")
    totalIssues: Optional[int] = Field(None, description="총 이슈 개수")
    topK: int = Field(8, description="RAG 검색 결과 개수")


class UsedChunkV2(BaseModel):
    """사용된 RAG 청크 (v2)"""
    id: Optional[str] = None
    source_type: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    score: Optional[float] = None


class UsedChunksV2(BaseModel):
    """사용된 RAG 청크 그룹 (v2)"""
    contract: List[UsedChunkV2] = Field(default_factory=list, description="계약서 내부 청크")
    legal: List[UsedChunkV2] = Field(default_factory=list, description="법령 청크")


class LegalChatResponseV2(BaseModel):
    """법률 상담 챗 응답 (v2)"""
    answer: str = Field(..., description="AI 답변 (마크다운 형식)")
    markdown: Optional[str] = Field(None, description="마크다운 형식 답변")
    query: str = Field(..., description="원본 질문")
    usedChunks: Optional[UsedChunksV2] = Field(None, description="사용된 RAG 청크 (Dual RAG)")