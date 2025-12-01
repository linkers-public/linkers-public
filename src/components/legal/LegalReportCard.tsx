'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Scale, ChevronRight, ExternalLink, BookOpen } from 'lucide-react'
import { RAGHighlightedMarkdown } from '@/components/legal/RAGHighlightedText'
import { EvidenceDrawer } from '@/components/legal/LegalEvidenceSection'
import { LegalBasisModal, type LegalBasisDetail } from '@/components/legal/LegalBasisModal'
import type { SituationAnalysisResponse } from '@/types/legal'

interface LegalReportCardProps {
  analysisResult: SituationAnalysisResponse
  onCopy?: (text: string, description: string) => void
}

export function LegalReportCard({ analysisResult, onCopy }: LegalReportCardProps) {
  // 디버깅: criteria 확인
  console.log('🔍 [LegalReportCard] analysisResult:', analysisResult)
  console.log('🔍 [LegalReportCard] criteria:', analysisResult.criteria)
  console.log('🔍 [LegalReportCard] criteria 존재 여부:', !!analysisResult.criteria)
  console.log('🔍 [LegalReportCard] criteria 길이:', analysisResult.criteria?.length || 0)
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedCriterionIndex, setSelectedCriterionIndex] = useState<number | null>(null)
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false)
  
  // summary에서 "## 상황 분석의 결과" 섹션만 추출
  const summaryText = analysisResult.summary || ''
  const sectionMatch = summaryText.match(/##\s*📊\s*상황\s*분석의\s*결과\s*\n([\s\S]*?)(?=##|$)/i) ||
                       summaryText.match(/##\s*상황\s*분석의\s*결과\s*\n([\s\S]*?)(?=##|$)/i) ||
                       summaryText.match(/상황\s*분석의\s*결과\s*\n([\s\S]*?)(?=##|$)/i)
  
  const situationAnalysisContent = sectionMatch ? sectionMatch[1].trim() : summaryText

  // 근거 자료 변환 (중복 제거 없이 모든 항목 표시)
  const evidenceSources = analysisResult.sources?.map((source) => ({
    sourceId: source.sourceId,
    title: source.title,
    snippet: source.snippet,
    snippetAnalyzed: source.snippetAnalyzed,  // 분석된 결과 포함
    score: source.score,
    fileUrl: source.fileUrl || null,
    sourceType: (source.sourceType || 'law') as 'law' | 'standard_contract' | 'manual' | 'case',
    externalId: source.externalId || null,
  })) || []

  /**
   * SourceItem을 LegalBasisDetail로 변환
   */
  const convertSourcesToLegalBasis = (sources: typeof evidenceSources): LegalBasisDetail[] => {
    return sources.map((source) => ({
      docId: source.sourceId,
      docTitle: source.title,
      docType: source.sourceType,
      snippet: source.snippet,
      similarityScore: source.score,
      fileUrl: source.fileUrl || undefined,
      externalId: source.externalId || undefined,
    }))
  }

  /**
   * 각 criterion에 대한 legalBasis 가져오기
   * criterion에 legalBasis가 있으면 사용, 없으면 fallback으로 모든 sources 사용
   */
  const getLegalBasisForCriterion = (criterionIndex: number): LegalBasisDetail[] => {
    const criterion = analysisResult.criteria?.[criterionIndex]
    if (!criterion) {
      return []
    }
    
    // criterion에 legalBasis가 있으면 사용
    if (criterion.legalBasis && criterion.legalBasis.length > 0) {
      return criterion.legalBasis.map((basis) => ({
        docId: basis.docId,
        docTitle: basis.docTitle,
        docType: basis.docType,
        chunkIndex: basis.chunkIndex,
        article: basis.article,
        snippet: basis.snippet,
        snippetHighlight: basis.snippetHighlight,
        reason: basis.reason,
        explanation: basis.explanation,
        similarityScore: basis.similarityScore,
        fileUrl: basis.fileUrl,
        externalId: basis.externalId,
      }))
    }
    
    // fallback: 모든 sources를 반환
    return convertSourcesToLegalBasis(evidenceSources)
  }

  return (
    <Card className="border border-gray-100 shadow-lg bg-white">
      <CardHeader className="pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span>AI 법률 진단 리포트</span>
          </CardTitle>
          {/* 헤더 우측: 근거 자료 전체 보기 버튼 */}
          {evidenceSources.length > 0 && (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 transition-colors"
            >
              <span>근거 자료 전체 보기 ({evidenceSources.length}건)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* 섹션 1: 상황 분석 */}
        {situationAnalysisContent && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">상황 분석</h3>
            </div>
            <div className="prose prose-slate max-w-none text-sm leading-relaxed">
              <RAGHighlightedMarkdown 
                content={situationAnalysisContent}
                sources={analysisResult.sources || []}
              />
            </div>
            <hr className="border-gray-200" />
          </div>
        )}

        {/* 섹션 2: 법적 관점 (summary의 ⚖️ 섹션) */}
        {(() => {
          // summary에서 "## ⚖️ 법적 관점에서 본 현재상황" 섹션 추출
          const legalSectionMatch = summaryText.match(/##\s*⚖️\s*법적\s*관점에서\s*본\s*현재상황\s*\n([\s\S]*?)(?=##|$)/i) ||
                                   summaryText.match(/##\s*⚖️\s*법적\s*관점\s*\n([\s\S]*?)(?=##|$)/i) ||
                                   summaryText.match(/##\s*법적\s*관점에서\s*본\s*현재상황\s*\n([\s\S]*?)(?=##|$)/i)
          const legalViewContent = legalSectionMatch ? legalSectionMatch[1].trim() : null
          
          // 기본값 텍스트 필터링
          const isDefaultText = legalViewContent === '해당 섹션 내용을 확인하는 중입니다.' || 
                                legalViewContent === '관련 법령을 확인하여 현재 상황을 법적으로 평가해야 합니다.'
          
          if (legalViewContent && !isDefaultText) {
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-bold text-slate-900">법적 관점에서 본 현재 상황</h3>
                </div>
                <div className="prose prose-slate max-w-none text-sm leading-relaxed">
                  <RAGHighlightedMarkdown 
                    content={legalViewContent}
                    sources={analysisResult.sources || []}
                  />
                </div>
                <hr className="border-gray-200" />
              </div>
            )
          }
          return null
        })()}

        {/* 섹션 3: 법적 판단 기준 (새 API 형식) */}
        {analysisResult.criteria && analysisResult.criteria.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-bold text-slate-900">법적 판단 기준</h3>
            </div>
            <div className="space-y-3">
              {analysisResult.criteria.map((criterion: any, idx: number) => {
                // 새로운 API 형식: documentTitle, fileUrl, sourceType, similarityScore, snippet, usageReason
                const documentTitle = criterion.documentTitle || criterion.name || '문서 제목 없음'
                const fileUrl = criterion.fileUrl || null
                const sourceType = criterion.sourceType || 'law'
                const similarityScore = criterion.similarityScore || 0
                const snippet = criterion.snippet || ''
                const usageReason = criterion.usageReason || criterion.reason || ''
                
                // sourceType에 따른 라벨 및 아이콘
                const getSourceTypeLabel = (type: string) => {
                  switch (type) {
                    case 'standard_contract':
                      return '표준 계약서'
                    case 'law':
                      return '법령'
                    case 'manual':
                      return '가이드라인'
                    case 'case':
                      return '판례'
                    default:
                      return type
                  }
                }
                
                const getSourceTypeColor = (type: string) => {
                  switch (type) {
                    case 'standard_contract':
                      return 'bg-blue-100 text-blue-800 border-blue-300'
                    case 'law':
                      return 'bg-purple-100 text-purple-800 border-purple-300'
                    case 'manual':
                      return 'bg-green-100 text-green-800 border-green-300'
                    case 'case':
                      return 'bg-orange-100 text-orange-800 border-orange-300'
                    default:
                      return 'bg-slate-100 text-slate-800 border-slate-300'
                  }
                }
                
                return (
                  <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      {/* 번호 뱃지 */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600 text-white font-bold text-sm flex items-center justify-center">
                        {idx + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* 문서 제목 + 소스 타입 배지 */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="font-semibold text-slate-900 flex-1 min-w-0 break-words">
                            {documentTitle}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${getSourceTypeColor(sourceType)}`}>
                            {getSourceTypeLabel(sourceType)}
                          </span>
                          {similarityScore > 0 && (
                            <span className="text-xs text-slate-500 flex-shrink-0">
                              유사도: {(similarityScore * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                        
                        {/* 사용 이유 (usageReason) */}
                        {usageReason && usageReason.trim() ? (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-slate-600 mb-1">판단 근거:</p>
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {usageReason}
                            </p>
                          </div>
                        ) : null}
                        
                        {/* 스니펫 (snippet) */}
                        {snippet && snippet.trim() ? (
                          <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-xs font-semibold text-slate-600 mb-1">관련 조항:</p>
                            <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">
                              {snippet}
                            </p>
                          </div>
                        ) : null}
                        
                        {/* 파일 다운로드 버튼 */}
                        {fileUrl && (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                          >
                            <span>원본 문서 보기</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <hr className="border-gray-200" />
          </div>
        )}

        {/* 섹션 4: 참고 문헌 및 관련 사례 */}
        {((analysisResult.relatedCases && analysisResult.relatedCases.length > 0) || evidenceSources.length > 0) && (
          <div className="space-y-4">
            {(() => {
              // 참고 문헌 및 관련 사례 섹션 데이터 로그
              console.log('📚 [LegalReportCard] 참고 문헌 및 관련 사례 섹션 데이터:')
              console.log('📚 [LegalReportCard] relatedCases:', analysisResult.relatedCases)
              console.log('📚 [LegalReportCard] relatedCases 개수:', analysisResult.relatedCases?.length || 0)
              console.log('📚 [LegalReportCard] evidenceSources:', evidenceSources)
              console.log('📚 [LegalReportCard] evidenceSources 개수:', evidenceSources.length)
              if (analysisResult.relatedCases && analysisResult.relatedCases.length > 0) {
                console.log('📚 [LegalReportCard] 대표 근거 케이스 (relatedCases[0]):', analysisResult.relatedCases[0])
              }
              evidenceSources.forEach((source, idx) => {
                console.log(`📚 [LegalReportCard] evidenceSources[${idx}]:`, {
                  sourceId: source.sourceId,
                  title: source.title,
                  sourceType: source.sourceType,
                  score: source.score,
                  fileUrl: source.fileUrl,
                  snippet: source.snippet?.substring(0, 100) + '...',
                })
              })
              return null
            })()}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900">참고 문헌 및 관련 사례</h3>
              </div>
              {evidenceSources.length > 0 && (
                <button
                  onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 transition-colors"
                >
                  <span>출처 문서 더보기</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isSourcesExpanded ? 'rotate-90' : ''}`} />
                </button>
              )}
            </div>

            {/* 대표 근거 케이스 3개 (1*3 그리드) */}
            {analysisResult.relatedCases && analysisResult.relatedCases.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {analysisResult.relatedCases.slice(0, 3).map((relatedCase, idx) => {
                  const analyzed = relatedCase.summaryAnalyzed
                  return (
                    <div key={idx} className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-purple-600 text-white text-xs font-semibold rounded">
                          대표 근거 케이스
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-2 text-sm line-clamp-2">{relatedCase.title}</h4>
                      
                      {/* 분석된 결과가 있으면 표시, 없으면 원본 summary */}
                      {analyzed ? (
                        <div className="space-y-2 mb-3">
                          {analyzed.core_clause && (
                            <div className="text-xs font-semibold text-purple-700">
                              📌 {analyzed.core_clause}
                            </div>
                          )}
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {analyzed.easy_summary}
                          </p>
                          {analyzed.action_tip && (
                            <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                              💡 {analyzed.action_tip}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-700 mb-3 line-clamp-3">{relatedCase.summary}</p>
                      )}
                      
                      {relatedCase.fileUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => relatedCase.fileUrl && window.open(relatedCase.fileUrl, '_blank')}
                          className="w-full text-xs"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          문서 보기
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* sources 리스트 (토글로 표시) */}
            {evidenceSources.length > 0 && isSourcesExpanded && (
              <div className="space-y-3 mt-4">
                <h4 className="font-semibold text-slate-900 mb-3">관련 법령 및 가이드라인</h4>
                {evidenceSources.map((source, idx) => {
                  const sourceTypeLabels = {
                    law: '법령',
                    manual: '매뉴얼',
                    standard_contract: '표준계약서',
                    case: '사례',
                  }
                  const sourceTypeColors = {
                    law: 'bg-blue-100 text-blue-800 border-blue-300',
                    manual: 'bg-green-100 text-green-800 border-green-300',
                    standard_contract: 'bg-orange-100 text-orange-800 border-orange-300',
                    case: 'bg-purple-100 text-purple-800 border-purple-300',
                  }
                  
                  return (
                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${sourceTypeColors[source.sourceType] || sourceTypeColors.law}`}>
                          {sourceTypeLabels[source.sourceType] || '법령'}
                        </span>
                        <div className="flex-1">
                          <h5 className="font-semibold text-slate-900 mb-1">{source.title}</h5>
                          
                          {/* 분석된 결과가 있으면 표시, 없으면 원본 snippet */}
                          {source.snippetAnalyzed ? (
                            <div className="space-y-2 mb-2">
                              {source.snippetAnalyzed.core_clause && (
                                <div className="text-xs font-semibold text-blue-700">
                                  📌 {source.snippetAnalyzed.core_clause}
                                </div>
                              )}
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {source.snippetAnalyzed.easy_summary}
                              </p>
                              {source.snippetAnalyzed.action_tip && (
                                <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                  💡 {source.snippetAnalyzed.action_tip}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-600 line-clamp-2 mb-2">{source.snippet}</p>
                          )}
                          
                          {source.fileUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => source.fileUrl && window.open(source.fileUrl, '_blank')}
                              className="h-7 text-xs"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              문서 보기
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 하단 안내 */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-slate-500 italic">
            ⚠️ 실제 법률 자문이 아닌, 공개된 가이드와 사례를 바탕으로 한 1차 정보입니다.
          </p>
        </div>
      </CardContent>

      {/* 근거 자료 Drawer */}
      {evidenceSources.length > 0 && (
        <EvidenceDrawer
          sources={evidenceSources}
          isOpen={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
        />
      )}

      {/* 법적 근거 모달 */}
      {selectedCriterionIndex !== null && analysisResult.criteria && analysisResult.criteria[selectedCriterionIndex] && (
        <LegalBasisModal
          isOpen={selectedCriterionIndex !== null}
          onClose={() => setSelectedCriterionIndex(null)}
          issueTitle={analysisResult.criteria[selectedCriterionIndex].name}
          issueStatus={analysisResult.criteria[selectedCriterionIndex].status}
          detailSummary={analysisResult.criteria[selectedCriterionIndex].reason}
          legalBasis={getLegalBasisForCriterion(selectedCriterionIndex)}
        />
      )}
    </Card>
  )
}

