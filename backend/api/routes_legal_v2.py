"""
Legal RAG API Routes v2
법률 리스크 분석 API 엔드포인트 (v2 - 가이드 스펙 준수)
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Query, Header
from typing import Optional, List
import tempfile
import os
import logging
import asyncio
from pathlib import Path
from datetime import datetime
import uuid
import re

from models.schemas import (
    ScriptsV2,
    LegalSearchResponseV2,
    LegalSearchResult,
    SituationRequestV2,
    SituationResponseV2,
    ContractAnalysisResponseV2,
    ContractIssueV2,
    ClauseV2,
    HighlightedTextV2,
    ContractComparisonRequestV2,
    ContractComparisonResponseV2,
    ClauseRewriteRequestV2,
    ClauseRewriteResponseV2,
    LegalChatRequestV2,
    LegalChatResponseV2,
    UsedChunksV2,
    UsedChunkV2,
    ConversationRequestV2,
)
from core.legal_rag_service import LegalRAGService
from core.document_processor_v2 import DocumentProcessor
from core.contract_storage import ContractStorageService
from core.tools import ClauseLabelingTool, HighlightTool, RewriteTool
from core.dependencies import (
    get_legal_service_dep,
    get_processor_dep,
    get_storage_service_dep,
)
from core.logging_config import get_logger

router = APIRouter(
    prefix="/api/v2/legal",
    tags=["legal-v2"],
)

# 레거시 호환성을 위한 함수 (의존성 주입 패턴으로 마이그레이션 권장)
def get_legal_service() -> LegalRAGService:
    """Legal RAG 서비스 인스턴스 가져오기 (레거시 호환)"""
    from core.dependencies import get_legal_service as _get_legal_service
    return _get_legal_service()

def get_processor() -> DocumentProcessor:
    """문서 프로세서 인스턴스 가져오기 (레거시 호환)"""
    from core.dependencies import get_processor as _get_processor
    return _get_processor()

def get_storage_service() -> ContractStorageService:
    """계약서 저장 서비스 인스턴스 가져오기 (레거시 호환)"""
    from core.dependencies import get_storage_service as _get_storage_service
    return _get_storage_service()

# 임시 파일 디렉토리
TEMP_DIR = "./data/temp"
os.makedirs(TEMP_DIR, exist_ok=True)

# 계약서 분석 결과 저장소 (fallback용)
_contract_analyses = {}

logger = get_logger(__name__)


@router.get("/health")
async def health():
    """헬스 체크"""
    return {
        "status": "ok",
        "message": "Linkus Public RAG API is running"
    }


@router.get("/search", response_model=LegalSearchResponseV2)
async def search_legal(
    q: str = Query(..., description="검색어"),
    limit: int = Query(5, ge=1, le=50, description="결과 개수"),
    doc_type: Optional[str] = Query(None, description="문서 타입 (law, standard_contract, manual, case)"),
):
    """
    법령/표준계약/매뉴얼/케이스 RAG 검색
    """
    try:
        service = get_legal_service()
        
        # RAG 검색 수행
        chunks = await service._search_legal_chunks(query=q, top_k=limit)
        
        # 결과 변환 (LegalGroundingChunk 객체를 dict로 변환)
        results = []
        for chunk in chunks:
            result = LegalSearchResult(
                legal_document_id=chunk.source_id,
                section_title=None,  # LegalGroundingChunk에는 없음
                text=chunk.snippet,
                score=chunk.score,
                source=None,  # LegalGroundingChunk에는 없음
                doc_type=chunk.source_type,
                title=chunk.title,
            )
            results.append(result)
        
        return LegalSearchResponseV2(
            results=results,
            count=len(results),
            query=q,
        )
    except Exception as e:
        logger.error(f"법령 검색 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"법령 검색 중 오류가 발생했습니다: {str(e)}",
        )


@router.post("/analyze-contract", response_model=ContractAnalysisResponseV2)
async def analyze_contract(
    file: UploadFile = File(..., description="계약서 파일 (PDF/HWPX 등)"),
    title: Optional[str] = Form(None, description="문서 이름"),
    doc_type: Optional[str] = Form(None, description="문서 타입 (employment, freelance 등)"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id", description="사용자 ID"),
):
    """
    계약서 PDF/HWPX 업로드 → 위험 분석
    """
    logger.info(f"[계약서 분석] ========== v2 엔드포인트 호출 시작 ==========")
    logger.info(f"[계약서 분석] 파일명: {file.filename}, title: {title}, doc_type: {doc_type}, user_id: {x_user_id}")
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="파일이 필요합니다.")

    temp_path = None
    try:
        # 파일 임시 저장
        suffix = Path(file.filename).suffix if file.filename else ".tmp"
        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix,
            dir=TEMP_DIR
        )
        temp_path = temp_file.name
        
        content = await file.read()
        temp_file.write(content)
        temp_file.close()
        
        # 텍스트 추출
        processor = get_processor()
        extracted_text, _ = processor.process_file(temp_path, file_type=None)
        
        # extracted_text 추출 확인 로깅
        logger.info(f"[계약서 분석] 텍스트 추출 완료: extracted_text 길이={len(extracted_text) if extracted_text else 0}, 미리보기={extracted_text[:100] if extracted_text else '(없음)'}")
        
        if not extracted_text or extracted_text.strip() == "":
            logger.error(f"[계약서 분석] 텍스트 추출 실패: extracted_text가 비어있음")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="업로드된 파일에서 텍스트를 추출할 수 없습니다.",
            )

        # 계약서 조항 단위 청킹 및 벡터 저장 (Dual RAG를 위해)
        doc_id = str(uuid.uuid4())
        doc_title = title or file.filename or "계약서"
        
        # contract_chunks 저장을 먼저 완료한 후 분석 시작 (Race condition 해결)
        async def prepare_contract_chunks():
            """계약서 청킹 및 벡터 저장"""
            try:
                # 1. 조항 단위 청킹
                processor = get_processor()
                contract_chunks = processor.to_contract_chunks(
                    text=extracted_text,
                    base_meta={
                        "contract_id": doc_id,
                        "title": doc_title,
                        "filename": file.filename,
                    }
                )
                
                # 2. 임베딩 생성 (비동기로 실행하여 블로킹 방지)
                from core.generator_v2 import LLMGenerator
                generator = LLMGenerator()
                chunk_texts = [chunk.content for chunk in contract_chunks]
                embeddings = await asyncio.to_thread(generator.embed, chunk_texts)
                
                # 3. contract_chunks 테이블에 저장
                from core.supabase_vector_store import SupabaseVectorStore
                vector_store = SupabaseVectorStore()
                
                chunk_payload = []
                for idx, chunk in enumerate(contract_chunks):
                    chunk_payload.append({
                        "article_number": chunk.metadata.get("article_number", 0),
                        "paragraph_index": chunk.metadata.get("paragraph_index"),
                        "content": chunk.content,
                        "chunk_index": chunk.index,
                        "chunk_type": chunk.metadata.get("chunk_type", "article"),
                        "embedding": embeddings[idx],
                        "metadata": chunk.metadata,
                    })
                
                vector_store.bulk_upsert_contract_chunks(
                    contract_id=doc_id,
                    chunks=chunk_payload
                )
                logger.info(f"[계약서 분석] contract_chunks 저장 완료: {len(chunk_payload)}개 청크")
                return True
            except Exception as chunk_error:
                logger.warning(f"[계약서 분석] contract_chunks 저장 실패 (계속 진행): {str(chunk_error)}", exc_info=True)
                # 청크 저장 실패해도 분석은 계속 진행
                return False
        
        # contract_chunks 저장을 먼저 완료
        chunks_saved = await prepare_contract_chunks()
        
        # 저장 완료 후 분석 시작 (Dual RAG에서 contract_chunks 사용 가능)
        async def analyze_contract_risk():
            """법률 리스크 분석 (Dual RAG 지원)"""
            service = get_legal_service()
            # doc_id를 전달하여 contract_chunks도 검색
            # chunks_saved가 True면 contract_chunks가 저장되어 있으므로 검색 가능
            return await service.analyze_contract(
                extracted_text=extracted_text,
                description=None,
                doc_id=doc_id if chunks_saved else None,  # 저장 실패 시 None 전달
            )
        
        # 분석 실행
        result = await analyze_contract_risk()
        
        # result가 예외인 경우 처리 (이미 await 했으므로 예외는 자동으로 전파됨)
        if not result:
            logger.error(f"[계약서 분석] 분석 결과가 None입니다")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="계약서 분석에 실패했습니다.",
            )
        
        # 영역별 점수 계산 (기존 result에서 추출 또는 기본값)
        sections = {
            "working_hours": 0,
            "wage": 0,
            "probation_termination": 0,
            "stock_option_ip": 0,
        }
        
        # issues 변환 및 originalText 검증
        issues = []
        for idx, issue in enumerate(result.issues):
            # originalText 추출: LegalIssue의 original_text 필드 우선 사용
            original_text = ""
            if hasattr(issue, 'original_text') and issue.original_text:
                original_text = issue.original_text
            elif issue.description:
                # 하위 호환성: original_text가 없으면 description 사용
                original_text = issue.description[:200]
            
            # originalText 검증: 계약서 원문에 정확히 일치하는지 확인
            original_text_validated = original_text
            if original_text and extracted_text:
                # 정확히 일치하는지 확인
                if extracted_text.find(original_text) < 0:
                    # 정확히 일치하지 않으면 부분 매칭 시도
                    # originalText의 처음 50자로 검색
                    partial_match = extracted_text.find(original_text[:50])
                    if partial_match >= 0:
                        # 부분 매칭된 경우, 해당 위치의 텍스트 추출
                        # 문장 단위로 확장하여 추출
                        start_pos = partial_match
                        # 앞으로 문장 시작 찾기
                        while start_pos > 0 and extracted_text[start_pos] not in ['\n', '。', '.']:
                            start_pos -= 1
                        start_pos = max(0, start_pos + 1)
                        # 뒤로 문장 끝 찾기
                        end_pos = min(partial_match + len(original_text), len(extracted_text))
                        while end_pos < len(extracted_text) and extracted_text[end_pos] not in ['\n', '。', '.']:
                            end_pos += 1
                        original_text_validated = extracted_text[start_pos:end_pos].strip()
                        logger.info(f"[originalText 검증] issue-{idx+1}: 부분 매칭으로 수정됨 (길이: {len(original_text)} -> {len(original_text_validated)})")
                    else:
                        logger.warning(f"[originalText 검증] issue-{idx+1}: originalText를 계약서 원문에서 찾을 수 없음. originalText 길이={len(original_text)}")
                        # 검증 실패 시 원본 유지 (하위 호환성)
            
            issue_v2 = ContractIssueV2(
                id=f"issue-{idx+1}",
                category=issue.name.lower().replace(" ", "_"),
                severity=issue.severity,
                summary=issue.description,
                originalText=original_text_validated,  # 검증된 originalText 사용
                legalBasis=issue.legal_basis,
                explanation=issue.rationale or issue.description,
                suggestedRevision=issue.suggested_text or "",
            )
            issues.append(issue_v2)
        
        # retrievedContexts 변환
        retrieved_contexts = []
        for chunk in result.grounding:
            retrieved_contexts.append({
                "sourceType": chunk.source_type,
                "title": chunk.title,
                "snippet": chunk.snippet,
            })
        
        # 조항 자동 분류 및 하이라이트
        clauses = []
        highlighted_texts = []
        
        try:
            # 1. 조항 자동 분류
            labeling_tool = ClauseLabelingTool()
            labeling_result = await labeling_tool.execute(
                contract_text=extracted_text,
                issues=[issue.model_dump() for issue in issues]
            )
            
            clauses = [
                ClauseV2(
                    id=clause["id"],
                    title=clause["title"],
                    content=clause["content"],
                    articleNumber=clause.get("articleNumber"),
                    startIndex=clause.get("startIndex", 0),
                    endIndex=clause.get("endIndex", 0),
                    category=clause.get("category")
                )
                for clause in labeling_result.get("clauses", [])
            ]
            
            # issue에 clauseId 매핑
            issue_clause_mapping = labeling_result.get("issue_clause_mapping", {})
            for issue_v2 in issues:
                matched_clause_ids = issue_clause_mapping.get(issue_v2.id, [])
                if matched_clause_ids:
                    issue_v2.clauseId = matched_clause_ids[0]  # 첫 번째 매칭된 조항
            
            # 2. 위험 조항 하이라이트
            highlight_tool = HighlightTool()
            highlight_result = await highlight_tool.execute(
                contract_text=extracted_text,
                issues=[issue.model_dump() for issue in issues]
            )
            
            highlighted_texts = [
                HighlightedTextV2(
                    text=ht["text"],
                    startIndex=ht["startIndex"],
                    endIndex=ht["endIndex"],
                    severity=ht["severity"],
                    issueId=ht["issueId"]
                )
                for ht in highlight_result.get("highlightedTexts", [])
            ]
            
            # issue에 startIndex, endIndex 추가
            for issue_v2 in issues:
                for ht in highlighted_texts:
                    if ht.issueId == issue_v2.id:
                        issue_v2.startIndex = ht.startIndex
                        issue_v2.endIndex = ht.endIndex
                        break
            
            logger.info(f"[계약서 분석] 조항 분류 완료: {len(clauses)}개 조항, {len(highlighted_texts)}개 하이라이트")
            
            # 검증: clauses가 비어있으면 경고
            if not clauses:
                logger.warning(f"[계약서 분석] ⚠️ 조항이 추출되지 않았습니다. 계약서에 '제n조' 패턴이 없을 수 있습니다.")
            
            # 검증: highlightedTexts가 비어있으면 경고
            if not highlighted_texts and issues:
                logger.warning(f"[계약서 분석] ⚠️ 하이라이트된 텍스트가 없습니다. originalText 매칭 실패 가능성.")
                # originalText가 있는 issues 개수 확인
                issues_with_original = sum(1 for issue in issues if issue.originalText and issue.originalText.strip())
                logger.info(f"[계약서 분석] originalText가 있는 issues: {issues_with_original}/{len(issues)}개")
        except Exception as e:
            logger.warning(f"[계약서 분석] 조항 분류/하이라이트 실패: {str(e)}", exc_info=True)
            # 실패해도 계속 진행 (clauses와 highlightedTexts는 빈 배열로 유지)
        
        # 결과 저장 (DB에 저장)
        # contractText 설정 전 확인
        logger.info(f"[계약서 분석] ContractAnalysisResponseV2 생성 전: extracted_text 길이={len(extracted_text) if extracted_text else 0}, extracted_text 타입={type(extracted_text)}")
        
        # extracted_text가 None이면 빈 문자열로 변환
        contract_text_value = extracted_text if extracted_text else ""
        logger.info(f"[계약서 분석] contractText 값 설정: 길이={len(contract_text_value)}, 비어있음={not contract_text_value or contract_text_value.strip() == ''}")
        
        analysis_result = ContractAnalysisResponseV2(
            docId=doc_id,
            title=doc_title,
            riskScore=result.risk_score,
            riskLevel=result.risk_level,
            sections=sections,
            issues=issues,
            summary=result.summary,
            retrievedContexts=retrieved_contexts,
            contractText=contract_text_value,  # 계약서 원문 텍스트 포함 (None이면 빈 문자열)
            clauses=clauses,  # 조항 목록
            highlightedTexts=highlighted_texts,  # 하이라이트된 텍스트
            createdAt=datetime.utcnow().isoformat() + "Z",
        )
        
        # 생성 후 확인
        logger.info(f"[계약서 분석] ContractAnalysisResponseV2 생성 후: contractText 길이={len(analysis_result.contractText) if analysis_result.contractText else 0}, contractText 존재={bool(analysis_result.contractText)}")
        logger.info(f"[계약서 분석] 응답 생성 완료: docId={doc_id}, title={doc_title}, issues={len(issues)}개")
        
        # DB에 저장 시도
        try:
            storage_service = get_storage_service()
            # file_name 필드를 확실하게 채우기 위해 우선순위 적용
            # original_filename은 file.filename 또는 doc_title 사용
            original_filename_for_db = file.filename if file.filename and file.filename.strip() else doc_title
            
            logger.info(f"[계약서 분석] DB 저장 시도: doc_id={doc_id}, title={doc_title}, original_filename={original_filename_for_db}, file.filename={file.filename}")
            
            # DB 저장 전 데이터 요약 로깅
            issues_for_db = [{
                "id": issue.id,
                "category": issue.category,
                "severity": issue.severity,
                "summary": issue.summary,
                "originalText": issue.originalText,
                "legalBasis": issue.legalBasis,
                "explanation": issue.explanation,
                "suggestedRevision": issue.suggestedRevision,
            } for issue in issues]
            
            logger.info(f"[DB 저장] 저장할 데이터 요약:")
            logger.info(f"  - doc_id: {doc_id}")
            logger.info(f"  - title: {doc_title}")
            logger.info(f"  - risk_score: {result.risk_score}, risk_level: {result.risk_level}")
            logger.info(f"  - summary 길이: {len(result.summary)}")
            logger.info(f"  - issues 개수: {len(issues_for_db)}")
            logger.info(f"  - contract_text 길이: {len(extracted_text) if extracted_text else 0}")
            logger.info(f"  - retrieved_contexts 개수: {len(retrieved_contexts)}")
            for idx, issue in enumerate(issues_for_db[:3]):  # 처음 3개만 로깅
                logger.info(f"  - issue[{idx}]: id={issue['id']}, category={issue['category']}, severity={issue['severity']}, summary={issue['summary'][:50]}")
            
            # clauses와 highlightedTexts를 DB 저장 형식으로 변환
            clauses_for_db = [
                {
                    "id": clause.id,
                    "title": clause.title,
                    "content": clause.content,
                    "articleNumber": clause.articleNumber,
                    "startIndex": clause.startIndex,
                    "endIndex": clause.endIndex,
                    "category": clause.category,
                }
                for clause in clauses
            ] if clauses else []
            
            highlighted_texts_for_db = [
                {
                    "text": ht.text,
                    "startIndex": ht.startIndex,
                    "endIndex": ht.endIndex,
                    "severity": ht.severity,
                    "issueId": ht.issueId,
                }
                for ht in highlighted_texts
            ] if highlighted_texts else []
            
            await storage_service.save_contract_analysis(
                doc_id=doc_id,
                title=doc_title,
                original_filename=original_filename_for_db,  # file.filename이 None이면 doc_title 사용
                doc_type=doc_type,
                risk_score=result.risk_score,
                risk_level=result.risk_level,
                sections=sections,
                summary=result.summary,
                retrieved_contexts=retrieved_contexts,
                issues=issues_for_db,
                user_id=x_user_id,
                contract_text=extracted_text,  # 계약서 원문 텍스트 저장
                clauses=clauses_for_db,  # 조항 목록 저장
                highlighted_texts=highlighted_texts_for_db,  # 하이라이트된 텍스트 저장
            )
            logger.info(f"[계약서 분석] DB 저장 완료: doc_id={doc_id}")
        except Exception as save_error:
            logger.warning(f"[계약서 분석] DB 저장 실패, 메모리에만 저장: {str(save_error)}", exc_info=True)
            # Fallback: 메모리에 저장
            _contract_analyses[doc_id] = analysis_result
            logger.info(f"[계약서 분석] 메모리에 저장 완료: doc_id={doc_id}, contractText 길이={len(analysis_result.contractText) if analysis_result.contractText else 0}")
        
        # 응답 직렬화 확인
        response_dict = analysis_result.model_dump()
        contract_text_length = len(response_dict.get('contractText', '')) if response_dict.get('contractText') else 0
        
        # 상세 로깅
        logger.info(f"[계약서 분석] 응답 생성 완료:")
        logger.info(f"  - docId: {response_dict.get('docId')}")
        logger.info(f"  - contractText 길이: {contract_text_length}")
        logger.info(f"  - contractText 존재: {bool(response_dict.get('contractText'))}")
        logger.info(f"  - contractText 미리보기: {response_dict.get('contractText', '')[:100] if response_dict.get('contractText') else '(없음)'}")
        logger.info(f"  - 응답 키: {list(response_dict.keys())}")
        logger.info(f"  - issues 개수: {len(response_dict.get('issues', []))}")
        logger.info(f"  - retrievedContexts 개수: {len(response_dict.get('retrievedContexts', []))}")
        
        # contractText가 없으면 경고
        if not response_dict.get('contractText') or contract_text_length == 0:
            logger.warning(f"[계약서 분석] ⚠️ contractText가 응답에 없습니다! extracted_text 길이: {len(extracted_text) if extracted_text else 0}")
        
        # v2 형식 검증: 필수 필드 확인
        required_fields = ['docId', 'title', 'riskScore', 'riskLevel', 'sections', 'issues', 'summary', 'retrievedContexts', 'contractText', 'createdAt']
        missing_fields = [field for field in required_fields if field not in response_dict]
        if missing_fields:
            logger.error(f"[계약서 분석] ❌ v2 형식 필수 필드 누락: {missing_fields}")
        else:
            logger.info(f"[계약서 분석] ✅ v2 형식 검증 통과")
        
        return analysis_result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"계약서 분석 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"계약서 분석 중 오류가 발생했습니다: {str(e)}",
        )
    finally:
        # 임시 파일 삭제
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)


@router.post("/compare-contracts", response_model=ContractComparisonResponseV2)
async def compare_contracts(
    request: ContractComparisonRequestV2,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id", description="사용자 ID"),
):
    """
    계약서 버전 비교 (이전 vs 새 계약서)
    """
    try:
        storage_service = get_storage_service()
        
        # 이전 계약서 조회
        old_contract = await storage_service.get_contract_analysis(request.oldContractId)
        if not old_contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"이전 계약서를 찾을 수 없습니다: {request.oldContractId}"
            )
        
        # 새 계약서 조회
        new_contract = await storage_service.get_contract_analysis(request.newContractId)
        if not new_contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"새 계약서를 찾을 수 없습니다: {request.newContractId}"
            )
        
        # 변경된 조항 찾기
        changed_clauses = []
        old_clauses = {clause.get("id"): clause for clause in old_contract.get("clauses", [])}
        new_clauses = {clause.get("id"): clause for clause in new_contract.get("clauses", [])}
        
        # 새로 추가된 조항
        for clause_id, clause in new_clauses.items():
            if clause_id not in old_clauses:
                changed_clauses.append({
                    "type": "added",
                    "clauseId": clause_id,
                    "title": clause.get("title"),
                    "content": clause.get("content")
                })
        
        # 삭제된 조항
        for clause_id, clause in old_clauses.items():
            if clause_id not in new_clauses:
                changed_clauses.append({
                    "type": "removed",
                    "clauseId": clause_id,
                    "title": clause.get("title"),
                    "content": clause.get("content")
                })
        
        # 수정된 조항
        for clause_id in old_clauses.keys() & new_clauses.keys():
            old_clause = old_clauses[clause_id]
            new_clause = new_clauses[clause_id]
            if old_clause.get("content") != new_clause.get("content"):
                changed_clauses.append({
                    "type": "modified",
                    "clauseId": clause_id,
                    "title": new_clause.get("title"),
                    "oldContent": old_clause.get("content"),
                    "newContent": new_clause.get("content")
                })
        
        # 위험도 변화
        risk_change = {
            "oldRiskScore": old_contract.get("riskScore", 0),
            "newRiskScore": new_contract.get("riskScore", 0),
            "oldRiskLevel": old_contract.get("riskLevel", "medium"),
            "newRiskLevel": new_contract.get("riskLevel", "medium"),
            "riskScoreDelta": new_contract.get("riskScore", 0) - old_contract.get("riskScore", 0)
        }
        
        # 비교 요약 생성
        summary = f"총 {len(changed_clauses)}개 조항이 변경되었습니다. "
        summary += f"위험도: {risk_change['oldRiskScore']:.1f} → {risk_change['newRiskScore']:.1f} "
        summary += f"({risk_change['riskScoreDelta']:+.1f})"
        
        # 응답 생성
        old_contract_response = ContractAnalysisResponseV2(**old_contract)
        new_contract_response = ContractAnalysisResponseV2(**new_contract)
        
        return ContractComparisonResponseV2(
            oldContract=old_contract_response,
            newContract=new_contract_response,
            changedClauses=changed_clauses,
            riskChange=risk_change,
            summary=summary
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"계약서 비교 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"계약서 비교 중 오류가 발생했습니다: {str(e)}",
        )


@router.post("/rewrite-clause", response_model=ClauseRewriteResponseV2)
async def rewrite_clause(
    request: ClauseRewriteRequestV2,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id", description="사용자 ID"),
):
    """
    조항 자동 리라이트 (위험 조항을 안전한 문구로 수정)
    """
    try:
        rewrite_tool = RewriteTool()
        
        # issue 정보 가져오기 (있는 경우)
        legal_basis = []
        if request.issueId:
            storage_service = get_storage_service()
            # issue 정보 조회 (간단한 구현)
            # 실제로는 issue를 조회해서 legalBasis를 가져와야 함
            pass
        
        # 리라이트 실행
        result = await rewrite_tool.execute(
            original_text=request.originalText,
            issue_id=request.issueId,
            legal_basis=legal_basis,
            contract_type="employment"  # 기본값
        )
        
        return ClauseRewriteResponseV2(
            originalText=result["originalText"],
            rewrittenText=result["rewrittenText"],
            explanation=result["explanation"],
            legalBasis=result["legalBasis"]
        )
        
    except Exception as e:
        logger.error(f"조항 리라이트 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"조항 리라이트 중 오류가 발생했습니다: {str(e)}",
        )


@router.get("/contracts/history", response_model=List[dict])
async def get_contract_history(
    x_user_id: str = Header(..., alias="X-User-Id", description="사용자 ID"),
    limit: int = Query(20, ge=1, le=100, description="조회 개수"),
    offset: int = Query(0, ge=0, description="오프셋"),
):
    """
    사용자별 계약서 분석 히스토리 조회
    """
    try:
        storage_service = get_storage_service()
        history = await storage_service.get_user_contract_analyses(
            user_id=x_user_id,
            limit=limit,
            offset=offset,
        )
        return history
    except Exception as e:
        logger.error(f"히스토리 조회 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"히스토리 조회 중 오류가 발생했습니다: {str(e)}",
        )


@router.get("/contracts/{doc_id}", response_model=ContractAnalysisResponseV2)
async def get_contract_analysis(
    doc_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id", description="사용자 ID"),
):
    """
    계약서 분석 결과 조회
    """
    logger.info(f"[계약서 조회] doc_id={doc_id}, user_id={x_user_id} 조회 시작")
    
    # 임시 ID인 경우 메모리에서만 조회
    if doc_id.startswith("temp-"):
        logger.warning(f"[계약서 조회] 임시 ID 감지: {doc_id}, 메모리에서만 조회")
        if doc_id in _contract_analyses:
            result = _contract_analyses[doc_id]
            contract_text_length = len(result.contractText) if result.contractText else 0
            logger.info(f"[계약서 조회] 메모리에서 찾음: doc_id={doc_id}, contractText 길이={contract_text_length}")
            return result
        else:
            logger.warning(f"[계약서 조회] 메모리에서도 찾을 수 없음: {doc_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"임시 분석 결과를 찾을 수 없습니다. (doc_id: {doc_id})",
            )
    
    # DB에서 조회 시도
    try:
        storage_service = get_storage_service()
        result = await storage_service.get_contract_analysis(doc_id, user_id=x_user_id)
        if result:
            contract_text_length = len(result.get('contractText', '')) if result.get('contractText') else 0
            logger.info(f"[계약서 조회] DB에서 찾음: doc_id={doc_id}, user_id={x_user_id}, contractText 길이={contract_text_length}")
            return ContractAnalysisResponseV2(**result)
        else:
            logger.warning(f"[계약서 조회] DB에서 찾을 수 없음: doc_id={doc_id}, user_id={x_user_id}")
    except Exception as e:
        logger.error(f"[계약서 조회] DB 조회 실패: {str(e)}", exc_info=True)
    
    # Fallback: 메모리에서 조회
    if doc_id in _contract_analyses:
        result = _contract_analyses[doc_id]
        contract_text_length = len(result.contractText) if result.contractText else 0
        logger.info(f"[계약서 조회] 메모리에서 찾음: doc_id={doc_id}, contractText 길이={contract_text_length}")
        return result
    
    logger.error(f"[계약서 조회] 어디서도 찾을 수 없음: doc_id={doc_id}, user_id={x_user_id}")
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"분석 결과를 찾을 수 없습니다. (doc_id: {doc_id})",
    )


@router.post("/analyze-situation", response_model=SituationResponseV2)
async def analyze_situation(
    payload: SituationRequestV2,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id", description="사용자 ID"),
):
    """
    텍스트 기반 상황 설명 + 메타 정보 → 맞춤형 상담 분석
    """
    # logger를 명시적으로 참조 (스코프 문제 방지)
    import logging
    _logger = logging.getLogger(__name__)
    
    try:
        service = get_legal_service()
        
        # 기존 analyze_situation_detailed 사용
        result = await service.analyze_situation_detailed(
            category_hint=payload.category or "unknown",
            situation_text=payload.situation,
            summary=None,
            details=None,
            employment_type=payload.employmentType,
            work_period=payload.workPeriod,
            weekly_hours=None,
            is_probation=None,
            social_insurance=", ".join(payload.socialInsurance) if payload.socialInsurance else None,
        )
        
        # v2 스펙에 맞춰 변환
        risk_level = "low"
        if result["risk_score"] >= 70:
            risk_level = "high"
        elif result["risk_score"] >= 40:
            risk_level = "medium"
        
        # legalBasis 변환 (status 필드 보존)
        legal_basis = []
        for criteria in result.get("criteria", []):
            legal_basis.append({
                "title": criteria.get("name", ""),
                "snippet": criteria.get("reason", ""),
                "sourceType": "law",
                "status": criteria.get("status", "likely"),  # status 필드 보존
            })
        
        # action_plan.steps에서 checklist와 recommendations 구분
        action_plan = result.get("action_plan", {})
        steps = action_plan.get("steps", [])
        
        # action_plan이 비어있으면 summary에서 "지금 당장 할 수 있는 행동" 섹션 파싱
        if len(steps) == 0:
            summary_text = result.get("summary", "")
            # "## 🎯 지금 당장 할 수 있는 행동" 섹션 추출
            action_section_match = re.search(
                r'##\s*🎯\s*지금\s*당장\s*할\s*수\s*있는\s*행동\s*\n(.*?)(?=##|$)',
                summary_text,
                re.DOTALL | re.IGNORECASE
            )
            if action_section_match:
                action_content = action_section_match.group(1).strip()
                # "- " 또는 "* "로 시작하는 리스트 항목 추출
                action_items = re.findall(r'[-*]\s*(.+?)(?=\n[-*]|\n##|$)', action_content, re.MULTILINE)
                action_items = [item.strip() for item in action_items if item.strip()]
                if action_items:
                    # 첫 번째 step으로 추가
                    steps = [{
                        "title": "즉시 조치",
                        "items": action_items[:5]  # 최대 5개
                    }]
        
        # checklist: 첫 번째 step의 items만 사용
        checklist = []
        if len(steps) > 0:
            checklist = steps[0].get("items", [])
        
        # recommendations: 나머지 steps의 items 병합
        recommendations = []
        for step in steps[1:]:
            recommendations.extend(step.get("items", []))
        
        # scripts 변환
        scripts_data = result.get("scripts", {})
        scripts = None
        if scripts_data:
            scripts = ScriptsV2(
                toCompany=scripts_data.get("to_company"),
                toAdvisor=scripts_data.get("to_advisor"),
            )
        
        # relatedCases 변환
        related_cases = []
        for case in result.get("related_cases", []):
            related_cases.append({
                "id": case.get("id", ""),
                "title": case.get("title", ""),
                "summary": case.get("summary", ""),
                "link": None,
            })
        
        # tags 추출 (classified_type 기반)
        tags = [result.get("classified_type", "unknown")]
        
        # DB에 저장 (비동기, 실패해도 응답은 반환)
        situation_analysis_id = None
        try:
            storage_service = get_storage_service()
            analysis_summary = result.get("summary", "")
            situation_analysis_id = await storage_service.save_situation_analysis(
                situation=payload.situation,
                category=payload.category,
                employment_type=payload.employmentType,
                company_size=payload.companySize,
                work_period=payload.workPeriod,
                has_written_contract=payload.hasWrittenContract,
                social_insurance=payload.socialInsurance,
                risk_score=float(result["risk_score"]),
                risk_level=risk_level,
                analysis={
                    "summary": analysis_summary,
                    "legalBasis": legal_basis,
                    "recommendations": recommendations,
                },
                checklist=checklist,
                related_cases=related_cases,
                user_id=x_user_id,
                # situation_reports 통합 필드
                question=payload.situation,  # question은 situation과 동일
                answer=analysis_summary,  # answer는 analysis.summary
                details=None,  # details는 현재 제공되지 않음
                category_hint=payload.category,  # category_hint는 category와 동일
                classified_type=result.get("classified_type", "unknown"),
            )
            _logger.info(f"상황 분석 결과 DB 저장 완료 (id: {situation_analysis_id}, user_id: {x_user_id})")
            
            # 대화 메시지는 트리거가 자동으로 저장하므로 수동 저장 불필요
            # 트리거가 answer 필드를 sequence_number 0으로 저장함
            # 사용자 입력 메시지는 프론트엔드에서 저장하거나 별도로 저장할 수 있음
            # 여기서는 트리거에 의존하므로 수동 저장하지 않음
        except Exception as save_error:
            # DB 저장 실패해도 분석 결과는 반환
            _logger.warning(f"상황 분석 결과 DB 저장 실패 (응답은 정상 반환): {str(save_error)}")
        
        # v2 응답 생성 (DB 저장 후 ID 포함)
        response = SituationResponseV2(
            id=situation_analysis_id,  # DB 저장 후 ID 포함
            riskScore=float(result["risk_score"]),
            riskLevel=risk_level,
            tags=tags,
            analysis={
                "summary": result.get("summary", ""),
                "legalBasis": legal_basis,
                "recommendations": recommendations[:5],  # 최대 5개
            },
            checklist=checklist,
            scripts=scripts,
            relatedCases=related_cases,
        )
        
        return response
    except Exception as e:
        _logger.error(f"상황 분석 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"상황 분석 중 오류가 발생했습니다: {str(e)}",
        )


@router.get("/situations/history", response_model=List[dict])
async def get_situation_history(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id", description="사용자 ID"),
    limit: int = Query(20, ge=1, le=100, description="조회 개수"),
    offset: int = Query(0, ge=0, description="오프셋"),
):
    """
    사용자별 상황 분석 히스토리 조회
    """
    try:
        if not x_user_id:
            logger.warning("사용자 ID가 제공되지 않아 빈 배열 반환")
            return []
        
        storage_service = get_storage_service()
        history = await storage_service.get_user_situation_analyses(
            user_id=x_user_id,
            limit=limit,
            offset=offset,
        )
        return history
    except Exception as e:
        logger.error(f"상황 분석 히스토리 조회 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"히스토리 조회 중 오류가 발생했습니다: {str(e)}",
        )


@router.get("/situations/{situation_id}", response_model=dict)
async def get_situation_analysis(
    situation_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id", description="사용자 ID"),
):
    """
    특정 상황 분석 결과 조회
    """
    try:
        storage_service = get_storage_service()
        analysis = await storage_service.get_situation_analysis(situation_id, x_user_id)
        if not analysis:
            raise HTTPException(status_code=404, detail="분석 결과를 찾을 수 없습니다.")
        return analysis
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"상황 분석 조회 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"분석 결과 조회 중 오류가 발생했습니다: {str(e)}",
        )


@router.post("/conversations", response_model=dict)
async def save_conversation(
    payload: ConversationRequestV2,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id", description="사용자 ID"),
):
    """
    상황 분석 대화 메시지 저장
    """
    try:
        storage_service = get_storage_service()
        conversation_id = await storage_service.save_situation_conversation(
            report_id=payload.report_id,
            message=payload.message,
            sender_type=payload.sender_type,
            sequence_number=payload.sequence_number,
            user_id=x_user_id,
            metadata=payload.metadata,
        )
        return {"id": conversation_id, "success": True}
    except Exception as e:
        logger.error(f"대화 메시지 저장 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"대화 메시지 저장 중 오류가 발생했습니다: {str(e)}",
        )


@router.get("/conversations/{report_id}", response_model=List[dict])
async def get_conversations(
    report_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id", description="사용자 ID"),
):
    """
    상황 분석 대화 메시지 조회
    """
    try:
        storage_service = get_storage_service()
        conversations = await storage_service.get_situation_conversations(
            report_id=report_id,
            user_id=x_user_id,
        )
        return conversations
    except Exception as e:
        logger.error(f"대화 메시지 조회 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"대화 메시지 조회 중 오류가 발생했습니다: {str(e)}",
        )


@router.post("/chat", response_model=LegalChatResponseV2)
async def chat_with_contract(
    payload: LegalChatRequestV2,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id", description="사용자 ID"),
):
    """
    계약서 기반 법률 상담 챗 (Dual RAG 지원)
    
    - 계약서 내부 청크 검색 (contract_chunks)
    - 외부 법령 청크 검색 (legal_chunks)
    - 선택된 이슈 기반 boosting
    - 구조화된 프롬프트로 답변 생성
    """
    try:
        service = get_legal_service()
        
        # selected_issue 변환 (프론트엔드 형식 → 백엔드 형식)
        selected_issue = None
        if payload.selectedIssue:
            selected_issue = {
                "category": payload.selectedIssue.get("category"),
                "summary": payload.selectedIssue.get("summary"),
                "severity": payload.selectedIssue.get("severity"),
                "originalText": payload.selectedIssue.get("originalText"),
                "legalBasis": payload.selectedIssue.get("legalBasis", []),
            }
        
        # Dual RAG 검색 및 답변 생성
        result = await service.chat_with_context(
            query=payload.query,
            doc_ids=payload.docIds or [],
            selected_issue_id=payload.selectedIssueId,
            selected_issue=selected_issue,
            analysis_summary=payload.analysisSummary,
            risk_score=payload.riskScore,
            total_issues=payload.totalIssues,
            top_k=payload.topK or 8,
        )
        
        # used_chunks 변환 (프론트엔드 형식)
        used_chunks_v2 = None
        if result.get("used_chunks"):
            used_chunks = result["used_chunks"]
            used_chunks_v2 = UsedChunksV2(
                contract=[
                    UsedChunkV2(
                        id=chunk.get("id"),
                        source_type="contract",
                        title=f"제{chunk.get('article_number', '')}조",
                        content=chunk.get("content", "")[:500],
                        score=chunk.get("score"),
                    )
                    for chunk in used_chunks.get("contract", [])
                ],
                legal=[
                    UsedChunkV2(
                        id=chunk.get("id"),
                        source_type=chunk.get("source_type", "law"),
                        title=chunk.get("title", ""),
                        content=chunk.get("content", "")[:500],
                        score=chunk.get("score"),
                    )
                    for chunk in used_chunks.get("legal", [])
                ],
            )
        
        return LegalChatResponseV2(
            answer=result.get("answer", ""),
            markdown=result.get("markdown", result.get("answer", "")),
            query=result.get("query", payload.query),
            usedChunks=used_chunks_v2,
        )
    except Exception as e:
        logger.error(f"법률 상담 챗 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"법률 상담 챗 중 오류가 발생했습니다: {str(e)}",
        )

