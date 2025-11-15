"""
Legal RAG Service - 법률 도메인 RAG 서비스
계약서 분석, 상황 분석, 케이스 검색 기능 제공
"""

from typing import List, Optional
from pathlib import Path

from models.schemas import (
    LegalAnalysisResult,
    LegalIssue,
    LegalRecommendation,
    LegalGroundingChunk,
    LegalCasePreview,
)
from core.supabase_vector_store import SupabaseVectorStore
from core.generator_v2 import LLMGenerator
from core.document_processor_v2 import DocumentProcessor


LEGAL_BASE_PATH = Path(__file__).resolve().parent.parent / "data" / "legal"


class LegalRAGService:
    """
    법률 도메인 RAG 서비스.
    - laws/: 요약 법령/체크리스트
    - manuals/: 계약/노동 가이드
    - cases/: 우리가 만든 시나리오 md 파일
    """

    def __init__(self):
        """벡터스토어/임베딩/LLM 클라이언트 초기화"""
        self.vector_store = SupabaseVectorStore()
        self.generator = LLMGenerator()
        self.processor = DocumentProcessor()

    # 1) 계약서 + 상황 설명 기반 분석
    async def analyze_contract(
        self,
        extracted_text: str,
        description: Optional[str] = None,
    ) -> LegalAnalysisResult:
        """
        - extracted_text: 업로드된 계약서 OCR/파싱 결과 텍스트
        - description: 사용자가 덧붙인 상황 설명
        """
        # 1. 쿼리 문장 구성
        query = self._build_query_from_contract(extracted_text, description)

        # 2. RAG 검색 (laws + manuals + cases)
        grounding_chunks = await self._search_legal_chunks(query=query, top_k=8)

        # 3. LLM으로 리스크 요약/분류
        result = await self._llm_summarize_risk(
            query=query,
            contract_text=extracted_text,
            grounding_chunks=grounding_chunks,
        )
        return result

    # 2) 텍스트 상황 설명 기반 분석
    async def analyze_situation(self, text: str) -> LegalAnalysisResult:
        query = text
        grounding_chunks = await self._search_legal_chunks(query=query, top_k=8)
        result = await self._llm_summarize_risk(
            query=query,
            contract_text=None,
            grounding_chunks=grounding_chunks,
        )
        return result

    # 3) 시나리오/케이스 검색
    async def search_cases(self, query: str, limit: int = 5) -> List[LegalCasePreview]:
        """
        cases/*.md 에서만 검색하는 라이트한 검색 (새 스키마).
        """
        # 쿼리 임베딩 생성
        query_embedding = self.generator.embed_one(query)
        
        # 벡터 검색 (case 타입만 필터링)
        rows = self.vector_store.search_similar_legal_chunks(
            query_embedding=query_embedding,
            top_k=limit,
            filters={"source_type": "case"}
        )

        cases: List[LegalCasePreview] = []
        for row in rows:
            # 새 스키마에서 정보 추출
            external_id = row.get("external_id", "")
            title = row.get("title", "제목 없음")
            content = row.get("content", "")
            metadata = row.get("metadata", {})
            
            cases.append(
                LegalCasePreview(
                    id=external_id,
                    title=title,
                    situation=metadata.get("situation", content[:200]),
                    main_issues=metadata.get("issues", []),
                )
            )
        return cases

    # ================= 내부 유틸 =================

    def _build_query_from_contract(
        self,
        extracted_text: str,
        description: Optional[str],
    ) -> str:
        # 너무 길면 앞부분/조항 제목만 사용
        snippet = extracted_text[:2000]
        if description:
            return f"사용자 설명: {description}\n\n계약서 주요 내용:\n{snippet}"
        return f"계약서 주요 내용:\n{snippet}"

    async def _search_legal_chunks(
        self,
        query: str,
        top_k: int = 8,
    ) -> List[LegalGroundingChunk]:
        """
        벡터스토어 + 메타데이터로
        - laws
        - manuals
        - cases
        섞어서 검색 (새 스키마).
        """
        # 쿼리 임베딩 생성
        query_embedding = self.generator.embed_one(query)
        
        # 벡터 검색 (모든 source_type 검색)
        rows = self.vector_store.search_similar_legal_chunks(
            query_embedding=query_embedding,
            top_k=top_k,
            filters=None  # 모든 타입 검색
        )

        results: List[LegalGroundingChunk] = []
        for r in rows:
            # 새 스키마에서 source_type은 직접 컬럼
            source_type = r.get("source_type", "law")
            title = r.get("title", "제목 없음")
            content = r.get("content", "")
            score = r.get("score", 0.0)
            
            results.append(
                LegalGroundingChunk(
                    source_id=r.get("id", ""),
                    source_type=source_type,
                    title=title,
                    snippet=content[:300],
                    score=score,
                )
            )
        return results

    async def _llm_summarize_risk(
        self,
        query: str,
        contract_text: Optional[str],
        grounding_chunks: List[LegalGroundingChunk],
    ) -> LegalAnalysisResult:
        """
        LLM 프롬프트를 통해:
        - risk_score, risk_level
        - issues[]
        - recommendations[]
        를 생성하도록 하는 부분.
        """
        # TODO: 실제 LLM 호출 로직
        # 여기서는 더미 반환 (나중에 실제 LLM 연동)
        
        if self.generator.disable_llm:
            # LLM 비활성화 시 기본 응답
            dummy_issue = LegalIssue(
                name="LLM 분석 비활성화",
                description="LLM 분석이 비활성화되어 있습니다.",
                severity="low",
                legal_basis=[],
            )
            return LegalAnalysisResult(
                risk_score=50,
                risk_level="medium",
                summary="LLM 분석이 비활성화되어 있습니다. RAG 검색 결과만 제공됩니다.",
                issues=[dummy_issue],
                recommendations=[],
                grounding=grounding_chunks,
            )
        
        # LLM 프롬프트 구성
        context_parts = []
        for chunk in grounding_chunks[:5]:  # 상위 5개만 사용
            context_parts.append(
                f"[{chunk.source_type}] {chunk.title}\n{chunk.snippet}"
            )
        context = "\n\n".join(context_parts)
        
        contract_snippet = ""
        if contract_text:
            contract_snippet = f"\n\n계약서 내용:\n{contract_text[:2000]}"
        
        prompt = f"""당신은 법률 전문가입니다. 다음 정보를 바탕으로 법적 리스크를 분석해주세요.

사용자 질문/상황:
{query}
{contract_snippet}

관련 법령/가이드/케이스:
{context}

다음 JSON 형식으로 분석 결과를 반환하세요:
{{
    "risk_score": 0~100 사이의 숫자,
    "risk_level": "low" 또는 "medium" 또는 "high",
    "summary": "전체 요약 (200자 이내)",
    "issues": [
        {{
            "name": "법적 이슈명",
            "description": "이슈 설명",
            "severity": "low|medium|high",
            "legal_basis": ["관련 법 조항"]
        }}
    ],
    "recommendations": [
        {{
            "title": "권고사항 제목",
            "description": "권고사항 설명",
            "steps": ["단계1", "단계2"]
        }}
    ]
}}

JSON 형식만 반환하세요."""

        try:
            # Ollama 사용
            if self.generator.use_ollama:
                from langchain_community.llms import Ollama
                from config import settings
                import json
                import re
                
                llm = Ollama(
                    base_url=settings.ollama_base_url,
                    model=settings.ollama_model
                )
                response_text = llm.invoke(prompt)
                
                # JSON 추출
                try:
                    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                    if json_match:
                        analysis = json.loads(json_match.group())
                        risk_score = analysis.get("risk_score", 50)
                        risk_level = analysis.get("risk_level", "medium")
                        summary = analysis.get("summary", "")
                        
                        issues = []
                        for issue_data in analysis.get("issues", []):
                            issues.append(LegalIssue(
                                name=issue_data.get("name", ""),
                                description=issue_data.get("description", ""),
                                severity=issue_data.get("severity", "medium"),
                                legal_basis=issue_data.get("legal_basis", [])
                            ))
                        
                        recommendations = []
                        for rec_data in analysis.get("recommendations", []):
                            recommendations.append(LegalRecommendation(
                                title=rec_data.get("title", ""),
                                description=rec_data.get("description", ""),
                                steps=rec_data.get("steps", [])
                            ))
                        
                        return LegalAnalysisResult(
                            risk_score=risk_score,
                            risk_level=risk_level,
                            summary=summary,
                            issues=issues,
                            recommendations=recommendations,
                            grounding=grounding_chunks,
                        )
                except Exception as e:
                    print(f"[경고] LLM 응답 파싱 실패: {str(e)}")
                    # 파싱 실패 시 기본 응답
                    return LegalAnalysisResult(
                        risk_score=50,
                        risk_level="medium",
                        summary=f"LLM 분석 중 오류가 발생했습니다: {str(e)}",
                        issues=[],
                        recommendations=[],
                        grounding=grounding_chunks,
                    )
        except Exception as e:
            print(f"[경고] LLM 호출 실패: {str(e)}")
        
        # LLM 호출 실패 시 기본 응답
        dummy_issue = LegalIssue(
            name="분석 실패",
            description="LLM 분석을 수행할 수 없습니다.",
            severity="low",
            legal_basis=[],
        )
        return LegalAnalysisResult(
            risk_score=50,
            risk_level="medium",
            summary="LLM 분석을 수행할 수 없습니다. RAG 검색 결과만 제공됩니다.",
            issues=[dummy_issue],
            recommendations=[],
            grounding=grounding_chunks,
        )

