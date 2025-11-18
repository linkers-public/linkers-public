"""
HighlightTool - 위험 조항 자동 하이라이트 도구
문서 전문에 위험 조항 표시, start/end index 마킹
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import logging

from .base_tool import BaseTool

logger = logging.getLogger(__name__)


@dataclass
class HighlightedText:
    """하이라이트된 텍스트"""
    text: str
    start_index: int
    end_index: int
    severity: str  # "low" | "medium" | "high"
    issue_id: str  # 연결된 issue ID


class HighlightTool(BaseTool):
    """위험 조항 자동 하이라이트 도구"""
    
    @property
    def name(self) -> str:
        return "HighlightTool"
    
    @property
    def description(self) -> str:
        return "문서 전문에서 위험 조항을 찾아 하이라이트 정보 생성"
    
    async def execute(
        self,
        contract_text: str,
        issues: List[Dict[str, Any]],
        **kwargs
    ) -> Dict[str, Any]:
        """
        위험 조항 하이라이트 실행
        
        Args:
            contract_text: 계약서 원문 텍스트
            issues: 이슈 리스트
            **kwargs: 추가 옵션
        
        Returns:
            {
                "highlightedTexts": List[HighlightedText]
            }
        """
        self.log_execution(contract_text_length=len(contract_text), issues_count=len(issues))
        
        # 입력 검증
        self.validate_input(["contract_text", "issues"], contract_text=contract_text, issues=issues)
        
        if not contract_text or not issues:
            return {
                "highlightedTexts": []
            }
        
        try:
            highlighted_texts = []
            
            for issue in issues:
                original_text = issue.get("originalText", "")
                issue_id = issue.get("id", "")
                severity = issue.get("severity", "medium")
                
                if not original_text or not original_text.strip():
                    logger.debug(f"[하이라이트] issue={issue_id}: originalText가 없어 건너뜁니다")
                    continue
                
                # 원문에서 originalText 찾기
                start_index = contract_text.find(original_text)
                
                if start_index >= 0:
                    end_index = start_index + len(original_text)
                    
                    highlighted_text = HighlightedText(
                        text=original_text,
                        start_index=start_index,
                        end_index=end_index,
                        severity=severity,
                        issue_id=issue_id
                    )
                    highlighted_texts.append(highlighted_text)
                else:
                    # 정확히 일치하지 않으면 부분 매칭 시도
                    # originalText의 핵심 키워드 추출
                    keywords = self._extract_keywords(original_text)
                    if keywords:
                        # 키워드가 포함된 문장 찾기
                        matched_text, matched_start, matched_end = self._find_text_by_keywords(
                            contract_text, keywords, original_text
                        )
                        if matched_text:
                            highlighted_text = HighlightedText(
                                text=matched_text,
                                start_index=matched_start,
                                end_index=matched_end,
                                severity=severity,
                                issue_id=issue_id
                            )
                            highlighted_texts.append(highlighted_text)
            
            # 중복 제거 (같은 위치의 하이라이트는 하나만)
            unique_highlights = self._remove_overlaps(highlighted_texts)
            
            result = {
                "highlightedTexts": [
                    {
                        "text": h.text,
                        "startIndex": h.start_index,
                        "endIndex": h.end_index,
                        "severity": h.severity,
                        "issueId": h.issue_id
                    }
                    for h in unique_highlights
                ]
            }
            
            self.log_result(result)
            return result
            
        except Exception as e:
            logger.error(f"[{self.name}] 실행 실패: {str(e)}", exc_info=True)
            raise
    
    def _extract_keywords(self, text: str) -> List[str]:
        """핵심 키워드 추출"""
        # 간단한 키워드 추출 (실제로는 더 정교한 NLP 사용 가능)
        keywords = []
        
        # 중요한 단어 추출 (2글자 이상)
        words = text.split()
        for word in words:
            word_clean = word.strip(".,!?()[]{}")
            if len(word_clean) >= 2:
                keywords.append(word_clean)
        
        # 상위 5개만 반환
        return keywords[:5]
    
    def _find_text_by_keywords(
        self,
        contract_text: str,
        keywords: List[str],
        original_text: str
    ) -> tuple:
        """
        키워드로 텍스트 찾기
        
        Returns:
            (matched_text, start_index, end_index) 또는 (None, 0, 0)
        """
        # 키워드가 모두 포함된 문장 찾기
        sentences = contract_text.split('。')  # 한국어 문장 구분자
        if not sentences:
            sentences = contract_text.split('.')
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            # 키워드가 모두 포함되어 있는지 확인
            if all(keyword in sentence for keyword in keywords[:3]):  # 상위 3개 키워드만 확인
                start_index = contract_text.find(sentence)
                if start_index >= 0:
                    end_index = start_index + len(sentence)
                    return (sentence, start_index, end_index)
        
        return (None, 0, 0)
    
    def _remove_overlaps(self, highlights: List[HighlightedText]) -> List[HighlightedText]:
        """중복/겹치는 하이라이트 제거"""
        if not highlights:
            return []
        
        # severity 우선순위: high > medium > low
        severity_priority = {"high": 3, "medium": 2, "low": 1}
        
        # start_index 기준 정렬
        sorted_highlights = sorted(highlights, key=lambda h: h.start_index)
        
        unique_highlights = []
        for highlight in sorted_highlights:
            # 기존 하이라이트와 겹치는지 확인
            overlap = False
            for existing in unique_highlights:
                # 겹치는 범위 확인
                if not (highlight.end_index <= existing.start_index or highlight.start_index >= existing.end_index):
                    overlap = True
                    # severity가 더 높으면 기존 것 교체
                    if severity_priority.get(highlight.severity, 0) > severity_priority.get(existing.severity, 0):
                        unique_highlights.remove(existing)
                        unique_highlights.append(highlight)
                    break
            
            if not overlap:
                unique_highlights.append(highlight)
        
        return unique_highlights

