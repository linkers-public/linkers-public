/**
 * 상황분석 리포트의 summary 마크다운을 섹션별로 파싱하는 유틸리티
 */

export type SummarySection = {
  title: string
  content: string
}

/**
 * summary 마크다운 텍스트를 섹션 배열로 파싱
 * 
 * @param summary 마크다운 형식의 summary 텍스트 (## 헤더로 섹션 구분)
 * @returns 파싱된 섹션 배열
 */
export function parseSummary(summary: string): SummarySection[] {
  if (!summary || !summary.trim()) {
    return []
  }

  const lines = summary.split('\n')
  const sections: SummarySection[] = []
  let current: SummarySection | null = null

  for (const raw of lines) {
    const line = raw.trim()
    
    // 빈 줄은 건너뛰기
    if (!line) {
      if (current) {
        // 빈 줄도 content에 포함 (마크다운 포맷 유지)
        current.content += '\n'
      }
      continue
    }

    // 새 섹션 시작 (## 헤더 감지)
    if (line.startsWith('## ')) {
      // 이전 섹션 저장
      if (current) {
        sections.push({
          ...current,
          content: current.content.trim(),
        })
      }
      
      // 새 섹션 시작
      current = {
        title: line.replace(/^##\s*/, '').trim(),
        content: '',
      }
    } else if (current) {
      // 현재 섹션에 내용 추가
      current.content += (current.content ? '\n' : '') + line
    }
  }

  // 마지막 섹션 저장
  if (current) {
    sections.push({
      ...current,
      content: current.content.trim(),
    })
  }

  return sections
}

/**
 * 이모지로 섹션 찾기 (헬퍼 함수)
 * 
 * @param sections 파싱된 섹션 배열
 * @param emoji 찾을 이모지 (예: '📊', '⚖️', '🎯', '💬')
 * @returns 해당 이모지로 시작하는 섹션 또는 undefined
 */
export function findSectionByEmoji(sections: SummarySection[], emoji: string): SummarySection | undefined {
  return sections.find(s => s.title.startsWith(emoji))
}

/**
 * 섹션 제목에서 이모지 제거하고 텍스트만 반환
 * 
 * @param title 섹션 제목 (예: "📊 상황 분석의 결과")
 * @returns 이모지 제거된 텍스트 (예: "상황 분석의 결과")
 */
export function removeEmojiFromTitle(title: string): string {
  return title.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+/u, '').trim()
}

