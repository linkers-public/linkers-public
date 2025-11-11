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

