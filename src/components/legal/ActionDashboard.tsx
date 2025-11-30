'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Briefcase, Upload, Phone, Globe, ExternalLink, MapPin, FileText, X, Loader2, CheckCircle2, AlertCircle, Download, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { uploadSituationEvidence, getSituationEvidences, deleteSituationEvidence } from '@/apis/legal.service'
import type { SituationCategory } from '@/types/legal'
import { cn } from '@/lib/utils'

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

interface EvidenceFile {
  id: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  evidence_type: string
  file_path: string
  file_url: string
  created_at: string
}

interface ActionDashboardProps {
  classifiedType: SituationCategory
  analysisId: string | null
  onCopy?: (text: string, description: string) => void
  organizations?: Array<{
    id: string
    name: string
    description: string
    capabilities: string[]
    requiredDocs: string[]
    legalBasis?: string
    website?: string
    phone?: string
  }>
}

export function ActionDashboard({ classifiedType, analysisId, onCopy, organizations: propOrganizations }: ActionDashboardProps) {
  const { toast } = useToast()
  const [checkedEvidence, setCheckedEvidence] = useState<Set<string>>(new Set())
  const [uploadedFiles, setUploadedFiles] = useState<EvidenceFile[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [uploadingFileId, setUploadingFileId] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedEvidenceType, setSelectedEvidenceType] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // 업로드된 파일 목록 불러오기
  const loadUploadedFiles = useCallback(async () => {
    if (!analysisId) return
    
    setIsLoadingFiles(true)
    try {
      const files = await getSituationEvidences(analysisId)
      setUploadedFiles(files)
    } catch (error: any) {
      console.error('파일 목록 불러오기 실패:', error)
      toast({
        title: '파일 목록 불러오기 실패',
        description: error.message || '업로드된 파일 목록을 불러올 수 없습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingFiles(false)
    }
  }, [analysisId, toast])

  // 컴포넌트 마운트 시 및 analysisId 변경 시 파일 목록 불러오기
  useEffect(() => {
    loadUploadedFiles()
  }, [loadUploadedFiles])

  // 파일 업로드 핸들러
  const handleFileUpload = async (file: File, evidenceType?: string) => {
    if (!analysisId) {
      toast({
        title: '분석 ID가 없습니다',
        description: '상황 분석이 완료된 후 파일을 업로드할 수 있습니다.',
        variant: 'destructive',
      })
      return
    }

    // 증거 타입이 선택되지 않았으면 선택 요청
    if (!evidenceType) {
      toast({
        title: '증거 유형 선택 필요',
        description: '증거 자료 유형을 선택해주세요.',
        variant: 'destructive',
      })
      return
    }

    const uploadId = `${Date.now()}_${file.name}`
    setUploadingFileId(uploadId)

    try {
      const result = await uploadSituationEvidence(file, analysisId, evidenceType)
      
      toast({
        title: '업로드 완료',
        description: `${file.name} 파일이 업로드되었습니다.`,
      })

      // 파일 목록 새로고침
      await loadUploadedFiles()
      
      // 체크박스도 자동으로 체크
      const newSet = new Set(checkedEvidence)
      newSet.add(evidenceType)
      setCheckedEvidence(newSet)
    } catch (error: any) {
      console.error('파일 업로드 실패:', error)
      toast({
        title: '업로드 실패',
        description: error.message || '파일 업로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setUploadingFileId(null)
      setSelectedEvidenceType(null)
    }
  }

  // 파일 삭제 핸들러
  const handleFileDelete = async (evidenceId: string, fileName: string) => {
    if (!confirm(`"${fileName}" 파일을 삭제하시겠습니까?`)) {
      return
    }

    try {
      await deleteSituationEvidence(evidenceId)
      toast({
        title: '삭제 완료',
        description: `${fileName} 파일이 삭제되었습니다.`,
      })
      await loadUploadedFiles()
    } catch (error: any) {
      console.error('파일 삭제 실패:', error)
      toast({
        title: '삭제 실패',
        description: error.message || '파일 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  // 드래그 앤 드롭 핸들러
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (!analysisId) {
      toast({
        title: '분석 ID가 없습니다',
        description: '상황 분석이 완료된 후 파일을 업로드할 수 있습니다.',
        variant: 'destructive',
      })
      return
    }

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    // 첫 번째 파일만 처리
    const file = files[0]
    
    // 증거 타입 선택 모달 표시 (간단하게 첫 번째 EVIDENCE_DOCS 사용)
    // 실제로는 모달로 선택하게 하는 것이 좋지만, 여기서는 드롭존에 직접 업로드할 때는
    // 증거 타입을 선택할 수 있도록 UI를 추가해야 함
    // 일단은 사용자가 직접 버튼으로 업로드하도록 안내
    toast({
      title: '증거 유형 선택 필요',
      description: '드래그 앤 드롭 대신 각 항목의 업로드 버튼을 사용해주세요.',
      variant: 'default',
    })
  }, [analysisId, toast])

  // 파일 선택 핸들러 (증거 타입과 함께)
  const handleFileSelect = useCallback((evidenceType: string) => {
    setSelectedEvidenceType(evidenceType)
    fileInputRef.current?.click()
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !selectedEvidenceType) return

    const file = files[0]
    handleFileUpload(file, selectedEvidenceType)
    
    // input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [selectedEvidenceType])

  const toggleCheckItem = (itemKey: string) => {
    const newSet = new Set(checkedEvidence)
    if (newSet.has(itemKey)) {
      newSet.delete(itemKey)
    } else {
      newSet.add(itemKey)
    }
    setCheckedEvidence(newSet)
  }

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '알 수 없음'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  // 기관별 주소 및 좌표 정보
  const getOrgInfo = (orgId: string) => {
    const orgInfoMap: Record<string, { address: string; lat: number; lng: number; name: string }> = {
      moel: {
        address: '서울특별시 중구 세종대로 209',
        lat: 37.5651,
        lng: 126.9890,
        name: '서울지방고용노동청'
      },
      moel_complaint: {
        address: '서울특별시 중구 세종대로 209',
        lat: 37.5651,
        lng: 126.9890,
        name: '고용노동부 고객상담센터'
      },
      comwel: {
        address: '대전광역시 서구 둔산로 100',
        lat: 36.3504,
        lng: 127.3845,
        name: '근로복지공단'
      },
      human_rights: {
        address: '서울특별시 종로구 세종대로 209',
        lat: 37.5665,
        lng: 126.9780,
        name: '국가인권위원회'
      },
      labor_attorney: {
        address: '전국 각 지역 노무사 사무실',
        lat: 37.5665,
        lng: 126.9780,
        name: '노무사'
      },
    }
    return orgInfoMap[orgId] || { address: '주소 정보 없음', lat: 37.5665, lng: 126.9780, name: orgId }
  }

  // 기관별 주소 반환
  const getOrgAddress = (orgId: string): string => {
    return getOrgInfo(orgId).address + ' (도보·버스 가능)'
  }

  // 카카오맵 Static Map 이미지 URL 생성
  const getMapImageUrl = (orgId: string): string => {
    const info = getOrgInfo(orgId)
    const width = 400
    const height = 300
    const level = 3 // 줌 레벨 (1-14, 작을수록 넓은 범위)
    
    // 카카오맵 Static Map API 사용 (API 키 필요)
    // 환경변수에서 API 키 가져오기
    const kakaoApiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY
    
    if (kakaoApiKey) {
      // 카카오맵 Static Map API 사용
      return `https://dapi.kakao.com/v2/maps/staticmap?center=${info.lat},${info.lng}&level=${level}&size=${width}x${height}&markers=size:mid,color:red,label:${encodeURIComponent(info.name)}|${info.lat},${info.lng}`
    }
    
    // API 키가 없을 경우: 카카오맵 공개 이미지 서비스 사용
    // 참고: 이 방법은 제한적일 수 있음
    // 실제 프로덕션에서는 카카오맵 API 키를 발급받아 사용하는 것을 권장합니다
    return `https://map2.daum.net/map/mapservice?FORMAT=PNG&SCALE=2&MAKERINFO=0&WIDTH=${width}&HEIGHT=${height}&X=${info.lng}&Y=${info.lat}&LEVEL=${level}`
  }

  // 지도 링크 생성 및 열기
  const handleOpenMap = (org: OrganizationInfo) => {
    const info = getOrgInfo(org.id)
    const mapLinks: Record<string, string> = {
      moel: `https://map.kakao.com/link/map/${encodeURIComponent(info.name)},${info.lat},${info.lng}`,
      moel_complaint: `https://map.kakao.com/link/map/${encodeURIComponent(info.name)},${info.lat},${info.lng}`,
      comwel: `https://map.kakao.com/link/map/${encodeURIComponent(info.name)},${info.lat},${info.lng}`,
      human_rights: `https://map.kakao.com/link/map/${encodeURIComponent(info.name)},${info.lat},${info.lng}`,
      labor_attorney: 'https://map.kakao.com/link/search/노무사',
    }
    
    const link = mapLinks[org.id] || `https://map.kakao.com/link/search/${encodeURIComponent(org.name)}`
    window.open(link, '_blank')
  }

  // 백엔드에서 받은 organizations가 있으면 사용, 없으면 기본값 사용
  const recommendedOrgs = React.useMemo(() => {
    if (propOrganizations && propOrganizations.length > 0) {
      // 백엔드에서 받은 organizations를 OrganizationInfo 형식으로 변환
      return propOrganizations.map(org => {
        const existingOrg = ORGANIZATIONS.find(o => o.id === org.id)
        return {
          ...org,
          icon: existingOrg?.icon || Briefcase
        } as OrganizationInfo
      })
    }
    return getRecommendedOrganizations(classifiedType)
  }, [propOrganizations, classifiedType])
  
  const [selectedOrgIndex, setSelectedOrgIndex] = useState(0)
  const mainOrg = recommendedOrgs[selectedOrgIndex] || recommendedOrgs[0]
  const MainIcon = mainOrg?.icon || Briefcase
  
  // recommendedOrgs가 비어있으면 빈 배열 반환
  if (!mainOrg || recommendedOrgs.length === 0) {
    return null
  }

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
            
            {/* 업로드된 파일 목록 */}
            {isLoadingFiles ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-green-600" />
              </div>
            ) : uploadedFiles.length > 0 ? (
              <div className="space-y-2 mb-4">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{file.file_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{file.evidence_type}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{formatFileSize(file.file_size)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600"
                        onClick={() => {
                          if (file.file_url) {
                            window.open(file.file_url, '_blank')
                          } else {
                            toast({
                              title: '다운로드 URL 없음',
                              description: '파일 다운로드 URL을 생성할 수 없습니다.',
                              variant: 'destructive',
                            })
                          }
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                        onClick={() => handleFileDelete(file.id, file.file_name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

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
                    onClick={() => handleFileSelect(doc)}
                    disabled={!analysisId || uploadingFileId !== null}
                  >
                    {uploadingFileId && selectedEvidenceType === doc ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        업로드 중
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 mr-1" />
                        업로드
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
            
            {/* 숨겨진 파일 입력 */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.hwp,.hwpx,.mp3,.mp4,.wav"
              onChange={handleInputChange}
              className="hidden"
            />

            {/* 파일 드롭 영역 */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => {
                if (!analysisId) {
                  toast({
                    title: '분석 ID가 없습니다',
                    description: '상황 분석이 완료된 후 파일을 업로드할 수 있습니다.',
                    variant: 'destructive',
                  })
                  return
                }
                // 드롭존 클릭 시 첫 번째 증거 타입으로 파일 선택
                if (EVIDENCE_DOCS.length > 0) {
                  handleFileSelect(EVIDENCE_DOCS[0])
                }
              }}
              className={cn(
                "mt-4 p-6 border-2 border-dashed rounded-lg text-center transition-colors cursor-pointer",
                dragActive
                  ? "border-green-500 bg-green-100"
                  : "border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50/30"
              )}
            >
              <Upload className={cn(
                "w-8 h-8 mx-auto mb-2",
                dragActive ? "text-green-600" : "text-gray-400"
              )} />
              <p className="text-sm text-gray-600 font-medium">DROP FILE HERE</p>
              <p className="text-xs text-gray-500 mt-1">또는 클릭하여 파일 선택</p>
              {!analysisId && (
                <p className="text-xs text-red-500 mt-2">⚠️ 상황 분석이 완료된 후 업로드할 수 있습니다</p>
              )}
            </div>
          </div>

          {/* 우측: 지도 및 기관 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">지도 및 기관</h3>
            </div>
            
            {/* 지도 이미지 영역 */}
            <div className="relative h-48 w-full overflow-hidden rounded-3xl bg-sky-50 mb-4">
              {/* 실제 지도 이미지 (카카오맵 Static Map) */}
              <img
                src={getMapImageUrl(mainOrg.id)}
                alt={`${mainOrg.name} 주변 지도`}
                className="h-full w-full object-cover opacity-90"
                onError={(e) => {
                  // 이미지 로드 실패 시 fallback 배경 표시
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = target.nextElementSibling as HTMLElement
                  if (fallback) {
                    fallback.style.display = 'block'
                  }
                }}
              />
              
              {/* 지도 느낌의 그라디언트 배경 (이미지 로드 실패 시 fallback) */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-50 to-sky-100" style={{ display: 'none' }}>
                {/* 지도 느낌의 패턴 */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-blue-300 rounded-lg transform rotate-12"></div>
                  <div className="absolute top-1/2 right-1/4 w-24 h-24 border-2 border-indigo-300 rounded-lg transform -rotate-12"></div>
                  <div className="absolute bottom-1/4 left-1/3 w-20 h-20 border-2 border-sky-300 rounded-lg transform rotate-45"></div>
                  {/* 도로 느낌의 선 */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-200/50 transform -rotate-6"></div>
                  <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-indigo-200/50 transform rotate-3"></div>
                </div>
              </div>
              
              {/* 그라디언트 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-white/10 to-white/40" />
              
              {/* 좌상단 배지 */}
              <div className="absolute left-4 top-4">
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-sky-700 shadow-sm backdrop-blur-sm">
                  지도 미리보기
                </span>
              </div>
              
              {/* 중앙 위치 정보 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center z-10">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md">
                  <MapPin className="w-6 h-6 text-sky-500" />
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {mainOrg.name}
                </p>
                <p className="text-xs text-slate-500">
                  {getOrgAddress(mainOrg.id)}
                </p>
              </div>
              
              {/* 우하단 버튼 */}
              <div className="absolute bottom-4 right-4 z-10">
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-sky-700 shadow-md hover:bg-white transition-colors backdrop-blur-sm"
                  onClick={() => handleOpenMap(mainOrg)}
                >
                  <span>지도에서 열기</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
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
            {recommendedOrgs.length > 1 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 mb-2">기타 추천 기관</p>
                {recommendedOrgs.map((org, index) => {
                  if (index === selectedOrgIndex) return null // 현재 선택된 기관은 제외
                  const OrgIcon = org.icon
                  return (
                    <div 
                      key={org.id} 
                      onClick={() => setSelectedOrgIndex(index)}
                      className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <OrgIcon className="w-4 h-4 text-blue-600" />
                      <span className="flex-1 text-xs text-slate-700 font-medium">{org.name}</span>
                      {org.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation() // 부모 클릭 이벤트 방지
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
