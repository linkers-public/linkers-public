"""
법률/계약서 RAG 전용 프롬프트 템플릿
"""

# ============================================================================
# 법률 상담 챗 프롬프트
# ============================================================================

LEGAL_CHAT_SYSTEM_PROMPT = """당신은 한국 노동법/계약 실무에 특화된 어시스턴트입니다.

**중요한 원칙:**
1. 이 서비스는 법률 자문이 아닙니다. 정보 안내와 가이드를 제공하는 것입니다.
2. 항상 관련 법령/가이드를 근거로 설명하세요.
3. 답변은 마크다운 형식으로 작성하세요 (제목, 리스트, 강조 등).
4. 답변 마지막에 "전문가 상담 권장" 문구를 포함하세요.

**답변 구조:**
1. 요약 결론 (한 문장)
2. 왜 위험한지 (법적 리스크)
3. 실무 협상 포인트 (현실적인 옵션)
4. 참고 법령/표준 계약 요약
"""


def build_legal_chat_prompt(
    query: str,
    contract_chunks: list = None,
    legal_chunks: list = None,
    selected_issue: dict = None,
    analysis_summary: str = None,
    risk_score: int = None,
    total_issues: int = None,
) -> str:
    """
    법률 상담 챗용 프롬프트 구성
    
    Args:
        query: 사용자 질문
        contract_chunks: 계약서 내부 청크
        legal_chunks: 법령 청크
        selected_issue: 선택된 이슈 정보
        analysis_summary: 분석 요약
        risk_score: 위험도 점수
        total_issues: 전체 이슈 개수
    
    Returns:
        완성된 프롬프트 문자열
    """
    # 컨텍스트 구성
    context_parts = []
    
    # 계약서 청크 추가
    if contract_chunks:
        context_parts.append("=== 계약서 내용 ===")
        for chunk in contract_chunks[:3]:  # 상위 3개만 사용
            article_num = chunk.get("article_number", "")
            content = chunk.get("content", "")[:500]  # 500자로 제한
            context_parts.append(f"제{article_num}조:\n{content}")
    
    # 법령 청크 추가
    if legal_chunks:
        context_parts.append("\n=== 관련 법령/가이드라인 ===")
        for chunk in legal_chunks[:5]:  # 상위 5개만 사용
            # LegalGroundingChunk는 Pydantic 모델이므로 getattr 사용
            source_type = getattr(chunk, 'source_type', 'law')
            title = getattr(chunk, 'title', '')
            snippet = getattr(chunk, 'snippet', getattr(chunk, 'content', ''))[:500]
            context_parts.append(f"[{source_type}] {title}\n{snippet}")
    
    context = "\n\n".join(context_parts)
    
    # 선택된 이슈 정보 추가
    issue_context = ""
    if selected_issue:
        issue_context = f"""
**선택된 위험 조항 정보:**
- 카테고리: {selected_issue.get('category', '알 수 없음')}
- 요약: {selected_issue.get('summary', '')}
- 위험도: {selected_issue.get('severity', 'medium')}
- 조항 내용: {selected_issue.get('originalText', '')[:500]}
- 관련 법령: {', '.join(selected_issue.get('legalBasis', [])[:3])}
"""
    
    # 분석 요약 추가
    analysis_context = ""
    if analysis_summary:
        analysis_context = f"\n**전체 분석 요약:** {analysis_summary}"
    if risk_score is not None:
        analysis_context += f"\n**전체 위험도:** {risk_score}점"
    if total_issues is not None:
        analysis_context += f"\n**발견된 위험 조항 수:** {total_issues}개"
    
    prompt = f"""{LEGAL_CHAT_SYSTEM_PROMPT}

**사용자 질문:**
{query}
{issue_context}
{analysis_context}

**관련 법령/가이드/케이스:**
{context}

위 정보를 바탕으로 사용자의 질문에 대해 다음 구조로 답변해주세요:

## 요약 결론
[한 문장으로 핵심 답변]

## 왜 위험한지 (법적 리스크)
[관련 법령을 근거로 위험성 설명]

## 실무 협상 포인트
[현실적인 협상 옵션과 대안 제시]

## 참고 법령/표준 계약
[관련 법령 요약 및 출처]

---
**⚠️ 참고:** 이 답변은 정보 안내를 위한 것이며 법률 자문이 아닙니다. 중요한 사안은 전문 변호사나 노동위원회 등 전문 기관에 상담하시기 바랍니다.
"""
    
    return prompt


# ============================================================================
# 계약서 분석 프롬프트
# ============================================================================

