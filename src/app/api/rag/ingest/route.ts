/**
 * RAG 인덱싱 API
 * PDF 업로드 → 텍스트 추출 → 청크 → 임베딩 → DB 저장
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractFromPDF } from '@/lib/rag/extractor'
import { chunkText } from '@/lib/rag/chunker'
import { getEmbedder } from '@/lib/rag/embedder'
import type { IngestRequest, IngestResponse } from '@/types/rag'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const source = formData.get('source') as string
    const title = formData.get('title') as string | null
    const publishedAt = formData.get('publishedAt') as string | null
    const docUrl = formData.get('docUrl') as string | null

    if (!file || !source) {
      return NextResponse.json(
        { error: '파일과 source가 필요합니다' },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase 설정이 필요합니다' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. PDF 파일을 버퍼로 변환
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 2. 텍스트 추출
    const extractionResult = await extractFromPDF(buffer)

    // 3. 청크 분할
    const chunks = chunkText(extractionResult.text, {
      chunkSize: 500,
      chunkOverlap: 100,
    })

    // 4. 문서 저장
    const organization = formData.get('organization') as string | null
    const metadata: Record<string, any> = {
      ...extractionResult.metadata,
    }
    if (organization) {
      metadata.organization = organization
    }

    const { data: doc, error: docError } = await supabase
      .from('docs')
      .insert({
        source: source as any,
        doc_url: docUrl || null,
        title: title || file.name,
        raw_text: extractionResult.text,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
      })
      .select()
      .single()

    if (docError || !doc) {
      return NextResponse.json(
        { error: `문서 저장 실패: ${docError?.message}` },
        { status: 500 }
      )
    }

    // 5. 임베딩 생성
    const embedder = getEmbedder()
    const chunkTexts = chunks.map((chunk) => chunk.text)
    const embeddings = await embedder.embedBatch(chunkTexts)

    // 6. 청크 및 임베딩 저장
    const chunksToInsert = chunks.map((chunk, index) => ({
      doc_id: doc.id,
      chunk_index: chunk.index,
      text: chunk.text,
      meta: {
        ...metadata,
        ...chunk.metadata,
      },
      embedding: embeddings[index],
    }))

    const { error: chunksError } = await supabase
      .from('doc_chunks')
      .insert(chunksToInsert)

    if (chunksError) {
      return NextResponse.json(
        { error: `청크 저장 실패: ${chunksError.message}` },
        { status: 500 }
      )
    }

    // 7. 문서 소유자 설정 (현재 사용자)
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      
      if (user) {
        await supabase.from('doc_owners').insert({
          doc_id: doc.id,
          user_id: user.id,
        })
      }
    }

    const response: IngestResponse = {
      docId: doc.id,
      chunks: chunks.length,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('인덱싱 오류:', error)
    return NextResponse.json(
      {
        error: '인덱싱 실패',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

