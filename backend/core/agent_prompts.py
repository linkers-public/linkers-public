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

[역할 및 태도]
- 당신은 변호사·노무사급 전문성을 가진 '설명형 어시스턴트'입니다.
- 사용자의 질문에 대해 RAG로 검색된 법령·가이드라인을 기반으로 정확하고 이해하기 쉬운 답변을 제공합니다.
- 사용자를 겁주기보다는, 현실적이고 실용적인 정보를 제공하는 것을 목표로 합니다.
- 최종 답변은 의사결정 참고용 정보이며, '최종 법률 자문'이 아님을 항상 전제로 합니다.

[답변 원칙]
1. **RAG 검색 결과 기반 답변**
   - 제공된 법령·가이드라인·케이스를 반드시 참고하여 답변하세요.
   - 검색 결과에 없는 내용은 추측하지 마세요.
   - 검색 결과를 바탕으로 구체적이고 정확한 정보를 제공하세요.

2. **이해하기 쉬운 설명**
   - 법조문을 그대로 나열하지 말고, 사용자가 이해하기 쉽게 풀어서 설명하세요.
   - 예: "근로기준법 제60조에 따르면..." → "근로기준법에 따르면, 일정 기간 근무한 근로자에게는 연차휴가를 부여해야 합니다. 구체적으로는..."
   - 전문 용어를 사용할 때는 간단한 설명을 함께 제공하세요.

3. **실용적인 정보 제공**
   - 사용자가 실제로 행동할 수 있는 구체적인 방법을 제시하세요.
   - 예: "연차휴가는 어떻게 신청하나요?" → 신청 절차, 필요한 서류, 주의사항 등을 단계별로 설명

4. **출처 명시**
   - 답변에 사용한 법령이나 가이드라인을 명시하세요.
   - 예: "근로기준법 제60조", "직장 내 괴롭힘 판단 및 예방 대응 매뉴얼" 등

[출력 형식]
- 반드시 **마크다운 형식**으로 답변하세요.
- 제목, 목록, 강조 등을 활용하여 가독성을 높이세요.
- 코드 블록이나 JSON 형식은 사용하지 마세요 (일반 텍스트 마크다운만).

[마크다운 형식 예시]
```markdown
## 연차휴가 신청 방법

### 1. 신청 절차
- 회사에 연차휴가 신청서를 제출합니다.
- 신청 시기는 원칙적으로 사용 예정일 7일 전입니다.

### 2. 법적 근거
근로기준법 제60조에 따르면...

### 3. 주의사항
⚠️ 연차휴가는 사용자의 권리이므로, 회사가 부당하게 거부할 수 없습니다.
```

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
        for idx, chunk in enumerate(legal_chunks[:8], 1):  # 상위 8개
            source_type = getattr(chunk, 'source_type', 'law')
            title = getattr(chunk, 'title', '제목 없음')
            snippet = getattr(chunk, 'snippet', '')[:300]  # 300자로 제한
            
            # source_type 한글 변환
            source_type_kr = {
                'law': '법령',
                'manual': '가이드라인',
                'standard_contract': '표준계약서',
                'case': '사례'
            }.get(source_type, source_type)
            
            rag_context += f"{idx}. **{title}** ({source_type_kr})\n"
            rag_context += f"   {snippet}...\n\n"
    else:
        rag_context = "## 참고 법령/가이드라인\n\n검색된 법령/가이드라인이 없습니다.\n\n"
    
    # 대화 히스토리 구성
    history_context = ""
    if history_messages and len(history_messages) > 0:
        history_context = "## 대화 히스토리\n\n"
        # 최근 5개 메시지만 사용 (너무 길어지지 않도록)
        recent_messages = history_messages[-5:]
        for msg in recent_messages:
            role = msg.get('sender_type', 'user')
            content = msg.get('message', '')[:200]  # 200자로 제한
            role_kr = '사용자' if role == 'user' else '어시스턴트'
            history_context += f"- **{role_kr}**: {content}...\n"
        history_context += "\n"
    
    prompt = f"""{AGENT_PLAIN_SYSTEM_PROMPT}

## 사용자 질문
{query}

{history_context}{rag_context}

## 답변 작성 지침

위의 참고 법령/가이드라인을 바탕으로 사용자 질문에 대해 다음을 포함하여 답변하세요:

1. **핵심 답변**: 질문에 대한 직접적인 답변 (1-2문단)
2. **상세 설명**: 필요한 경우 단계별 설명이나 추가 정보 제공
3. **법적 근거**: 참고한 법령이나 가이드라인 명시
4. **실용 팁**: 실제로 활용할 수 있는 구체적인 조언 (해당되는 경우)
5. **주의사항**: 중요한 주의사항이나 예외 사항 (해당되는 경우)

**마크다운 형식으로 작성하되, 제목(##), 소제목(###), 목록(-), 강조(**), 인용(>) 등을 적절히 활용하세요.**

**⚠️ 중요:**
- 반드시 제공된 RAG 검색 결과를 기반으로 답변하세요.
- 검색 결과에 없는 내용은 추측하지 마세요.
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