CONTRACT_ANALYSIS_SYSTEM_PROMPT = """당신은 한국 노동법 전문가입니다. 계약서를 분석하여 위험 조항을 식별하고 개선안을 제시합니다.

**분석 원칙:**
1. 근로기준법, 최저임금법 등 관련 법령을 기준으로 분석
2. 표준근로계약서와 비교하여 누락/과도한 조항 식별
3. 각 위험 조항에 대해 구체적인 법적 근거 제시
4. 실무적인 개선안과 협상 포인트 제시
"""


def build_contract_analysis_prompt(
    contract_text: str,
    grounding_chunks: list = None,
    contract_chunks: list = None,
    description: str = None,
) -> str:
    """
    계약서 분석용 프롬프트 구성 (Dual RAG 지원)
    
    Args:
        contract_text: 계약서 텍스트
        grounding_chunks: 관련 법령 청크 (legal_chunks)
        contract_chunks: 계약서 내부 청크 (contract_chunks)
        description: 추가 상황 설명
    
    Returns:
        완성된 프롬프트 문자열
    """
    # 계약서 내부 조항 컨텍스트 (Dual RAG)
    contract_context = ""
    if contract_chunks:
        contract_context = "\n**계약서 주요 조항 (분석 대상):**\n"
        for chunk in contract_chunks[:5]:  # 상위 5개만 사용
            article_num = chunk.get("article_number", "")
            content = chunk.get("content", "")[:400]  # 400자로 제한
            contract_context += f"- 제{article_num}조:\n{content}\n\n"
    
    # 관련 법령 컨텍스트
    legal_context = ""
    if grounding_chunks:
        legal_context = "\n**참고 법령/가이드라인:**\n"
        for chunk in grounding_chunks[:8]:
            # LegalGroundingChunk는 Pydantic 모델이므로 getattr 사용
            source_type = getattr(chunk, 'source_type', 'law')
            title = getattr(chunk, 'title', '')
            snippet = getattr(chunk, 'snippet', getattr(chunk, 'content', ''))[:300]
            legal_context += f"- [{source_type}] {title}: {snippet}\n"
    
    situation_context = ""
    if description:
        situation_context = f"\n**추가 상황 설명:**\n{description}\n"
    
    prompt = f"""{CONTRACT_ANALYSIS_SYSTEM_PROMPT}

**분석 대상 계약서:**
{contract_text[:3000]}
{contract_context}
{situation_context}
{legal_context}

위 계약서를 분석하여 다음 JSON 형식으로 응답해주세요:

{{
    "risk_score": 0-100,
    "risk_level": "low" | "medium" | "high",
    "summary": "전체 위험도 요약 (2-3문장)",
    "issues": [
        {{
            "name": "이슈 이름",
            "description": "위험 조항 내용",
            "severity": "low" | "medium" | "high",
            "legal_basis": ["근로기준법 제XX조", ...],
            "suggested_text": "개선된 조항 텍스트",
            "rationale": "왜 위험한지 설명",
            "suggested_questions": ["협상 시 물어볼 질문 1", ...]
        }}
    ],
    "recommendations": [
        {{
            "title": "권장 사항 제목",
            "description": "구체적인 권장 사항",
            "steps": ["단계 1", "단계 2", ...]
        }}
    ]
}}
"""
    
    return prompt


# ============================================================================
# 상황 분석 프롬프트
# ============================================================================

SITUATION_ANALYSIS_SYSTEM_PROMPT = """당신은 한국 노동법 전문가입니다. 사용자의 상황을 분석하여 법적 리스크와 대응 방안을 제시합니다.

**분석 원칙:**
1. 제공된 상황 정보를 바탕으로 법적 리스크 평가
2. 관련 법령을 근거로 설명
3. 실무적인 대응 방안과 체크리스트 제시
4. 유사 케이스와 비교 분석
"""


