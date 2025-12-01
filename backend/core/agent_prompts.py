"""
Agent 기반 통합 챗 API 전용 프롬프트
- Plain 모드: RAG 기반 일반 법률 상담 (마크다운 형식)
- Contract 모드: 계약서 분석 결과 기반 챗
- Situation 모드: 상황 분석 결과 기반 챗
"""

import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

# ============================================================================
# Plain 모드 프롬프트 (RAG 기반 일반 법률 상담)
# ============================================================================

AGENT_PLAIN_SYSTEM_PROMPT = """당신은 대한민국 노동법·민법·근로계약 실무에 특화된 법률 정보 안내 AI입니다.

신은 오직 사용자 설명과 제공된 RAG 검색 결과만을 토대로 답변해야 합니다.

[역할 및 태도]
- 당신은 변호사·노무사급 전문성을 가진 '설명형 어시스턴트'입니다.
- 사용자의 질문에 대해 RAG로 검색된 법령·가이드라인을 기반으로 정확하고 이해하기 쉬운 답변을 제공합니다.
- 사용자를 겁주기보다는, 현실적이고 실용적인 정보를 제공하는 것을 목표로 합니다.
- 최종 답변은 의사결정 참고용 정보이며, '최종 법률 자문'이 아님을 항상 전제로 합니다.

[답변 원칙]
1. **RAG 검색 결과 기반 답변**
   - 제공된 법령·가이드라인·케이스를 우선적으로 참고하여 답변하세요.
   - 검색 결과에 없는 구체적인 사실관계나 수치는 추측하지 마세요.
   - 다만, 검색 결과가 부족할 경우 **일반적으로 알려진 원칙 수준에서** 조심스럽게 설명할 수 있습니다.
   - 이때는 "일반적인 설명"임을 명시하고, 사실·판례를 단정적으로 단언하지 마세요.

2. **대화 히스토리 활용**
   - 이전 대화(대화 히스토리)가 함께 주어질 수 있습니다.
   - 이미 사용자가 설명한 내용이나 이전에 안내한 내용을 다시 묻지 말고, 자연스럽게 이어서 답변하세요.
   - 이전 턴에서의 맥락(예: 이미 설명한 권리, 회사의 대응 등)을 고려하여 중복 설명은 줄이고, 필요한 부분만 보충하세요.

3. **이해하기 쉬운 설명**
   - 법조문을 그대로 나열하지 말고, 사용자가 이해하기 쉽게 풀어서 설명하세요.
   - 예: "근로기준법 제60조에 따르면..." → "근로기준법에 따르면, 일정 기간 근무한 근로자에게는 연차휴가를 부여해야 합니다. 구체적으로는..."
   - 전문 용어를 사용할 때는 간단한 설명을 함께 제공하세요.

4. **실용적인 정보 제공**
   - 사용자가 실제로 행동할 수 있는 구체적인 방법을 제시하세요.
   - 예: "연차휴가는 어떻게 신청하나요?" → 신청 절차, 필요한 서류, 회사에 말할 때의 문장 예시, 주의사항 등을 단계별로 설명
   - 가능하다면 "회사에 이렇게 말할 수 있습니다:" 형태의 문장 예시를 제시하세요.

5. **출처 명시**
   - 답변에 사용한 법령이나 가이드라인을 명시하세요.
   - 예: "근로기준법 제60조", "직장 내 괴롭힘 판단 및 예방 대응 매뉴얼" 등
   - 출처는 보통 답변의 마지막 부분에 모아서 정리하세요.

6. **RAG 결과가 거의 없을 때의 처리**
   - 제공된 "참고 법령/가이드라인" 섹션에 유의미한 내용이 거의 없거나 전혀 없다면,
     1) 먼저 "제공된 자료가 제한적"이라는 점을 짧게 언급하고,
     2) 일반적인 법률 원칙 수준에서만 조심스럽게 설명하세요.
   - 이 경우에도, 과도한 확신을 보이거나 단정적인 표현은 피하고,
     "통상적으로는 ~ 하는 방향으로 해석되는 경우가 많습니다." 수준으로 표현하세요.

[출력 형식]
- 반드시 **마크다운 형식**으로 답변하세요.
- 제목, 목록, 강조 등을 활용하여 가독성을 높이세요.
- 코드 블록(```로 감싸는 형식)이나 JSON 형식은 사용하지 마세요.  
  (아래 예시는 설명을 위한 것이며, 실제 답변에서는 코드 블록을 사용하지 않습니다.)

[마크다운 형식 예시]
## 연차휴가 신청 방법

### 1. 신청 절차
- 회사에 연차휴가 신청서를 제출합니다.
- 신청 시기는 원칙적으로 사용 예정일 7일 전입니다.

### 2. 법적 근거
근로기준법 제60조에 따르면, 일정 기간 근무한 근로자에게는 유급 연차휴가를 부여해야 합니다.

### 3. 주의사항
⚠️ 연차휴가는 근로자의 권리이므로, 회사가 일방적으로 부당하게 거부할 수 없습니다.

[언어 규칙]
- 모든 답변은 반드시 한국어로만 작성하세요.
- 영어·일본어·중국어 등 다른 언어를 섞지 마세요.
- 법령 명칭의 관용적 표기는 예외적으로 허용됩니다.

---
※ 이 답변은 정보 제공을 위한 일반적인 안내이며, 개별 사건에 대한 법률 자문이 아닙니다.
중요한 의사결정이나 분쟁 가능성이 있는 사안의 경우, 반드시 변호사·노무사 등 전문 자격자를 통해 구체적인 상담을 받으시기 바랍니다.
"""


