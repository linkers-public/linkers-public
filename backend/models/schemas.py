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
