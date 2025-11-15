# backend/core/bidding_rag.py

"""
Backend RAG - 복잡한 분석 & 생성 작업 전담

역할:
1. 공고문 전체 분석 (요구사항 추출, 기술 스택 분석)
2. 과거 유사 입찰 검색 (ChromaDB)
3. 팀 매칭 알고리즘
4. 견적서 자동 생성
"""

from typing import Dict, List, Any, Optional
from langchain_core.prompts import ChatPromptTemplate
from .vector_store import VectorStoreManager
from .document_processor import DocumentProcessor
from models.schemas import AnnouncementAnalysis, MatchedTeam
from config import settings

# langchain_openai는 조건부로만 import (Ollama 사용 시 불필요)
# OpenAIEmbeddings는 사용하지 않으므로 제거


class BiddingRAG:
    def __init__(self):
        self.vector_store = VectorStoreManager()
        
        # LLM 초기화 (Ollama만 사용 - 해커톤 모드)
        try:
            # langchain-ollama 우선 사용 (deprecated 경고 없음)
            try:
                from langchain_ollama import OllamaLLM
                print(f"[연결] Ollama LLM: {settings.ollama_base_url} (모델: {settings.ollama_model})")
                self.llm = OllamaLLM(
                    base_url=settings.ollama_base_url,
                    model=settings.ollama_model,
                    temperature=settings.llm_temperature
                )
                print("[완료] Ollama LLM 연결 완료 (langchain-ollama)")
            except ImportError:
                # 대안: langchain-community 사용 (deprecated)
                from langchain_community.llms import Ollama
                print(f"[경고] langchain-ollama를 사용할 수 없습니다. deprecated된 langchain_community.llms.Ollama를 사용합니다.")
                print(f"[연결] Ollama LLM: {settings.ollama_base_url} (모델: {settings.ollama_model})")
                self.llm = Ollama(
                    base_url=settings.ollama_base_url,
                    model=settings.ollama_model,
                    temperature=settings.llm_temperature
                )
                print("[완료] Ollama LLM 연결 완료")
        except Exception as e:
            raise ValueError(f"Ollama 연결 실패: {str(e)}\n[팁] Ollama가 실행 중인지 확인하세요: ollama serve")
        
        # embeddings는 VectorStoreManager에서 이미 설정됨
        self.embeddings = self.vector_store.embeddings
        self.doc_processor = DocumentProcessor()
    
    async def analyze_announcement(self, doc_id: str) -> Dict[str, Any]:
        """
        공고문 심층 분석
        
        Returns:
            AnalysisResult with requirements, similar_bids, risk_analysis
        """
        try:
            # 1. 전체 문서 로드
            doc_data = await self.load_document(doc_id)
            if not doc_data:
                raise Exception(f"문서를 찾을 수 없습니다: {doc_id}")
            
            # 2. 요구사항 추출
            requirements = await self.extract_requirements(doc_data['content'])
            
            # 3. 유사 과거 입찰 검색 (ChromaDB)
            similar_bids = await self.search_similar_bids(
                requirements,
                top_k=5
            )
            
            # 4. 난이도 & 리스크 분석
            risk_analysis = await self.analyze_risks(
                requirements,
                similar_bids
            )
            
            # 5. 예상 공수 계산
            estimated_effort = self.calculate_effort(requirements)
            
            return {
                'requirements': requirements,
                'similar_bids': similar_bids,
                'risk_analysis': risk_analysis,
                'estimated_effort': estimated_effort,
                'difficulty_score': risk_analysis.get('difficulty', 0.5),
            }
            
        except Exception as e:
            raise Exception(f"공고 분석 실패: {str(e)}")
    
    async def load_document(self, doc_id: str) -> Optional[Dict]:
        """문서 로드"""
        # Supabase 또는 ChromaDB에서 문서 로드
        # 실제 구현 필요
        return None
    
    async def extract_requirements(self, content: str) -> Dict[str, Any]:
        """요구사항 추출"""
        prompt = f"""
다음 공고문에서 요구사항을 추출하세요:

{content[:5000]}

다음 형식으로 응답:
- 필수 기술 스택
- 우대 기술 스택
- 예상 인력 규모
- 프로젝트 난이도
- 주요 기능 요구사항
"""
        
        response = self.llm.invoke(prompt)
        # Ollama는 문자열 반환, ChatOpenAI는 AIMessage 반환
        if hasattr(response, 'content'):
            response_text = response.content
        else:
            response_text = str(response)
        # 파싱 로직 필요
        return {
            'essential_skills': [],
            'preferred_skills': [],
            'team_size': 0,
            'difficulty': 0.5,
        }
    
    async def search_similar_bids(
        self, 
        requirements: Dict, 
        top_k: int = 5
    ) -> List[Dict]:
        """유사 과거 입찰 검색"""
        query = f"""
        기술: {', '.join(requirements.get('essential_skills', []))}
        예산: {requirements.get('budget_range', '미정')}
        """
        
        results = self.vector_store.search_similar_announcements(
            query=query,
            k=top_k
        )
        
        return [
            {
                'announcement_id': doc.metadata.get('announcement_id'),
                'similarity': 0.8,  # 실제 유사도 계산 필요
                'budget': doc.metadata.get('budget'),
            }
            for doc in results
        ]
    
    async def analyze_risks(
        self, 
        requirements: Dict, 
        similar_bids: List[Dict]
    ) -> Dict[str, Any]:
        """리스크 분석"""
        prompt = f"""
        다음 요구사항과 유사 입찰 이력을 바탕으로 리스크를 분석하세요:
        
        요구사항: {requirements}
        유사 입찰: {similar_bids}
        
        분석 항목:
        1. 기술적 난이도
        2. 일정 리스크
        3. 예산 리스크
        4. 팀 구성 리스크
        """
        
        response = self.llm.invoke(prompt)
        # Ollama는 문자열 반환, ChatOpenAI는 AIMessage 반환
        if hasattr(response, 'content'):
            response_text = response.content
        else:
            response_text = str(response)
        
        return {
            'difficulty': 0.6,
            'schedule_risk': 'medium',
            'budget_risk': 'low',
            'team_risk': 'low',
        }
    
    def calculate_effort(self, requirements: Dict) -> Dict[str, int]:
        """예상 공수 계산 (인일 기준)"""
        # 간단한 추정 로직
        base_effort = 100  # 기본 공수
        team_size = requirements.get('team_size', 3)
        
        return {
            'frontend': base_effort * 0.4,
            'backend': base_effort * 0.5,
            'devops': base_effort * 0.1,
            'total': base_effort,
            'team_size': team_size,
        }
    
    async def generate_estimate(
        self, 
        doc_id: str, 
        team_id: str
    ) -> str:
        """
        견적서 자동 생성
        
        Args:
            doc_id: 공고 문서 ID
            team_id: 팀 ID
            
        Returns:
            견적서 마크다운 텍스트
        """
        try:
            # 1. 분석 결과 로드
            analysis = await self.get_analysis(doc_id)
            
            # 2. 팀 정보 로드
            team = await self.get_team_profile(team_id)
            
            # 3. 과거 견적 검색
            past_estimates = await self.vector_store.search_similar_announcements(
                query=f"팀 {team_id} 견적",
                k=3
            )
            
            # 4. LLM으로 견적서 생성
            estimate = await self.generate_estimate_with_llm(
                announcement=analysis,
                team_profile=team,
                past_estimates=past_estimates,
            )
            
            return estimate
            
        except Exception as e:
            raise Exception(f"견적서 생성 실패: {str(e)}")
    
    async def get_analysis(self, doc_id: str) -> Dict:
        """분석 결과 조회"""
        # 실제 구현 필요
        return {}
    
    async def get_team_profile(self, team_id: str) -> Dict:
        """팀 프로필 조회"""
        # 실제 구현 필요
        return {}
    
    async def generate_estimate_with_llm(
        self,
        announcement: Dict,
        team_profile: Dict,
        past_estimates: List,
    ) -> str:
        """LLM으로 견적서 생성"""
        
        ESTIMATE_PROMPT = """
다음 정보를 바탕으로 공공사업 견적서를 작성하세요:

[프로젝트 정보]
{announcement}

[팀 프로필]
{team_profile}

[참고: 과거 견적]
{past_estimates}

출력 형식:
## 1. 사업 개요
## 2. 투입 인력 및 비용
## 3. 세부 견적 내역
## 4. 총 예상 금액
"""
        
        prompt = ESTIMATE_PROMPT.format(
            announcement=str(announcement),
            team_profile=str(team_profile),
            past_estimates='\n'.join([str(e) for e in past_estimates[:2]])
        )
        
        response = self.llm.invoke(prompt)
        # Ollama는 문자열 반환, ChatOpenAI는 AIMessage 반환
        if hasattr(response, 'content'):
            return response.content
        else:
            return str(response)