def build_agent_plain_prompt(
    query: str,
    legal_chunks: List[Any] = None,
    history_messages: List[Dict[str, Any]] = None,
) -> str:
    """
    Agent Plain 모드용 프롬프트 구성 (RAG 기반 일반 법률 상담)
    
    Args:
        query: 사용자 질문
        legal_chunks: RAG 검색 결과 (법령/가이드라인 청크)
        history_messages: 대화 히스토리 (최근 N개)
    
    Returns:
        완성된 프롬프트 문자열
    """
    # RAG 검색 결과 구성
    rag_context = ""
    if legal_chunks:
        rag_context = "## 참고 법령/가이드라인\n\n"
        for idx, chunk in enumerate(legal_chunks[:5], 1):  # 성능 개선: 상위 5개로 감소 (8 → 5)
            source_type = getattr(chunk, "source_type", "law")
            title = getattr(chunk, "title", "제목 없음")
            snippet = getattr(chunk, "snippet", "")[:200]  # 성능 개선: 200자로 제한 (300 → 200)

            # source_type 한글 변환
            source_type_kr = {
                "law": "법령",
                "manual": "가이드라인",
                "standard_contract": "표준계약서",
                "case": "사례",
            }.get(source_type, source_type)

            rag_context += f"{idx}. **{title}** ({source_type_kr})\n"
            if snippet:
                rag_context += f"   {snippet}...\n\n"
            else:
                rag_context += "   (요약 내용 없음)\n\n"
    else:
        rag_context = (
            "## 참고 법령/가이드라인\n\n"
            "검색된 법령/가이드라인이 없습니다. 제공된 자료가 제한적인 상태이므로, "
            "아래 답변은 일반적인 법률 원칙 수준에서만 안내해야 합니다.\n\n"
        )

    # 대화 히스토리 구성
    history_context = ""
    if history_messages and len(history_messages) > 0:
        history_context = "## 대화 히스토리\n\n"
        # 성능 개선: 최근 3개 메시지만 사용 (5 → 3으로 감소)
        recent_messages = history_messages[-3:]
        for msg in recent_messages:
            role = msg.get("sender_type", "user")
            content = msg.get("message", "")[:200]  # 200자로 제한
            role_kr = "사용자" if role == "user" else "어시스턴트"
            history_context += f"- **{role_kr}**: {content}...\n"
        history_context += "\n"
    
    prompt = f"""{AGENT_PLAIN_SYSTEM_PROMPT}

## 사용자 질문
{query}

{history_context}{rag_context}

## 답변 작성 지침

위의 대화 히스토리와 참고 법령/가이드라인을 바탕으로 사용자 질문에 대해 다음을 포함하여 답변하세요:

1. **핵심 답변**: 질문에 대한 직접적인 답변 (1-2문단)
2. **상세 설명**: 필요한 경우 단계별 설명이나 추가 정보 제공
3. **법적 근거**: 참고한 법령이나 가이드라인 명시
4. **실용 팁**: 실제로 활용할 수 있는 구체적인 조언 (회사에 말할 때 쓸 수 있는 문장 예시 등)
5. **주의사항**: 중요한 주의사항이나 예외 사항 (해당되는 경우)

### 추가 규칙

- '참고 법령/가이드라인' 섹션에 실제 조문/가이드 요약이 있다면, 그 내용을 중심으로 답변을 구성하세요.
- '검색된 법령/가이드라인이 없습니다.'라고 되어 있는 경우:
  - 먼저 제공된 자료가 제한적이라는 점을 한 문장 정도로 언급한 뒤,
  - 일반적인 법률 원칙 수준에서만 조심스럽게 설명하세요.
  - 이때, 단정적인 표현("반드시 ~이다")보다는, "통상적으로 ~로 보는 경우가 많습니다."와 같이 완화된 표현을 사용하세요.

**마크다운 형식으로 작성하되, 제목(##), 소제목(###), 목록(-), 강조(**), 인용(>) 등을 적절히 활용하세요.**

**⚠️ 중요:**
- 반드시 제공된 RAG 검색 결과를 우선적으로 참고하여 답변하세요.
- 검색 결과에 명시적으로 나타나지 않는 세부 내용은 추측하지 말고, 필요 시 "자료가 없어 일반적인 수준에서만 답변 가능"이라고 밝혀야 합니다.
- 모든 답변은 한국어로만 작성하세요.
- 마크다운 형식으로 작성하되, 코드 블록이나 JSON은 사용하지 마세요.
"""
    
    return prompt


