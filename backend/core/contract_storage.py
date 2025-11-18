"""
계약서 분석 결과 Supabase 저장 서비스
"""

from typing import Dict, Any, Optional, List
import os
from supabase import create_client, Client
from config import settings
import logging

logger = logging.getLogger(__name__)


class ContractStorageService:
    """계약서 분석 결과를 Supabase에 저장/조회하는 서비스"""
    
    def __init__(self):
        self.sb: Optional[Client] = None
        self._initialized = False
    
    def _ensure_initialized(self):
        """Supabase 클라이언트 지연 초기화"""
        if self._initialized:
            return
        
        supabase_url = os.getenv("SUPABASE_URL") or settings.supabase_url
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or settings.supabase_service_role_key
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다")
        
        try:
            self.sb = create_client(supabase_url, supabase_key)
            self._initialized = True
        except Exception as e:
            logger.error(f"Supabase 클라이언트 초기화 실패: {str(e)}")
            raise ValueError(f"Supabase 클라이언트 초기화 실패: {str(e)}")
    
    async def save_contract_analysis(
        self,
        doc_id: str,
        title: str,
        original_filename: Optional[str],
        doc_type: Optional[str],
        risk_score: float,
        risk_level: str,
        sections: Dict[str, int],
        summary: str,
        retrieved_contexts: List[Dict[str, Any]],
        issues: List[Dict[str, Any]],
    ) -> str:
        """
        계약서 분석 결과를 DB에 저장
        
        Returns:
            contract_analysis_id (UUID)
        """
        self._ensure_initialized()
        
        try:
            # 1. contract_analyses 테이블에 헤더 저장
            analysis_data = {
                "doc_id": doc_id,
                "title": title,
                "original_filename": original_filename,
                "doc_type": doc_type,
                "risk_score": float(risk_score),
                "risk_level": risk_level,
                "sections": sections,
                "summary": summary,
                "retrieved_contexts": retrieved_contexts,
            }
            
            result = self.sb.table("contract_analyses").insert(analysis_data).execute()
            
            if not result.data or len(result.data) == 0:
                raise ValueError("계약서 분석 결과 저장 실패")
            
            contract_analysis_id = result.data[0]["id"]
            
            # 2. contract_issues 테이블에 이슈들 저장
            if issues:
                issues_data = []
                for issue in issues:
                    issues_data.append({
                        "contract_analysis_id": contract_analysis_id,
                        "issue_id": issue.get("id", ""),
                        "category": issue.get("category", ""),
                        "severity": issue.get("severity", "medium"),
                        "summary": issue.get("summary", ""),
                        "original_text": issue.get("originalText", ""),
                        "legal_basis": issue.get("legalBasis", []),
                        "explanation": issue.get("explanation", ""),
                        "suggested_revision": issue.get("suggestedRevision", ""),
                    })
                
                if issues_data:
                    self.sb.table("contract_issues").insert(issues_data).execute()
            
            logger.info(f"계약서 분석 결과 저장 완료: doc_id={doc_id}, analysis_id={contract_analysis_id}")
            return contract_analysis_id
            
        except Exception as e:
            logger.error(f"계약서 분석 결과 저장 중 오류: {str(e)}", exc_info=True)
            raise
    
    async def get_contract_analysis(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        계약서 분석 결과를 DB에서 조회
        
        Returns:
            계약서 분석 결과 딕셔너리 또는 None
        """
        self._ensure_initialized()
        
        try:
            # contract_analyses 테이블에서 조회
            result = self.sb.table("contract_analyses").select("*").eq("doc_id", doc_id).execute()
            
            if not result.data or len(result.data) == 0:
                return None
            
            analysis = result.data[0]
            contract_analysis_id = analysis["id"]
            
            # contract_issues 테이블에서 이슈들 조회
            issues_result = (
                self.sb.table("contract_issues")
                .select("*")
                .eq("contract_analysis_id", contract_analysis_id)
                .execute()
            )
            
            issues = []
            if issues_result.data:
                for issue in issues_result.data:
                    issues.append({
                        "id": issue.get("issue_id", ""),
                        "category": issue.get("category", ""),
                        "severity": issue.get("severity", "medium"),
                        "summary": issue.get("summary", ""),
                        "originalText": issue.get("original_text", ""),
                        "legalBasis": issue.get("legal_basis", []),
                        "explanation": issue.get("explanation", ""),
                        "suggestedRevision": issue.get("suggested_revision", ""),
                    })
            
            # v2 응답 형식으로 변환
            return {
                "docId": analysis["doc_id"],
                "title": analysis.get("title", ""),
                "riskScore": float(analysis.get("risk_score", 0)),
                "riskLevel": analysis.get("risk_level", "medium"),
                "sections": analysis.get("sections", {}),
                "issues": issues,
                "summary": analysis.get("summary", ""),
                "retrievedContexts": analysis.get("retrieved_contexts", []),
                "createdAt": analysis.get("created_at", ""),
            }
            
        except Exception as e:
            logger.error(f"계약서 분석 결과 조회 중 오류: {str(e)}", exc_info=True)
            return None
    
    async def save_situation_analysis(
        self,
        situation: str,
        category: Optional[str],
        employment_type: Optional[str],
        company_size: Optional[str],
        work_period: Optional[str],
        has_written_contract: Optional[bool],
        social_insurance: Optional[List[str]],
        risk_score: float,
        risk_level: str,
        analysis: Dict[str, Any],
        checklist: List[str],
        related_cases: List[Dict[str, Any]],
    ) -> str:
        """
        상황 분석 결과를 DB에 저장
        
        Returns:
            situation_analysis_id (UUID)
        """
        self._ensure_initialized()
        
        try:
            data = {
                "situation": situation,
                "category": category,
                "employment_type": employment_type,
                "company_size": company_size,
                "work_period": work_period,
                "has_written_contract": has_written_contract,
                "social_insurance": social_insurance or [],
                "risk_score": float(risk_score),
                "risk_level": risk_level,
                "analysis": analysis,
                "checklist": checklist,
                "related_cases": related_cases,
            }
            
            result = self.sb.table("situation_analyses").insert(data).execute()
            
            if not result.data or len(result.data) == 0:
                raise ValueError("상황 분석 결과 저장 실패")
            
            situation_analysis_id = result.data[0]["id"]
            logger.info(f"상황 분석 결과 저장 완료: id={situation_analysis_id}")
            return situation_analysis_id
            
        except Exception as e:
            logger.error(f"상황 분석 결과 저장 중 오류: {str(e)}", exc_info=True)
            raise

