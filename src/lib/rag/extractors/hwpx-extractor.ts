/**
 * HWPX 추출 모듈
 * HWPX는 ZIP 기반 XML 형식이므로 직접 파싱 가능
 */

// JSZip은 서버 사이드에서만 사용 가능
let JSZip: any = null

// 동적 import (서버 사이드만)
async function getJSZip() {
  if (typeof window === 'undefined' && !JSZip) {
    JSZip = (await import('jszip')).default
  }
  return JSZip
}

export interface HWPXBlock {
  type: 'paragraph' | 'table' | 'list' | 'caption' | 'attachment'
  text: string
  metadata?: {
    section?: string
    level?: number
    tableRows?: number
    tableCols?: number
  }
}

export interface HWPXExtractionResult {
  text: string
  blocks: HWPXBlock[]
  metadata: {
    title?: string
    author?: string
    createdDate?: string
    attachments?: string[]
  }
}

/**
 * HWPX 파일 추출
 * HWPX는 ZIP 압축된 XML 파일이므로 직접 파싱 가능
 */
export async function extractFromHWPX(
  fileBuffer: Buffer
): Promise<HWPXExtractionResult> {
  try {
    const JSZipClass = await getJSZip()
    if (!JSZipClass) {
      throw new Error('JSZip을 사용할 수 없습니다. 서버 사이드에서만 실행 가능합니다.')
    }

    const zip = new JSZipClass()
    const zipFile = await zip.loadAsync(fileBuffer)

    const blocks: HWPXBlock[] = []
    let fullText = ''

    // HWPX 구조: Contents/section0.xml, section1.xml, ...
    const sectionFiles = Object.keys(zipFile.files).filter((name) =>
      name.match(/^Contents\/section\d+\.xml$/)
    )

    // 섹션 파일들을 순서대로 처리
    const sortedSections = sectionFiles.sort((a, b) => {
      const aNum = parseInt(a.match(/section(\d+)\.xml/)?.[1] || '0')
      const bNum = parseInt(b.match(/section(\d+)\.xml/)?.[1] || '0')
      return aNum - bNum
    })

    for (const sectionFile of sortedSections) {
      const sectionContent = await zipFile.files[sectionFile].async('string')

      // 간단한 XML 파싱 (실제로는 더 정교한 파싱 필요)
      const paragraphs = extractParagraphsFromHWPX(sectionContent)
      const tables = extractTablesFromHWPX(sectionContent)

      paragraphs.forEach((para) => {
        blocks.push({
          type: 'paragraph',
          text: para.text,
          metadata: {
            section: sectionFile,
            level: para.level,
          },
        })
        fullText += para.text + '\n'
      })

      tables.forEach((table) => {
        blocks.push({
          type: 'table',
          text: table.text,
          metadata: {
            section: sectionFile,
            tableRows: table.rows,
            tableCols: table.cols,
          },
        })
        fullText += table.text + '\n'
      })
    }

    // 메타데이터 추출
    const metadata = await extractMetadataFromHWPX(zipFile)

    return {
      text: fullText,
      blocks,
      metadata,
    }
  } catch (error) {
    throw new Error(
      `HWPX 추출 실패: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * HWPX XML에서 문단 추출
 */
function extractParagraphsFromHWPX(xmlContent: string): Array<{
  text: string
  level?: number
}> {
  const paragraphs: Array<{ text: string; level?: number }> = []

  // 간단한 정규식 기반 추출 (실제로는 XML 파서 사용 권장)
  const paraRegex = /<hp:p[^>]*>(.*?)<\/hp:p>/gs
  let match

  while ((match = paraRegex.exec(xmlContent)) !== null) {
    const paraXml = match[1]
    // 태그 제거
    const text = paraXml.replace(/<[^>]+>/g, '').trim()
    if (text) {
      paragraphs.push({ text })
    }
  }

  return paragraphs
}

/**
 * HWPX XML에서 표 추출
 */
function extractTablesFromHWPX(xmlContent: string): Array<{
  text: string
  rows: number
  cols: number
}> {
  const tables: Array<{ text: string; rows: number; cols: number }> = []

  // 표 추출 (간단한 구현)
  const tableRegex = /<hp:tbl[^>]*>(.*?)<\/hp:tbl>/gs
  let match

  while ((match = tableRegex.exec(xmlContent)) !== null) {
    const tableXml = match[1]
    const cells = tableXml.match(/<hp:tc[^>]*>(.*?)<\/hp:tc>/gs) || []
    const cellTexts = cells.map((cell) => {
      return cell.replace(/<[^>]+>/g, '').trim()
    })

    if (cellTexts.length > 0) {
      tables.push({
        text: cellTexts.join(' | '),
        rows: Math.ceil(cellTexts.length / 2), // 추정
        cols: 2, // 추정
      })
    }
  }

  return tables
}

/**
 * HWPX에서 메타데이터 추출
 */
async function extractMetadataFromHWPX(
  zipFile: any
): Promise<HWPXExtractionResult['metadata']> {
  const metadata: HWPXExtractionResult['metadata'] = {}

  // Version.xml 또는 다른 메타데이터 파일에서 추출
  const versionFile = zipFile.files['Version.xml']
  if (versionFile) {
    try {
      const versionContent = await versionFile.async('string')
      const titleMatch = versionContent.match(/<dc:title[^>]*>(.*?)<\/dc:title>/)
      if (titleMatch) metadata.title = titleMatch[1]

      const authorMatch = versionContent.match(/<dc:creator[^>]*>(.*?)<\/dc:creator>/)
      if (authorMatch) metadata.author = authorMatch[1]

      const dateMatch = versionContent.match(/<dc:date[^>]*>(.*?)<\/dc:date>/)
      if (dateMatch) metadata.createdDate = dateMatch[1]
    } catch (error) {
      console.warn('메타데이터 추출 실패:', error)
    }
  }

  return metadata
}

