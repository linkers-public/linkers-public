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

