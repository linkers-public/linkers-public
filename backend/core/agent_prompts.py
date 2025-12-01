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

[역할]
- 변호사·노무사 수준의 지식을 가진 '설명형 어시스턴트'입니다.
- 사용자를 겁주기보다, 현실적으로 쓸 수 있는 정보를 줍니다.
- 모든 답변은 한국어로, 마크다운 형식(제목/목록/강조만 사용)으로 작성합니다.

[근거 사용 원칙]
- 먼저 RAG로 제공된 법령·가이드라인을 최우선으로 참고합니다.
- 자료가 부족하면, "제공된 자료가 제한적이므로 일반적인 원칙 수준에서만 안내 가능하다"는 점을 짧게 밝혀야 합니다.
- 명시적으로 확인되지 않는 부분은 추측하지 말고, 조건부·완화된 표현을 사용합니다.
  (예: "통상적으로 ~인 경우가 많습니다.", "~일 가능성이 높습니다.")

[답변 구조]
1. 핵심 결론: 사용자의 질문에 대한 한두 문단 요약
2. 법적 근거: 참고한 법령·가이드라인/표준계약의 제목과 핵심 취지를 간단히 정리
3. 실무 조언: 회사·상대방에게 말할 때 쓸 수 있는 예시 문장, 다음 단계 행동 가이드
4. 주의사항: 예외 가능성이나 추가로 확인해야 할 포인트가 있다면 짧게 정리

[형식 규칙]
- 코드 블록, JSON, 표는 사용하지 않습니다.
- 가능하면 5~10문장 안에서 간결하게 답변합니다.
- 대화 히스토리가 있으면 이전 맥락을 자연스럽게 이어서 답변하세요.
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
    # RAG 검색 결과 구성 (해커톤 최적화: 5개, 180자)
    rag_context = "## 참고 법령/가이드라인\n\n"
    if legal_chunks:
        for idx, chunk in enumerate(legal_chunks[:5], 1):  # 해커톤 최적화: 상위 5개
            source_type = getattr(chunk, "source_type", "law")
            title = getattr(chunk, "title", "제목 없음")
            snippet = getattr(chunk, "snippet", "")[:180]  # 해커톤 최적화: 180자로 제한

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
        rag_context += (
            "검색된 법령/가이드라인이 없습니다. 제공된 자료가 제한적이므로, "
            "일반적인 법률 원칙 수준에서만 조심스럽게 안내해야 합니다.\n\n"
        )

    # 대화 히스토리 구성 (해커톤 최적화: 3개, 120자)
    history_context = ""
    if history_messages and len(history_messages) > 0:
        recent_messages = history_messages[-3:]  # 해커톤 최적화: 최근 3개
        if recent_messages:
            history_context = "## 대화 히스토리 (요약)\n\n"
            for msg in recent_messages:
                role = msg.get("sender_type", "user")
                content = msg.get("message", "")[:120]  # 해커톤 최적화: 120자로 제한
                role_kr = "사용자" if role == "user" else "어시스턴트"
                history_context += f"- **{role_kr}**: {content}...\n"
            history_context += "\n"
    
    # 최종 프롬프트 (답변 작성 지침 섹션 제거 - 시스템 프롬프트에 통합됨)
    prompt = f"""{AGENT_PLAIN_SYSTEM_PROMPT}

## 사용자 질문
{query}

{history_context}{rag_context}
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

