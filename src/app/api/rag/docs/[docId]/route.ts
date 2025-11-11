/**
 * 문서 정보 조회 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { docId: string } }
) {
  try {
    const docId = parseInt(params.docId)

    if (isNaN(docId)) {
      return NextResponse.json({ error: '유효하지 않은 문서 ID' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase 설정이 필요합니다' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 문서 정보 조회
    const { data: doc, error } = await supabase
      .from('docs')
      .select('*')
      .eq('id', docId)
      .single()

    if (error || !doc) {
      return NextResponse.json(
        { error: '문서를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json(doc)
  } catch (error) {
    console.error('문서 조회 오류:', error)
    return NextResponse.json(
      {
        error: '문서 조회 실패',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

