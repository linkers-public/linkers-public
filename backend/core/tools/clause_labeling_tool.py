"""
ClauseLabelingTool - 조항 자동 분류 도구
"제n조" 단위로 자동 라벨링 및 issue와 매핑
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import re
import logging

from .base_tool import BaseTool
from ..legal_chunker import LegalChunker, Section

logger = logging.getLogger(__name__)


@dataclass
class Clause:
    """계약서 조항"""
    id: str
    title: str  # "제1조 (목적)"
    content: str  # 조항 본문
    article_number: Optional[int] = None  # 조 번호
    start_index: int = 0  # 원문에서 시작 위치
    end_index: int = 0  # 원문에서 종료 위치
    category: Optional[str] = None  # "working_hours", "wage" 등
    issues: List[str] = None  # 연결된 issue ID 리스트


class ClauseLabelingTool(BaseTool):
    """조항 자동 분류 도구 - 조항 추출 및 issue 매핑"""
    
    def __init__(self):
        """도구 초기화"""
        self.chunker = LegalChunker(max_chars=1200, overlap=200)
    
    @property
    def name(self) -> str:
        return "ClauseLabelingTool"
    
    @property
    def description(self) -> str:
        return "계약서에서 조항을 자동으로 추출하고 분류하며, issue와 매핑"
    
    async def execute(
        self,
        contract_text: str,
        issues: List[Dict[str, Any]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        조항 자동 분류 실행
        
        Args:
            contract_text: 계약서 원문 텍스트
            issues: 이슈 리스트 (issue와 조항 매핑용)
            **kwargs: 추가 옵션
        
        Returns:
            {
                "clauses": List[Clause],
                "issue_clause_mapping": Dict[str, List[str]]  # issue_id -> clause_id 리스트
            }
        """
        self.log_execution(contract_text_length=len(contract_text), issues_count=len(issues) if issues else 0)
        
        # 입력 검증
        self.validate_input(["contract_text"], contract_text=contract_text)
        
        if not contract_text or not contract_text.strip():
            return {
                "clauses": [],
                "issue_clause_mapping": {}
            }
        
        try:
            # 1. 조항 추출
            clauses = self._extract_clauses(contract_text)
            
            # 2. issue와 조항 매핑
            issue_clause_mapping = {}
            if issues:
                issue_clause_mapping = self._map_issues_to_clauses(issues, clauses, contract_text)
            
            result = {
                "clauses": [
                    {
                        "id": clause.id,
                        "title": clause.title,
                        "content": clause.content,
                        "articleNumber": clause.article_number,
                        "startIndex": clause.start_index,
                        "endIndex": clause.end_index,
                        "category": clause.category,
                        "issues": clause.issues or []
                    }
                    for clause in clauses
                ],
                "issue_clause_mapping": issue_clause_mapping
            }
            
            self.log_result(result)
            return result
            
        except Exception as e:
            logger.error(f"[{self.name}] 실행 실패: {str(e)}", exc_info=True)
            raise
    
    def _extract_clauses(self, text: str) -> List[Clause]:
        """
        조항 추출 (제n조 기준)
        
        Args:
            text: 원본 텍스트
        
        Returns:
            Clause 리스트
        """
        sections = self.chunker.split_by_article(text)
        clauses = []
        
        for i, section in enumerate(sections):
            # 조 번호 추출
            article_number = self._extract_article_number(section.title)
            
            # 원문에서 위치 찾기
            full_text = section.title + "\n" + section.body
            start_index = text.find(section.title)
            end_index = start_index + len(full_text) if start_index >= 0 else 0
            
            # 카테고리 추정
            category = self._infer_category(section.title, section.body)
            
            clause = Clause(
                id=f"clause-{i+1}",
                title=section.title,
                content=section.body,
                article_number=article_number,
                start_index=start_index if start_index >= 0 else 0,
                end_index=end_index,
                category=category,
                issues=[]
            )
            clauses.append(clause)
        
        return clauses
    
    def _extract_article_number(self, title: str) -> Optional[int]:
        """조 번호 추출"""
        match = re.search(r'제\s*(\d+)\s*조', title)
        if match:
            return int(match.group(1))
        return None
    
    def _infer_category(self, title: str, content: str) -> Optional[str]:
        """카테고리 추정 (키워드 기반)"""
        text = (title + " " + content).lower()
        
        # 키워드 매핑
        category_keywords = {
            "working_hours": ["근로시간", "근무시간", "야근", "연장근로", "휴게시간", "휴일", "주휴일"],
            "wage": ["임금", "급여", "수당", "보너스", "상여금", "연봉", "월급"],
            "probation_termination": ["수습", "인턴", "해고", "계약해지", "퇴직", "사직", "퇴사"],
            "stock_option_ip": ["스톡옵션", "지분", "지적재산권", "저작권", "특허", "발명"],
            "vacation": ["휴가", "연차", "병가", "경조사", "출산"],
            "overtime": ["야근", "연장근로", "휴일근로", "야간근로"],
            "benefits": ["복리후생", "보험", "퇴직금", "퇴직연금"]
        }
        
        for category, keywords in category_keywords.items():
            if any(keyword in text for keyword in keywords):
                return category
        
        return None
    
    def _map_issues_to_clauses(
        self,
        issues: List[Dict[str, Any]],
        clauses: List[Clause],
        contract_text: str
    ) -> Dict[str, List[str]]:
        """
        issue와 조항 매핑
        
        Args:
            issues: 이슈 리스트
            clauses: 조항 리스트
            contract_text: 원문 텍스트
        
        Returns:
            issue_id -> clause_id 리스트 매핑
        """
        issue_clause_mapping = {}
        
        for issue in issues:
            issue_id = issue.get("id", "")
            original_text = issue.get("originalText", "")
            
            if not original_text:
                continue
            
            # issue의 originalText가 어떤 조항에 포함되는지 찾기
            matched_clause_ids = []
            
            for clause in clauses:
                # 조항 본문에서 originalText 검색
                if original_text in clause.content or clause.content in original_text:
                    matched_clause_ids.append(clause.id)
                    clause.issues.append(issue_id)
                # 또는 원문에서 위치 기반 매칭
                elif clause.start_index > 0 and clause.end_index > 0:
                    # issue의 originalText가 원문에서 어디에 있는지 찾기
                    issue_start = contract_text.find(original_text)
                    if issue_start >= 0:
                        issue_end = issue_start + len(original_text)
                        # 조항 범위와 겹치는지 확인
                        if (clause.start_index <= issue_start <= clause.end_index) or \
                           (clause.start_index <= issue_end <= clause.end_index) or \
                           (issue_start <= clause.start_index and issue_end >= clause.end_index):
                            if clause.id not in matched_clause_ids:
                                matched_clause_ids.append(clause.id)
                                clause.issues.append(issue_id)
            
            if matched_clause_ids:
                issue_clause_mapping[issue_id] = matched_clause_ids
        
        return issue_clause_mapping

