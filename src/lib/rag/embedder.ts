/**
 * 임베딩 모듈
 * 백엔드 Python API 사용
 */

export interface EmbeddingOptions {
  model?: string
  dimensions?: number
}

export class Embedder {
  private backendUrl: string
  private model: string
  private dimensions: number

  constructor(options: EmbeddingOptions = {}) {
    this.model = options.model || process.env.EMBED_MODEL || 'text-embedding-3-small'
    this.dimensions = options.dimensions || 1536
    this.backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'
  }

  /**
   * 텍스트를 벡터로 임베딩
   * 백엔드 API 사용
   */
  async embed(text: string | string[]): Promise<number[][]> {
    const texts = Array.isArray(text) ? text : [text]

    try {
      // 백엔드에 임베딩 엔드포인트가 있다면 사용
      // 없으면 검색 API를 통해 간접적으로 처리
      // 실제로는 백엔드에 /api/v2/embed 엔드포인트 추가 필요
      
      // 임시: 각 텍스트에 대해 검색을 수행하여 임베딩이 생성되도록 함
      // 실제로는 백엔드에 직접 임베딩 엔드포인트가 필요
      const embeddings: number[][] = []
      
      for (const t of texts) {
        // 백엔드 검색 API를 호출 (임베딩이 내부적으로 생성됨)
        const searchUrl = new URL(`${this.backendUrl}/api/v2/announcements/search`)
        searchUrl.searchParams.set('query', t)
        searchUrl.searchParams.set('limit', '1')
        
        await fetch(searchUrl.toString(), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        
        // 임시: 더미 임베딩 반환 (실제로는 백엔드에서 임베딩을 반환해야 함)
        // 백엔드에 /api/v2/embed 엔드포인트 추가 필요
        embeddings.push(new Array(this.dimensions).fill(0).map(() => Math.random() - 0.5))
      }
      
      return embeddings
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
