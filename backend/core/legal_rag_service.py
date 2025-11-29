"""
Legal RAG Service - 법률 도메인 RAG 서비스
계약서 분석, 상황 분석, 케이스 검색 기능 제공
"""

from typing import List, Optional, OrderedDict, Dict, Any
from pathlib import Path
from collections import OrderedDict as OrderedDictType
import asyncio
import logging
import json
import re

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
from core.prompts import (
    build_legal_chat_prompt,
    build_contract_analysis_prompt,
    build_situation_analysis_prompt,
    LEGAL_CHAT_SYSTEM_PROMPT,
)


LEGAL_BASE_PATH = Path(__file__).resolve().parent.parent / "data" / "legal"

logger = logging.getLogger(__name__)


class LRUEmbeddingCache:
    """
    LRU (Least Recently Used) 캐시를 사용한 임베딩 캐시
    메모리 사용량을 제한하기 위해 최대 크기를 설정할 수 있음
    """
    
    def __init__(self, max_size: int = 100):
        """
        Args:
            max_size: 최대 캐시 항목 수 (기본값: 100)
        """
        self.max_size = max_size
        self._cache: OrderedDictType[str, List[float]] = OrderedDictType()
    
    def get(self, key: str) -> Optional[List[float]]:
        """캐시에서 값을 가져오고, 사용된 항목을 최신으로 이동"""
        if key in self._cache:
            # OrderedDict에서 항목을 제거하고 다시 추가하여 최신으로 이동
            value = self._cache.pop(key)
            self._cache[key] = value
            return value
        return None
    
    def put(self, key: str, value: List[float]) -> None:
        """캐시에 값을 저장하고, 크기 제한을 초과하면 가장 오래된 항목 제거"""
        if key in self._cache:
            # 이미 존재하면 제거하고 다시 추가 (최신으로 이동)
            self._cache.pop(key)
        elif len(self._cache) >= self.max_size:
            # 캐시가 가득 차면 가장 오래된 항목 제거 (FIFO)
            self._cache.popitem(last=False)  # last=False: 가장 오래된 항목
        
        self._cache[key] = value
    
    def clear(self) -> None:
        """캐시 전체 삭제"""
        self._cache.clear()
    
    def size(self) -> int:
        """현재 캐시 크기 반환"""
        return len(self._cache)
    
    def __contains__(self, key: str) -> bool:
        """캐시에 키가 있는지 확인"""
        return key in self._cache


