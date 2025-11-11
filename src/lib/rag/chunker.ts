/**
 * 텍스트 청킹 모듈
 * 문장 분리, 슬라이딩 윈도우, 표/숫자 보존
 */

export interface Chunk {
  text: string
  index: number
  metadata?: {
    startChar?: number
    endChar?: number
    hasTable?: boolean
    hasNumbers?: boolean
  }
}

export interface ChunkOptions {
  chunkSize?: number // 기본 500자
  chunkOverlap?: number // 기본 100자
  preserveNumbers?: boolean // 숫자 보존 여부
  preserveTables?: boolean // 표 보존 여부
}

/**
 * 텍스트를 청크로 분할
 */
export function chunkText(
  text: string,
  options: ChunkOptions = {}
): Chunk[] {
  const {
    chunkSize = 500,
    chunkOverlap = 100,
    preserveNumbers = true,
    preserveTables = true,
  } = options

  const chunks: Chunk[] = []

  // 문장 단위로 분리
  const sentences = splitIntoSentences(text)

  let currentChunk: string[] = []
  let currentLength = 0
  let chunkIndex = 0
  let startChar = 0

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i]
    const sentenceLength = sentence.length

    // 현재 청크에 추가하면 크기 초과하는 경우
    if (currentLength + sentenceLength > chunkSize && currentChunk.length > 0) {
      // 현재 청크 저장
      const chunkText = currentChunk.join(' ')
      chunks.push({
        text: chunkText,
        index: chunkIndex++,
        metadata: {
          startChar,
          endChar: startChar + chunkText.length,
          hasTable: preserveTables && hasTable(chunkText),
          hasNumbers: preserveNumbers && hasNumbers(chunkText),
        },
      })

      // 오버랩을 위해 이전 문장들 일부 유지
      const overlapSentences: string[] = []
      let overlapLength = 0

      for (let j = currentChunk.length - 1; j >= 0; j--) {
        const prevSentence = currentChunk[j]
        if (overlapLength + prevSentence.length <= chunkOverlap) {
          overlapSentences.unshift(prevSentence)
          overlapLength += prevSentence.length
        } else {
          break
        }
      }

      currentChunk = overlapSentences
      currentLength = overlapLength
      startChar += chunkText.length - overlapLength
    }

    currentChunk.push(sentence)
    currentLength += sentenceLength
  }

  // 마지막 청크 저장
  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join(' ')
    chunks.push({
      text: chunkText,
      index: chunkIndex,
      metadata: {
        startChar,
        endChar: startChar + chunkText.length,
        hasTable: preserveTables && hasTable(chunkText),
        hasNumbers: preserveNumbers && hasNumbers(chunkText),
      },
    })
  }

  return chunks
}

/**
 * 텍스트를 문장 단위로 분리
 */
function splitIntoSentences(text: string): string[] {
  // 한국어 문장 종결 부호 기준 분리
  const sentenceEndings = /[.!?。！？]\s+/g
  const sentences = text
    .split(sentenceEndings)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  // 문장 종결 부호가 없는 경우 줄바꿈 기준 분리
  if (sentences.length === 1 && text.includes('\n')) {
    return text
      .split(/\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }

  return sentences
}

/**
 * 텍스트에 표가 포함되어 있는지 확인
 */
function hasTable(text: string): boolean {
  // 간단한 표 패턴 확인
  return /(\|.+\|[\n\r]+)+/.test(text) || /\t/.test(text)
}

/**
 * 텍스트에 숫자가 포함되어 있는지 확인
 */
function hasNumbers(text: string): boolean {
  return /\d/.test(text)
}

/**
 * 청크 크기 조정 (너무 작거나 큰 청크 병합/분할)
 */
export function adjustChunkSizes(chunks: Chunk[], minSize = 200, maxSize = 800): Chunk[] {
  const adjusted: Chunk[] = []

  for (const chunk of chunks) {
    if (chunk.text.length < minSize && adjusted.length > 0) {
      // 이전 청크와 병합
      const lastChunk = adjusted[adjusted.length - 1]
      lastChunk.text += ' ' + chunk.text
      if (lastChunk.metadata) {
        lastChunk.metadata.endChar = (lastChunk.metadata.endChar || 0) + chunk.text.length
      }
    } else if (chunk.text.length > maxSize) {
      // 큰 청크를 다시 분할
      const subChunks = chunkText(chunk.text, { chunkSize: maxSize, chunkOverlap: 100 })
      adjusted.push(...subChunks.map((sc, idx) => ({
        ...sc,
        index: chunk.index * 1000 + idx, // 인덱스 조정
      })))
    } else {
      adjusted.push(chunk)
    }
  }

  return adjusted
}

