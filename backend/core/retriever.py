# backend/core/retriever.py

from typing import List, Dict
from .vector_store import VectorStoreManager


class HybridRetriever:
    """검색 로직 통합"""
    
    def __init__(self, vector_store: VectorStoreManager):
        self.vector_store = vector_store
    
    def retrieve_for_analysis(self, current_text: str, announcement_id: str) -> Dict:
        """
        공고 분석을 위한 컨텍스트 수집
        - 현재 공고문
        - 유사 과거 공고 (벤치마킹용)
        """
        # 현재 공고
        current_docs = self.vector_store.get_announcement_by_id(announcement_id)
        
        # 유사 과거 공고 검색 (키워드 추출해서 검색)
        similar_docs = self.vector_store.search_similar_announcements(
            query=current_text[:1000],  # 앞부분만 사용
            k=3
        )
        
        # 중복 제거 (같은 announcement_id 제외)
        similar_docs = [
            doc for doc in similar_docs 
            if doc.metadata.get('announcement_id') != announcement_id
        ]
        
        return {
            "current": current_text,
            "similar_past": [doc.page_content for doc in similar_docs[:2]]
        }
    
    def retrieve_for_matching(self, requirements: Dict) -> List:
        """
        팀 매칭을 위한 검색
        """
        # 요구사항을 자연어 쿼리로 변환
        query_parts = []
        
        if requirements.get('essential_skills'):
            query_parts.append(f"필수기술: {', '.join(requirements['essential_skills'])}")
        
        if requirements.get('preferred_skills'):
            query_parts.append(f"우대기술: {', '.join(requirements['preferred_skills'])}")
        
        if requirements.get('budget_range'):
            query_parts.append(f"예산규모: {requirements['budget_range']}")
        
        query = " ".join(query_parts) if query_parts else "프로젝트 팀"
        
        # 벡터 검색
        matched_teams = self.vector_store.search_matching_teams(
            requirements=query,
            k=5
        )
        
        return matched_teams
    
    def retrieve_similar_estimates(self, project_type: str, budget_range: str, k: int = 3):
        """
        과거 견적 검색 (견적 생성 참고용)
        """
        query = f"{project_type} {budget_range}"
        
        similar_estimates = self.vector_store.estimates.similarity_search(
            query=query,
            k=k
        )
        
        return similar_estimates

