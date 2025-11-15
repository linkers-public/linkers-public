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

    # 2) 텍스트 상황 설명 기반 분석 (레거시)
    async def analyze_situation(self, text: str) -> LegalAnalysisResult:
        query = text
        grounding_chunks = await self._search_legal_chunks(query=query, top_k=8)
        result = await self._llm_summarize_risk(
            query=query,
            contract_text=None,
            grounding_chunks=grounding_chunks,
        )
        return result

    # 2-2) 상황 기반 상세 진단 (새로운 API)
    async def analyze_situation_detailed(
        self,
        category_hint: str,
        situation_text: str,
        summary: Optional[str] = None,
        details: Optional[str] = None,
        employment_type: Optional[str] = None,
        work_period: Optional[str] = None,
        weekly_hours: Optional[int] = None,
        is_probation: Optional[bool] = None,
        social_insurance: Optional[str] = None,
    ) -> dict:
        """
        상황 기반 상세 진단
        
        Returns:
            {
                "classified_type": str,
                "risk_score": int,
                "summary": str,
                "criteria": List[CriteriaItem],
                "action_plan": ActionPlan,
                "scripts": Scripts,
                "related_cases": List[RelatedCase]
            }
        """
        # 1. RAG 검색 (법률 문서에서 관련 정보 검색)
        # summary와 details가 있으면 우선 사용, 없으면 situation_text 사용
        query_text = situation_text
        if summary:
            query_text = summary
            if details:
                query_text = f"{summary}\n\n{details}"
        
        grounding_chunks = await self._search_legal_chunks(query=query_text, top_k=8)
        
        # 2. 유사 케이스 검색
        related_cases = await self.search_cases(query=query_text, limit=3)
        
        # 3. LLM으로 상세 진단 수행
        result = await self._llm_situation_diagnosis(
            category_hint=category_hint,
            situation_text=query_text,  # summary + details 또는 situation_text
            grounding_chunks=grounding_chunks,
            employment_type=employment_type,
            work_period=work_period,
            weekly_hours=weekly_hours,
            is_probation=is_probation,
            social_insurance=social_insurance,
        )
        
        # 4. 유사 케이스 추가
        result["related_cases"] = [
            {
                "id": case.id,
                "title": case.title,
                "summary": case.situation[:200] if len(case.situation) > 200 else case.situation,
            }
            for case in related_cases
        ]
        
        return result

    # 3) 법률 상담 챗 (컨텍스트 기반)
    async def chat_with_context(
        self,
        query: str,
        doc_ids: List[str] = None,
        selected_issue_id: Optional[str] = None,
        selected_issue: Optional[dict] = None,
        analysis_summary: Optional[str] = None,
        risk_score: Optional[int] = None,
        total_issues: Optional[int] = None,
        top_k: int = 8,
    ) -> dict:
        """
        계약서 분석 결과를 컨텍스트로 포함한 법률 상담 챗
        
        Args:
            query: 사용자 질문
            doc_ids: 계약서 문서 ID 목록
            selected_issue_id: 선택된 이슈 ID
            selected_issue: 선택된 이슈 정보
            analysis_summary: 분석 요약
            risk_score: 위험도 점수
            total_issues: 총 이슈 개수
            top_k: RAG 검색 결과 개수
        
        Returns:
            {
                "answer": str,  # 마크다운 형식 답변
                "markdown": str,
                "query": str,
                "used_chunks": List[dict]
            }
        """
        # 1. RAG 검색 (법률 문서에서 관련 정보 검색)
        grounding_chunks = await self._search_legal_chunks(query=query, top_k=top_k)
        
        # 2. LLM으로 답변 생성 (컨텍스트 포함)
        answer = await self._llm_chat_response(
            query=query,
            grounding_chunks=grounding_chunks,
            selected_issue=selected_issue,
            analysis_summary=analysis_summary,
            risk_score=risk_score,
            total_issues=total_issues,
        )
        
        return {
            "answer": answer,
            "markdown": answer,
            "query": query,
            "used_chunks": [
                {
                    "id": chunk.source_id,
                    "source_type": chunk.source_type,
                    "title": chunk.title,
                    "content": chunk.snippet,
                    "score": chunk.score,
                }
                for chunk in grounding_chunks
            ],
        }

    # 4) 시나리오/케이스 검색
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
            "name": "법적 이슈명 (예: 수습기간 해지 조건 미명시)",
            "description": "이슈 상세 설명 및 계약서 내 해당 조항의 구체적인 내용",
            "severity": "low|medium|high",
            "legal_basis": ["관련 법 조항 (예: 근로기준법 제27조)"],
            "suggested_text": "권장 수정 문구 (선택사항)",
            "rationale": "왜 이렇게 수정해야 하는지 이유 (선택사항)",
            "suggested_questions": ["회사에 이렇게 질문할 수 있는 문구 (선택사항)"]
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

