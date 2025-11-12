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
    const docIdParam = params.docId
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docIdParam)
    const isNumeric = /^\d+$/.test(docIdParam)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase 설정이 필요합니다' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // UUID 또는 숫자 ID로 문서 조회
    let doc: any = null
    let error: any = null

    if (isUUID) {
      // UUID로 조회 (announcement_id 또는 id 컬럼)
      const { data: docByUuid, error: errorUuid } = await supabase
        .from('docs')
        .select('*')
        .or(`announcement_id.eq.${docIdParam},id.eq.${docIdParam}`)
        .maybeSingle()
      
      doc = docByUuid
      error = errorUuid
    } else if (isNumeric) {
      // 숫자 ID로 조회
      const docId = parseInt(docIdParam)
      const { data: docById, error: errorId } = await supabase
        .from('docs')
        .select('*')
        .eq('id', docId)
        .single()
      
      doc = docById
      error = errorId
    } else {
      return NextResponse.json(
        { error: '유효하지 않은 문서 ID 형식입니다' },
        { status: 400 }
      )
    }

    if (error || !doc) {
      // 백엔드 API로도 시도 (announcement_id가 UUID인 경우)
      if (isUUID) {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'
        try {
          const backendResponse = await fetch(`${backendUrl}/api/v2/announcements/${docIdParam}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          if (backendResponse.ok) {
            const backendData = await backendResponse.json()
            // 백엔드 응답을 docs 형식으로 변환
            return NextResponse.json({
              id: docIdParam,
              announcement_id: docIdParam,
              title: backendData.data?.title || '공고 문서',
              meta: {
                organization: backendData.data?.agency,
                source: backendData.data?.source,
              },
              created_at: backendData.data?.created_at || new Date().toISOString(),
            })
          }
        } catch (backendError) {
          console.error('백엔드 API 호출 실패:', backendError)
        }
      }
      
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

