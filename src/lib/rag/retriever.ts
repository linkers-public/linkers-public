/**
 * 검색 및 재랭킹 모듈
 * pgvector 검색, MMR, Cross-Encoder 재랭킹
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export interface RetrievedChunk {
  id: number
  doc_id: number
  text: string
  meta: Record<string, any>
  score: number
}

export interface RetrievalOptions {
  topK?: number
  threshold?: number
  useMMR?: boolean
  mmrLambda?: number
  filterDocIds?: number[]
}

export class Retriever {
  private supabase: ReturnType<typeof createClient<Database>>

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 환경 변수가 설정되지 않았습니다')
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseKey)
  }

  /**
   * 벡터 유사도 검색
   */
  async search(
    queryEmbedding: number[],
    options: RetrievalOptions = {}
  ): Promise<RetrievedChunk[]> {
    const {
      topK = 10,
      threshold = 0.7,
      useMMR = false,
      mmrLambda = 0.5,
      filterDocIds,
    } = options

    try {
      let result

      if (useMMR) {
        // MMR 검색
        const { data, error } = await this.supabase.rpc('search_chunks_mmr', {
          query_vec: queryEmbedding,
          k: topK,
          lambda: mmrLambda,
          filter_doc_ids: filterDocIds || null,
        })

        if (error) throw error
        result = data || []
      } else {
        // 일반 코사인 유사도 검색
        const { data, error } = await this.supabase.rpc('search_chunks_cosine', {
          query_vec: queryEmbedding,
          k: topK,
          filter_doc_ids: filterDocIds || null,
        })

        if (error) throw error
        result = data || []
      }

      // 임계값 필터링
      return result
        .filter((chunk) => chunk.score >= threshold)
        .map((chunk) => ({
          id: chunk.id,
          doc_id: chunk.doc_id,
          text: chunk.text,
          meta: chunk.meta || {},
          score: chunk.score,
        }))
    } catch (error) {
      throw new Error(
        `검색 실패: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 하이브리드 검색 (키워드 + 벡터)
   */
  async hybridSearch(
    queryText: string,
    queryEmbedding: number[],
    options: RetrievalOptions = {}
  ): Promise<RetrievedChunk[]> {
    // 벡터 검색
    const vectorResults = await this.search(queryEmbedding, options)

    // 키워드 검색 (간단한 구현)
    const keywordResults = await this.keywordSearch(queryText, options)

    // 결과 병합 및 재랭킹
    return this.mergeResults(vectorResults, keywordResults)
  }

  /**
   * 키워드 검색 (간단한 구현)
   */
  private async keywordSearch(
    queryText: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievedChunk[]> {
    const { topK = 10, filterDocIds } = options

    try {
      // 간단한 텍스트 검색 (실제로는 full-text search 사용 권장)
      const query = this.supabase
        .from('doc_chunks')
        .select('id, doc_id, text, meta')
        .ilike('text', `%${queryText}%`)
        .limit(topK)

      if (filterDocIds && filterDocIds.length > 0) {
        query.in('doc_id', filterDocIds)
      }

      const { data, error } = await query

      if (error) throw error

      return (data || []).map((chunk) => ({
        id: chunk.id,
        doc_id: chunk.doc_id,
        text: chunk.text,
        meta: chunk.meta || {},
        score: 0.5, // 키워드 매칭 점수 (간단한 구현)
      }))
    } catch (error) {
      console.error('키워드 검색 실패:', error)
      return []
    }
  }

  /**
   * 검색 결과 병합 및 재랭킹
   */
  private mergeResults(
    vectorResults: RetrievedChunk[],
    keywordResults: RetrievedChunk[]
  ): RetrievedChunk[] {
    const merged = new Map<number, RetrievedChunk>()

    // 벡터 결과 추가 (가중치 0.7)
    for (const result of vectorResults) {
      merged.set(result.id, {
        ...result,
        score: result.score * 0.7,
      })
    }

    // 키워드 결과 추가/병합 (가중치 0.3)
    for (const result of keywordResults) {
      const existing = merged.get(result.id)
      if (existing) {
        existing.score = existing.score + result.score * 0.3
      } else {
        merged.set(result.id, {
          ...result,
          score: result.score * 0.3,
        })
      }
    }

    // 점수 기준 정렬
    return Array.from(merged.values()).sort((a, b) => b.score - a.score)
  }
}

// 싱글톤 인스턴스
let retrieverInstance: Retriever | null = null

export function getRetriever(): Retriever {
  if (!retrieverInstance) {
    retrieverInstance = new Retriever()
  }
  return retrieverInstance
}

