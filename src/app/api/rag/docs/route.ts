/**
 * 문서 목록 조회 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase 설정이 필요합니다' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 문서 목록 조회
    const { data: docs, error } = await supabase
      .from('docs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { error: `문서 목록 조회 실패: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(docs || [])
  } catch (error) {
    console.error('문서 목록 조회 오류:', error)
    return NextResponse.json(
      {
        error: '문서 목록 조회 실패',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

