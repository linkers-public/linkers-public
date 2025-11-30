"""
법률 문서 snippet 분석 모듈
LLM을 사용하여 법률 문서의 snippet을 일반인이 이해하기 쉬운 형태로 변환
"""

import json
import logging
import re
from typing import Dict, Any, Optional
from llm_api import ask_groq_with_messages
from config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
너는 복잡한 법률 문서와 판례를 일반인도 이해하기 쉽게 설명해주는 'AI 법률 해석가'야.

주어진 법률 문서의 '스니펫(Snippet)'을 읽고, 다음 규칙에 따라 사용자가 이해하기 쉬운 [요약본]을 작성해줘.

### 1. 분석 규칙

1. **노이즈 제거:** 페이지 번호, 파일명, 불필요한 특수문자(indd, 17.10.30 등)는 모두 무시해.

2. **핵심 발췌:** 스니펫에 '제N조' 또는 구체적인 '판례 요지'가 있다면 그 부분을 핵심 근거로 삼아.

3. **쉬운 풀이:** 법률 용어를 풀어쓰고, "이 조항은 ~라는 의미입니다" 또는 "따라서 ~해야 합니다" 형태로 설명해.

### 2. 출력 포맷 (JSON)

반드시 다음 JSON 구조로 출력해.

{
    "core_clause": "제6조(행사기간) 등 핵심 조항 번호나 제목 (없으면 '핵심 내용'이라고 적음)",
    "easy_summary": "초등학생도 이해할 수 있는 2~3문장의 친절한 설명",
    "action_tip": "사용자가 주의해야 할 점 1줄 (선택사항)"
}

### 3. 예시

입력: "제6조(행사기간) ① 스톡옵션은 202Ο년 Ο월 Ο일이후... 행사하지 아니한 스톡옵션은 부여하지 않은 것으로 본다."

출력:

{
    "core_clause": "제6조 (스톡옵션 행사기간)",
    "easy_summary": "스톡옵션은 정해진 기간 내에만 사용할 수 있다는 내용입니다. 계약서에 적힌 날짜가 지나면 권리가 사라지니 주의해야 합니다.",
    "action_tip": "계약서에 명시된 행사 시작일과 종료일을 캘린더에 꼭 기록해두세요."
}
"""


async def analyze_snippet(snippet: str) -> Optional[Dict[str, Any]]:
    """
    법률 문서 snippet을 분석하여 일반인이 이해하기 쉬운 형태로 변환
    
    Args:
        snippet: 분석할 법률 문서 snippet 텍스트
    
    Returns:
        {
            "core_clause": "핵심 조항 번호나 제목",
            "easy_summary": "쉬운 설명",
            "action_tip": "주의사항 (선택사항)"
        } 또는 None (실패 시)
    """
    if not snippet or not snippet.strip():
        return None
    
    try:
        user_prompt = f"""
다음 법률 문서 스니펫을 분석하여 JSON 형식으로 변환해주세요:

{snippet}

위 스니펫을 읽고, 반드시 다음 JSON 형식으로만 출력해주세요:
{{
    "core_clause": "핵심 조항 번호나 제목",
    "easy_summary": "초등학생도 이해할 수 있는 2~3문장의 친절한 설명",
    "action_tip": "사용자가 주의해야 할 점 1줄 (선택사항, 없으면 빈 문자열)"
}}

JSON만 출력하고 다른 설명은 하지 마세요.
"""
        
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]
        
        response = ask_groq_with_messages(
            messages=messages,
            temperature=0.3,  # 일관성 있는 출력을 위해 낮은 temperature
            model=settings.groq_model if hasattr(settings, 'groq_model') else "llama-3.3-70b-versatile"
        )
        
        # JSON 추출 (코드 블록 제거)
        response_clean = response.strip()
        response_clean = re.sub(r'```json\s*', '', response_clean, flags=re.IGNORECASE)
        response_clean = re.sub(r'```\s*', '', response_clean)
        response_clean = response_clean.strip()
        
        # JSON 파싱
        try:
            result = json.loads(response_clean)
            
            # 필수 필드 검증
            if not isinstance(result, dict):
                raise ValueError("응답이 딕셔너리가 아닙니다")
            
            # 필수 필드 확인 및 기본값 설정
            parsed_result = {
                "core_clause": result.get("core_clause", "핵심 내용"),
                "easy_summary": result.get("easy_summary", snippet[:200] + "..." if len(snippet) > 200 else snippet),
                "action_tip": result.get("action_tip", "")
            }
            
            return parsed_result
            
        except json.JSONDecodeError as e:
            logger.warning(f"snippet 분석 JSON 파싱 실패: {str(e)}, 원본 응답: {response_clean[:200]}")
            # JSON 파싱 실패 시 원본 snippet 반환
            return {
                "core_clause": "핵심 내용",
                "easy_summary": snippet[:200] + "..." if len(snippet) > 200 else snippet,
                "action_tip": ""
            }
            
    except Exception as e:
        logger.error(f"snippet 분석 실패: {str(e)}", exc_info=True)
        # 실패 시 원본 snippet 반환
        return {
            "core_clause": "핵심 내용",
            "easy_summary": snippet[:200] + "..." if len(snippet) > 200 else snippet,
            "action_tip": ""
        }


async def analyze_snippets_batch(snippets: list[str], max_concurrent: int = 5) -> list[Optional[Dict[str, Any]]]:
    """
    여러 snippet을 배치로 분석 (동시 처리 제한)
    
    Args:
        snippets: 분석할 snippet 리스트
        max_concurrent: 최대 동시 처리 개수
    
    Returns:
        분석 결과 리스트 (순서 보장)
    """
    import asyncio
    
    if not snippets:
        return []
    
    # 동시 처리 제한을 위한 세마포어
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def analyze_with_semaphore(snippet: str) -> Optional[Dict[str, Any]]:
        async with semaphore:
            return await analyze_snippet(snippet)
    
    # 모든 snippet을 동시에 처리 (제한 내에서)
    tasks = [analyze_with_semaphore(snippet) for snippet in snippets]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # 예외 처리: 예외 발생 시 None 반환
    processed_results = []
    for result in results:
        if isinstance(result, Exception):
            logger.error(f"snippet 분석 중 예외 발생: {str(result)}")
            processed_results.append(None)
        else:
            processed_results.append(result)
    
    return processed_results