중요 사항:
1. 모든 응답은 한국어로 작성하세요.
2. legal_basis 필드에는 한국어 법령명과 조항을 명확히 표기하세요.
   예: "근로기준법 제56조", "퇴직급여법 제8조", "국민연금법 제2조" 등
3. 영어 법령명이 나오면 한국어로 번역하여 표기하세요.
   - "Labor Standards Act" → "근로기준법"
   - "Pension Fund Act" → "퇴직급여법" 또는 "국민연금법"
   - "Employment Insurance Act" → "고용보험법"

JSON 형식만 반환하세요."""

        try:
            # Ollama 사용
            if self.generator.use_ollama:
                from config import settings
                import json
                import re
                
                # langchain-ollama 우선 사용 (deprecated 경고 없음)
                try:
                    from langchain_ollama import OllamaLLM
                    llm = OllamaLLM(
                        base_url=settings.ollama_base_url,
                        model=settings.ollama_model
                    )
                except ImportError:
                    # 대안: langchain-community 사용 (deprecated)
                    from langchain_community.llms import Ollama
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
                            # 계약서 텍스트에서 해당 조항 위치 찾기
                            description = issue_data.get("description", "")
                            start_index = None
                            end_index = None
                            
                            if contract_text and description:
                                # 간단한 텍스트 매칭으로 위치 찾기 (더 정교한 방법 필요할 수 있음)
                                start_index = contract_text.find(description[:50])  # 처음 50자로 검색
                                if start_index >= 0:
                                    end_index = start_index + len(description)
                            
                            issues.append(LegalIssue(
                                name=issue_data.get("name", ""),
                                description=description,
                                severity=issue_data.get("severity", "medium"),
                                legal_basis=issue_data.get("legal_basis", []),
                                start_index=start_index,
                                end_index=end_index,
                                suggested_text=issue_data.get("suggested_text"),
                                rationale=issue_data.get("rationale"),
                                suggested_questions=issue_data.get("suggested_questions", [])
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
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"LLM 응답 파싱 실패: {str(e)}", exc_info=True)
                    logger.error(f"LLM 응답 원문 (처음 500자): {response_text[:500] if response_text else 'None'}")
                    # 파싱 실패 시 기본 응답 (빈 이슈 리스트 반환)
                    return LegalAnalysisResult(
                        risk_score=50,
                        risk_level="medium",
                        summary=f"LLM 분석 중 오류가 발생했습니다. RAG 검색 결과는 {len(grounding_chunks)}개 발견되었습니다.",
                        issues=[],
                        recommendations=[],
                        grounding=grounding_chunks,
                    )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"LLM 호출 실패: {str(e)}", exc_info=True)
        
        # LLM 호출 실패 시 빈 이슈 리스트 반환 (프론트엔드에서 에러 처리)
        return LegalAnalysisResult(
            risk_score=50,
            risk_level="medium",
            summary=f"LLM 분석을 수행할 수 없습니다. RAG 검색 결과는 {len(grounding_chunks)}개 발견되었습니다.",
            issues=[],  # 빈 리스트 반환 (더미 이슈 제거)
            recommendations=[],
            grounding=grounding_chunks,
        )

    async def _llm_chat_response(
        self,
        query: str,
        grounding_chunks: List[LegalGroundingChunk],
        selected_issue: Optional[dict] = None,
        analysis_summary: Optional[str] = None,
        risk_score: Optional[int] = None,
        total_issues: Optional[int] = None,
    ) -> str:
        """
        법률 상담 챗용 LLM 응답 생성
        """
        if self.generator.disable_llm:
            # LLM 비활성화 시 기본 응답
            return f"LLM 분석이 비활성화되어 있습니다. RAG 검색 결과는 {len(grounding_chunks)}개 발견되었습니다."
        
        # 컨텍스트 구성
        context_parts = []
        for chunk in grounding_chunks[:5]:  # 상위 5개만 사용
            context_parts.append(
                f"[{chunk.source_type}] {chunk.title}\n{chunk.snippet}"
            )
        context = "\n\n".join(context_parts)
        
        # 선택된 이슈 정보 추가
        issue_context = ""
        if selected_issue:
            issue_context = f"""
