"""
RewriteTool - AI 기반 조항 자동 리라이트 도구
위험 조항을 법적으로 안전한 문구로 자동 수정
"""

from typing import List, Dict, Any, Optional
import logging

from .base_tool import BaseTool
from ..generator_v2 import LLMGenerator

logger = logging.getLogger(__name__)


class RewriteTool(BaseTool):
    """AI 기반 조항 자동 리라이트 도구"""
    
    def __init__(self):
        """도구 초기화"""
        self.generator = LLMGenerator()
    
    @property
    def name(self) -> str:
        return "RewriteTool"
    
    @property
    def description(self) -> str:
        return "위험 조항을 법적으로 안전한 문구로 자동 수정"
    
    async def execute(
        self,
        original_text: str,
        issue_id: Optional[str] = None,
        legal_basis: List[str] = None,
        contract_type: str = "employment",
        **kwargs
    ) -> Dict[str, Any]:
        """
        조항 리라이트 실행
        
        Args:
            original_text: 원본 조항 텍스트
            issue_id: 관련 issue ID (선택)
            legal_basis: 법적 근거 리스트
            contract_type: 계약서 타입
            **kwargs: 추가 옵션
        
        Returns:
            {
                "originalText": str,
                "rewrittenText": str,
                "explanation": str,
                "legalBasis": List[str]
            }
        """
        self.log_execution(original_text_length=len(original_text), issue_id=issue_id)
        
        # 입력 검증
        self.validate_input(["original_text"], original_text=original_text)
        
        if not original_text or not original_text.strip():
            return {
                "originalText": original_text,
                "rewrittenText": original_text,
                "explanation": "수정할 내용이 없습니다.",
                "legalBasis": []
            }
        
        try:
            # LLM 비활성화 시 기본 응답
            if self.generator.disable_llm:
                return self._generate_default_rewrite(original_text, legal_basis or [])
            
            # LLM 기반 리라이트 생성
            rewrite_result = await self._generate_llm_rewrite(
                original_text=original_text,
                legal_basis=legal_basis or [],
                contract_type=contract_type
            )
            
            result = {
                "originalText": original_text,
                "rewrittenText": rewrite_result.get("rewritten_text", original_text),
                "explanation": rewrite_result.get("explanation", ""),
                "legalBasis": rewrite_result.get("legal_basis", legal_basis or [])
            }
            
            self.log_result(result)
            return result
            
        except Exception as e:
            logger.error(f"[{self.name}] 실행 실패: {str(e)}", exc_info=True)
            # 실패 시 원본 반환
            return {
                "originalText": original_text,
                "rewrittenText": original_text,
                "explanation": f"리라이트 생성 중 오류가 발생했습니다: {str(e)}",
                "legalBasis": legal_basis or []
            }
    
    async def _generate_llm_rewrite(
        self,
        original_text: str,
        legal_basis: List[str],
        contract_type: str
    ) -> Dict[str, Any]:
        """LLM 기반 리라이트 생성"""
        
        # 프롬프트 구성
        legal_basis_text = "\n".join([f"- {basis}" for basis in legal_basis]) if legal_basis else "없음"
        
        prompt = f"""다음 계약서 조항을 법적으로 안전하고 명확한 문구로 수정해주세요.

**원본 조항:**
{original_text}

**관련 법적 근거:**
{legal_basis_text}

**계약서 타입:** {contract_type}

**요구사항:**
1. 법적으로 문제가 없는 명확한 문구로 수정
2. 근로기준법, 노동법 등 관련 법령을 준수
3. 근로자에게 불리한 조항은 공정한 조항으로 변경
4. 모호한 표현은 구체적으로 명시
5. 수정 이유를 간단히 설명

**응답 형식 (JSON):**
{{
    "rewritten_text": "수정된 조항 텍스트",
    "explanation": "수정 이유 설명",
    "legal_basis": ["관련 법령 조문"]
}}
"""
        
        try:
            response = await self.generator.generate(prompt)
            
            # JSON 파싱 시도
            import json
            try:
                # JSON 코드 블록 제거
                response_clean = response.strip()
                if response_clean.startswith("```json"):
                    response_clean = response_clean[7:]
                if response_clean.startswith("```"):
                    response_clean = response_clean[3:]
                if response_clean.endswith("```"):
                    response_clean = response_clean[:-3]
                response_clean = response_clean.strip()
                
                result = json.loads(response_clean)
                return result
            except json.JSONDecodeError:
                # JSON 파싱 실패 시 텍스트에서 추출
                return self._parse_text_response(response, original_text, legal_basis)
                
        except Exception as e:
            logger.error(f"LLM 리라이트 생성 실패: {str(e)}")
            return self._generate_default_rewrite(original_text, legal_basis)
    
    def _parse_text_response(
        self,
        response: str,
        original_text: str,
        legal_basis: List[str]
    ) -> Dict[str, Any]:
        """텍스트 응답 파싱"""
        # 간단한 파싱 로직
        rewritten_text = original_text  # 기본값
        explanation = "LLM 응답을 파싱하지 못했습니다."
        
        # "rewritten_text" 또는 "수정된" 키워드 찾기
        lines = response.split('\n')
        for i, line in enumerate(lines):
            if "수정된" in line or "rewritten" in line.lower():
                # 다음 줄이 수정된 텍스트일 가능성
                if i + 1 < len(lines):
                    rewritten_text = lines[i + 1].strip()
                    break
        
        return {
            "rewritten_text": rewritten_text,
            "explanation": explanation,
            "legal_basis": legal_basis
        }
    
    def _generate_default_rewrite(
        self,
        original_text: str,
        legal_basis: List[str]
    ) -> Dict[str, Any]:
        """기본 리라이트 생성 (LLM 비활성화 시)"""
        # 간단한 규칙 기반 수정
        rewritten_text = original_text
        
        # 위험 키워드 치환
        replacements = {
            "사전 통보 없이": "최소 30일 전 서면 통보 후",
            "임의로": "법적 절차에 따라",
            "즉시": "법적 통지 기간을 준수하여",
            "무조건": "법적 요건을 충족하는 경우에 한하여"
        }
        
        for old, new in replacements.items():
            if old in rewritten_text:
                rewritten_text = rewritten_text.replace(old, new)
        
        explanation = "기본 규칙 기반 수정이 적용되었습니다. 더 정확한 수정을 위해서는 LLM을 활성화해주세요."
        
        return {
            "rewritten_text": rewritten_text,
            "explanation": explanation,
            "legal_basis": legal_basis
        }

