/**
 * RAG 질의 API
 * 검색 → 생성 (요약/견적/매칭)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { getEmbedder } from '@/lib/rag/embedder'
import { getRetriever } from '@/lib/rag/retriever'
import {
  createSummaryPrompt,
  createEstimatePrompt,
  createMatchPrompt,
  createQueryPrompt,
} from '@/lib/rag/prompts'
import { scoreAndRankTeams } from '@/lib/rag/scoring'
import type { QueryRequest, QueryResponse } from '@/types/rag'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

export async function POST(request: NextRequest) {
  try {
    const body: QueryRequest = await request.json()
    const { mode, query, topK = 8, withTeams = false, docIds } = body

    if (!query) {
      return NextResponse.json({ error: '질의가 필요합니다' }, { status: 400 })
    }

    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다' },
        { status: 500 }
      )
    }

    // 1. 질의 임베딩 생성
    const embedder = getEmbedder()
    const queryEmbedding = await embedder.embedOne(query)

    // 2. 검색
    const retriever = getRetriever()
    const chunks = await retriever.search(queryEmbedding, {
      topK,
      filterDocIds: docIds,
    })

    if (chunks.length === 0) {
      return NextResponse.json({
        answer: '관련 정보를 찾을 수 없습니다.',
        usedChunks: [],
      } as QueryResponse)
    }

    // 3. 프롬프트 생성
    let systemPrompt = 'You are a procurement analyst. Answer ONLY with facts in <CONTEXT>.\nIf missing, say "정보 없음". Cite chunk ids like [id:123]. Respond in Korean.'
    let userPrompt: string

    const chunksWithId = chunks.map((c) => ({ id: c.id, text: c.text }))

    if (mode === 'summary') {
      userPrompt = createSummaryPrompt({ query, chunks: chunksWithId })
    } else if (mode === 'estimate') {
      userPrompt = createEstimatePrompt({ query, chunks: chunksWithId })
    } else if (mode === 'match') {
      // 팀 매칭 모드
      if (withTeams) {
        // 팀 검색
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey)
          const { data: teamEmbeddings } = await supabase.rpc('search_teams_cosine', {
            query_vec: queryEmbedding,
            k: 10,
          })

          if (teamEmbeddings && teamEmbeddings.length > 0) {
            // 스코어 계산
            const requirements = extractRequirements(chunks)
            const scoredTeams = scoreAndRankTeams(
              teamEmbeddings.map((t: any) => ({
                team_id: t.team_id,
                summary: t.summary,
                meta: t.meta || {},
                semanticScore: t.score,
              })),
              requirements
            )

            userPrompt = createMatchPrompt({
              query,
              chunks: chunksWithId,
              teams: scoredTeams.slice(0, 3).map((t) => ({
                team_id: t.team_id,
                summary: t.summary,
                meta: t.meta,
                score: t.finalScore,
              })),
            })

            // LLM 호출
            const completion = await openai.chat.completions.create({
              model: process.env.CHAT_MODEL || 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              temperature: 0.3,
            })

            const answer = completion.choices[0]?.message?.content || '답변을 생성할 수 없습니다.'

            return NextResponse.json({
              answer,
              usedChunks: chunks.map((c) => ({
                id: c.id,
                doc_id: c.doc_id,
                score: c.score,
              })),
              teams: scoredTeams.slice(0, 3).map((t) => ({
                team_id: t.team_id,
                score: t.finalScore,
              })),
            } as QueryResponse)
          }
        }
      }
      userPrompt = createMatchPrompt({ query, chunks: chunksWithId })
    } else {
      userPrompt = createQueryPrompt({ query, chunks: chunksWithId })
    }

    // 4. LLM 호출
    const completion = await openai.chat.completions.create({
      model: process.env.CHAT_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    })

    const answer = completion.choices[0]?.message?.content || '답변을 생성할 수 없습니다.'

    // 5. 감사 로그 저장 (선택)
    const authHeader = request.headers.get('authorization')
    if (authHeader && supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)

      if (user) {
        await supabase.from('rag_audit_logs').insert({
          query,
          mode,
          used_chunk_ids: chunks.map((c) => c.id),
          answer,
          user_id: user.id,
        })
      }
    }

    const response: QueryResponse = {
      answer,
      usedChunks: chunks.map((c) => ({
        id: c.id,
        doc_id: c.doc_id,
        score: c.score,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('질의 오류:', error)
    return NextResponse.json(
      {
        error: '질의 실패',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * 청크에서 요구사항 추출
 */
function extractRequirements(chunks: any[]): any {
  const allMeta = chunks.map((c) => c.meta || {}).flat()
  
  return {
    techStack: allMeta
      .map((m: any) => m.techStack || [])
      .flat()
      .filter((v: any, i: number, arr: any[]) => arr.indexOf(v) === i),
    region: allMeta.find((m: any) => m.region)?.region,
    budget: allMeta.find((m: any) => m.budget)?.budget,
    period: allMeta.find((m: any) => m.period)?.period,
  }
}

