"""
Legal RAG API Routes v2
법률 리스크 분석 API 엔드포인트 (v2 - 가이드 스펙 준수)
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Query, Header
from typing import Optional, List
import tempfile
import os
import logging
from pathlib import Path
from datetime import datetime
import uuid

from models.schemas import (
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

        # 법률 리스크 분석
        service = get_legal_service()
        result = await service.analyze_contract(
            extracted_text=extracted_text,
            description=None,
        )
        
        # v2 스펙에 맞춰 변환
        doc_id = str(uuid.uuid4())
        doc_title = title or file.filename or "계약서"
        
        # 영역별 점수 계산 (기존 result에서 추출 또는 기본값)
        sections = {
            "working_hours": 0,
            "wage": 0,
            "probation_termination": 0,
            "stock_option_ip": 0,
        }
        
        # issues 변환
        issues = []
        for idx, issue in enumerate(result.issues):
            # originalText 추출 시도
            original_text = issue.description[:200] if issue.description else ""  # 간단한 추출
            
            issue_v2 = ContractIssueV2(
                id=f"issue-{idx+1}",
                category=issue.name.lower().replace(" ", "_"),
                severity=issue.severity,
                summary=issue.description,
                originalText=original_text,
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
        except Exception as e:
            logger.warning(f"[계약서 분석] 조항 분류/하이라이트 실패: {str(e)}", exc_info=True)
            # 실패해도 계속 진행
        
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
            await storage_service.save_contract_analysis(
                doc_id=doc_id,
                title=doc_title,
                original_filename=file.filename,
                doc_type=doc_type,
                risk_score=result.risk_score,
                risk_level=result.risk_level,
                sections=sections,
                summary=result.summary,
                retrieved_contexts=retrieved_contexts,
                issues=[{
                    "id": issue.id,
                    "category": issue.category,
                    "severity": issue.severity,
                    "summary": issue.summary,
                    "originalText": issue.originalText,
                    "legalBasis": issue.legalBasis,
                    "explanation": issue.explanation,
                    "suggestedRevision": issue.suggestedRevision,
                } for issue in issues],
                user_id=x_user_id,
                contract_text=extracted_text,  # 계약서 원문 텍스트 저장
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
async def get_contract_analysis(doc_id: str):
    """
    계약서 분석 결과 조회
    """
    logger.info(f"[계약서 조회] doc_id={doc_id} 조회 시작")
    
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
        result = await storage_service.get_contract_analysis(doc_id)
        if result:
            contract_text_length = len(result.get('contractText', '')) if result.get('contractText') else 0
            logger.info(f"[계약서 조회] DB에서 찾음: doc_id={doc_id}, contractText 길이={contract_text_length}")
            return ContractAnalysisResponseV2(**result)
        else:
            logger.warning(f"[계약서 조회] DB에서 찾을 수 없음: doc_id={doc_id}")
    except Exception as e:
        logger.warning(f"[계약서 조회] DB 조회 실패: {str(e)}", exc_info=True)
    
    # Fallback: 메모리에서 조회
    if doc_id in _contract_analyses:
        result = _contract_analyses[doc_id]
        contract_text_length = len(result.contractText) if result.contractText else 0
        logger.info(f"[계약서 조회] 메모리에서 찾음: doc_id={doc_id}, contractText 길이={contract_text_length}")
        return result
    
    logger.error(f"[계약서 조회] 어디서도 찾을 수 없음: doc_id={doc_id}")
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
        
        # legalBasis 변환
        legal_basis = []
        for criteria in result.get("criteria", []):
            legal_basis.append({
                "title": criteria.get("name", ""),
                "snippet": criteria.get("reason", ""),
                "sourceType": "law",
            })
        
        # recommendations 추출
        recommendations = []
        action_plan = result.get("action_plan", {})
        for step in action_plan.get("steps", []):
            recommendations.extend(step.get("items", []))
        
        # checklist 추출
        checklist = []
        for step in action_plan.get("steps", []):
            checklist.extend(step.get("items", []))
        
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
        
        return SituationResponseV2(
            riskScore=float(result["risk_score"]),
            riskLevel=risk_level,
            tags=tags,
            analysis={
                "summary": result.get("summary", ""),
                "legalBasis": legal_basis,
                "recommendations": recommendations[:5],  # 최대 5개
            },
            checklist=checklist,
            relatedCases=related_cases,
        )
    except Exception as e:
        logger.error(f"상황 분석 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"상황 분석 중 오류가 발생했습니다: {str(e)}",
        )

