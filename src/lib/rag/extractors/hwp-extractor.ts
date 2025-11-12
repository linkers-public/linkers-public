/**
 * HWP 추출 모듈
 * HWP 파일에서 텍스트 및 구조 추출
 */

export interface HWPBlock {
  type: 'paragraph' | 'table' | 'list' | 'caption' | 'attachment'
  text: string
  metadata?: {
    section?: string
    level?: number
    tableRows?: number
    tableCols?: number
  }
}

export interface HWPExtractionResult {
  text: string
  blocks: HWPBlock[]
  metadata: {
    title?: string
    author?: string
    createdDate?: string
    attachments?: string[]
  }
}

/**
 * HWP 파일 추출 (외부 서비스 호출)
 * 
 * 해커톤용: FastAPI + pyhwp 마이크로서비스 호출
 * 프로덕션: Edge Function 또는 별도 서비스
 */
export async function extractFromHWP(
  fileBuffer: Buffer,
  filename: string
): Promise<HWPExtractionResult> {
  // 옵션 1: 외부 HWP 변환 서비스 호출
  const hwpServiceUrl = process.env.HWP_CONVERTER_SERVICE_URL

  if (hwpServiceUrl) {
    try {
      // FormData 생성 (Node.js 환경)
      const FormData = (await import('form-data')).default
      const formData = new FormData()
      formData.append('file', fileBuffer, {
        filename,
        contentType: 'application/x-hwp',
      })

      const response = await fetch(`${hwpServiceUrl}/convert`, {
        method: 'POST',
        body: formData as any,
        headers: formData.getHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HWP 변환 서비스 오류: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return {
        text: data.text || '',
        blocks: data.blocks || [],
        metadata: data.metadata || {},
      }
    } catch (error) {
      console.error('HWP 변환 서비스 호출 실패:', error)
      throw error
    }
  }

  // 옵션 2: 개발 환경 Mock (해커톤용)
  if (process.env.NODE_ENV === 'development') {
    console.warn('HWP 변환 서비스가 설정되지 않았습니다. Mock 데이터를 사용합니다.')
    return {
      text: `[HWP 파일: ${filename}]\n\n이 파일은 HWP 형식입니다. 실제 변환을 위해 HWP_CONVERTER_SERVICE_URL을 설정하거나 PDF로 변환 후 업로드해주세요.`,
      blocks: [
        {
          type: 'paragraph',
          text: 'HWP 파일 내용 (Mock)',
        },
      ],
      metadata: {
        title: filename,
      },
    }
  }

  // 폴백: 에러 발생
  throw new Error(
    'HWP 추출을 위해 HWP_CONVERTER_SERVICE_URL 환경 변수를 설정하거나, 수동으로 PDF로 변환해주세요.'
  )
}

/**
 * HWP 파일을 PDF로 변환 요청 (폴백)
 */
export async function requestHWPConversion(
  fileBuffer: Buffer,
  filename: string
): Promise<{ needsConversion: true; message: string }> {
  // Storage에 원본 저장 후 변환 요청 플래그 설정
  return {
    needsConversion: true,
    message: 'HWP 파일은 PDF로 변환 후 업로드해주세요. (온라인 변환 도구 사용 가능)',
  }
}