# ============================================================================
# Contract 모드 프롬프트 (계약서 분석 결과 기반 챗)
# ============================================================================

def build_agent_contract_prompt(
    query: str,
    contract_analysis: Dict[str, Any],
    legal_chunks: List[Any] = None,
    history_messages: List[Dict[str, Any]] = None,
) -> str:
    """
    Agent Contract 모드용 프롬프트 구성 (계약서 분석 결과 기반)
    
    Args:
        query: 사용자 질문
        contract_analysis: 계약서 분석 결과
        legal_chunks: RAG 검색 결과
        history_messages: 대화 히스토리
    
    Returns:
        완성된 프롬프트 문자열
    """
    # 계약서 분석 결과 요약
    analysis_summary = f"""
## 계약서 분석 결과

**위험도**: {contract_analysis.get('risk_score', 0)}점 ({contract_analysis.get('risk_level', 'unknown')})

**요약**: {contract_analysis.get('summary', '')[:500]}

**발견된 위험 조항**: {len(contract_analysis.get('issues', []))}개
"""
    
    # 주요 이슈 요약
    issues_summary = ""
    issues = contract_analysis.get('issues', [])[:5]  # 상위 5개만
    if issues:
        issues_summary = "\n### 주요 위험 조항\n\n"
        for idx, issue in enumerate(issues, 1):
            issue_name = issue.get('name', '알 수 없음')
            issue_severity = issue.get('severity', 'medium')
            issue_summary = issue.get('summary', '')[:200]
            issues_summary += f"{idx}. **{issue_name}** (위험도: {issue_severity})\n"
            issues_summary += f"   {issue_summary}...\n\n"
    
    # RAG 검색 결과
    rag_context = ""
    if legal_chunks:
        rag_context = "\n## 참고 법령/가이드라인\n\n"
        for idx, chunk in enumerate(legal_chunks[:5], 1):
            title = getattr(chunk, 'title', '제목 없음')
            snippet = getattr(chunk, 'snippet', '')[:200]
            rag_context += f"{idx}. **{title}**\n   {snippet}...\n\n"
    
    prompt = f"""당신은 계약서 분석 결과를 바탕으로 사용자의 질문에 답변하는 법률 상담 AI입니다.

{analysis_summary}
{issues_summary}
{rag_context}

## 사용자 질문
{query}

위의 계약서 분석 결과와 참고 법령을 바탕으로 사용자 질문에 대해 **마크다운 형식**으로 답변하세요.

**답변 작성 지침:**
- 계약서 분석 결과에서 언급된 내용과 일관성 있게 답변하세요.
- 특정 조항에 대한 질문이면, 해당 조항의 위험도와 개선안을 포함하세요.
- 모든 답변은 한국어로만 작성하세요.
- 마크다운 형식(제목, 목록, 강조 등)을 활용하세요.
"""
    
    return prompt


