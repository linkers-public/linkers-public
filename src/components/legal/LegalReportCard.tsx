'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Scale, ChevronRight } from 'lucide-react'
import { RAGHighlightedMarkdown } from '@/components/legal/RAGHighlightedText'
import { LegalEvidenceSection, EvidenceDrawer } from '@/components/legal/LegalEvidenceSection'
import type { SituationAnalysisResponse } from '@/types/legal'

interface LegalReportCardProps {
  analysisResult: SituationAnalysisResponse
}

export function LegalReportCard({ analysisResult }: LegalReportCardProps) {
  // 디버깅: criteria 확인
  console.log('🔍 [LegalReportCard] analysisResult:', analysisResult)
  console.log('🔍 [LegalReportCard] criteria:', analysisResult.criteria)
  console.log('🔍 [LegalReportCard] criteria 존재 여부:', !!analysisResult.criteria)
  console.log('🔍 [LegalReportCard] criteria 길이:', analysisResult.criteria?.length || 0)
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
  // summary에서 "## 상황 분석의 결과" 섹션만 추출
  const summaryText = analysisResult.summary || ''
  const sectionMatch = summaryText.match(/##\s*📊\s*상황\s*분석의\s*결과\s*\n([\s\S]*?)(?=##|$)/i) ||
                       summaryText.match(/##\s*상황\s*분석의\s*결과\s*\n([\s\S]*?)(?=##|$)/i) ||
                       summaryText.match(/상황\s*분석의\s*결과\s*\n([\s\S]*?)(?=##|$)/i)
  
  const situationAnalysisContent = sectionMatch ? sectionMatch[1].trim() : summaryText

  // 근거 자료 변환
  const evidenceSources = analysisResult.sources?.map((source) => ({
    sourceId: source.sourceId,
    title: source.title,
    snippet: source.snippet,
    score: source.score,
    fileUrl: source.fileUrl || null,
    sourceType: (source.sourceType || 'law') as 'law' | 'standard_contract' | 'manual' | 'case',
    externalId: source.externalId || null,
  })) || []

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

        {/* 섹션 2: 법적 판단 */}
        {analysisResult.criteria && analysisResult.criteria.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-bold text-slate-900">법적 관점에서 본 현재 상황</h3>
            </div>
            <div className="space-y-3">
              {analysisResult.criteria.map((criterion, idx) => {
                const statusEmoji = criterion.status === 'likely' ? '✅' : criterion.status === 'unclear' ? '⚠️' : '❌'
                const statusLabel = criterion.status === 'likely' ? '충족' : criterion.status === 'unclear' ? '불명확' : '불충분'
                const statusClass = criterion.status === 'likely' 
                  ? 'bg-green-100 text-green-800 border-green-300' 
                  : criterion.status === 'unclear'
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                  : 'bg-red-100 text-red-800 border-red-300'
                
                return (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600 text-white font-bold text-sm flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-slate-900">{criterion.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusClass}`}>
                            {statusEmoji} {statusLabel}
                          </span>
                        </div>
                        <div className="prose prose-slate max-w-none text-xs text-slate-700">
                          <RAGHighlightedMarkdown 
                            content={criterion.reason}
                            sources={analysisResult.sources || []}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <hr className="border-gray-200" />
          </div>
        )}

        {/* 섹션 3: 참고 문헌 (RAG 근거) */}
        {evidenceSources.length > 0 && (
          <LegalEvidenceSection sources={evidenceSources} />
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
    </Card>
  )
}