def build_situation_analysis_prompt(
    situation_text: str,
    category_hint: str = None,
    grounding_chunks: list = None,
    employment_type: str = None,
    work_period: str = None,
    weekly_hours: int = None,
    is_probation: bool = None,
    social_insurance: str = None,
) -> str:
    """
    상황 분석용 프롬프트 구성
    
    Args:
        situation_text: 상황 설명
        category_hint: 카테고리 힌트
        grounding_chunks: 관련 법령 청크
        employment_type: 고용 형태
        work_period: 근무 기간
        weekly_hours: 주당 근로시간
        is_probation: 수습 여부
        social_insurance: 4대보험
    
    Returns:
        완성된 프롬프트 문자열
    """
    # 관련 법령 컨텍스트
    legal_context = ""
    if grounding_chunks:
        legal_context = "\n**참고 법령/가이드라인:**\n"
        for chunk in grounding_chunks[:8]:
            # LegalGroundingChunk는 Pydantic 모델이므로 getattr 사용
            source_type = getattr(chunk, 'source_type', 'law')
            title = getattr(chunk, 'title', '')
            snippet = getattr(chunk, 'snippet', getattr(chunk, 'content', ''))[:300]
            legal_context += f"- [{source_type}] {title}: {snippet}\n"
    
    # 사용자 정보 요약
    user_info = []
    if employment_type:
        user_info.append(f"고용 형태: {employment_type}")
    if work_period:
        user_info.append(f"근무 기간: {work_period}")
    if weekly_hours:
        user_info.append(f"주당 근로시간: {weekly_hours}시간")
    if is_probation is not None:
        user_info.append(f"수습 여부: {'수습 중' if is_probation else '수습 아님'}")
    if social_insurance:
        user_info.append(f"4대보험: {social_insurance}")
    user_info_text = "\n".join(user_info) if user_info else "정보 없음"
    
    # 카테고리 라벨 매핑
    category_labels = {
        "harassment": "직장 내 괴롭힘 / 모욕",
        "unpaid_wage": "임금체불 / 수당 미지급",
        "unfair_dismissal": "부당해고 / 계약해지",
        "overtime": "근로시간 / 야근 / 휴게시간 문제",
        "probation": "수습·인턴 관련 문제",
        "unknown": "기타 / 잘 모르겠음",
    }
    category_label = category_labels.get(category_hint, category_hint) if category_hint else ""
    
    prompt = f"""{SITUATION_ANALYSIS_SYSTEM_PROMPT}

**사용자 정보:**
{user_info_text}

**상황 카테고리 힌트:** {category_label}

**상황 설명:**
{situation_text}
{legal_context}

다음 JSON 형식으로 진단 결과를 반환하세요:
{{
    "classified_type": "harassment|unpaid_wage|unfair_dismissal|overtime|probation|unknown",
    "risk_score": 0~100 사이의 숫자,
    "summary": "구조화된 마크다운 텍스트 (아래 지시사항 참고)",
    "criteria": [
        {{
            "name": "판단 기준명",
            "status": "likely|unclear|unlikely",
            "reason": "판단 이유 및 설명"
        }}
    ],
    "action_plan": {{
        "steps": [
            {{
                "title": "증거 수집",
                "items": ["구체적인 증거 수집 방법"]
            }},
            {{
                "title": "1차 대응",
                "items": ["초기 대응 방법"]
            }},
            {{
                "title": "상담/신고 루트",
                "items": ["고용노동부 1350 상담센터", "청년노동센터", "노무사 상담"]
            }}
        ]
    }},
    "scripts": {{
        "to_company": "회사에 보낼 정중한 문제 제기 문구 템플릿",
        "to_advisor": "노무사/기관에 상담할 때 쓸 설명 템플릿"
    }}
}}

**⚠️ 매우 중요한 지시사항:**

summary 필드는 반드시 다음 4개 섹션을 순서대로 포함한 마크다운 형식으로 작성해야 합니다:

1. ## 📊 상황 분석의 결과
   - 제공된 상황을 바탕으로 핵심 문제점과 위험도를 요약하여 2-3문장으로 설명

2. ## ⚖️ 법적 관점에서 본 현재상황
   - 관련 법령을 근거로 현재 상황이 법적으로 어떻게 평가되는지 설명
   - 구체적인 법적 근거와 판단 기준을 포함하여 3-5문장으로 작성
   - 위의 "참고 법령/가이드라인" 섹션의 내용을 참고하여 작성

3. ## 🎯 지금 당장 할 수 있는 행동
   - 즉시 실행 가능한 구체적인 행동 방안을 3-5개 항목으로 나열
   - 각 항목은 "- " 형식으로 작성

4. ## 💬 이렇게 말해보세요
   - 회사나 상담 기관에 실제로 사용할 수 있는 구체적인 문구 템플릿을 제공
   - 실제 대화에서 바로 사용할 수 있는 문장으로 작성

기타 사항:
- 모든 응답은 한국어로 작성하세요.
- summary는 마크다운 형식으로 작성하되, 각 섹션을 명확하게 구분하세요.
- criteria는 3~5개 정도로 구성하세요.
- action_plan의 steps는 3단계 정도로 구성하세요.
- scripts는 실제로 사용할 수 있는 구체적인 문구로 작성하세요.

JSON 형식만 반환하세요. summary 필드에는 위의 4개 섹션을 모두 포함한 완전한 마크다운 텍스트를 작성하세요.
"""
    
    return prompt

