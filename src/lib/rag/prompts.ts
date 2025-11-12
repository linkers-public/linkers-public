/**
 * 프롬프트 템플릿 모듈
 * 요약/견적/매칭 프롬프트 생성
 */

export interface ChunkWithId {
  id: number
  text: string
}

export interface PromptContext {
  query: string
  chunks: ChunkWithId[]
  teams?: Array<{
    team_id: number
    summary: string
    meta: Record<string, any>
    score: number
  }>
}

/**
 * 시스템 프롬프트
 */
export const SYSTEM_PROMPT = `You are a procurement analyst. Answer ONLY with facts in <CONTEXT>.
If missing, say "정보 없음". Cite chunk ids like [id:123]. Respond in Korean.`

/**
 * 요약 프롬프트 생성
 */
export function createSummaryPrompt(context: PromptContext): string {
  const chunksText = context.chunks
    .map((chunk) => `[id:${chunk.id}] ${chunk.text}`)
    .join('\n\n')

  return `질의: ${context.query}

<CONTEXT>
${chunksText}
</CONTEXT>

형식:
1) 핵심 요구사항
2) 예산 범위(근거 chunk id)
3) 예상 기간(근거)
4) 리스크/가정(근거)

각 항목에 반드시 [id:##] 형식으로 근거를 표기하세요.`
}

/**
 * 견적 초안 프롬프트 생성
 */
export function createEstimatePrompt(context: PromptContext): string {
  const chunksText = context.chunks
    .map((chunk) => `[id:${chunk.id}] ${chunk.text}`)
    .join('\n\n')

  return `질의: ${context.query}

<CONTEXT>
${chunksText}
</CONTEXT>

다음 형식으로 견적 초안을 작성하세요:

1) 프로젝트 범위 및 주요 작업
   - [id:##] 근거 표기

2) 예상 예산
   - 총액: [금액]원 ([id:##] 근거)
   - 세부 항목별 예산 분배

3) 예상 기간
   - 시작일: [날짜]
   - 종료일: [날짜]
   - 총 기간: [개월] ([id:##] 근거)

4) 마일스톤
   - [마일스톤명]: [예산]원, [기간] ([id:##] 근거)

5) 가정 및 리스크
   - [id:##] 근거 표기

정보가 없는 항목은 "정보 없음"으로 표기하세요.`
}

/**
 * 팀 매칭 프롬프트 생성
 */
export function createMatchPrompt(context: PromptContext): string {
  if (!context.teams || context.teams.length === 0) {
    throw new Error('팀 정보가 필요합니다')
  }

  const chunksText = context.chunks
    .map((chunk) => `[id:${chunk.id}] ${chunk.text}`)
    .join('\n\n')

  const teamsText = context.teams
    .map(
      (team) =>
        `팀 ID: ${team.team_id}\n요약: ${team.summary}\n메타: ${JSON.stringify(team.meta)}\n유사도 점수: ${team.score}`
    )
    .join('\n\n---\n\n')

  return `CONTEXT(공고 요구사항 + 팀 프로필)만 사용.

<공고 요구사항>
${chunksText}
</공고 요구사항>

<팀 프로필>
${teamsText}
</팀 프로필>

상위 3팀과 선정 사유를 5줄 이내로 작성하세요. 각 문장에 [id:##] 표기.`
}

/**
 * 일반 질의 프롬프트 생성
 */
export function createQueryPrompt(context: PromptContext): string {
  const chunksText = context.chunks
    .map((chunk) => `[id:${chunk.id}] ${chunk.text}`)
    .join('\n\n')

  return `질의: ${context.query}

<CONTEXT>
${chunksText}
</CONTEXT>

위 CONTEXT의 정보만 사용하여 질의에 답변하세요. 정보가 없으면 "정보 없음"이라고 답변하세요.
각 답변에 반드시 [id:##] 형식으로 근거를 표기하세요.`
}

/**
 * 커스텀 프롬프트 생성 (과거 3년간 유사 공공 IT사업 데이터 참조)
 */
export function createCustomPrompt(context: PromptContext): string {
  const chunksText = context.chunks
    .map((chunk) => `[id:${chunk.id}] ${chunk.text}`)
    .join('\n\n')

  return `질의: ${context.query}

<CONTEXT>
현재 공고 문서:
${chunksText}

참고: 위 CONTEXT에는 현재 공고 문서와 과거 3년간 유사한 공공 IT사업 데이터가 포함되어 있습니다.
각 문서는 [id:##] 형식으로 식별됩니다.
</CONTEXT>

지시사항:
1. 현재 공고의 주요 기술 요구사항을 추출하세요.
2. 과거 유사 사업 데이터를 참고하여 적정 예산 범위를 제시하세요.
3. 과거 유사 사업 데이터를 참고하여 예상 수행기간을 제시하세요.
4. 각 답변에 반드시 [id:##] 형식으로 근거를 표기하세요.
5. 표 형식으로 정리할 수 있는 경우 표로 작성하세요.

정보가 없는 항목은 "정보 없음"이라고 답변하세요.`
}

/**
 * 팀 비교 프롬프트 생성 (기술스택, 평점, 지역 경력 비교)
 */
export function createTeamComparisonPrompt(context: PromptContext): string {
  if (!context.teams || context.teams.length === 0) {
    throw new Error('팀 정보가 필요합니다')
  }

  const chunksText = context.chunks
    .map((chunk) => `[id:${chunk.id}] ${chunk.text}`)
    .join('\n\n')

  const teamsText = context.teams
    .map(
      (team) =>
        `팀 ID: ${team.team_id}
요약: ${team.summary}
메타데이터: ${JSON.stringify(team.meta, null, 2)}
유사도 점수: ${team.score.toFixed(2)}`
    )
    .join('\n\n---\n\n')

  return `질의: ${context.query}

<공고 요구사항>
${chunksText}
</공고 요구사항>

<팀 프로필>
${teamsText}
</팀 프로필>

지시사항:
1. 각 팀의 기술스택, 평점, 지역 경력을 비교 분석하세요.
2. 상위 3개 팀을 선정하고 선정 이유를 명확히 제시하세요.
3. 반드시 표 형식으로 정리하세요. 표에는 다음 정보를 포함하세요:
   - 팀 ID
   - 기술스택 (요구사항 대비 매칭도)
   - 평점
   - 지역 경력
   - 종합 점수
   - 선정 이유
4. 각 항목에 [id:##] 형식으로 근거를 표기하세요.

표 형식 예시:
| 순위 | 팀 ID | 기술스택 매칭도 | 평점 | 지역 경력 | 종합 점수 | 선정 이유 |
|------|-------|----------------|------|----------|----------|----------|
| 1 | [ID] | [매칭도] | [점수] | [지역] | [점수] | [이유] |`
}

