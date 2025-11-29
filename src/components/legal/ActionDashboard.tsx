'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Briefcase, Upload, Phone, Globe, ExternalLink, MapPin } from 'lucide-react'
import type { SituationCategory } from '@/types/legal'

interface OrganizationInfo {
  id: string
  name: string
  description: string
  capabilities: string[]
  requiredDocs: string[]
  legalBasis?: string
  website?: string
  phone?: string
  icon: React.ComponentType<{ className?: string }>
}

const ORGANIZATIONS: OrganizationInfo[] = [
  {
    id: 'moel',
    name: '노동청',
    description: '체불임금 조사 및 시정 명령, 근로기준법 위반 조사',
    capabilities: ['체불임금 조사', '시정 명령', '근로기준법 위반 조사'],
    requiredDocs: ['근로계약서', '출퇴근 기록', '급여명세서'],
    legalBasis: '근로기준법 제110조: 근로감독관의 권한',
    website: 'https://www.moel.go.kr',
    phone: '1350',
    icon: Briefcase,
  },
  {
    id: 'labor_attorney',
    name: '노무사',
    description: '상담 및 소송 대리, 근로 분쟁 해결 전문',
    capabilities: ['상담', '소송 대리', '근로 분쟁 해결'],
    requiredDocs: ['근로계약서', '문자/카톡 대화', '기타 증거 자료'],
    legalBasis: '노무사법: 근로 분쟁 전문 법률 서비스',
    icon: Briefcase,
  },
  {
    id: 'comwel',
    name: '근로복지공단',
    description: '연차수당, 휴일수당, 실업급여 상담',
    capabilities: ['연차수당 상담', '휴일수당 상담', '실업급여 안내'],
    requiredDocs: ['근로계약서', '출퇴근 기록', '급여명세서'],
    legalBasis: '근로기준법 제60조: 연차 유급휴가',
    website: 'https://www.comwel.or.kr',
    phone: '1588-0075',
    icon: Briefcase,
  },
  {
    id: 'moel_complaint',
    name: '고용노동부 고객상담센터',
    description: '직장 내 괴롭힘, 차별 상담 및 조사, 고용·노동 전반 상담',
    capabilities: ['직장 내 괴롭힘 상담', '차별 상담', '조사 지원', '고용·노동 전반 상담'],
    requiredDocs: ['증거 자료', '문자/카톡 대화', '녹음 파일'],
    legalBasis: '직장 내 괴롭힘 방지법 제13조: 고충 처리',
    website: 'https://1350.moel.go.kr/home/hp/main/hpmain.do',
    phone: '1350',
    icon: Briefcase,
  },
  {
    id: 'human_rights',
    name: '국가인권위원회',
    description: '인권 침해 상담 및 조사, 차별 구제',
    capabilities: ['인권 침해 상담', '차별 구제', '조사 및 구제'],
    requiredDocs: ['증거 자료', '차별 사례 기록'],
    legalBasis: '국가인권위원회법: 인권 침해 구제',
    website: 'https://www.humanrights.go.kr',
    phone: '1331',
    icon: Briefcase,
  },
]

const getRecommendedOrganizations = (category: SituationCategory): OrganizationInfo[] => {
  const recommendations: Record<SituationCategory, string[]> = {
    unpaid_wage: ['moel', 'labor_attorney', 'comwel'],
    harassment: ['moel_complaint', 'human_rights', 'labor_attorney'],
    unfair_dismissal: ['moel', 'labor_attorney', 'comwel'],
    overtime: ['moel', 'labor_attorney', 'comwel'],
    probation: ['moel', 'labor_attorney', 'comwel'],
    unknown: ['labor_attorney', 'moel', 'comwel'],
  }
  
  const orgIds = recommendations[category] || recommendations.unknown
  return orgIds.map(id => ORGANIZATIONS.find(org => org.id === id)!).filter(Boolean)
}

const EVIDENCE_DOCS = [
  '근로계약서',
  '출퇴근 기록',
  '급여명세서',
  '문자/카톡 대화',
  '이메일',
  '녹음 파일',
  '사진/동영상',
  '증인 정보',
]

interface ActionDashboardProps {
  classifiedType: SituationCategory
  analysisId: string | null
  onCopy?: (text: string, description: string) => void
}

