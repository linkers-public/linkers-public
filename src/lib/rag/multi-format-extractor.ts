/**
 * 멀티 포맷 추출 어댑터
 * PDF | HWP | HWPX 통합 처리
 */

import { detectFormat, type DocumentFormat } from './format-detector'
import { extractFromPDF, type ExtractionResult } from './extractor'
import { extractFromHWP, type HWPExtractionResult } from './extractors/hwp-extractor'
import { extractFromHWPX, type HWPXExtractionResult } from './extractors/hwpx-extractor'

export interface MultiFormatExtractionResult {
  text: string
  blocks?: Array<{
    type: string
    text: string
    metadata?: Record<string, any>
  }>
  metadata: Record<string, any>
  format: DocumentFormat
  needsConversion?: boolean
  conversionMessage?: string
}

/**
 * 멀티 포맷 추출 메인 함수
 */
export async function extractFromMultiFormat(
  fileBuffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<MultiFormatExtractionResult> {
  // 1. 포맷 감지
  const formatResult = await detectFormat(filename, mimeType, fileBuffer)

  if (formatResult.format === 'unknown') {
    throw new Error(
      `지원하지 않는 파일 형식입니다. (PDF, HWP, HWPX만 지원)`
    )
  }

  // 2. 포맷별 추출
  try {
    switch (formatResult.format) {
      case 'pdf':
        return await extractPDF(fileBuffer)

      case 'hwp':
        return await extractHWP(fileBuffer, filename)

      case 'hwpx':
        return await extractHWPX(fileBuffer)

      default:
        throw new Error(`처리할 수 없는 포맷: ${formatResult.format}`)
    }
  } catch (error) {
    // 3. 실패 시 폴백 처리
    return handleExtractionFailure(
      formatResult.format,
      filename,
      error instanceof Error ? error.message : String(error)
    )
  }
}

/**
 * PDF 추출
 */
async function extractPDF(
  fileBuffer: Buffer
): Promise<MultiFormatExtractionResult> {
  const result = await extractFromPDF(fileBuffer)

  return {
    text: result.text,
    blocks: result.tables?.map((table) => ({
      type: 'table',
      text: table.rows.map((row) => row.join(' | ')).join('\n'),
      metadata: {
        headers: table.headers,
        rowCount: table.rows.length,
      },
    })),
    metadata: result.metadata,
    format: 'pdf',
  }
}

/**
 * HWP 추출
 */
async function extractHWP(
  fileBuffer: Buffer,
  filename: string
): Promise<MultiFormatExtractionResult> {
  try {
    const result = await extractFromHWP(fileBuffer, filename)

    return {
      text: result.text,
      blocks: result.blocks.map((block) => ({
        type: block.type,
        text: block.text,
        metadata: block.metadata,
      })),
      metadata: result.metadata,
      format: 'hwp',
    }
  } catch (error) {
    // HWP 추출 실패 시 폴백
    throw new Error(
      `HWP 파일 추출 실패. PDF로 변환 후 다시 업로드해주세요. (원인: ${error instanceof Error ? error.message : String(error)})`
    )
  }
}

/**
 * HWPX 추출
 */
async function extractHWPX(
  fileBuffer: Buffer
): Promise<MultiFormatExtractionResult> {
  const result = await extractFromHWPX(fileBuffer)

  return {
    text: result.text,
    blocks: result.blocks?.map((block) => ({
      type: block.type,
      text: block.text,
      metadata: block.metadata,
    })) || [],
    metadata: result.metadata || {},
    format: 'hwpx',
  }
}

/**
 * 추출 실패 시 폴백 처리
 */
function handleExtractionFailure(
  format: DocumentFormat,
  filename: string,
  errorMessage: string
): MultiFormatExtractionResult {
  return {
    text: '',
    metadata: {
      originalFilename: filename,
      extractionError: errorMessage,
      needsManualConversion: true,
    },
    format,
    needsConversion: true,
    conversionMessage:
      format === 'hwp'
        ? 'HWP 파일은 PDF로 변환 후 업로드해주세요. (온라인 변환 도구 사용 가능)'
        : '파일 추출에 실패했습니다. 다른 형식으로 변환 후 다시 시도해주세요.',
  }
}