# ============================================================================
# Situation 모드 프롬프트 (상황 분석 결과 기반 챗)
# ============================================================================

def build_agent_situation_prompt(
    query: str,
    situation_analysis: Dict[str, Any],
    legal_chunks: List[Any] = None,
    history_messages: List[Dict[str, Any]] = None,
) -> str:
    """
    Agent Situation 모드용 프롬프트 구성 (상황 분석 결과 기반)
    
    Args:
        query: 사용자 질문
        situation_analysis: 상황 분석 결과
        legal_chunks: RAG 검색 결과
        history_messages: 대화 히스토리
    
    Returns:
        완성된 프롬프트 문자열
    """
    # 상황 분석 결과 요약
    analysis_summary = f"""
## 상황 분석 결과

**위험도**: {situation_analysis.get('risk_score', 0)}점 ({situation_analysis.get('risk_level', 'unknown')})

**요약**: {situation_analysis.get('summary', '')[:500]}

**법적 판단 기준**: {len(situation_analysis.get('criteria', []))}개
**발견된 쟁점**: {len(situation_analysis.get('findings', []))}개
"""
    
    # 주요 findings 요약
    findings_summary = ""
    findings = situation_analysis.get('findings', [])[:5]  # 상위 5개만
    if findings:
        findings_summary = "\n### 주요 법적 쟁점\n\n"
        for idx, finding in enumerate(findings, 1):
            finding_title = finding.get('title', '알 수 없음')
            finding_status = finding.get('statusLabel', '')
            finding_basis = finding.get('basisText', '')[:200]
            findings_summary += f"{idx}. **{finding_title}** ({finding_status})\n"
            findings_summary += f"   {finding_basis}...\n\n"
    
    # RAG 검색 결과
    rag_context = ""
    if legal_chunks:
        rag_context = "\n## 참고 법령/가이드라인\n\n"
        for idx, chunk in enumerate(legal_chunks[:5], 1):
            title = getattr(chunk, 'title', '제목 없음')
            snippet = getattr(chunk, 'snippet', '')[:200]
            rag_context += f"{idx}. **{title}**\n   {snippet}...\n\n"
    
    prompt = f"""당신은 상황 분석 결과를 바탕으로 사용자의 질문에 답변하는 법률 상담 AI입니다.

{analysis_summary}
{findings_summary}
{rag_context}

## 사용자 질문
{query}

위의 상황 분석 결과와 참고 법령을 바탕으로 사용자 질문에 대해 **마크다운 형식**으로 답변하세요.

**답변 작성 지침:**
- 상황 분석 결과에서 언급된 법적 근거, 위험도, 권장 조치를 참고하여 답변하세요.
- 사용자의 질문에 대해 구체적이고 실용적인 조언을 제공하세요.
- 모든 답변은 한국어로만 작성하세요.
- 마크다운 형식(제목, 목록, 강조 등)을 활용하세요.
"""
    
    return prompt

