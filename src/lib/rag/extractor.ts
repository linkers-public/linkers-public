/**
 * PDF 및 텍스트 추출 모듈
 * PDF→텍스트, 표 파싱, 메타데이터 추출
 */

import pdfParse from 'pdf-parse'

export interface ExtractedMetadata {
  budget?: {
    min?: number
    max?: number
    currency?: string
  }
  period?: {
    months?: number
    startDate?: string
    endDate?: string
  }
  techStack?: string[]
  region?: string
  organization?: string
  deadline?: string
  [key: string]: any
}

export interface ExtractionResult {
  text: string
  metadata: ExtractedMetadata
  tables?: Array<{ headers: string[]; rows: string[][] }>
}

/**
 * PDF 파일에서 텍스트 추출
 */
export async function extractFromPDF(
  fileBuffer: Buffer
): Promise<ExtractionResult> {
  try {
    const data = await pdfParse(fileBuffer)
    const text = data.text

    // 메타데이터 추출
    const metadata = extractMetadata(text)

    // 표 파싱 시도 (간단한 구현)
    const tables = extractTables(text)

    return {
      text,
      metadata,
      tables,
    }
  } catch (error) {
    throw new Error(`PDF 추출 실패: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * URL에서 텍스트 추출 (나중에 구현)
 */
export async function extractFromURL(url: string): Promise<ExtractionResult> {
  // TODO: URL 크롤링 및 텍스트 추출
  throw new Error('URL 추출은 아직 구현되지 않았습니다')
}

/**
 * 텍스트에서 메타데이터 추출 (정규식 기반)
 */
function extractMetadata(text: string): ExtractedMetadata {
  const metadata: ExtractedMetadata = {}

  // 예산 추출 (예: "예산: 5,000만원 ~ 1억원", "총 예산: 100,000,000원")
  const budgetPatterns = [
    /예산[:\s]*([\d,]+)\s*만?원?\s*[~-]\s*([\d,]+)\s*만?원?/i,
    /총\s*예산[:\s]*([\d,]+)\s*만?원?/i,
    /([\d,]+)\s*만?원?\s*[~-]\s*([\d,]+)\s*만?원?/i,
  ]

  for (const pattern of budgetPatterns) {
    const match = text.match(pattern)
    if (match) {
      const parseAmount = (str: string) => {
        const num = parseInt(str.replace(/,/g, ''))
        return str.includes('만') ? num * 10000 : num
      }

      if (match[2]) {
        metadata.budget = {
          min: parseAmount(match[1]),
          max: parseAmount(match[2]),
          currency: 'KRW',
        }
      } else {
        const amount = parseAmount(match[1])
        metadata.budget = {
          min: amount,
          max: amount,
          currency: 'KRW',
        }
      }
      break
    }
  }

  // 기간 추출 (예: "3개월", "6개월 ~ 12개월")
  const periodPatterns = [
    /기간[:\s]*(\d+)\s*개월\s*[~-]\s*(\d+)\s*개월/i,
    /(\d+)\s*개월\s*[~-]\s*(\d+)\s*개월/i,
    /기간[:\s]*(\d+)\s*개월/i,
    /(\d+)\s*개월/i,
  ]

  for (const pattern of periodPatterns) {
    const match = text.match(pattern)
    if (match) {
      metadata.period = {
        months: match[2] ? parseInt(match[2]) : parseInt(match[1]),
      }
      break
    }
  }

  // 기술 스택 추출
  const techKeywords = [
    'React',
    'Vue',
    'Angular',
    'Node.js',
    'Python',
    'Java',
    'Spring',
    'Django',
    'TypeScript',
    'JavaScript',
    'MySQL',
    'PostgreSQL',
    'MongoDB',
    'Docker',
    'Kubernetes',
    'AWS',
    'Azure',
    'GCP',
  ]

  const foundTech: string[] = []
  for (const tech of techKeywords) {
    if (text.includes(tech)) {
      foundTech.push(tech)
    }
  }
  if (foundTech.length > 0) {
    metadata.techStack = foundTech
  }

  // 지역 추출 (예: "서울", "경기", "부산" 등)
  const regionPattern = /(서울|경기|인천|부산|대구|광주|대전|울산|세종|강원|충북|충남|전북|전남|경북|경남|제주)/i
  const regionMatch = text.match(regionPattern)
  if (regionMatch) {
    metadata.region = regionMatch[1]
  }

  // 발주기관 추출
  const orgPatterns = [
    /발주기관[:\s]*([^\n]+)/i,
    /기관명[:\s]*([^\n]+)/i,
    /(국가기관|지방자치단체|공공기관|공기업)/i,
  ]

  for (const pattern of orgPatterns) {
    const match = text.match(pattern)
    if (match) {
      metadata.organization = match[1]?.trim()
      break
    }
  }

  // 마감일 추출
  const deadlinePatterns = [
    /마감일[:\s]*(\d{4}[.-]\d{2}[.-]\d{2})/i,
    /접수마감[:\s]*(\d{4}[.-]\d{2}[.-]\d{2})/i,
    /(\d{4}[.-]\d{2}[.-]\d{2})/,
  ]

  for (const pattern of deadlinePatterns) {
    const match = text.match(pattern)
    if (match) {
      metadata.deadline = match[1]
      break
    }
  }

  return metadata
}

/**
 * 텍스트에서 표 추출 (간단한 구현)
 */
function extractTables(text: string): Array<{ headers: string[]; rows: string[][] }> {
  const tables: Array<{ headers: string[]; rows: string[][] }> = []

  // 간단한 표 패턴 찾기 (실제로는 더 정교한 파싱 필요)
  const tablePattern = /(\|.+\|[\n\r]+)+/g
  const matches = text.match(tablePattern)

  if (matches) {
    for (const match of matches) {
      const lines = match.split(/[\n\r]+/).filter((line) => line.trim())
      if (lines.length > 1) {
        const headers = lines[0]
          .split('|')
          .map((cell) => cell.trim())
          .filter((cell) => cell)
        const rows = lines.slice(1).map((line) =>
          line
            .split('|')
            .map((cell) => cell.trim())
            .filter((cell) => cell)
        )

        if (headers.length > 0 && rows.length > 0) {
          tables.push({ headers, rows })
        }
      }
    }
  }

  return tables
}