선택된 위험 조항 정보:
- 카테고리: {selected_issue.get('category', '알 수 없음')}
- 요약: {selected_issue.get('summary', '')}
- 위험도: {selected_issue.get('severity', 'medium')}
- 조항 내용: {selected_issue.get('originalText', '')[:500]}
- 관련 법령: {', '.join(selected_issue.get('legalBasis', [])[:3])}
"""
        
        # 분석 요약 추가
        analysis_context = ""
        if analysis_summary:
            analysis_context = f"\n전체 분석 요약: {analysis_summary}"
        if risk_score is not None:
            analysis_context += f"\n전체 위험도: {risk_score}점"
        if total_issues is not None:
            analysis_context += f"\n발견된 위험 조항 수: {total_issues}개"
        
        prompt = f"""당신은 법률 상담 전문가입니다. 사용자의 질문에 대해 이해하기 쉽고 실용적인 답변을 제공해주세요.

**중요한 원칙:**
1. 이 서비스는 법률 자문이 아닙니다. 정보 안내와 가이드를 제공하는 것입니다.
2. 항상 관련 법령/가이드를 근거로 설명하세요.
3. 답변 마지막에 "전문가 상담 권장" 문구를 포함하세요.
4. 마크다운 형식을 사용하여 가독성을 높이세요 (제목, 리스트, 강조 등).

사용자 질문:
{query}
{issue_context}
{analysis_context}

관련 법령/가이드/케이스:
{context}

위 정보를 바탕으로 사용자의 질문에 대해:
1. 명확하고 이해하기 쉬운 설명
2. 구체적인 행동 가이드
3. 관련 법령 근거
4. 추가 확인이 필요한 사항

을 포함하여 답변해주세요. 마크다운 형식으로 작성하세요."""

        try:
            # Ollama 사용
            if self.generator.use_ollama:
                from config import settings
                
                # langchain-ollama 우선 사용
                try:
                    from langchain_ollama import OllamaLLM
                    llm = OllamaLLM(
                        base_url=settings.ollama_base_url,
                        model=settings.ollama_model
                    )
                except ImportError:
                    # 대안: langchain-community 사용
                    from langchain_community.llms import Ollama
                    llm = Ollama(
                        base_url=settings.ollama_base_url,
                        model=settings.ollama_model
                    )
                
                response_text = llm.invoke(prompt)
                
                # 답변에 전문가 상담 권장 문구 추가 (없는 경우)
                if "전문가 상담" not in response_text and "법률 자문" not in response_text:
                    response_text += "\n\n---\n\n**⚠️ 참고:** 이 답변은 정보 안내를 위한 것이며 법률 자문이 아닙니다. 중요한 사안은 전문 변호사나 노동위원회 등 전문 기관에 상담하시기 바랍니다."
                
                return response_text
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"LLM 채팅 응답 생성 실패: {str(e)}", exc_info=True)
        
        # LLM 호출 실패 시 기본 응답
        return f"답변을 생성하는 중 오류가 발생했습니다. RAG 검색 결과는 {len(grounding_chunks)}개 발견되었습니다. 다시 시도해주세요."

    async def _llm_situation_diagnosis(
        self,
        category_hint: str,
        situation_text: str,
        grounding_chunks: List[LegalGroundingChunk],
        employment_type: Optional[str] = None,
        work_period: Optional[str] = None,
        weekly_hours: Optional[int] = None,
        is_probation: Optional[bool] = None,
        social_insurance: Optional[str] = None,
    ) -> dict:
        """
        상황 기반 상세 진단용 LLM 응답 생성
        """
        if self.generator.disable_llm:
            # LLM 비활성화 시 기본 응답
            return {
                "classified_type": category_hint,
                "risk_score": 50,
                "summary": "LLM 분석이 비활성화되어 있습니다. RAG 검색 결과만 제공됩니다.",
                "criteria": [],
                "action_plan": {"steps": []},
                "scripts": {},
                "related_cases": [],
            }
        
        # 컨텍스트 구성
        context_parts = []
        for chunk in grounding_chunks[:5]:
            context_parts.append(
                f"[{chunk.source_type}] {chunk.title}\n{chunk.snippet}"
            )
        context = "\n\n".join(context_parts)
        
        # 사용자 정보 요약
        user_info = []
        if employment_type:
            user_info.append(f"고용 형태: {employment_type}")
        if work_period:
            user_info.append(f"근무 기간: {work_period}")
        if weekly_hours:
            user_info.append(f"주당 근로시간: {weekly_hours}시간")
        if is_probation is not None:
            user_info.append(f"수습 여부: {'수습 중' if is_probation else '수습 아님'}")
        if social_insurance:
            user_info.append(f"4대보험: {social_insurance}")
        user_info_text = "\n".join(user_info) if user_info else "정보 없음"
        
        # 카테고리 라벨 매핑
        category_labels = {
            "harassment": "직장 내 괴롭힘 / 모욕",
            "unpaid_wage": "임금체불 / 수당 미지급",
            "unfair_dismissal": "부당해고 / 계약해지",
            "overtime": "근로시간 / 야근 / 휴게시간 문제",
            "probation": "수습·인턴 관련 문제",
            "unknown": "기타 / 잘 모르겠음",
        }
        category_label = category_labels.get(category_hint, category_hint)
        
        prompt = f"""당신은 법률 진단 전문가입니다. 사용자가 설명한 상황을 분석하여 법적 위험도를 진단하고 행동 가이드를 제공해주세요.

