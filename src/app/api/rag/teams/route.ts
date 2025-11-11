/**
 * 팀 임베딩 갱신/조회 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getEmbedder } from '@/lib/rag/embedder'
import type { TeamUpdateRequest } from '@/types/rag'

export async function POST(request: NextRequest) {
  try {
    const body: TeamUpdateRequest = await request.json()
    const { teamId, summary, meta } = body

    if (!teamId || !summary) {
      return NextResponse.json(
        { error: 'teamId와 summary가 필요합니다' },
        { status: 400 }
      )
    }

    // Supabase 클라이언트
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase 설정이 필요합니다' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. 임베딩 생성
    const embedder = getEmbedder()
    const embedding = await embedder.embedOne(summary)

    // 2. 팀 임베딩 저장/업데이트
    const { error } = await supabase
      .from('team_embeddings')
      .upsert({
        team_id: teamId,
        summary,
        meta: meta || {},
        embedding,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      return NextResponse.json(
        { error: `팀 임베딩 저장 실패: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('팀 임베딩 오류:', error)
    return NextResponse.json(
      {
        error: '팀 임베딩 실패',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase 설정이 필요합니다' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    if (teamId) {
      // 특정 팀 조회
      const { data, error } = await supabase
        .from('team_embeddings')
        .select('team_id, summary, meta, updated_at')
        .eq('team_id', parseInt(teamId))
        .single()

      if (error) {
        return NextResponse.json(
          { error: `팀 조회 실패: ${error.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json(data)
    } else {
      // 전체 팀 목록 조회
      const { data, error } = await supabase
        .from('team_embeddings')
        .select('team_id, summary, meta, updated_at')
        .order('updated_at', { ascending: false })

      if (error) {
        return NextResponse.json(
          { error: `팀 목록 조회 실패: ${error.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json(data || [])
    }
  } catch (error) {
    console.error('팀 조회 오류:', error)
    return NextResponse.json(
      {
        error: '팀 조회 실패',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

