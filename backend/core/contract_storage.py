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
        user_id: Optional[str] = None,
        contract_text: Optional[str] = None,  # 계약서 원문 텍스트
        clauses: Optional[List[Dict[str, Any]]] = None,  # 조항 목록
        highlighted_texts: Optional[List[Dict[str, Any]]] = None,  # 하이라이트된 텍스트
    ) -> str:
        """
        계약서 분석 결과를 DB에 저장
        
        Args:
            user_id: 사용자 ID (옵션)
        
        Returns:
            contract_analysis_id (UUID)
        """
        self._ensure_initialized()
        
        try:
            # file_name 필드는 NOT NULL 제약조건이 있으므로 반드시 값이 있어야 함
            # 우선순위: original_filename > title > 기본값
            file_name_value = None
            if original_filename and original_filename.strip():
                file_name_value = original_filename.strip()
            elif title and title.strip():
                file_name_value = title.strip()
            else:
                file_name_value = "unknown.pdf"  # 최후의 기본값
            
            # 로깅으로 실제 저장되는 값 확인
            logger.info(f"[DB 저장] file_name 설정: original_filename={original_filename}, title={title}, 최종 file_name={file_name_value}")
            
            # 1. contract_analyses 테이블에 헤더 저장
            analysis_data = {
                "doc_id": doc_id,
                "title": title,
                "file_name": original_filename or title,  # file_name은 NOT NULL이므로 original_filename 또는 title 사용
                "file_url": "",  # file_url은 NOT NULL이므로 빈 문자열로 설정 (필요시 나중에 업로드된 파일 URL로 업데이트)
                "original_filename": original_filename,
                "file_name": file_name_value,  # NOT NULL 제약조건 충족
                "doc_type": doc_type,
                "risk_score": int(round(float(risk_score))),  # DB는 integer 타입이므로 변환
                "risk_level": risk_level,
                "sections": sections,
                "summary": summary,
                "retrieved_contexts": retrieved_contexts,
            }
            
            # 계약서 원문 텍스트 저장
            if contract_text:
                analysis_data["contract_text"] = contract_text
            
            # 조항 목록 저장 (JSONB)
            if clauses:
                analysis_data["clauses"] = clauses
            
            # 하이라이트된 텍스트 저장 (JSONB)
            if highlighted_texts:
                analysis_data["highlighted_texts"] = highlighted_texts
            
            # user_id가 제공된 경우 추가
            if user_id:
                analysis_data["user_id"] = user_id
            
            result = self.sb.table("contract_analyses").insert(analysis_data).execute()
            
            if not result.data or len(result.data) == 0:
                raise ValueError("계약서 분석 결과 저장 실패")
            
            contract_analysis_id = result.data[0]["id"]
            
            # 2. contract_issues 테이블에 이슈들 저장 (테이블이 있는 경우에만)
            logger.info(f"[DB 저장] issues 배열 길이: {len(issues) if issues else 0}")
            if issues:
                try:
                    issues_data = []
                    for idx, issue in enumerate(issues):
                        issue_data = {
                            "contract_analysis_id": contract_analysis_id,
                            "issue_id": issue.get("id", f"issue-{idx+1}"),
                            "category": issue.get("category", ""),
                            "severity": issue.get("severity", "medium"),
                            "summary": issue.get("summary", ""),
                            "original_text": issue.get("originalText", ""),
                            "legal_basis": issue.get("legalBasis", []),
                            "explanation": issue.get("explanation", ""),
                            "suggested_revision": issue.get("suggestedRevision", ""),
                        }
                        issues_data.append(issue_data)
                        logger.debug(f"[DB 저장] issue[{idx}]: id={issue_data['issue_id']}, summary={issue_data['summary'][:50] if issue_data['summary'] else '(없음)'}")
                
                    if issues_data:
                        result_issues = self.sb.table("contract_issues").insert(issues_data).execute()
                        logger.info(f"[DB 저장] contract_issues 저장 완료: {len(issues_data)}개 이슈 저장됨")
                    else:
                        logger.warning(f"[DB 저장] issues_data가 비어있어 이슈를 저장하지 않음")
                except Exception as issues_error:
                    # contract_issues 테이블이 없으면 무시 (선택적 기능)
                    logger.warning(f"contract_issues 저장 실패 (계속 진행): {str(issues_error)}", exc_info=True)
            else:
                logger.warning(f"[DB 저장] issues 배열이 비어있어 이슈를 저장하지 않음")
            
            logger.info(f"계약서 분석 결과 저장 완료: doc_id={doc_id}, analysis_id={contract_analysis_id}")
            return contract_analysis_id
            
        except Exception as e:
            logger.error(f"계약서 분석 결과 저장 중 오류: {str(e)}", exc_info=True)
            raise
    
    async def get_contract_analysis(self, doc_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        계약서 분석 결과를 DB에서 조회
        
        Args:
            doc_id: 문서 ID
            user_id: 사용자 ID (옵션, 필터링용)
        
        Returns:
            계약서 분석 결과 딕셔너리 또는 None
        """
        self._ensure_initialized()
        
        try:
            # contract_analyses 테이블에서 조회
            # doc_id로 먼저 시도, 없으면 id로 시도 (기존 데이터 호환성)
            query = self.sb.table("contract_analyses").select("*").eq("doc_id", doc_id)
            
            # user_id가 제공된 경우 필터링
            if user_id:
                query = query.eq("user_id", user_id)
            
            result = query.execute()
            
            # doc_id로 찾지 못한 경우, id로 시도 (UUID 형식인 경우)
            if not result.data or len(result.data) == 0:
                try:
                    # UUID 형식인지 확인
                    import uuid
                    uuid.UUID(doc_id)
                    query = self.sb.table("contract_analyses").select("*").eq("id", doc_id)
                    if user_id:
                        query = query.eq("user_id", user_id)
                    result = query.execute()
                except (ValueError, AttributeError):
                    pass
            
            if not result.data or len(result.data) == 0:
                logger.warning(f"계약서 분석 결과를 찾을 수 없음: doc_id={doc_id}, user_id={user_id}")
                return None
            
            analysis = result.data[0]
            contract_analysis_id = analysis["id"]
            
            # contract_issues 테이블에서 이슈들 조회 (테이블이 있는 경우에만)
            issues = []
            try:
                issues_result = (
                    self.sb.table("contract_issues")
                    .select("*")
                    .eq("contract_analysis_id", contract_analysis_id)
                    .execute()
                )
                
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
            except Exception:
                # contract_issues 테이블이 없으면 빈 리스트로 설정
                issues = []
            
            # v2 응답 형식으로 변환
            # doc_id가 없으면 id를 사용 (기존 데이터 호환성)
            doc_id_value = analysis.get("doc_id") or str(analysis["id"])
            
            # clauses와 highlightedTexts 조회 (JSONB 컬럼)
            clauses_data = analysis.get("clauses", [])
            highlighted_texts_data = analysis.get("highlighted_texts", [])
            
            return {
                "docId": doc_id_value,
                "title": analysis.get("title", ""),
                "riskScore": float(analysis.get("risk_score", 0)),
                "riskLevel": analysis.get("risk_level", "medium"),
                "sections": analysis.get("sections", {}),
                "issues": issues,
                "summary": analysis.get("summary", ""),
                "retrievedContexts": analysis.get("retrieved_contexts", []),
                "contractText": analysis.get("contract_text", ""),  # 계약서 원문 텍스트
                "clauses": clauses_data if isinstance(clauses_data, list) else [],  # 조항 목록
                "highlightedTexts": highlighted_texts_data if isinstance(highlighted_texts_data, list) else [],  # 하이라이트된 텍스트
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
        user_id: Optional[str] = None,
    ) -> str:
        """
        상황 분석 결과를 DB에 저장
        
        Args:
            user_id: 사용자 ID (옵션)
        
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
                "risk_score": int(round(float(risk_score))),  # DB는 integer 타입이므로 변환
                "risk_level": risk_level,
                "analysis": analysis,
                "checklist": checklist,
                "related_cases": related_cases,
            }
            
            # user_id가 제공된 경우 추가
            if user_id:
                data["user_id"] = user_id
            
            result = self.sb.table("situation_analyses").insert(data).execute()
            
            if not result.data or len(result.data) == 0:
                raise ValueError("상황 분석 결과 저장 실패")
            
            situation_analysis_id = result.data[0]["id"]
            logger.info(f"상황 분석 결과 저장 완료: id={situation_analysis_id}")
            return situation_analysis_id
            
        except Exception as e:
            logger.error(f"상황 분석 결과 저장 중 오류: {str(e)}", exc_info=True)
            raise
    
    async def get_user_contract_analyses(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        사용자별 계약서 분석 히스토리 조회
        
        Args:
            user_id: 사용자 ID
            limit: 조회 개수
            offset: 오프셋
        
        Returns:
            계약서 분석 결과 리스트
        """
        self._ensure_initialized()
        
        try:
            result = (
                self.sb.table("contract_analyses")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(limit)
                .offset(offset)
                .execute()
            )
            
            analyses = []
            if result.data:
                for analysis in result.data:
                    contract_analysis_id = analysis["id"]
                    
                    # 이슈 개수 조회 (contract_issues 테이블이 있는 경우에만)
                    issue_count = 0
                    try:
                        issues_result = (
                            self.sb.table("contract_issues")
                            .select("id", count="exact")
                            .eq("contract_analysis_id", contract_analysis_id)
                            .execute()
                        )
                        issue_count = issues_result.count if hasattr(issues_result, 'count') else 0
                    except Exception:
                        # contract_issues 테이블이 없으면 0으로 설정
                        issue_count = 0
                    
                    # doc_id가 없으면 id를 사용 (기존 데이터 호환성)
                    doc_id_value = analysis.get("doc_id") or str(analysis["id"])
                    
                    analyses.append({
                        "id": analysis["id"],
                        "doc_id": doc_id_value,
                        "title": analysis.get("title", ""),
                        "original_filename": analysis.get("original_filename", ""),
                        "risk_score": float(analysis.get("risk_score", 0)),
                        "risk_level": analysis.get("risk_level", "medium"),
                        "summary": analysis.get("summary", ""),
                        "created_at": analysis.get("created_at", ""),
                        "issue_count": issue_count,
                    })
            
            return analyses
            
        except Exception as e:
            logger.error(f"사용자별 계약서 분석 조회 중 오류: {str(e)}", exc_info=True)
            return []

