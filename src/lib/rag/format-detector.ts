/**
 * 파일 포맷 감지 모듈
 * PDF, HWP, HWPX, 기타 포맷 식별
 */

export type DocumentFormat = 'pdf' | 'hwp' | 'hwpx' | 'unknown'

export interface FormatDetectionResult {
  format: DocumentFormat
  mimeType?: string
  confidence: 'high' | 'medium' | 'low'
}

/**
 * 파일 확장자로 포맷 감지
 */
export function detectFormatByExtension(filename: string): DocumentFormat {
  const ext = filename.toLowerCase().split('.').pop() || ''

  if (ext === 'pdf') return 'pdf'
  if (ext === 'hwp') return 'hwp'
  if (ext === 'hwpx') return 'hwpx'

  return 'unknown'
}

/**
 * MIME 타입으로 포맷 감지
 */
export function detectFormatByMimeType(mimeType: string): DocumentFormat {
  if (mimeType.includes('pdf')) return 'pdf'
  if (mimeType.includes('hwp') || mimeType.includes('x-hwp')) return 'hwp'
  if (mimeType.includes('hwpx') || mimeType.includes('x-hwpx')) return 'hwpx'

  return 'unknown'
}

/**
 * 파일 시그니처(매직 넘버)로 포맷 감지
 */
export async function detectFormatBySignature(
  fileBuffer: Buffer
): Promise<FormatDetectionResult> {
  // PDF 시그니처: %PDF
  if (fileBuffer.slice(0, 4).toString() === '%PDF') {
    return {
      format: 'pdf',
      mimeType: 'application/pdf',
      confidence: 'high',
    }
  }

  // HWP 시그니처: HWP Document File
  const hwpSignature = fileBuffer.slice(0, 16).toString('ascii', 0, 16)
  if (hwpSignature.includes('HWP Document File')) {
    return {
      format: 'hwp',
      mimeType: 'application/x-hwp',
      confidence: 'high',
    }
  }

  // HWPX는 ZIP 기반이므로 PK 시그니처 확인
  if (fileBuffer.slice(0, 2).toString() === 'PK') {
    // ZIP 내부에 'Contents/section0.xml' 등이 있으면 HWPX
    const zipHeader = fileBuffer.slice(0, 100).toString('ascii')
    if (zipHeader.includes('section0.xml') || zipHeader.includes('HWPX')) {
      return {
        format: 'hwpx',
        mimeType: 'application/x-hwpx',
        confidence: 'high',
      }
    }
  }

  return {
    format: 'unknown',
    confidence: 'low',
  }
}

/**
 * 종합 포맷 감지 (확장자 + MIME + 시그니처)
 */
export async function detectFormat(
  filename: string,
  mimeType?: string,
  fileBuffer?: Buffer
): Promise<FormatDetectionResult> {
  // 1. 확장자로 감지
  const extFormat = detectFormatByExtension(filename)
  if (extFormat !== 'unknown') {
    return {
      format: extFormat,
      mimeType,
      confidence: 'high',
    }
  }

  // 2. MIME 타입으로 감지
  if (mimeType) {
    const mimeFormat = detectFormatByMimeType(mimeType)
    if (mimeFormat !== 'unknown') {
      return {
        format: mimeFormat,
        mimeType,
        confidence: 'medium',
      }
    }
  }

  // 3. 파일 시그니처로 감지
  if (fileBuffer) {
    const sigResult = await detectFormatBySignature(fileBuffer)
    if (sigResult.format !== 'unknown') {
      return sigResult
    }
  }

  return {
    format: 'unknown',
    mimeType,
    confidence: 'low',
  }
}

