# backend/core/orchestrator.py

from typing import Dict, List
from datetime import datetime
import uuid

from .document_processor import DocumentProcessor
from .vector_store import VectorStoreManager
from .retriever import HybridRetriever
from .generator import LLMGenerator
from models.schemas import AnnouncementAnalysis, MatchedTeam


class RAGOrchestrator:
    """RAG 파이프라인 전체 조율"""
    
    def __init__(self):
        self.doc_processor = DocumentProcessor()
        self.vector_store = VectorStoreManager()
        self.retriever = HybridRetriever(self.vector_store)
        self.generator = LLMGenerator()
    
    async def process_announcement(self, pdf_path: str) -> Dict:
        """
        공고 분석 전체 플로우
        1. PDF 처리
        2. 벡터 저장
        3. 유사 공고 검색
        4. LLM 분석
        """
        try:
            # 1. 문서 처리
            chunks, full_text = self.doc_processor.process_pdf(pdf_path)
            
            # 2. 구조화된 정보 추출 (정규식)
            structured_info = self.doc_processor.extract_structured_info(full_text)
            
            # 3. 공고 ID 생성
            announcement_id = f"anno_{uuid.uuid4().hex[:8]}"
            
            # 4. 벡터 저장
            self.vector_store.add_announcement(
                chunks=chunks,
                announcement_id=announcement_id,
                metadata={
                    "created_at": datetime.now().isoformat(),
                    **structured_info
                }
            )
            
            # 5. 검색 컨텍스트 수집
            context = self.retriever.retrieve_for_analysis(
                current_text=full_text,
                announcement_id=announcement_id
            )
            
            # 6. LLM 분석
            analysis = self.generator.analyze_announcement(context)
            
            return {
                "announcement_id": announcement_id,
                "analysis": analysis.dict(),
                "structured_info": structured_info,
                "full_text_preview": full_text[:500] + "..."
            }
            
        except Exception as e:
            raise Exception(f"공고 처리 실패: {str(e)}")
    
    async def match_teams(self, announcement_id: str) -> List[Dict]:
        """
        팀 매칭 플로우
        1. 공고 분석 결과 조회
        2. 요구사항 기반 팀 검색
        3. 각 팀별 추천 사유 생성
        """
        try:
            # 1. 공고 정보 조회
            announcement_data = self.vector_store.get_announcement_by_id(announcement_id)
            
            if not announcement_data or 'metadatas' not in announcement_data:
                raise Exception("공고를 찾을 수 없습니다")
            
            # 첫 번째 청크에서 메타데이터 가져오기
            metadata = announcement_data.get('metadatas', [{}])[0] if announcement_data.get('metadatas') else {}
            
            # 요구사항 구성
            requirements = {
                "essential_skills": metadata.get('essential_skills', []),
                "preferred_skills": metadata.get('preferred_skills', []),
                "budget_range": metadata.get('예산', '미정'),
                "duration": metadata.get('기간', '미정')
            }
            
            # 2. 팀 검색
            matched_teams_raw = self.retriever.retrieve_for_matching(requirements)
            
            # 3. 각 팀별 추천 사유 생성
            results = []
            for doc, score in matched_teams_raw:
                team_data = doc.metadata
                
                rationale = self.generator.generate_matching_rationale(
                    team_data=team_data,
                    requirements=requirements
                )
                
                results.append({
                    "team_id": team_data.get('team_id'),
                    "name": team_data.get('name'),
                    "match_score": round((1 - score) * 100, 1),  # 유사도를 점수로 변환
                    "rationale": rationale,
                    "skills": team_data.get('skills', []),
                    "rating": team_data.get('rating', 0),
                    "experience_years": team_data.get('experience_years', 0)
                })
            
            return results
            
        except Exception as e:
            raise Exception(f"팀 매칭 실패: {str(e)}")
    
    async def generate_estimate(self, announcement_id: str, team_id: str) -> str:
        """
        견적서 생성 플로우
        1. 공고 정보 조회
        2. 팀 정보 조회
        3. 유사 과거 견적 검색
        4. LLM 견적서 생성
        """
        try:
            # 1. 공고 정보
            announcement_data = self.vector_store.get_announcement_by_id(announcement_id)
            if not announcement_data:
                raise Exception("공고를 찾을 수 없습니다")
            
            project_info = announcement_data.get('metadatas', [{}])[0] if announcement_data.get('metadatas') else {}
            
            # 2. 팀 정보 (벡터 스토어에서 조회)
            team_results = self.vector_store.teams.get(
                ids=[team_id]
            )
            
            if not team_results or 'metadatas' not in team_results:
                raise Exception("팀을 찾을 수 없습니다")
            
            team_info = team_results['metadatas'][0]
            
            # 3. 유사 과거 견적 검색
            past_estimates = self.retriever.retrieve_similar_estimates(
                project_type=project_info.get('project_name', ''),
                budget_range=project_info.get('예산', ''),
                k=2
            )
            
            # 4. 견적서 생성
            estimate = self.generator.generate_estimate_draft(
                project_info=project_info,
                team_info=team_info,
                past_estimates=[doc.page_content for doc in past_estimates]
            )
            
            return estimate
            
        except Exception as e:
            raise Exception(f"견적서 생성 실패: {str(e)}")