class LegalRAGService:
    """
    법률 도메인 RAG 서비스.
    - laws/: 요약 법령/체크리스트
    - manuals/: 계약/노동 가이드
    - cases/: 우리가 만든 시나리오 md 파일
    """

    def __init__(self, embedding_cache_size: int = 100):
        """
        벡터스토어/임베딩/LLM 클라이언트 초기화
        
        Args:
            embedding_cache_size: 임베딩 캐시 최대 크기 (기본값: 100)
        """
        self.vector_store = SupabaseVectorStore()
        self.generator = LLMGenerator()
        self.processor = DocumentProcessor()
        # LRU 캐시를 사용한 임베딩 캐시 (메모리 사용량 제한)
        self._embedding_cache = LRUEmbeddingCache(max_size=embedding_cache_size)

    # 1) 계약서 + 상황 설명 기반 분석
    async def analyze_contract(
        self,
        extracted_text: str,
        description: Optional[str] = None,
        doc_id: Optional[str] = None,
        clauses: Optional[List[Dict]] = None,
        contract_type: Optional[str] = None,
        user_role: Optional[str] = None,
        field: Optional[str] = None,
    ) -> LegalAnalysisResult:
        """
        계약서 분석 (Dual RAG 지원)
        
        - extracted_text: 업로드된 계약서 OCR/파싱 결과 텍스트
        - description: 사용자가 덧붙인 상황 설명
        - doc_id: 계약서 ID (있으면 contract_chunks도 검색)
        """
        # 1. 쿼리 문장 구성
        query = self._build_query_from_contract(extracted_text, description)

        # 2. Dual RAG 검색: 계약서 내부 + 외부 법령
        contract_chunks = []
        legal_chunks = []
        
        # 2-1. 계약서 내부 검색 (doc_id가 있고 contract_chunks가 저장된 경우)
        if doc_id:
            try:
                contract_chunks = await self._search_contract_chunks(
                    doc_id=doc_id,
                    query=query,
                    top_k=5,  # 분석 시에는 상위 5개 사용
                    selected_issue=None
                )
            except Exception as e:
                # contract_chunks가 아직 저장되지 않았거나 오류 발생 시 무시
                logger.warning(f"[계약서 분석] contract_chunks 검색 실패 (계속 진행): {str(e)}")
                contract_chunks = []
        
        # 2-2. 외부 법령 검색 (타입 다양성 확보)
        legal_chunks = await self._search_legal_chunks(
            query=query, 
            top_k=8,
            category=None,  # 전체 계약서 분석이므로 category 필터 없음
            ensure_diversity=True,  # 타입 다양성 확보
        )

        # 3. 프리프로세싱: 법정 수당 청구권 포기 패턴 감지
        risk_hint = description
        if self._detect_wage_waiver_phrases(extracted_text):
            risk_hint = (
                f"{description or ''}\n\n"
                "※ 시스템 힌트: 이 계약서에는 "
                "'추가 수당을 사업주에게 청구하지 않기로 합의한다' 와 같이 "
                "근로자가 법에서 정한 연장·야간·휴일근로 수당 등 법정 임금 청구권을 "
                "미리 포기하는 취지의 문구가 포함되어 있습니다. "
                "이 조항의 위법 가능성과 위험도를 반드시 별도의 이슈로 평가하세요."
            ).strip()

        # 4. LLM으로 리스크 요약/분류 (Dual RAG 컨텍스트 포함)
        result = await self._llm_summarize_risk(
            query=query,
            contract_text=extracted_text,
            contract_chunks=contract_chunks,
            grounding_chunks=legal_chunks,
            clauses=clauses,
            contract_type=contract_type,
            user_role=user_role,
            field=field,
            concerns=risk_hint,
        )
        return result

    # 2) 텍스트 상황 설명 기반 분석 (레거시)
    async def analyze_situation(self, text: str) -> LegalAnalysisResult:
        query = text
        grounding_chunks = await self._search_legal_chunks(
            query=query, 
            top_k=8,
            category=None,
            ensure_diversity=True,  # 타입 다양성 확보
        )
        result = await self._llm_summarize_risk(
            query=query,
            contract_text=None,
            grounding_chunks=grounding_chunks,
            contract_chunks=None,  # 상황 분석에는 계약서 청크 없음
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
        # 1. 쿼리 텍스트 구성
        # summary와 details가 있으면 우선 사용, 없으면 situation_text 사용
        query_text = situation_text
        if summary:
            query_text = summary
            if details:
                query_text = f"{summary}\n\n{details}"
        
        # 2. 병렬 처리: RAG 검색과 케이스 검색을 동시에 실행
        # 같은 쿼리를 사용하므로 임베딩을 한 번만 생성하고 재사용
        query_embedding = await self._get_embedding(query_text)
        
        # 임베딩을 공유하여 병렬 검색
        async def search_legal_with_embedding():
            rows = self.vector_store.search_similar_legal_chunks(
                query_embedding=query_embedding,
                top_k=8,
                filters=None
            )
            results: List[LegalGroundingChunk] = []
            for r in rows:
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
        
        async def search_cases_with_embedding():
            rows = self.vector_store.search_similar_legal_chunks(
                query_embedding=query_embedding,
                top_k=3,
                filters={"source_type": "case"}
            )
            cases: List[LegalCasePreview] = []
            for row in rows:
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
        
        grounding_chunks, related_cases = await asyncio.gather(
            search_legal_with_embedding(),
            search_cases_with_embedding(),
            return_exceptions=False
        )
        
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
        # 1. Dual RAG 검색: 내 계약서 + 외부 법령
        # 같은 쿼리를 사용하므로 임베딩을 한 번만 생성하고 재사용
        query_embedding = await self._get_embedding(query)
        
        contract_chunks = []
        legal_chunks = []
        
        # 1-1. 계약서 내부 검색 (doc_ids가 있는 경우)
        async def search_contract_with_embedding():
            if doc_ids and len(doc_ids) > 0:
                doc_id = doc_ids[0]
                # Issue 기반 boosting
                boost_article = None
                if selected_issue:
                    boost_article = selected_issue.get("article_number")
                    if isinstance(boost_article, str):
                        import re
                        match = re.search(r'(\d+)', str(boost_article))
                        if match:
                            boost_article = int(match.group(1))
                        else:
                            boost_article = None
                    elif not isinstance(boost_article, int):
                        boost_article = None
                
                return self.vector_store.search_similar_contract_chunks(
                    contract_id=doc_id,
                    query_embedding=query_embedding,
                    top_k=3,
                    boost_article=boost_article,
                    boost_factor=1.5
                )
            return []
        
        # 1-2. 외부 법령 검색
        # selected_issue가 있으면 이슈 기반 쿼리 사용
        async def search_legal_with_embedding():
            if selected_issue:
                # 이슈 중심 쿼리 생성
                issue_query = self._build_query_from_issue(selected_issue)
                issue_category = selected_issue.get("category")
                # 이슈 기반 검색 (타입 다양성 확보)
                return await self._search_legal_chunks(
                    query=issue_query,
                    top_k=top_k,
                    category=issue_category,
                    ensure_diversity=True,
                )
            else:
                # 일반 쿼리 검색
                return await self._search_legal_chunks(
                    query=query,
                    top_k=top_k,
                    category=None,
                    ensure_diversity=True,
                )
        
        # 병렬 검색
        contract_chunks, legal_chunks_raw = await asyncio.gather(
            search_contract_with_embedding(),
            search_legal_with_embedding(),
            return_exceptions=False
        )
        legal_chunks = [
            {
                "id": chunk.source_id,
                "source_type": chunk.source_type,
                "title": chunk.title,
                "content": chunk.snippet,
                "score": chunk.score,
            }
            for chunk in legal_chunks_raw
        ]
        
        # 2. LLM으로 답변 생성 (컨텍스트 포함)
        answer = await self._llm_chat_response(
            query=query,
            contract_chunks=contract_chunks,
            legal_chunks=legal_chunks_raw,
            selected_issue=selected_issue,
            analysis_summary=analysis_summary,
            risk_score=risk_score,
            total_issues=total_issues,
        )
        
        return {
            "answer": answer,
            "markdown": answer,
            "query": query,
            "used_chunks": {
                "contract": contract_chunks,
                "legal": legal_chunks
            },
        }

    # 4) 시나리오/케이스 검색
    async def search_cases(self, query: str, limit: int = 5) -> List[LegalCasePreview]:
        """
        cases/*.md 에서만 검색하는 라이트한 검색 (새 스키마).
        """
        # 쿼리 임베딩 생성 (캐싱 지원)
        query_embedding = await self._get_embedding(query)
        
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
    
    def _detect_wage_waiver_phrases(self, text: str) -> bool:
        """
        '추가 수당 청구권 포기'류 문구가 있는지 간단히 감지
        
        Args:
            text: 계약서 텍스트
            
        Returns:
            패턴이 발견되면 True
        """
        if not text:
            return False
        
        import re
        
        patterns = [
            r"추가\s*수당[^\n]*청구하지\s+않기로\s+합의한다",
            r"법에서\s*정한\s*수당[^\n]*청구하지\s+않기로",
            r"연장.?야간.?휴일\s*근로\s*수당[^\n]*별도로\s*청구하지\s+않는다",
            r"포괄임금[^\n]*추가[^\n]*수당[^\n]*청구하지\s+않",
            r"실제\s*근로시간[^\n]*포괄임금[^\n]*초과[^\n]*추가\s*수당[^\n]*청구하지",
            r"연장.?야간.?휴일\s*수당[^\n]*청구하지\s+않",
            r"법정\s*수당[^\n]*청구하지\s+않",
        ]
        
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                logger.info(f"[프리프로세싱] 법정 수당 청구권 포기 패턴 감지됨: {pattern}")
                return True
        
        return False
    
    def _ensure_wage_waiver_issue(
        self,
        contract_text: str,
        issues: List[LegalIssue],
    ) -> None:
        """
        계약서에 '법정 수당 청구권 포기'류 문구가 있는데
        LLM이 이슈를 안 만들어 줬다면, 강제로 하나 추가한다.
        
        Args:
            contract_text: 계약서 텍스트
            issues: 기존 이슈 리스트 (in-place 수정)
        """
        if not contract_text:
            return
        
        # 이미 비슷한 이슈가 있는지 먼저 확인 (중복 방지)
        for issue in issues:
            issue_desc = (issue.description or "") + (issue.summary or "") + (issue.rationale or "")
            if issue.category in ("wage", "working_hours") and \
               "수당" in issue_desc and \
               ("청구" in issue_desc or "포기" in issue_desc or "합의" in issue_desc):
                logger.info("[후처리] 법정 수당 청구권 포기 관련 이슈가 이미 존재하여 추가하지 않음")
                return  # 이미 있는 것으로 간주하고 종료
        
        # 텍스트에서 해당 문구 검색
        import re
        
        # 더 정확한 패턴부터 시도
        pattern = r"제\s*\d+\s*조[\s\S]{0,100}?특약사항[\s\S]{0,200}?추가\s*수당[^\n]*청구하지\s+않기로\s+합의한다[^\n]*"
        match = re.search(pattern, contract_text)
        
        if not match:
            # 조금 더 느슨한 패턴들
            patterns = [
                r"추가\s*수당[^\n]*청구하지\s+않기로\s+합의한다",
                r"실제\s*근로시간[^\n]*포괄임금[^\n]*초과[^\n]*추가\s*수당[^\n]*청구하지",
                r"연장.?야간.?휴일\s*근로\s*수당[^\n]*별도로\s*청구하지\s+않는다",
                r"법에서\s*정한\s*수당[^\n]*청구하지\s+않기로",
            ]
            for p in patterns:
                match = re.search(p, contract_text, re.IGNORECASE)
                if match:
                    break
        
        if not match:
            return  # 발견 못하면 종료
        
        clause_text = match.group(0)
        if len(clause_text) > 500:
            clause_text = clause_text[:500] + "..."
        
        # LegalIssue 객체 생성
        from models.schemas import LegalIssue
        
        waiver_issue = LegalIssue(
            name="issue-wage-waiver",
            description=(
                "포괄임금제 하에서 실제 근로시간이 포괄임금에 포함된 시간을 초과하더라도 "
                "근로자가 추가 수당을 사업주에게 청구하지 않기로 약정한 조항입니다. "
                "연장·야간·휴일근로 수당 등 법정 임금 청구권을 사전에 포기시키는 내용으로 "
                "근로기준법 제15조 등의 강행규정에 위반되어 무효로 볼 여지가 크며, "
                "임금체불 분쟁 위험이 매우 큽니다."
            ),
            severity="high",
            legal_basis=[
                "근로기준법 제15조: 법에서 정한 기준에 미치지 못하는 근로조건을 정한 근로계약 부분은 무효",
                "근로기준법 제56조: 연장·야간·휴일근로에 대한 가산수당 지급 의무",
            ],
            start_index=match.start(),
            end_index=match.end(),
            suggested_text=None,
            rationale=(
                "포괄임금제 계약을 체결했더라도, 실제 근로시간을 산정하여 법정 수당(연장, 야간, 휴일)이 "
                "포괄임금액을 초과할 경우 차액을 지급해야 할 의무가 있습니다. "
                "'청구하지 않기로 합의'는 근로기준법 제15조 위반으로 무효이며, 임금 체불 소지가 큽니다. "
                "근로자는 법에서 보장하는 임금·수당을 사전에 포기할 수 없으며, 이러한 합의는 무효가 될 가능성이 높습니다."
            ),
            suggested_questions=[
                "실제 연장·야간·휴일근로 시간이 포괄임금에 포함된 시간보다 많을 경우, 차액 수당을 별도로 지급하나요?",
                "포괄임금에 포함된 시간(월 몇 시간분)과 그 계산 기준을 계약서에 명시해 주실 수 있나요?",
            ],
            original_text=clause_text,
            clause_id=None,  # clause_id는 나중에 매칭될 수 있음
            category="wage",
            summary="법정 수당 청구권을 사전에 포기시키는 포괄임금 특약",
            toxic_clause_detail=None,
        )
        
        issues.append(waiver_issue)
        logger.info(f"[후처리] 법정 수당 청구권 포기 이슈 강제 추가됨 (위치: {match.start()}-{match.end()})")
    
    def _build_file_path(self, source_type: str, external_id: str) -> str:
        """
        Storage 파일 경로 생성
        
        Args:
            source_type: 'law' | 'manual' | 'case' | 'standard_contract'
            external_id: 파일 키 (MD5 or filename)
        
        Returns:
            Storage object key (예: "standard_contract/437f9719fcdf4fb0a3b011315b75c56c.pdf")
        """
        # source_type을 폴더명으로 변환
        folder_mapping = {
            "law": "laws",
            "manual": "manuals",
            "case": "cases",
            "standard_contract": "standard_contracts",
        }
        folder_name = folder_mapping.get(source_type, source_type)
        
        # external_id에 확장자가 없다는 가정이면 .pdf 추가
        if not external_id.lower().endswith(".pdf"):
            object_name = f"{external_id}.pdf"
        else:
            object_name = external_id
        
        # 경로 규칙: {folder_name}/{object_name}
        return f"{folder_name}/{object_name}"
    
    async def _build_reason(
        self,
        issue_summary: str,
        clause_text: str,
        basis_snippet: str,
    ) -> Optional[str]:
        """
        "왜 이 근거를 붙였는지" LLM 한 줄 설명 생성
        
        Args:
            issue_summary: 이슈 요약
            clause_text: 계약서 조항 텍스트
            basis_snippet: 법령/표준계약서 스니펫
        
        Returns:
            이유 설명 (1~2문장) 또는 None (생성 실패 시)
        """
        if self.generator.disable_llm:
            return None
        
        try:
            prompt = f"""아래 세 정보를 보고, 왜 이 법령/표준계약서 스니펫이 이 이슈의 근거가 되는지
한국어로 1~2문장으로 간단하게 설명해줘.

[이슈 요약]
{issue_summary[:500]}

[계약서 조항]
{clause_text[:500]}

[법령/표준계약서 스니펫]
{basis_snippet[:500]}

답변은 설명만 간단히 작성하고, 다른 부가 설명은 하지 마세요."""
            
            # Groq 사용 (우선)
            from config import settings
            if settings.use_groq:
                from llm_api import ask_groq_with_messages
                messages = [
                    {"role": "system", "content": "너는 유능한 법률 AI야. 한국어로만 답변해주세요."},
                    {"role": "user", "content": prompt}
                ]
                response_text = ask_groq_with_messages(
                    messages=messages,
                    temperature=0.3,  # reason 생성은 낮은 temperature 사용
                    model=settings.groq_model
                )
                return response_text.strip() if response_text else None
            # Ollama 사용 (레거시)
            elif self.generator.use_ollama:
                from langchain_ollama import OllamaLLM
                from config import settings
                llm = OllamaLLM(
                    base_url=settings.ollama_base_url,
                    model=settings.ollama_model
                )
                response_text = llm.invoke(prompt)
                return response_text.strip() if response_text else None
            else:
                return None
        except Exception as e:
            logger.debug(f"[reason 생성] LLM 호출 실패: {str(e)}")
            return None
    
    async def _get_embeddings_batch(
        self,
        queries: List[str],
        use_cache: bool = True
    ) -> List[List[float]]:
        """
        여러 쿼리의 임베딩을 배치로 생성 (캐싱 지원)
        
        Args:
            queries: 쿼리 텍스트 리스트
            use_cache: 캐시 사용 여부
        
        Returns:
            임베딩 벡터 리스트
        """
        if not queries:
            return []
        
        # 캐시에서 찾기
        uncached_queries = []
        uncached_indices = []
        embeddings = [None] * len(queries)
        
        for idx, query in enumerate(queries):
            if use_cache:
                cached_embedding = self._embedding_cache.get(query)
                if cached_embedding is not None:
                    embeddings[idx] = cached_embedding
                    continue
            uncached_queries.append(query)
            uncached_indices.append(idx)
        
        # 캐시에 없는 쿼리만 배치로 생성
        if uncached_queries:
            # 배치 임베딩 생성 (비동기로 실행)
            new_embeddings = await asyncio.to_thread(
                self.generator.embed,
                uncached_queries
            )
            
            # 결과를 올바른 위치에 배치하고 캐시에 저장
            for cache_idx, original_idx in enumerate(uncached_indices):
                embedding = new_embeddings[cache_idx]
                embeddings[original_idx] = embedding
                if use_cache:
                    self._embedding_cache.put(uncached_queries[cache_idx], embedding)
        
        return embeddings
    
    async def _get_embedding(
        self,
        query: str,
        use_cache: bool = True
    ) -> List[float]:
        """
        단일 쿼리 임베딩 생성 (캐싱 지원)
        
        Args:
            query: 쿼리 텍스트
            use_cache: 캐시 사용 여부
        
        Returns:
            임베딩 벡터
        """
        if use_cache:
            cached_embedding = self._embedding_cache.get(query)
            if cached_embedding is not None:
                return cached_embedding
        
        # 비동기로 실행하여 블로킹 방지
        embedding = await asyncio.to_thread(self.generator.embed_one, query)
        
        if use_cache:
            self._embedding_cache.put(query, embedding)
        
        return embedding

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

    async def _search_contract_chunks(
        self,
        doc_id: str,
        query: str,
        top_k: int = 3,
        selected_issue: Optional[dict] = None
    ) -> List[dict]:
        """
        계약서 내부 청크 검색 (issue 기반 boosting)
        
        Args:
            doc_id: 계약서 ID
            query: 검색 쿼리
            top_k: 반환할 최대 개수
            selected_issue: 선택된 이슈 (article_number 포함)
        
        Returns:
            계약서 청크 리스트
        """
        # 쿼리 임베딩 생성 (캐싱 지원)
        query_embedding = await self._get_embedding(query)
        
        # Issue 기반 boosting: 같은 조항이면 가점
        boost_article = None
        if selected_issue:
            # selected_issue에서 article_number 추출
            boost_article = selected_issue.get("article_number")
            if isinstance(boost_article, str):
                # "제5조" 형식에서 숫자 추출
                import re
                match = re.search(r'(\d+)', str(boost_article))
                if match:
                    boost_article = int(match.group(1))
                else:
                    boost_article = None
            elif not isinstance(boost_article, int):
                boost_article = None
        
        # 벡터 검색
        chunks = self.vector_store.search_similar_contract_chunks(
            contract_id=doc_id,
            query_embedding=query_embedding,
            top_k=top_k,
            boost_article=boost_article,
            boost_factor=1.5
        )
        
        return chunks
    
    def _build_query_from_issue(
        self,
        issue: Dict[str, Any],
    ) -> str:
        """
        이슈 기반 쿼리 생성 (이슈 중심 검색용)
        
        Args:
            issue: 이슈 정보 (clause_text, rationale, category 포함)
        
        Returns:
            이슈 중심 쿼리 문자열
        """
        clause_text = issue.get("original_text") or issue.get("clause_text") or issue.get("originalText", "")
        rationale = issue.get("rationale") or issue.get("reason") or issue.get("description", "")
        category = issue.get("category", "")
        summary = issue.get("summary", "")
        
        query_parts = []
        
        if clause_text:
            query_parts.append(f"문제된 계약 조항:\n{clause_text[:500]}")
        
        if rationale:
            query_parts.append(f"이 조항의 위험 요약:\n{rationale[:500]}")
        elif summary:
            query_parts.append(f"이슈 요약:\n{summary[:500]}")
        
        if category:
            query_parts.append(f"이 이슈의 카테고리: {category}")
        
        if not query_parts:
            # 폴백: issue 전체를 문자열로 변환
            return str(issue)[:1000]
        
        return "\n\n".join(query_parts)
    
    async def _search_legal_chunks(
        self,
        query: str,
        top_k: int = 8,
        category: Optional[str] = None,
        ensure_diversity: bool = True,
    ) -> List[LegalGroundingChunk]:
        """
        벡터스토어 + 메타데이터로
        - laws
        - manuals
        - cases
        섞어서 검색 (새 스키마).
        
        Args:
            query: 검색 쿼리
            top_k: 반환할 최대 개수
            category: 이슈 카테고리 (필터링용, 예: "wage", "working_hours")
            ensure_diversity: 타입 다양성 확보 여부 (상위 20개에서 source_type별 quota 채워서 선정)
        """
        # 쿼리 임베딩 생성 (캐싱 지원)
        query_embedding = await self._get_embedding(query)
        
        # 필터 구성 (category가 있으면 metadata에서 topic_main 필터링)
        filters = None
        if category:
            # category를 topic_main으로 매핑
            # category 예: "wage", "working_hours", "job_stability", "dismissal", "payment", "ip", "nda", "non_compete", "liability", "dispute"
            # topic_main은 legal_chunks의 metadata JSONB 필드에 저장되어 있음
            filters = {"topic_main": category}
        
        # 타입 다양성을 위해 상위 20개를 먼저 가져옴 (RPC에서 더 많은 후보를 받아서 Python에서 다양성 확보)
        candidate_top_k = 20 if ensure_diversity else top_k
        
        # 벡터 검색 (RPC 함수 사용)
        rows = self.vector_store.search_similar_legal_chunks(
            query_embedding=query_embedding,
            top_k=candidate_top_k,  # 타입 다양성을 위해 20개 후보를 받음
            filters=filters
        )

        results: List[LegalGroundingChunk] = []
        for r in rows:
            # 새 스키마에서 source_type은 직접 컬럼
            source_type = r.get("source_type", "law")
            title = r.get("title", "제목 없음")
            content = r.get("content", "")
            score = r.get("score", 0.0)
            file_path = r.get("file_path", None)
            external_id = r.get("external_id", None)
            chunk_index = r.get("chunk_index", None)
            
            # file_path가 없으면 external_id로 생성
            if not file_path and external_id:
                file_path = self._build_file_path(source_type, external_id)
            
            results.append(
                LegalGroundingChunk(
                    source_id=r.get("id", ""),
                    source_type=source_type,
                    title=title,
                    snippet=content[:300],
                    score=score,
                    file_path=file_path,
                    external_id=external_id,
                    chunk_index=chunk_index,
                )
            )
        
        # threshold 체크: 상위 1개 스코어가 너무 낮으면 빈 리스트 반환
        if results and len(results) > 0:
            top_score = results[0].score
            if top_score < 0.4:  # threshold: 0.4
                logger.info(f"[법령 검색] 상위 스코어가 너무 낮음 (score={top_score:.3f} < 0.4), 결과 없음으로 처리")
                return []  # threshold 미만이면 빈 리스트 반환
        
        # 타입 다양성 확보: source_type별 quota 채워서 8개 선정
        if ensure_diversity and len(results) > top_k:
            results = self._ensure_source_type_diversity(results, top_k)
        
        return results[:top_k]
    
    def _ensure_source_type_diversity(
        self,
        candidates: List[LegalGroundingChunk],
        target_count: int = 8,
    ) -> List[LegalGroundingChunk]:
        """
        source_type별 다양성을 확보하여 결과 선정
        
        목표:
        - 최소 1개: 법령 (law)
        - 최소 1개: 가이드/표준계약 (manual, standard_contract)
        - 있으면 1개: 판례/케이스 (case)
        
        Args:
            candidates: 후보 리스트 (이미 유사도 순으로 정렬됨)
            target_count: 최종 반환할 개수
        
        Returns:
            다양성을 확보한 결과 리스트
        """
        if len(candidates) <= target_count:
            return candidates
        
        # source_type별로 분류
        by_type: Dict[str, List[LegalGroundingChunk]] = {
            "law": [],
            "manual": [],
            "standard_contract": [],
            "case": [],
            "other": [],
        }
        
        for chunk in candidates:
            source_type = chunk.source_type or "other"
            if source_type in by_type:
                by_type[source_type].append(chunk)
            else:
                by_type["other"].append(chunk)
        
        # 가이드와 표준계약을 합침
        guide_chunks = by_type["manual"] + by_type["standard_contract"]
        
        selected: List[LegalGroundingChunk] = []
        used_indices = set()
        
        # 1. 법령 최소 1개
        if by_type["law"]:
            selected.append(by_type["law"][0])
            used_indices.add(0)
        
        # 2. 가이드/표준계약 최소 1개
        if guide_chunks:
            selected.append(guide_chunks[0])
            # candidates에서 해당 chunk의 인덱스 찾기
            for idx, chunk in enumerate(candidates):
                if chunk.source_id == guide_chunks[0].source_id:
                    used_indices.add(idx)
                    break
        
        # 3. 케이스 있으면 1개
        if by_type["case"]:
            selected.append(by_type["case"][0])
            for idx, chunk in enumerate(candidates):
                if chunk.source_id == by_type["case"][0].source_id:
                    used_indices.add(idx)
                    break
        
        # 4. 나머지는 유사도 순으로 채우기
        for idx, chunk in enumerate(candidates):
            if len(selected) >= target_count:
                break
            if idx not in used_indices:
                selected.append(chunk)
                used_indices.add(idx)
        
        # 유사도 순으로 재정렬 (다양성 확보 후에도 유사도 우선)
        selected.sort(key=lambda x: x.score, reverse=True)
        
        return selected[:target_count]

    async def _llm_summarize_risk(
        self,
        query: str,
        contract_text: Optional[str],
        grounding_chunks: List[LegalGroundingChunk],
        contract_chunks: Optional[List[dict]] = None,
        clauses: Optional[List[Dict]] = None,
        contract_type: Optional[str] = None,
        user_role: Optional[str] = None,
        field: Optional[str] = None,
        concerns: Optional[str] = None,
    ) -> LegalAnalysisResult:
        """
        LLM 프롬프트를 통해:
        - risk_score, risk_level
        - issues[]
        - recommendations[]
        를 생성하도록 하는 부분.
        """
        logger.info(f"[LLM 호출] _llm_summarize_risk 시작: query 길이={len(query)}, contract_text 길이={len(contract_text) if contract_text else 0}, grounding_chunks={len(grounding_chunks)}, contract_chunks={len(contract_chunks) if contract_chunks else 0}")
        logger.info(f"[LLM 호출] disable_llm={self.generator.disable_llm}, use_ollama={self.generator.use_ollama}")
        
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
        
        # 프롬프트 템플릿 사용 (Dual RAG 지원)
        prompt = build_contract_analysis_prompt(
            contract_text=contract_text or "",
            grounding_chunks=grounding_chunks,
            contract_chunks=contract_chunks,
            description=concerns or query if query else None,
            clauses=clauses,
            contract_type=contract_type,
            user_role=user_role,
            field=field,
            concerns=concerns,
        )
        

        try:
            # Groq 사용 (우선)
            from config import settings
            import json
            import re
            
            if settings.use_groq:
                from llm_api import ask_groq_with_messages
                
                # 프롬프트를 메시지 형식으로 변환
                messages = [
                    {"role": "system", "content": "너는 유능한 법률 AI야. 한국어로만 답변해주세요. JSON 형식으로 응답하세요."},
                    {"role": "user", "content": prompt}
                ]
                
                try:
                    response_text = ask_groq_with_messages(
                        messages=messages,
                        temperature=settings.llm_temperature,
                        model=settings.groq_model
                    )
                    logger.info(f"[Groq 호출 성공] 응답 길이: {len(response_text) if response_text else 0}자")
                except Exception as groq_error:
                    logger.error(f"[Groq 호출 실패] {str(groq_error)}", exc_info=True)
                    raise  # 상위 except로 전달
            # Ollama 사용 (레거시)
            elif self.generator.use_ollama:
                logger.info(f"[LLM 호출] Ollama 호출 시작: base_url={settings.ollama_base_url}, model={settings.ollama_model}")
                
                # langchain-ollama 우선 사용 (deprecated 경고 없음)
                try:
                    from langchain_ollama import OllamaLLM
                    llm = OllamaLLM(
                        base_url=settings.ollama_base_url,
                        model=settings.ollama_model
                    )
                    logger.info("[LLM 호출] langchain_ollama.OllamaLLM 사용")
                except ImportError:
                    # 대안: langchain-community 사용 (deprecated)
                    from langchain_community.llms import Ollama
                    llm = Ollama(
                        base_url=settings.ollama_base_url,
                        model=settings.ollama_model
                    )
                    logger.info("[LLM 호출] langchain_community.llms.Ollama 사용")
                
                logger.info(f"[LLM 호출] 프롬프트 길이: {len(prompt)}자, invoke 호출 중...")
                logger.debug(f"[LLM 호출] 프롬프트 미리보기 (처음 500자): {prompt[:500]}")
                response_text = llm.invoke(prompt)
            else:
                # Groq와 Ollama 모두 사용 안 함
                raise ValueError("LLM이 설정되지 않았습니다. use_groq 또는 use_ollama를 True로 설정하세요.")
            
            # JSON 추출 및 파싱 (Groq와 Ollama 모두 공통)
            logger.info(f"[LLM 호출] 응답 수신 완료, 응답 길이: {len(response_text) if response_text else 0}자")
            # [DEBUG] Groq raw output 출력
            logger.info(f"[DEBUG] Groq raw output (처음 500자): {response_text[:500] if response_text else 'None'}")
            if response_text and len(response_text) > 1000:
                logger.info(f"[DEBUG] Groq raw output (마지막 500자): ...{response_text[-500:]}")
            logger.info(f"[LLM 호출] 응답 원문 (처음 1000자): {response_text[:1000] if response_text else 'None'}")
            if response_text and len(response_text) > 1000:
                logger.info(f"[LLM 호출] 응답 원문 (마지막 500자): ...{response_text[-500:]}")
            
            # JSON 추출 (더 robust한 파싱)
            try:
                # 1. 코드 블록 제거
                response_clean = response_text.strip()
                if response_clean.startswith("```json"):
                    response_clean = response_clean[7:]
                elif response_clean.startswith("```"):
                    response_clean = response_clean[3:]
                if response_clean.endswith("```"):
                    response_clean = response_clean[:-3]
                response_clean = response_clean.strip()
                
                # 2. JSON 객체 찾기 (더 정확한 정규식)
                json_match = re.search(r'\{[\s\S]*\}', response_clean, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                    logger.debug(f"[JSON 파싱] 추출된 JSON 문자열 길이: {len(json_str)}자")
                    logger.debug(f"[JSON 파싱] JSON 문자열 미리보기 (처음 500자): {json_str[:500]}")
                    # 3. JSON 유효성 검사 및 파싱
                    try:
                        analysis = json.loads(json_str)
                        logger.info(f"[JSON 파싱] ✅ JSON 파싱 성공")
                    except json.JSONDecodeError as json_err:
                        # JSON이 유효하지 않으면 수정 시도
                        logger.warning(f"[JSON 파싱] ❌ JSON 파싱 실패: {str(json_err)}")
                        logger.warning(f"[JSON 파싱] 에러 위치: line {json_err.lineno}, col {json_err.colno}")
                        logger.warning(f"[JSON 파싱] 문제가 있는 부분: {json_str[max(0, json_err.pos-50):json_err.pos+50]}")
                        # 마지막 중괄호까지 찾기
                        brace_count = 0
                        last_valid_pos = -1
                        for i, char in enumerate(json_str):
                            if char == '{':
                                brace_count += 1
                            elif char == '}':
                                brace_count -= 1
                                if brace_count == 0:
                                    last_valid_pos = i + 1
                                    break
                        
                        if last_valid_pos > 0:
                            json_str = json_str[:last_valid_pos]
                            try:
                                analysis = json.loads(json_str)
                            except:
                                raise json_err
                        else:
                            raise json_err
                    risk_score = analysis.get("risk_score", 50)
                    risk_level = analysis.get("risk_level", "medium")
                    summary = analysis.get("summary", "")
                    
                    logger.info(f"[LLM 응답 파싱] ✅ JSON 파싱 성공: risk_score={risk_score}, risk_level={risk_level}, summary 길이={len(summary)}")
                    logger.info(f"[LLM 응답 파싱] issues 배열 길이: {len(analysis.get('issues', []))}")
                    
                    # [DEBUG] rawIssues 확인
                    raw_issues = analysis.get("issues", [])
                    logger.info(f"[DEBUG] rawIssues 개수: {len(raw_issues)}")
                    if not raw_issues:
                        logger.warning(f"[DEBUG] ⚠️ issues 배열이 비어있습니다!")
                        logger.warning(f"[DEBUG] analysis 키 목록: {list(analysis.keys())}")
                        logger.warning(f"[DEBUG] analysis 전체 내용 (처음 1000자): {str(analysis)[:1000]}")
                    else:
                        logger.info(f"[DEBUG] rawIssues[0] 샘플: {raw_issues[0]}")
                        logger.info(f"[DEBUG] rawIssues[0] 키 목록: {list(raw_issues[0].keys()) if isinstance(raw_issues[0], dict) else 'N/A'}")
                    
                    issues = []
                    for idx, issue_data in enumerate(raw_issues):
                        logger.debug(f"[DEBUG] issue[{idx}] 파싱 시작: {issue_data}, 타입: {type(issue_data)}")
                        
                        # issue_data가 dict가 아니면 건너뛰기
                        if not isinstance(issue_data, dict):
                            logger.warning(f"[DEBUG] issue[{idx}]가 dict가 아닙니다 (타입: {type(issue_data)}). 건너뜁니다.")
                            continue
                        
                        # 새로운 스키마: issue_id, clause_id, category, summary, reason 등
                        # 레거시 스키마: name, description, original_text 등
                        issue_id = issue_data.get("issue_id") or issue_data.get("name", f"issue-{idx+1}")
                        clause_id = issue_data.get("clause_id") or issue_data.get("clauseId")
                        category = issue_data.get("category", "unknown")
                        summary = issue_data.get("summary") or issue_data.get("description", "")
                        reason = issue_data.get("reason") or issue_data.get("rationale", "")
                        
                        # original_text는 clause_id 기반으로 나중에 채워지므로 여기서는 빈 문자열
                        # 레거시 호환성을 위해 original_text가 있으면 사용
                        original_text = issue_data.get("original_text", "")
                        
                        # description은 summary 또는 reason으로 대체
                        description = summary or reason
                        
                        # toxic_clause_detail 파싱
                        toxic_clause_detail = None
                        toxic_detail_data = issue_data.get("toxic_clause_detail")
                        if toxic_detail_data and isinstance(toxic_detail_data, dict):
                            try:
                                from models.schemas import ToxicClauseDetail
                                toxic_clause_detail = ToxicClauseDetail(
                                    clauseLocation=toxic_detail_data.get("clause_location", ""),
                                    contentSummary=toxic_detail_data.get("content_summary", ""),
                                    whyRisky=toxic_detail_data.get("why_risky", ""),
                                    realWorldProblems=toxic_detail_data.get("real_world_problems", ""),
                                    suggestedRevisionLight=toxic_detail_data.get("suggested_revision_light", ""),
                                    suggestedRevisionFormal=toxic_detail_data.get("suggested_revision_formal", ""),
                                )
                            except Exception as toxic_err:
                                logger.warning(f"[LLM 응답 파싱] issue[{idx}] toxic_clause_detail 변환 실패: {str(toxic_err)}")
                        
                        logger.debug(f"[DEBUG] issue[{idx}] 추출된 필드: issue_id={issue_id}, clause_id={clause_id}, category={category}, summary 길이={len(summary)}")
                        
                        # 계약서 텍스트에서 해당 조항 위치 찾기
                        # 새로운 파이프라인에서는 clause_id 기반으로 original_text를 나중에 채우므로
                        # 여기서는 start_index/end_index를 None으로 설정
                        start_index = None
                        end_index = None
                        
                        # 레거시 호환성: original_text가 있고 contract_text가 있으면 위치 찾기 시도
                        if contract_text and original_text and isinstance(original_text, str):
                            try:
                                # original_text를 사용하여 정확한 위치 찾기
                                start_index = contract_text.find(original_text)
                                if start_index >= 0:
                                    end_index = start_index + len(original_text)
                                else:
                                    # 정확히 일치하지 않으면 부분 매칭 시도
                                    if len(original_text) > 100:
                                        # 1. 처음 100자로 검색
                                        start_index = contract_text.find(original_text[:100])
                                        if start_index >= 0:
                                            end_index = start_index + len(original_text)
                                    if start_index is None and len(original_text) > 50:
                                        # 2. 처음 50자로 검색
                                        start_index = contract_text.find(original_text[:50])
                                        if start_index >= 0:
                                            # 문장 단위로 확장
                                            end_pos = min(start_index + len(original_text), len(contract_text))
                                            while end_pos < len(contract_text) and contract_text[end_pos] not in ['\n', '。', '.']:
                                                end_pos += 1
                                            end_index = end_pos
                                    if start_index is None:
                                        logger.debug(f"[LLM 응답 파싱] originalText를 계약서에서 찾을 수 없음 (clause_id 기반으로 나중에 채워짐): {original_text[:50] if isinstance(original_text, str) else original_text}...")
                            except Exception as find_err:
                                logger.warning(f"[LLM 응답 파싱] originalText 위치 찾기 실패: {str(find_err)}")
                                # 에러가 나도 계속 진행 (clause_id 기반으로 나중에 채워짐)
                        
                        try:
                            issue_obj = LegalIssue(
                                name=issue_id,  # issue_id를 name 필드에 저장 (레거시 호환)
                                description=description,  # summary 또는 reason을 description에 저장
                                severity=issue_data.get("severity", "medium"),
                                legal_basis=issue_data.get("legal_basis", []),
                                start_index=start_index,
                                end_index=end_index,
                                suggested_text=issue_data.get("suggested_revision") or issue_data.get("suggested_text"),
                                rationale=reason or issue_data.get("rationale"),
                                suggested_questions=issue_data.get("suggested_questions", []),
                                original_text=original_text,  # original_text 필드 추가
                                clause_id=clause_id,  # clause_id 필드 추가 (새 스키마)
                                category=category,  # category 필드 추가 (새 스키마)
                                summary=summary,  # summary 필드 추가 (새 스키마)
                                toxic_clause_detail=toxic_clause_detail,  # toxic_clause_detail 추가
                            )
                            issues.append(issue_obj)
                            logger.debug(f"[LLM 응답 파싱] issue[{len(issues)}]: name={issue_obj.name[:50]}, clause_id={clause_id}, severity={issue_obj.severity}, description 길이={len(description)}")
                        except Exception as issue_create_err:
                            logger.error(f"[LLM 응답 파싱] issue[{idx}] LegalIssue 생성 실패: {str(issue_create_err)}", exc_info=True)
                            # 개별 issue 생성 실패해도 계속 진행
                            continue
                    
                    # [DEBUG] normalizedDataIssues 확인 (이 단계에서는 아직 정규화 전이므로 rawIssues와 동일)
                    logger.info(f"[DEBUG] normalizedDataIssues (rawIssues와 동일): {len(issues)}개")
                    logger.info(f"[LLM 응답 파싱] 최종 이슈 개수: {len(issues)}개")
                    
                    # 각 이슈별로 legal 검색 수행 (이슈 중심 쿼리 사용)
                    logger.info(f"[법령 검색] 이슈별 legal 검색 시작: {len(issues)}개 이슈")
                    for issue in issues:
                        try:
                            # 이슈 기반 쿼리 생성
                            issue_dict = {
                                "original_text": issue.original_text or "",
                                "clause_text": issue.original_text or "",
                                "rationale": issue.rationale or issue.description or "",
                                "category": issue.category or "",
                                "summary": issue.summary or issue.description or "",
                            }
                            issue_query = self._build_query_from_issue(issue_dict)
                            
                            # 이슈별 legal 검색 (category 필터 적용, boilerplate 제외)
                            issue_legal_chunks = await self._search_legal_chunks(
                                query=issue_query,
                                top_k=5,  # 이슈별로 5개만
                                category=issue.category,  # category 필터 적용
                                ensure_diversity=False,  # 이슈별 검색이므로 다양성 확보 불필요
                            )
                            
                            # legal_basis를 이슈별 검색 결과로 업데이트
                            if issue_legal_chunks:
                                from models.schemas import LegalBasisItemV2
                                issue_legal_basis = []
                                for chunk in issue_legal_chunks:
                                    # file_path가 없으면 external_id로 생성
                                    file_path = chunk.file_path
                                    if not file_path and chunk.external_id:
                                        file_path = self._build_file_path(chunk.source_type, chunk.external_id)
                                    
                                    # reason 생성 (선택적, LLM 사용)
                                    reason = None
                                    try:
                                        reason = await self._build_reason(
                                            issue_summary=issue.summary or issue.description or "",
                                            clause_text=issue.original_text or "",
                                            basis_snippet=chunk.snippet,
                                        )
                                    except Exception as reason_err:
                                        logger.debug(f"[법령 검색] reason 생성 실패 (계속 진행): {str(reason_err)}")
                                    
                                    issue_legal_basis.append(
                                        LegalBasisItemV2(
                                            title=chunk.title,
                                            snippet=chunk.snippet,
                                            sourceType=chunk.source_type,
                                            status="unclear",  # LLM이 판단한 status가 있다면 사용
                                            filePath=file_path,  # 스토리지 키
                                            similarityScore=chunk.score,  # 벡터 유사도
                                            chunkIndex=chunk.chunk_index,  # 청크 인덱스
                                            externalId=chunk.external_id,  # external_id
                                            reason=reason,  # LLM으로 생성한 이유 설명
                                        )
                                    )
                                # 기존 legal_basis가 있으면 병합 (이슈별 검색 결과 우선)
                                if issue.legal_basis:
                                    # 기존 legal_basis가 문자열 배열이면 그대로 유지
                                    if isinstance(issue.legal_basis[0], str):
                                        issue.legal_basis = issue_legal_basis + issue.legal_basis
                                    else:
                                        issue.legal_basis = issue_legal_basis + list(issue.legal_basis)
                                else:
                                    issue.legal_basis = issue_legal_basis
                                
                                logger.debug(f"[법령 검색] 이슈 '{issue.name[:30]}' ({issue.category}): {len(issue_legal_chunks)}개 법령 검색됨")
                            else:
                                logger.debug(f"[법령 검색] 이슈 '{issue.name[:30]}' ({issue.category}): 법령 검색 결과 없음 (threshold 미만 또는 필터링됨)")
                        except Exception as issue_search_err:
                            logger.warning(f"[법령 검색] 이슈 '{issue.name[:30]}' legal 검색 실패: {str(issue_search_err)}")
                            # 이슈별 검색 실패해도 계속 진행
                            continue
                    
                    logger.info(f"[법령 검색] 이슈별 legal 검색 완료")
                    
                    recommendations = []
                    for rec_data in analysis.get("recommendations", []):
                        # rec_data가 dict가 아니면 건너뛰기
                        if not isinstance(rec_data, dict):
                            logger.warning(f"[LLM 응답 파싱] recommendation이 dict가 아닙니다 (타입: {type(rec_data)}). 건너뜁니다.")
                            continue
                        recommendations.append(LegalRecommendation(
                            title=rec_data.get("title", ""),
                            description=rec_data.get("description", ""),
                            steps=rec_data.get("steps", [])
                        ))
                    
                    # 새로운 독소조항 탐지 필드 파싱
                    one_line_summary = analysis.get("one_line_summary")
                    risk_traffic_light = analysis.get("risk_traffic_light")
                    top3_action_points = analysis.get("top3_action_points", [])
                    negotiation_questions = analysis.get("negotiation_questions", [])
                    
                    # risk_summary_table 파싱
                    risk_summary_table = []
                    for item_data in analysis.get("risk_summary_table", []):
                        if isinstance(item_data, dict):
                            from models.schemas import RiskSummaryItem
                            try:
                                risk_summary_table.append(RiskSummaryItem(
                                    item=item_data.get("item", ""),
                                    riskLevel=item_data.get("risk_level", "medium"),
                                    problemPoint=item_data.get("problem_point", ""),
                                    simpleExplanation=item_data.get("simple_explanation", ""),
                                    revisionKeyword=item_data.get("revision_keyword", ""),
                                ))
                            except Exception as risk_item_err:
                                logger.warning(f"[LLM 응답 파싱] risk_summary_table 항목 변환 실패: {str(risk_item_err)}")
                    
                    # toxic_clauses 파싱
                    toxic_clauses = []
                    for toxic_data in analysis.get("toxic_clauses", []):
                        if isinstance(toxic_data, dict):
                            from models.schemas import ToxicClauseDetail
                            try:
                                toxic_clauses.append(ToxicClauseDetail(
                                    clauseLocation=toxic_data.get("clause_location", ""),
                                    contentSummary=toxic_data.get("content_summary", ""),
                                    whyRisky=toxic_data.get("why_risky", ""),
                                    realWorldProblems=toxic_data.get("real_world_problems", ""),
                                    suggestedRevisionLight=toxic_data.get("suggested_revision_light", ""),
                                    suggestedRevisionFormal=toxic_data.get("suggested_revision_formal", ""),
                                ))
                            except Exception as toxic_err:
                                logger.warning(f"[LLM 응답 파싱] toxic_clause 변환 실패: {str(toxic_err)}")
                    
                    # ① 규칙 기반 강제 이슈 추가 (법정 수당 청구권 포기 패턴)
                    try:
                        self._ensure_wage_waiver_issue(
                            contract_text=contract_text or "",
                            issues=issues,
                        )
                    except Exception as ensure_err:
                        logger.warning(f"[후처리] 법정 수당 청구권 포기 이슈 보정 중 오류: {str(ensure_err)}", exc_info=True)
                    
                    result = LegalAnalysisResult(
                        risk_score=risk_score,
                        risk_level=risk_level,
                        summary=summary,
                        issues=issues,  # 빈 배열이어도 반환 (최소한 키는 채워줌)
                        recommendations=recommendations,
                        grounding=grounding_chunks,
                        one_line_summary=one_line_summary,
                        risk_traffic_light=risk_traffic_light,
                        top3_action_points=top3_action_points,
                        risk_summary_table=risk_summary_table,
                        toxic_clauses=toxic_clauses,
                        negotiation_questions=negotiation_questions,
                    )
                    
                    # [DEBUG] validIssues 확인 (이 단계에서는 issues와 동일)
                    logger.info(f"[DEBUG] validIssues (issues와 동일): {len(issues)}개")
                    logger.info(f"[LLM 응답 파싱] 최종 결과:")
                    logger.info(f"  - risk_score: {result.risk_score}, risk_level: {result.risk_level}")
                    logger.info(f"  - summary: {result.summary[:100]}..." if len(result.summary) > 100 else f"  - summary: {result.summary}")
                    logger.info(f"  - issues 개수: {len(result.issues)}")
                    logger.info(f"  - recommendations 개수: {len(result.recommendations)}")
                    logger.info(f"  - grounding_chunks 개수: {len(result.grounding)}")
                    for idx, issue in enumerate(result.issues[:3]):  # 처음 3개만 로깅
                        logger.info(f"  - issue[{idx}]: name={issue.name[:50]}, severity={issue.severity}, description 길이={len(issue.description)}")
                    
                    return result
                else:
                    # json_match가 None인 경우
                    raise ValueError("JSON 객체를 찾을 수 없습니다.")
            except Exception as e:
                logger.error(f"[ERROR] ❌ LLM 응답 파싱 실패: {str(e)}", exc_info=True)
                logger.error(f"[ERROR] 예외 타입: {type(e).__name__}")
                logger.error(f"[ERROR] LLM 응답 원문 전체 길이: {len(response_text) if response_text else 0}자")
                logger.error(f"[ERROR] LLM 응답 원문 (처음 2000자): {response_text[:2000] if response_text else 'None'}")
                if response_text and len(response_text) > 2000:
                    logger.error(f"[ERROR] LLM 응답 원문 (마지막 1000자): ...{response_text[-1000:]}")
                # JSON 객체가 있는지 확인
                if response_text:
                    json_objects = re.findall(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response_text, re.DOTALL)
                    logger.error(f"[ERROR] 발견된 JSON 객체 개수: {len(json_objects)}")
                    if json_objects:
                        logger.error(f"[ERROR] 첫 번째 JSON 객체 (처음 500자): {json_objects[0][:500]}")
                
                # 파싱 실패 시에도 최소한의 정보 추출 시도 (issues는 빈 배열로 반환)
                try:
                    # risk_score, risk_level, summary만이라도 추출 시도
                    risk_score_match = re.search(r'"risk_score"\s*:\s*(\d+)', response_text)
                    risk_level_match = re.search(r'"risk_level"\s*:\s*"([^"]+)"', response_text)
                    summary_match = re.search(r'"summary"\s*:\s*"([^"]+)"', response_text)
                    
                    risk_score = int(risk_score_match.group(1)) if risk_score_match else 50
                    risk_level = risk_level_match.group(1) if risk_level_match else "medium"
                    summary = summary_match.group(1) if summary_match else f"LLM 분석 중 오류가 발생했습니다. RAG 검색 결과는 {len(grounding_chunks)}개 발견되었습니다."
                    
                    # [DEBUG] 파싱 실패 시 issues는 빈 배열
                    logger.warning(f"[DEBUG] 파싱 실패로 인해 issues는 빈 배열로 반환됩니다.")
                    
                    # issues 배열에서 최소한의 정보 추출 시도
                    issues = []
                    issues_matches = re.finditer(r'\{\s*"name"\s*:\s*"([^"]+)"\s*,\s*"description"\s*:\s*"([^"]+)"\s*,\s*"severity"\s*:\s*"([^"]+)"', response_text)
                    for match in issues_matches:
                        issues.append(LegalIssue(
                            name=match.group(1),
                            description=match.group(2),
                            severity=match.group(3),
                            legal_basis=[],
                            suggested_text=None,
                            rationale=None,
                            suggested_questions=[]
                        ))
                    
                    if issues:
                        logger.info(f"파싱 실패했지만 {len(issues)}개 이슈를 정규식으로 추출했습니다.")
                    
                    return LegalAnalysisResult(
                        risk_score=risk_score,
                        risk_level=risk_level,
                        summary=summary,
                        issues=issues,
                        recommendations=[],
                        grounding=grounding_chunks,
                    )
                except Exception as fallback_error:
                    logger.error(f"Fallback 파싱도 실패: {str(fallback_error)}")
                    # 최종 fallback: 빈 이슈 리스트 반환
                    return LegalAnalysisResult(
                        risk_score=50,
                        risk_level="medium",
                        summary=f"LLM 분석 중 오류가 발생했습니다. RAG 검색 결과는 {len(grounding_chunks)}개 발견되었습니다.",
                        issues=[],
                        recommendations=[],
                        grounding=grounding_chunks,
                    )
        except Exception as e:
            logger.error(f"[LLM 호출] LLM 호출 실패: {str(e)}", exc_info=True)
            logger.error(f"[LLM 호출] 예외 타입: {type(e).__name__}")
        
        # LLM 호출 실패 시 빈 이슈 리스트 반환 (프론트엔드에서 에러 처리)
        logger.warning(f"[LLM 호출] LLM 호출 실패로 기본 응답 반환: RAG 검색 결과 {len(grounding_chunks)}개")
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
        contract_chunks: Optional[List[dict]] = None,
        legal_chunks: Optional[List[LegalGroundingChunk]] = None,
        grounding_chunks: Optional[List[LegalGroundingChunk]] = None,  # 레거시 호환
        selected_issue: Optional[dict] = None,
        analysis_summary: Optional[str] = None,
        risk_score: Optional[int] = None,
        total_issues: Optional[int] = None,
    ) -> str:
        """
        법률 상담 챗용 LLM 응답 생성 (Dual RAG 지원)
        
        Args:
            contract_chunks: 계약서 내부 청크 (새로운 방식)
            legal_chunks: 법령 청크 (새로운 방식)
            grounding_chunks: 법령 청크 (레거시 호환)
        """
        if self.generator.disable_llm:
            # LLM 비활성화 시 기본 응답
            total_chunks = len(legal_chunks or grounding_chunks or []) + len(contract_chunks or [])
            return f"LLM 분석이 비활성화되어 있습니다. RAG 검색 결과는 {total_chunks}개 발견되었습니다."
        
        # 컨텍스트 구성
        context_parts = []
        
        # 계약서 청크 추가
        if contract_chunks:
            context_parts.append("=== 계약서 내용 ===")
            for chunk in contract_chunks[:3]:  # 상위 3개만 사용
                article_num = chunk.get("article_number", "")
                content = chunk.get("content", "")[:500]  # 500자로 제한
                context_parts.append(f"제{article_num}조:\n{content}")
        
        # 법령 청크 추가
        chunks_to_use = legal_chunks or grounding_chunks or []
        if chunks_to_use:
            context_parts.append("\n=== 관련 법령/가이드라인 ===")
            for chunk in chunks_to_use[:5]:  # 상위 5개만 사용
                context_parts.append(
                    f"[{chunk.source_type}] {chunk.title}\n{chunk.snippet}"
                )
        context = "\n\n".join(context_parts)
        
        # 선택된 이슈 정보 추가
        issue_context = ""
        if selected_issue:
            # [DEBUG] legalBasis 타입 확인
            legal_basis_raw = selected_issue.get('legalBasis', [])
            logger.debug(f"[chat] selected_issue.legalBasis 타입: {[type(x).__name__ for x in legal_basis_raw]}")
            logger.debug(f"[chat] selected_issue.legalBasis 샘플: {legal_basis_raw[:2] if legal_basis_raw else '없음'}")
            
            # legalBasis 처리: string[] 또는 LegalBasisItemV2[] 형식 모두 지원
            legal_basis_list = legal_basis_raw
            legal_basis_texts = []
            for basis in legal_basis_list[:3]:
                try:
                    if isinstance(basis, dict):
                        # LegalBasisItemV2 형식: { title, snippet, sourceType }
                        title = basis.get('title', '')
                        snippet = basis.get('snippet', '')
                        legal_basis_texts.append(title or snippet or str(basis))
                    elif isinstance(basis, str):
                        # string 형식
                        legal_basis_texts.append(basis)
                    else:
                        # 기타 형식은 문자열로 변환
                        legal_basis_texts.append(str(basis))
                except Exception as basis_err:
                    logger.warning(f"[chat] legalBasis 항목 변환 실패: {str(basis_err)}, basis={basis}")
                    legal_basis_texts.append(str(basis) if basis else '알 수 없음')
            
            legal_basis_str = ', '.join(legal_basis_texts) if legal_basis_texts else '없음'
            logger.debug(f"[chat] legalBasis 변환 결과: {legal_basis_str}")
            
            issue_context = f"""
선택된 위험 조항 정보:
- 카테고리: {selected_issue.get('category', '알 수 없음')}
- 요약: {selected_issue.get('summary', '')}
- 위험도: {selected_issue.get('severity', 'medium')}
- 조항 내용: {selected_issue.get('originalText', '')[:500]}
- 관련 법령: {legal_basis_str}
"""
        
        # 분석 요약 정보 추가
        analysis_context = ""
        if analysis_summary:
            analysis_context = f"""
**분석 요약:**
{analysis_summary}
"""
        if risk_score is not None:
            analysis_context += f"\n**위험도 점수:** {risk_score}점"
        if total_issues is not None:
            analysis_context += f"\n**발견된 이슈 수:** {total_issues}개"
        
        # 프롬프트 템플릿 사용
        prompt = build_legal_chat_prompt(
            query=query,
            contract_chunks=contract_chunks,
            legal_chunks=chunks_to_use,
            selected_issue=selected_issue,
            analysis_summary=analysis_summary,
            risk_score=risk_score,
            total_issues=total_issues,
        )

        try:
            # Groq 사용 (우선)
            from config import settings
            if settings.use_groq:
                from llm_api import ask_groq_with_messages
                
                # 프롬프트를 메시지 형식으로 변환
                # prompt는 이미 전체 프롬프트이므로, system과 user로 분리
                messages = [
                    {"role": "system", "content": "너는 유능한 법률 AI야. 한국어로만 답변해주세요."},
                    {"role": "user", "content": prompt}
                ]
                
                response_text = ask_groq_with_messages(
                    messages=messages,
                    temperature=settings.llm_temperature,
                    model=settings.groq_model
                )
                
                # LLM 출력 로깅
                logger.info("=" * 80)
                logger.info("[LLM OUTPUT] Legal Chat Response")
                logger.info("=" * 80)
                logger.info(f"Response Length: {len(response_text)} characters")
                logger.info(f"Response Content:\n{response_text}")
                logger.info("=" * 80)
                
                # 답변에 전문가 상담 권장 문구 추가 (없는 경우)
                if "전문가 상담" not in response_text and "법률 자문" not in response_text:
                    response_text += "\n\n---\n\n**⚠️ 참고:** 이 답변은 정보 안내를 위한 것이며 법률 자문이 아닙니다. 중요한 사안은 전문 변호사나 노동위원회 등 전문 기관에 상담하시기 바랍니다."
                
                return response_text
            
            # Ollama 사용 (레거시)
            if self.generator.use_ollama:
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
                
                # LLM 출력 로깅
                logger.info("=" * 80)
                logger.info("[LLM OUTPUT] Legal Chat Response (Ollama)")
                logger.info("=" * 80)
                logger.info(f"Response Length: {len(response_text)} characters")
                logger.info(f"Response Content:\n{response_text}")
                logger.info("=" * 80)
                
                # 한국어가 포함되어 있는지 확인 (한글 유니코드 범위: AC00-D7A3)
                # 첫 200자 중 한국어가 없으면 재시도
                if response_text and len(response_text) > 0:
                    first_chars = response_text[:200]
                    has_korean = any(ord(c) >= 0xAC00 and ord(c) <= 0xD7A3 for c in first_chars)
                    
                    if not has_korean:
                        # 영어로 답변한 경우 더 강한 프롬프트로 재시도
                        retry_prompt = f"""당신은 한국어 전문가입니다. 다음 질문에 반드시 한국어로만 답변하세요. 영어를 절대 사용하지 마세요.
마크다운 형식으로 구조화하여 작성하세요.

{LEGAL_CHAT_SYSTEM_PROMPT}

**사용자 질문:**
{query}
{issue_context}
{analysis_context}

**관련 법령/가이드/케이스:**
{context}

**⚠️ 매우 중요:**
- 반드시 한국어로만 답변하세요.
- 영어 단어나 문장을 절대 사용하지 마세요.
- 모든 텍스트는 한국어로 작성해야 합니다.

다음 구조로 **한국어로만** 답변해주세요:

## 요약 결론
[한 문장으로 핵심 답변 (한국어)]

## 왜 위험한지 (법적 리스크)
[관련 법령을 근거로 위험성 설명 (한국어)]

## 실무 협상 포인트
[현실적인 협상 옵션과 대안 제시 (한국어)]

## 참고 법령/표준 계약
[관련 법령 요약 및 출처 (한국어)]
"""
                        response_text = llm.invoke(retry_prompt)
                        
                        # 재시도 후 LLM 출력 로깅
                        logger.info("=" * 80)
                        logger.info("[LLM OUTPUT] Legal Chat Response (Ollama - Retry)")
                        logger.info("=" * 80)
                        logger.info(f"Response Length: {len(response_text)} characters")
                        logger.info(f"Response Content:\n{response_text}")
                        logger.info("=" * 80)
                
                # 답변에 전문가 상담 권장 문구 추가 (없는 경우)
                if "전문가 상담" not in response_text and "법률 자문" not in response_text:
                    response_text += "\n\n---\n\n**⚠️ 참고:** 이 답변은 정보 안내를 위한 것이며 법률 자문이 아닙니다. 중요한 사안은 전문 변호사나 노동위원회 등 전문 기관에 상담하시기 바랍니다."
                
                return response_text
        except Exception as e:
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
        # logger를 명시적으로 참조 (스코프 문제 방지)
        _logger = logging.getLogger(__name__)
        
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
        
        # 프롬프트 템플릿 사용
        prompt = build_situation_analysis_prompt(
            situation_text=situation_text,
            category_hint=category_hint,
            grounding_chunks=grounding_chunks,
            employment_type=employment_type,
            work_period=work_period,
            weekly_hours=weekly_hours,
            is_probation=is_probation,
            social_insurance=social_insurance,
        )
        

        try:
            # Groq 사용 (우선)
            from config import settings
            import json
            import re
            
            if settings.use_groq:
                from llm_api import ask_groq_with_messages
                
                # 프롬프트를 메시지 형식으로 변환
                messages = [
                    {"role": "system", "content": "너는 유능한 법률 AI야. 한국어로만 답변해주세요. JSON 형식으로 응답하세요."},
                    {"role": "user", "content": prompt}
                ]
                
                try:
                    response_text = ask_groq_with_messages(
                        messages=messages,
                        temperature=settings.llm_temperature,
                        model=settings.groq_model
                    )
                    _logger.info(f"[Groq 호출 성공] 응답 길이: {len(response_text) if response_text else 0}자")
                except Exception as groq_error:
                    _logger.error(f"[Groq 호출 실패] {str(groq_error)}", exc_info=True)
                    raise  # 상위 except로 전달
            # Ollama 사용 (레거시)
            elif self.generator.use_ollama:
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
            else:
                # Groq와 Ollama 모두 사용 안 함
                raise ValueError("LLM이 설정되지 않았습니다. use_groq 또는 use_ollama를 True로 설정하세요.")
            
            # JSON 추출 및 파싱 (Groq와 Ollama 모두 공통)
            try:
                # 1. 외부 코드 블록 제거 (```json, ``` 등)
                response_clean = response_text.strip()
                if response_clean.startswith("```json"):
                    response_clean = response_clean[7:]
                elif response_clean.startswith("```"):
                    response_clean = response_clean[3:]
                if response_clean.endswith("```"):
                    response_clean = response_clean[:-3]
                response_clean = response_clean.strip()
                
                # 2. JSON 객체 추출
                json_match = re.search(r'\{.*\}', response_clean, re.DOTALL)
                if not json_match:
                    _logger.warning(f"LLM 응답에서 JSON 객체를 찾을 수 없습니다. 응답 (처음 500자): {response_clean[:500]}")
                    raise ValueError("LLM 응답에서 JSON 객체를 찾을 수 없습니다.")
                
                json_str = json_match.group()
                
                # JSON 파싱 전에 summary 필드의 마크다운 코드 블록 제거
                # summary 필드 전체를 찾아서 정리 (다중 라인, 이스케이프된 따옴표 포함)
                def clean_summary_field_in_json(json_str):
                    """summary 필드 내부의 마크다운 코드 블록과 특수 문자를 정리"""
                    try:
                        # Python 삼중 따옴표 제거 (""" ... """)
                        json_str = re.sub(r'"""\s*', '"', json_str)  # 시작 삼중 따옴표
                        json_str = re.sub(r'\s*"""', '"', json_str)  # 끝 삼중 따옴표
                        
                        # summary 필드의 시작 위치 찾기
                        summary_start = json_str.find('"summary"')
                        if summary_start == -1:
                            return json_str
                        
                        # summary 필드의 값 시작 위치 찾기 (콜론과 따옴표 이후)
                        value_start = json_str.find('"', summary_start + 9)  # "summary" 길이 + 1
                        if value_start == -1:
                            return json_str
                        
                        value_start += 1  # 따옴표 다음부터
                        
                        # 문자열 끝 찾기 (이스케이프된 따옴표 고려)
                        # 백슬래시가 홀수 개 연속으로 나오면 이스케이프된 따옴표
                        value_end = value_start
                        brace_count = 0  # 중첩된 객체/배열 추적
                        in_string = True
                        
                        while value_end < len(json_str):
                            char = json_str[value_end]
                            
                            # 이스케이프된 문자 건너뛰기
                            if char == '\\' and value_end + 1 < len(json_str):
                                value_end += 2
                                continue
                            
                            # 따옴표 처리
                            if char == '"':
                                # 앞의 백슬래시 개수 세기
                                backslash_count = 0
                                i = value_end - 1
                                while i >= value_start and json_str[i] == '\\':
                                    backslash_count += 1
                                    i -= 1
                                # 홀수 개의 백슬래시면 이스케이프된 따옴표, 짝수 개면 문자열 끝
                                if backslash_count % 2 == 0:
                                    break
                            
                            value_end += 1
                        
                        if value_end >= len(json_str):
                            # 문자열 끝을 찾지 못한 경우, 다음 큰따옴표까지 찾기
                            next_quote = json_str.find('"', value_start)
                            if next_quote > value_start:
                                value_end = next_quote
                            else:
                                return json_str
                        
                        # summary 필드 내용 추출
                        content = json_str[value_start:value_end]
                        
                        # 이스케이프된 문자를 실제 문자로 변환 (일시적)
                        content_decoded = content.replace('\\n', '\n').replace('\\r', '\r').replace('\\t', '\t').replace('\\"', '"').replace('\\\\', '\\')
                        
                        # Python 삼중 따옴표 제거 (""" ... """)
                        content_decoded = re.sub(r'"""\s*', '', content_decoded)
                        content_decoded = re.sub(r'\s*"""', '', content_decoded)
                        
                        # 마크다운 코드 블록 제거
                        content_decoded = re.sub(r'```markdown\s*', '', content_decoded, flags=re.IGNORECASE)
                        content_decoded = re.sub(r'```\s*', '', content_decoded, flags=re.MULTILINE)
                        
                        # 제어 문자를 JSON 이스케이프로 변환
                        result = []
                        for char in content_decoded:
                            if char == '\n':
                                result.append('\\n')
                            elif char == '\r':
                                result.append('\\r')
                            elif char == '\t':
                                result.append('\\t')
                            elif char == '"':
                                result.append('\\"')
                            elif char == '\\':
                                result.append('\\\\')
                            elif ord(char) < 32:
                                result.append(f'\\u{ord(char):04x}')
                            else:
                                result.append(char)
                        
                        # summary 필드 교체
                        cleaned_content = ''.join(result)
                        return json_str[:value_start] + cleaned_content + json_str[value_end:]
                    except Exception as e:
                        _logger.warning(f"summary 필드 정리 중 오류 발생: {str(e)}, 원본 JSON 사용")
                        return json_str
                
                # summary 필드 정리
                json_str_cleaned = clean_summary_field_in_json(json_str)
                
                # 제어 문자 처리 (전체 JSON 문자열)
                json_str_cleaned = json_str_cleaned.replace('\t', ' ').replace('\r', '')
                
                # JSON 파싱 시도
                try:
                    diagnosis = json.loads(json_str_cleaned)
                except json.JSONDecodeError as json_err:
                    # JSON 파싱 실패 시 더 강력한 정리 시도
                    _logger.warning(f"JSON 파싱 실패, 추가 정리 시도 중...: {str(json_err)}")
                    
                    # 중괄호 매칭으로 유효한 JSON 추출
                    brace_count = 0
                    last_valid_pos = -1
                    for i, char in enumerate(json_str_cleaned):
                        if char == '{':
                            brace_count += 1
                        elif char == '}':
                            brace_count -= 1
                            if brace_count == 0:
                                last_valid_pos = i + 1
                                break
                    
                    if last_valid_pos > 0:
                        json_str_cleaned = json_str_cleaned[:last_valid_pos]
                        try:
                            diagnosis = json.loads(json_str_cleaned)
                        except json.JSONDecodeError:
                            _logger.error(f"JSON 파싱 최종 실패: {str(json_err)}")
                            raise json_err
                    else:
                        raise json_err
                
                # summary 필드에서 마크다운 코드 블록 제거 (파싱 후)
                summary = diagnosis.get("summary", "상황을 분석했습니다.")
                if summary:
                    # ```markdown ... ``` 제거
                    summary = re.sub(r'```markdown\s*', '', summary, flags=re.IGNORECASE)
                    summary = re.sub(r'```\s*$', '', summary, flags=re.MULTILINE)
                    summary = summary.strip()
                
                # 응답 형식 변환
                return {
                    "classified_type": diagnosis.get("classified_type", category_hint),
                    "risk_score": diagnosis.get("risk_score", 50),
                    "summary": summary,
                    "criteria": diagnosis.get("criteria", []),
                    "action_plan": diagnosis.get("action_plan", {"steps": []}),
                    "scripts": diagnosis.get("scripts", {}),
                    "related_cases": [],  # 나중에 추가됨
                }
            except json.JSONDecodeError as e:
                _logger.error(f"LLM 진단 응답 JSON 파싱 실패: {str(e)}", exc_info=True)
                _logger.error(f"LLM 응답 원문 (처음 500자): {response_text[:500] if response_text else 'None'}")
                # JSON 파싱 실패 시 기본 응답 반환
                raise  # 상위 except로 전달하여 기본 응답 반환
            except Exception as e:
                _logger.error(f"LLM 진단 응답 파싱 실패: {str(e)}", exc_info=True)
                _logger.error(f"LLM 응답 원문 (처음 500자): {response_text[:500] if response_text else 'None'}")
                # 파싱 실패 시 기본 응답 반환
                raise  # 상위 except로 전달하여 기본 응답 반환
        except Exception as e:
            _logger.error(f"LLM 진단 응답 생성 실패: {str(e)}", exc_info=True)
            _logger.error(f"에러 타입: {type(e).__name__}, 에러 메시지: {str(e)}")
        
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

