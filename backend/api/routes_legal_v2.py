"""
Legal RAG API Routes v2
법률 리스크 분석 API 엔드포인트 (v2 - 가이드 스펙 준수)
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Query
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
)
from core.legal_rag_service import LegalRAGService
from core.document_processor_v2 import DocumentProcessor
from core.contract_storage import ContractStorageService

router = APIRouter(
    prefix="/api/v2/legal",
    tags=["legal-v2"],
)

# 서비스 인스턴스 (지연 초기화)
_service = None

def get_legal_service() -> LegalRAGService:
    """Legal RAG 서비스 인스턴스 가져오기 (지연 초기화)"""
    global _service
    if _service is None:
        _service = LegalRAGService()
    return _service

# 임시 파일 디렉토리
TEMP_DIR = "./data/temp"
os.makedirs(TEMP_DIR, exist_ok=True)

# 문서 프로세서
_processor = None

def get_processor() -> DocumentProcessor:
    """문서 프로세서 인스턴스 가져오기"""
    global _processor
    if _processor is None:
        _processor = DocumentProcessor()
    return _processor

# 계약서 분석 결과 저장소 (fallback용)
_contract_analyses = {}

# 저장 서비스 인스턴스
_storage_service = None

def get_storage_service() -> ContractStorageService:
    """계약서 저장 서비스 인스턴스 가져오기"""
    global _storage_service
    if _storage_service is None:
        _storage_service = ContractStorageService()
    return _storage_service

logger = logging.getLogger(__name__)


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
):
    """
    계약서 PDF/HWPX 업로드 → 위험 분석
    """
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
        
        if not extracted_text or extracted_text.strip() == "":
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
            issue_v2 = ContractIssueV2(
                id=f"issue-{idx+1}",
                category=issue.name.lower().replace(" ", "_"),
                severity=issue.severity,
                summary=issue.description,
                originalText="",  # 원본 텍스트는 별도로 추출 필요
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
        
        # 결과 저장 (DB에 저장)
        analysis_result = ContractAnalysisResponseV2(
            docId=doc_id,
            title=doc_title,
            riskScore=result.risk_score,
            riskLevel=result.risk_level,
            sections=sections,
            issues=issues,
            summary=result.summary,
            retrievedContexts=retrieved_contexts,
            createdAt=datetime.utcnow().isoformat() + "Z",
        )
        
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
            )
            logger.info(f"계약서 분석 결과 DB 저장 완료: doc_id={doc_id}")
        except Exception as save_error:
            logger.warning(f"DB 저장 실패, 메모리에만 저장: {str(save_error)}")
            # Fallback: 메모리에 저장
            _contract_analyses[doc_id] = analysis_result
        
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


@router.get("/contracts/{doc_id}", response_model=ContractAnalysisResponseV2)
async def get_contract_analysis(doc_id: str):
    """
    계약서 분석 결과 조회
    """
    # DB에서 조회 시도
    try:
        storage_service = get_storage_service()
        result = await storage_service.get_contract_analysis(doc_id)
        if result:
            return ContractAnalysisResponseV2(**result)
    except Exception as e:
        logger.warning(f"DB 조회 실패: {str(e)}")
    
    # Fallback: 메모리에서 조회
    if doc_id in _contract_analyses:
        return _contract_analyses[doc_id]
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="분석 결과를 찾을 수 없습니다.",
    )


@router.post("/analyze-situation", response_model=SituationResponseV2)
async def analyze_situation(payload: SituationRequestV2):
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

