/**
 * 문서 다운로드 API
 * Supabase Storage에 파일이 있으면 Storage에서 다운로드,
 * 없으면 announcement_bodies의 텍스트를 다운로드 가능한 형식으로 제공
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { docId: string } }
) {
  try {
    const docIdParam = params.docId
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'original' // original, txt

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase 설정이 필요합니다' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 공고 정보 조회 (Storage 파일 경로 포함)
    const { data: announcement, error: announcementError } = await supabase
      .from('announcements')
      .select('id, title, agency, storage_file_path, storage_bucket, file_name, file_mime_type')
      .eq('id', docIdParam)
      .eq('status', 'active')
      .single()

    if (announcementError || !announcement) {
      return NextResponse.json(
        { error: '문서를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Storage에 파일이 있는 경우: Storage에서 파일 다운로드
    if (announcement.storage_file_path) {
      try {
        // 버킷 이름: DB에 저장된 값 또는 기본값 'announcements'
        const bucket = announcement.storage_bucket || 'announcements'
        const filePath = announcement.storage_file_path

        // Storage에서 파일 다운로드
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(filePath)

        if (downloadError) {
          console.warn('Storage에서 파일 다운로드 실패, 텍스트로 대체:', downloadError)
          // Storage 다운로드 실패 시 텍스트로 대체
        } else if (fileData) {
          // 파일을 ArrayBuffer로 변환
          const arrayBuffer = await fileData.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)

          // 파일명 결정
          const fileName = announcement.file_name || 
            `${announcement.title || '문서'}.${filePath.split('.').pop() || 'pdf'}`

          // MIME 타입 결정
          const mimeType = announcement.file_mime_type || 
            (filePath.endsWith('.pdf') ? 'application/pdf' :
             filePath.endsWith('.txt') ? 'text/plain' :
             filePath.endsWith('.hwpx') ? 'application/x-hwp' :
             'application/octet-stream')

          return new NextResponse(buffer, {
            headers: {
              'Content-Type': mimeType,
              'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
              'Content-Length': buffer.length.toString(),
            },
          })
        }
      } catch (storageError) {
        console.warn('Storage 파일 처리 중 오류, 텍스트로 대체:', storageError)
        // Storage 오류 시 텍스트로 대체
      }
    }

    // Storage에 파일이 없거나 다운로드 실패한 경우: 텍스트 본문 반환
    const { data: body, error: bodyError } = await supabase
      .from('announcement_bodies')
      .select('text')
      .eq('announcement_id', docIdParam)
      .single()

    if (bodyError || !body || !body.text) {
      return NextResponse.json(
        { error: '문서 본문을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const text = body.text
    const title = announcement.title || '문서'
    const safeTitle = title.replace(/[^a-zA-Z0-9가-힣\s]/g, '_').substring(0, 50)

    // 텍스트 파일로 다운로드
    return new NextResponse(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeTitle}.txt"`,
      },
    })
  } catch (error) {
    console.error('문서 다운로드 오류:', error)
    return NextResponse.json(
      {
        error: '문서 다운로드 실패',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

