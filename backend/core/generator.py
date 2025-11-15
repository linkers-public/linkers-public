# backend/core/generator.py

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from models.schemas import AnnouncementAnalysis
from config import settings
from typing import Dict, List


class LLMGenerator:
    def __init__(self):
        # Ollama만 사용 (해커톤 모드)
        try:
            # langchain-ollama 우선 사용 (deprecated 경고 없음)
            try:
                from langchain_ollama import OllamaLLM
                self.llm = OllamaLLM(
                    base_url=settings.ollama_base_url,
                    model=settings.ollama_model,
                    temperature=settings.llm_temperature
                )
                print("[완료] Ollama LLM 연결 완료 (langchain-ollama)")
            except ImportError:
                # 대안: langchain-community 사용 (deprecated)
                from langchain_community.llms import Ollama
                self.llm = Ollama(
                    base_url=settings.ollama_base_url,
                    model=settings.ollama_model,
                    temperature=settings.llm_temperature
                )
                print("[완료] Ollama LLM 연결 완료")
        except Exception as e:
            raise ValueError(f"Ollama 연결 실패: {str(e)}\n[팁] Ollama가 실행 중인지 확인하세요: ollama serve")
    
    def analyze_announcement(self, context: Dict) -> AnnouncementAnalysis:
        """
        공고문 분석 및 구조화
        """
        parser = PydanticOutputParser(pydantic_object=AnnouncementAnalysis)
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """당신은 공공입찰 공고 분석 전문가입니다.
주어진 공고문에서 핵심 정보를 정확하게 추출하세요.

출력 형식:
{format_instructions}

주의사항:
- 공고문에 명시된 내용만 추출하세요
- 추측하지 말고, 정보가 없으면 빈 리스트로 반환하세요
- 예산은 "X억 원" 또는 "X천만 원" 형식으로 표현하세요
"""),
            ("user", """
[현재 공고문]
{current_announcement}

[참고: 유사 과거 공고]
{similar_announcements}

위 정보를 바탕으로 분석 결과를 출력하세요.
""")
        ])
        
        chain = prompt | self.llm | parser
        
        try:
            result = chain.invoke({
                "format_instructions": parser.get_format_instructions(),
                "current_announcement": context["current"][:3000],  # 토큰 제한
                "similar_announcements": "\n\n---\n\n".join(context["similar_past"])[:1000]
            })
            return result
        except Exception as e:
            # 파싱 실패 시 기본값 반환
            print(f"LLM 분석 오류: {str(e)}")
            return AnnouncementAnalysis(
                project_name="분석 실패",
                budget_range="미정",
                duration="미정",
                essential_skills=[],
                summary="자동 분석에 실패했습니다. 수동으로 확인해주세요."
            )
    
    def generate_matching_rationale(self, team_data: Dict, requirements: Dict) -> str:
        """
        팀 추천 사유 생성
        """
        prompt = f"""
다음 팀이 프로젝트에 적합한 이유를 3가지로 간결하게 요약하세요:

[프로젝트 요구사항]
- 필수 기술: {', '.join(requirements.get('essential_skills', []))}
- 우대 기술: {', '.join(requirements.get('preferred_skills', []))}
- 예산: {requirements.get('budget_range', '미정')}

[팀 정보]
- 이름: {team_data.get('name', 'Unknown')}
- 기술: {', '.join(team_data.get('skills', []))}
- 경력: {team_data.get('experience_years', 0)}년
- 평점: {team_data.get('rating', 0)}/5.0

출력 형식 (번호 없이):
✓ [강점 1]
✓ [강점 2]
✓ [강점 3]
"""
        
        try:
            response = self.llm.invoke(prompt)
            # Ollama는 문자열 반환, ChatOpenAI는 AIMessage 반환
            if hasattr(response, 'content'):
                return response.content
            else:
                return str(response)
        except Exception as e:
            return f"매칭 사유 생성 실패: {str(e)}"
    
    def generate_estimate_draft(self, project_info: Dict, team_info: Dict, past_estimates: List[str]) -> str:
        """
        견적서 초안 생성
        """
        prompt = f"""
다음 정보를 바탕으로 공공사업 견적서 초안을 작성하세요:

[프로젝트 정보]
- 프로젝트명: {project_info.get('project_name', 'Unknown')}
- 예산 범위: {project_info.get('budget_range', '미정')}
- 수행 기간: {project_info.get('duration', '미정')}
- 필수 기술: {', '.join(project_info.get('essential_skills', []))}

[투입 인력]
- 팀명: {team_info.get('name', 'Unknown')}
- 보유 기술: {', '.join(team_info.get('skills', []))}
- 경력: {team_info.get('experience_years', 0)}년

[참고: 유사 프로젝트 견적]
{chr(10).join(past_estimates[:2]) if past_estimates else '참고 자료 없음'}

출력 형식:
## 1. 사업 개요
## 2. 투입 인력 및 비용
## 3. 세부 견적 내역
## 4. 총 예상 금액

각 항목을 간결하고 명확하게 작성하세요.
"""
        
        try:
            response = self.llm.invoke(prompt)
            # Ollama는 문자열 반환, ChatOpenAI는 AIMessage 반환
            if hasattr(response, 'content'):
                return response.content
            else:
                return str(response)
        except Exception as e:
            return f"견적서 생성 실패: {str(e)}"

