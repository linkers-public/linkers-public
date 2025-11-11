/**
 * 임베딩 모듈
 * OpenAI/bge/e5 등 다양한 모델 지원
 */

import OpenAI from 'openai'

export interface EmbeddingOptions {
  model?: string
  dimensions?: number
}

export class Embedder {
  private openai: OpenAI | null = null
  private model: string
  private dimensions: number

  constructor(options: EmbeddingOptions = {}) {
    this.model = options.model || process.env.EMBED_MODEL || 'text-embedding-3-small'
    this.dimensions = options.dimensions || 1536

    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    }
  }

  /**
   * 텍스트를 벡터로 임베딩
   */
  async embed(text: string | string[]): Promise<number[][]> {
    if (!this.openai) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다')
    }

    const texts = Array.isArray(text) ? text : [text]

    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: texts,
        dimensions: this.dimensions,
      })

      return response.data.map((item) => item.embedding)
    } catch (error) {
      throw new Error(
        `임베딩 생성 실패: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 단일 텍스트 임베딩
   */
  async embedOne(text: string): Promise<number[]> {
    const embeddings = await this.embed(text)
    return embeddings[0]
  }

  /**
   * 배치 임베딩 (대량 처리용)
   */
  async embedBatch(
    texts: string[],
    batchSize = 100
  ): Promise<number[][]> {
    const results: number[][] = []

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      const embeddings = await this.embed(batch)
      results.push(...embeddings)
    }

    return results
  }
}

// 싱글톤 인스턴스
let embedderInstance: Embedder | null = null

export function getEmbedder(): Embedder {
  if (!embedderInstance) {
    embedderInstance = new Embedder()
  }
  return embedderInstance
}

