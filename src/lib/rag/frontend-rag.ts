/**
 * Frontend RAG - 경량 & 실시간 작업 전담
 * 
 * 역할:
 * 1. 공고문 업로드 시 즉시 메타데이터 추출
 * 2. 사업명, 예산, 기간 등 기본 정보 파싱
 * 3. 사용자 대시보드에서 빠른 검색
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import type { AnnouncementMetadata, SearchFilters } from '@/types/rag'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY!

export class FrontendRAG {
  private supabase = createClient(supabaseUrl, supabaseKey)
  private openai = new OpenAI({ apiKey: openaiApiKey })

  /**
   * 메타데이터 추출 (빠른 응답 목표: 5초 이내)
   */
  async extractMetadata(docId: string): Promise<AnnouncementMetadata> {
    try {
      // 1. 문서에서 핵심 정보만 추출 (빠른 응답)
      const { data: chunks } = await this.supabase
        .from('doc_chunks')
        .select('text')
        .eq('doc_id', docId)
        .order('chunk_index', { ascending: true })
        .limit(5) // 첫 5개 청크만 분석

      if (!chunks || chunks.length === 0) {
        throw new Error('문서 청크를 찾을 수 없습니다')
      }

      // 2. OpenAI로 메타데이터 추출
      const content = chunks.map(c => c.text).join('\n\n')
      const metadata = await this.extractWithGPT(content)

      // 3. Supabase에 구조화된 데이터 저장
      const { error } = await this.supabase
        .from('announcement_metadata')
        .insert({
          doc_id: docId,
          project_name: metadata.projectName,
          budget_min: metadata.budget?.min,
          budget_max: metadata.budget?.max,
          duration_months: metadata.duration?.months,
          tech_stack: metadata.techStack || [],
          organization: metadata.organization,
          deadline: metadata.deadline,
          created_at: new Date().toISOString(),
        })

      if (error) {
        console.error('메타데이터 저장 실패:', error)
      }

      return metadata
    } catch (error) {
      console.error('메타데이터 추출 실패:', error)
      throw error
    }
  }

  /**
   * GPT를 사용한 메타데이터 추출
   */
  private async extractWithGPT(content: string): Promise<AnnouncementMetadata> {
    const prompt = `
다음 공고문에서 핵심 정보를 추출하세요. JSON 형식으로 응답하세요.

{
  "projectName": "프로젝트명",
  "budget": {"min": 최소예산, "max": 최대예산, "currency": "원"},
  "duration": {"months": 개월수},
  "techStack": ["기술1", "기술2"],
  "organization": "발주기관",
  "deadline": "마감일"
}

공고문:
${content.substring(0, 3000)}  // 토큰 제한
`

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 공공입찰 공고 분석 전문가입니다. JSON 형식으로만 응답하세요.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return result as AnnouncementMetadata
  }

  /**
   * 빠른 검색 (pgvector 기반)
   */
  async quickSearch(query: string, filters?: SearchFilters) {
    try {
      // 1. 쿼리 임베딩 생성
      const embeddingResponse = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      })
      const queryEmbedding = embeddingResponse.data[0].embedding

      // 2. pgvector로 유사 공고 검색
      const { data, error } = await this.supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 10,
        filter_budget_min: filters?.budgetMin || null,
        filter_budget_max: filters?.budgetMax || null,
      })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('검색 실패:', error)
      throw error
    }
  }

  /**
   * 임베딩 생성
   */
  private async getEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    return response.data[0].embedding
  }
}