export function ActionDashboard({ classifiedType, analysisId, onCopy }: ActionDashboardProps) {
  const [checkedEvidence, setCheckedEvidence] = useState<Set<string>>(new Set())

  // 체크박스 상태를 localStorage에서 불러오기
  useEffect(() => {
    if (analysisId && typeof window !== 'undefined') {
      const savedEvidence = localStorage.getItem(`checked_evidence_${analysisId}`)
      if (savedEvidence) {
        try {
          setCheckedEvidence(new Set(JSON.parse(savedEvidence)))
        } catch (e) {
          console.error('증거 자료 체크 상태 불러오기 실패:', e)
        }
      }
    }
  }, [analysisId])

  // 체크박스 상태를 localStorage에 저장
  useEffect(() => {
    if (analysisId && typeof window !== 'undefined' && checkedEvidence.size > 0) {
      localStorage.setItem(`checked_evidence_${analysisId}`, JSON.stringify(Array.from(checkedEvidence)))
    }
  }, [checkedEvidence, analysisId])

  const toggleCheckItem = (itemKey: string) => {
    const newSet = new Set(checkedEvidence)
    if (newSet.has(itemKey)) {
      newSet.delete(itemKey)
    } else {
      newSet.add(itemKey)
    }
    setCheckedEvidence(newSet)
  }

  const recommendedOrgs = getRecommendedOrganizations(classifiedType)
  const mainOrg = recommendedOrgs[0]
  const MainIcon = mainOrg.icon

  return (
    <Card className="border border-gray-100 shadow-lg bg-white">
      <CardHeader className="pb-4 border-b border-gray-100">
        <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <span>실전 대응 대시보드</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 좌측: 증거 보관함 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-bold text-slate-900">증거 보관함</h3>
            </div>
            <div className="space-y-2">
              {EVIDENCE_DOCS.map((doc, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={checkedEvidence.has(doc)}
                    onChange={() => toggleCheckItem(doc)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="flex-1 text-sm text-slate-700">{doc}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-green-300 text-green-700 hover:bg-green-50"
                    onClick={() => {
                      // 파일 업로드 기능 (향후 구현)
                      console.log('파일 업로드:', doc)
                    }}
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    업로드
                  </Button>
                </div>
              ))}
            </div>
            {/* 파일 드롭 영역 */}
            <div className="mt-4 p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center hover:border-green-400 hover:bg-green-50/30 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">DROP FILE HERE</p>
              <p className="text-xs text-gray-500 mt-1">또는 클릭하여 파일 선택</p>
            </div>
          </div>

          {/* 우측: 지도 및 기관 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">지도 및 기관</h3>
            </div>
            
            {/* 지도 이미지 영역 */}
            <div className="bg-slate-100 border border-slate-200 rounded-lg overflow-hidden mb-4" style={{ height: '200px' }}>
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 font-medium">서울지방고용노동청</p>
                  <p className="text-xs text-slate-500 mt-1">지도 이미지 영역</p>
                </div>
              </div>
            </div>

            {/* 메인 추천 기관 */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <MainIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">우선순위 1위</span>
                    <h4 className="font-bold text-slate-900">{mainOrg.name}</h4>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">{mainOrg.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {mainOrg.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (onCopy) {
                            onCopy(mainOrg.phone || '', '전화번호가 복사되었습니다')
                          }
                        }}
                        className="h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        {mainOrg.phone}
                      </Button>
                    )}
                    {mainOrg.website && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(mainOrg.website, '_blank')}
                        className="h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Globe className="w-3 h-3 mr-1" />
                        웹사이트
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 기타 추천 기관 */}
            {recommendedOrgs.slice(1).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 mb-2">기타 추천 기관</p>
                {recommendedOrgs.slice(1).map((org) => {
                  const OrgIcon = org.icon
                  return (
                    <div key={org.id} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
                      <OrgIcon className="w-4 h-4 text-blue-600" />
                      <span className="flex-1 text-xs text-slate-700 font-medium">{org.name}</span>
                      {org.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (onCopy) {
                              onCopy(org.phone || '', '전화번호가 복사되었습니다')
                            }
                          }}
                          className="h-6 text-xs text-blue-600 hover:bg-blue-50"
                        >
                          <Phone className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