**중요한 원칙:**
1. 이 서비스는 법률 자문이 아닙니다. 정보 안내와 가이드를 제공하는 것입니다.
2. 항상 관련 법령/가이드를 근거로 판단하세요.
3. 구체적이고 실용적인 행동 가이드를 제공하세요.

사용자 정보:
{user_info_text}

상황 카테고리 힌트: {category_label}

상황 설명:
{situation_text}

관련 법령/가이드/케이스:
{context}

다음 JSON 형식으로 진단 결과를 반환하세요:
{{
    "classified_type": "harassment|unpaid_wage|unfair_dismissal|overtime|probation|unknown",
    "risk_score": 0~100 사이의 숫자,
    "summary": "한 줄 요약 (예: '설명하신 상황은, 직장 내 괴롭힘 매뉴얼 기준 상 괴롭힘에 해당할 가능성이 높습니다.')",
    "criteria": [
        {{
            "name": "판단 기준명 (예: 반복성 여부)",
            "status": "likely|unclear|unlikely",
            "reason": "판단 이유 및 설명"
        }}
    ],
    "action_plan": {{
        "steps": [
            {{
                "title": "증거 수집",
                "items": ["○○, △△, 카톡/이메일 캡처", "출퇴근 기록 등을 남기세요"]
            }},
            {{
                "title": "1차 대응",
                "items": ["가능하다면 감정 섞지 않고 이런 식으로 문제를 제기해보는 것도 방법입니다."]
            }},
            {{
                "title": "상담/신고 루트",
                "items": ["고용노동부 1350 상담센터", "청년노동센터", "노무사 상담"]
            }}
        ]
    }},
    "scripts": {{
        "to_company": "회사에 보낼 정중한 문제 제기 문구 템플릿 (예: '현재 계약상 주당 근로시간이 ○시간으로 기재되어 있으나, 실제로는 ○시간 이상 근무하고 있으며 연장근로 수당은 별도로 지급받지 못하고 있습니다. 이 부분에 대해 근로기준법 기준에 맞게 조정이 가능할지 검토를 요청드립니다.')",
        "to_advisor": "노무사/기관에 상담할 때 쓸 설명 템플릿"
    }}
}}

중요 사항:
1. 모든 응답은 한국어로 작성하세요.
2. criteria는 3~5개 정도로 구성하세요.
3. action_plan의 steps는 3단계 정도로 구성하세요.
4. scripts는 실제로 사용할 수 있는 구체적인 문구로 작성하세요.

JSON 형식만 반환하세요."""

        try:
            # Ollama 사용
            if self.generator.use_ollama:
                from config import settings
                import json
                import re
                
                # langchain-ollama 우선 사용
                try:
                    from langchain_ollama import OllamaLLM
                    llm = OllamaLLM(
                        base_url=settings.ollama_base_url,
                        model=settings.ollama_model
                    )
                except ImportError:
                    # 대안: langchain-community 사용
                    from langchain_community.llms import Ollama
                    llm = Ollama(
                        base_url=settings.ollama_base_url,
                        model=settings.ollama_model
                    )
                
                response_text = llm.invoke(prompt)
                
                # JSON 추출
                try:
                    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                    if json_match:
                        diagnosis = json.loads(json_match.group())
                        
                        # 응답 형식 변환
                        return {
                            "classified_type": diagnosis.get("classified_type", category_hint),
                            "risk_score": diagnosis.get("risk_score", 50),
                            "summary": diagnosis.get("summary", "상황을 분석했습니다."),
                            "criteria": diagnosis.get("criteria", []),
                            "action_plan": diagnosis.get("action_plan", {"steps": []}),
                            "scripts": diagnosis.get("scripts", {}),
                            "related_cases": [],  # 나중에 추가됨
                        }
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"LLM 진단 응답 파싱 실패: {str(e)}", exc_info=True)
                    logger.error(f"LLM 응답 원문 (처음 500자): {response_text[:500] if response_text else 'None'}")
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"LLM 진단 응답 생성 실패: {str(e)}", exc_info=True)
        
        # LLM 호출 실패 시 기본 응답
        return {
            "classified_type": category_hint,
            "risk_score": 50,
            "summary": "진단을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.",
            "criteria": [],
            "action_plan": {"steps": []},
            "scripts": {},
            "related_cases": [],
        }

