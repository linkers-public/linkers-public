'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Zap, 
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Copy,
  ArrowLeft,
  Scale,
  FileText,
  FolderArchive,
  Edit,
  X,
  Bot,
  User,
  Clock,
  Scroll,
  Briefcase,
  DollarSign,
  Users,
  TrendingUp,
  Sparkles,
  Plus,
  ClipboardList
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { 
  analyzeSituationV2, 
  type SituationRequestV2, 
  chatWithContractV2, 
  getSituationHistoryV2, 
  getContractHistoryV2,
  getSituationAnalysisByIdV2,
  getContractAnalysisV2,
  // 새로운 통합 챗 API
  createChatSession,
  getChatSessions,
  getChatSession,
  saveChatMessage,
  getChatMessages,
  updateChatSession,
  deleteChatSession,
  type ChatSession,
  type ChatMessage as ChatMessageType,
} from '@/apis/legal.service'
import { MarkdownRenderer } from '@/components/rag/MarkdownRenderer'
import { QuickChatMessage } from '@/components/legal/QuickChatMessage'
import { SituationChatMessage } from '@/components/legal/SituationChatMessage'
import { LegalChatMessage } from '@/components/contract/LegalChatMessage'
import { UserMessageWithContext } from '@/components/legal/UserMessageWithContext'
import { ContextSituationList } from '@/components/legal/ContextSituationList'
import { ContextContractList } from '@/components/legal/ContextContractList'
import type { SituationAnalysisResponse } from '@/types/legal'

// 색상 상수 (다른 페이지와 통일)
const PRIMARY_GRADIENT = 'from-blue-600 to-indigo-600'
const PRIMARY_GRADIENT_HOVER = 'hover:from-blue-700 hover:to-indigo-700'

// 공통 유저 ID 가져오기 함수
async function getUserId(): Promise<string | null> {
  const { createSupabaseBrowserClient } = await import('@/supabase/supabase-client')
  const supabase = createSupabaseBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

// 자주 있는 상황 템플릿
const COMMON_SITUATIONS = [
  {
    title: '인턴/수습 해고 통보',
    text: '수습 기간 중 갑작스러운 해고 통보를 받은 경우',
    icon: Briefcase,
    category: 'probation' as const,
    exampleForm: `• 언제부터 이런 일이 발생했는지
예: 2025년 1월부터, 수습 인턴으로 근무 중입니다. 최근 2주 전부터 팀장님이 수습이라서 언제든 내보낼 수 있다고 반복적으로 말하기 시작했습니다.

• 상대방(회사, 팀장, 클라이언트 등)이 누구인지
예: OO회사 인사팀과 팀장 A씨입니다.

• 지금까지 어떤 대화를 나눴는지
예: 갑자기 이번 주까지만 나오라고 통보만 받았고, 구체적인 사유는 없었습니다. 해고 사유를 물어봤지만 명확한 답변을 받지 못했습니다.

• 가지고 있는 증거(카톡, 메일, 녹취 등)가 있는지
예: 해고 통보 카카오톡 메시지와 근로계약서가 있습니다.`,
  },
  {
    title: '무급 야근·추가 근무',
    text: '연장근로 수당 없이 야근이나 추가 근무를 요구받는 경우',
    icon: Clock,
    category: 'overtime' as const,
    exampleForm: `• 언제부터 이런 일이 발생했는지
예: 2024년 10월쯤부터, 거의 매주 회의 때마다 야근을 요구받기 시작했습니다.

• 상대방(회사, 팀장, 클라이언트 등)이 누구인지
예: OO회사와 팀장 B씨입니다.

• 지금까지 어떤 대화를 나눴는지
예: 매일 밤 10시 이후까지 근무하는데, 연장근로 수당은 전혀 지급되지 않습니다. 수당에 대해 물어봤지만 "회사 사정상 어렵다"는 답변만 받았습니다.

• 가지고 있는 증거(카톡, 메일, 녹취 등)가 있는지
예: 야근 요청 카카오톡 메시지와 출퇴근 기록이 있습니다.`,
  },
  {
    title: '임금 체불·수당 미지급',
    text: '월급이나 수당이 지급되지 않거나 지연되는 경우',
    icon: DollarSign,
    category: 'unpaid_wage' as const,
    exampleForm: `• 언제부터 이런 일이 발생했는지
예: 2024년 9월부터 월급 지급이 불규칙해지기 시작했습니다.

• 상대방(회사, 팀장, 클라이언트 등)이 누구인지
예: OO회사 인사팀과 대표 C씨입니다.

• 지금까지 어떤 대화를 나눴는지
예: 계약서에는 매월 25일 지급이라고 되어 있는데, 실제로는 다음 달 초에야 들어옵니다. 월급 지급 지연에 대해 여러 번 문의했지만 "곧 지급하겠다"는 답변만 반복됩니다.

• 가지고 있는 증거(카톡, 메일, 녹취 등)가 있는지
예: 계약서, 급여명세서, 월급 지급 지연 관련 이메일이 있습니다.`,
  },
  {
    title: '직장 내 괴롭힘·모욕 발언',
    text: '상사나 동료로부터 모욕적 발언이나 괴롭힘을 당하는 경우',
    icon: Users,
    category: 'harassment' as const,
    exampleForm: `• 언제부터 이런 일이 발생했는지
예: 2024년 10월쯤부터, 거의 매주 회의 때마다 모욕적인 발언을 듣기 시작했습니다.

• 상대방(회사, 팀장, 클라이언트 등)이 누구인지
예: 팀장 D씨가 주로 그런 발언을 합니다.

• 지금까지 어떤 대화를 나눴는지
예: 팀장 D씨가 팀원들 다 있는 자리에서 특정 사람을 지목해 모욕적인 말을 합니다. "너 같은 사람은 어디 가도 안 된다"는 식의 발언을 반복합니다. 항의했지만 "농담이었다"며 넘어갑니다.

• 가지고 있는 증거(카톡, 메일, 녹취 등)가 있는지
예: 회의 중 모욕 발언 녹취와 관련 증인(동료들)이 있습니다.`,
  },
  {
    title: '프리랜서/용역 대금 미지급',
    text: '프리랜서나 용역 계약에서 대금이 지급되지 않는 경우',
    icon: FileText,
    category: 'unpaid_wage' as const,
    exampleForm: `• 언제부터 이런 일이 발생했는지
예: 2024년 11월부터, 프로젝트 완료 후 대금 지급이 계속 지연되고 있습니다.

• 상대방(회사, 팀장, 클라이언트 등)이 누구인지
예: OO기업과 프로젝트 담당자 E씨입니다.

• 지금까지 어떤 대화를 나눴는지
예: 계약서에는 "프로젝트 완료 후 7일 이내 지급"이라고 되어 있는데, 3개월째 미지급 상태입니다. 대금 지급을 요청했지만 "회계 처리 중"이라는 답변만 반복됩니다.

• 가지고 있는 증거(카톡, 메일, 녹취 등)가 있는지
예: 용역계약서, 프로젝트 완료 확인서, 대금 지급 요청 이메일이 있습니다.`,
  },
  {
    title: '스톡옵션/성과급 관련 문제',
    text: '스톡옵션이나 성과급 관련 약속이 지켜지지 않는 경우',
    icon: TrendingUp,
    category: 'unknown' as const,
    exampleForm: `• 언제부터 이런 일이 발생했는지
예: 입사 시(2023년 3월) 스톡옵션을 받기로 약속받았는데, 2년이 지나도 지급되지 않았습니다.

• 상대방(회사, 팀장, 클라이언트 등)이 누구인지
예: OO스타트업과 대표 F씨입니다.

• 지금까지 어떤 대화를 나눴는지
예: 계약서에는 명시되어 있지 않고, 구두로만 약속받았습니다. 스톡옵션 지급에 대해 물어봤지만 "회사 상황을 봐야 한다"는 답변만 받았습니다.

• 가지고 있는 증거(카톡, 메일, 녹취 등)가 있는지
예: 입사 시 스톡옵션 약속 관련 이메일과 증인(동료들)이 있습니다.`,
  },
]


// 메시지 타입 정의
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  reportId?: string // 리포트가 생성된 경우 리포트 ID
  context_type?: 'none' | 'situation' | 'contract'
  context_id?: string | null
}

// 리포트 타입 정의 (Supabase와 호환)
interface Report {
  id: string
  question: string
  answer: string
  legalBasis: string[]
  recommendations: string[]
  riskScore?: number
  tags?: string[] // 유형 태그
  createdAt: Date
  expiresAt?: Date // Supabase에서는 만료일 없음 (선택사항)
}

// 대화 세션 타입
interface ConversationSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
  sessionId: string  // legal_chat_sessions의 ID
}

// 컨텍스트 타입 정의
type ChatContextType = 'none' | 'situation' | 'contract'

interface ChatContext {
  type: ChatContextType
  id: string | null      // situation_analyses.id or contract_analyses.id
  label?: string         // UI 표시용 (예: "편의점 야간 알바 상황", "김인턴 계약서")
}

// 컨텍스트 링크 정보 생성 유틸 함수 (메모이제이션)
const getContextLink = (message: ChatMessage): { href: string; label: string; badge: string } | null => {
  if (!message.context_type || !message.context_id || message.context_type === 'none') {
    return null
  }

  if (message.context_type === 'situation') {
    return {
      href: `/legal/situation/${message.context_id}`,
      label: '상황 분석 리포트 보러가기',
      badge: '상황분석'
    }
  }

  if (message.context_type === 'contract') {
    return {
      href: `/legal/contract/${message.context_id}`,
      label: '계약서 분석 리포트 보러가기',
      badge: '계약서분석'
    }
  }

  return null
}


export default function QuickAssistPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isUserScrollingRef = useRef(false)
  const shouldAutoScrollRef = useRef(true)

  // URL 쿼리 파라미터에서 context 정보 가져오기
  const contextType = searchParams.get('contextType') as 'none' | 'situation' | 'contract' | null
  const contextId = searchParams.get('contextId')
  const prefilledQuestion = searchParams.get('question')

  const [inputMessage, setInputMessage] = useState(prefilledQuestion || '')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hasInitialGreeting, setHasInitialGreeting] = useState(false)
  const [conversations, setConversations] = useState<ConversationSession[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [isLoadingReports, setIsLoadingReports] = useState(false)
  const [situationAnalysis, setSituationAnalysis] = useState<SituationAnalysisResponse | null>(null)
  const [situationContext, setSituationContext] = useState<{
    summary: string
    details: string
    categoryHint: string
    employmentType?: string
    workPeriod?: string
    socialInsurance?: string
  } | null>(null)
  // 🔥 컨텍스트 상태 추가
  const [currentContext, setCurrentContext] = useState<ChatContext>({
    type: 'none',
    id: null,
  })
  const [showContextSelector, setShowContextSelector] = useState(false)
  const [contextSelectorType, setContextSelectorType] = useState<'situation' | 'contract' | null>(null)
  const [openReportMenu, setOpenReportMenu] = useState(false) // + 버튼 메뉴 열림 상태
  // 리포트 정보 캐시 (context_id -> 리포트 정보)
  const [reportCache, setReportCache] = useState<Map<string, { title: string; summary: string; type: 'situation' | 'contract' }>>(new Map())
  

  // localStorage 및 DB에서 대화 내역 로드
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const loadConversations = async () => {
      try {
        // 1. localStorage에서 대화 로드 (즉시 표시)
        const stored = localStorage.getItem('legal_assist_conversations')
        let localConversations: ConversationSession[] = []
        
        if (stored) {
          const parsed = JSON.parse(stored)
          localConversations = parsed.map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
            messages: s.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
          }))
          
          // localStorage 데이터를 먼저 표시 (빠른 초기 렌더링)
          setConversations(localConversations)
          
          // 최근 대화가 있으면 자동으로 선택
          if (localConversations.length > 0 && !selectedConversationId) {
            const latestConversation = localConversations.sort((a, b) => 
              b.createdAt.getTime() - a.createdAt.getTime()
            )[0]
            setSelectedConversationId(latestConversation.id)
          }
        }

        // 2. DB에서 상황 분석 히스토리 가져오기 (백그라운드 동기화)
        try {
          const userId = await getUserId()

          if (userId) {
            const dbConversations: ConversationSession[] = []
            
            // 2-1. 새 테이블 구조에서 챗 세션 로드 (legal_chat_sessions)
            // 성능 최적화: 최근 20개 세션만 로드 (초기 로드)
            try {
              const chatSessions = await getChatSessions(userId, 20, 0)
              
              // 병렬 처리: 각 세션의 메시지를 동시에 가져오기
              // 성능 최적화: 최대 10개 세션만 동시에 처리 (너무 많으면 타임아웃 위험)
              const BATCH_SIZE = 10
              const batches: ChatSession[][] = []
              for (let i = 0; i < chatSessions.length; i += BATCH_SIZE) {
                batches.push(chatSessions.slice(i, i + BATCH_SIZE))
              }
              
              // 배치별로 순차 처리 (각 배치는 병렬)
              for (const batch of batches) {
                const chatSessionPromises = batch.map(async (session: ChatSession) => {
                  try {
                    // 타임아웃 추가 (5초)
                    const timeoutPromise = new Promise((_, reject) => {
                      setTimeout(() => reject(new Error('타임아웃')), 5000)
                    })
                    
                    const messagesPromise = getChatMessages(session.id, userId)
                    const messages = await Promise.race([messagesPromise, timeoutPromise]) as any
                    
                    if (!messages || messages.length === 0) {
                      return null
                    }
                    
                    // 메시지를 ChatMessage 형식으로 변환
                    const chatMessages: ChatMessage[] = messages
                      .sort((a: any, b: any) => a.sequence_number - b.sequence_number)
                      .map((msg: any) => ({
                        id: msg.id,
                        role: msg.sender_type,
                        content: msg.message,
                        timestamp: new Date(msg.created_at),
                        context_type: (msg.context_type as 'none' | 'situation' | 'contract') || 'none',
                        context_id: msg.context_id || null,
                      }))
                    
                    // 대화 세션 생성
                    const conversation: ConversationSession = {
                      id: `session-${session.id}`,
                      sessionId: session.id,
                      title: session.title || '대화',
                      messages: chatMessages,
                      createdAt: new Date(session.created_at),
                      updatedAt: new Date(session.updated_at),
                    }
                    
                    return conversation
                  } catch (error) {
                    console.warn(`챗 메시지 조회 실패 (session_id: ${session.id}):`, error)
                    return null
                  }
                })
                
                const batchResults = await Promise.all(chatSessionPromises)
                for (const result of batchResults) {
                  if (result) {
                    dbConversations.push(result)
                  }
                }
              }
            } catch (error) {
              console.warn('새 챗 세션 로드 실패, 레거시만 사용:', error)
            }
            
            
            // 3. localStorage와 DB 대화 병합
            // DB 대화와 localStorage 대화 병합 (ID 중복 제거)
            const mergedConversations: ConversationSession[] = []
            const idSet = new Set<string>()  // ID 중복 방지
            
            // DB 대화를 먼저 추가 (최신 데이터)
            for (const dbConv of dbConversations) {
              if (!idSet.has(dbConv.id)) {
                idSet.add(dbConv.id)
                mergedConversations.push(dbConv)
              }
            }
            
            // localStorage 대화 추가 (ID 중복 체크)
            for (const localConv of localConversations) {
              if (!idSet.has(localConv.id)) {
                idSet.add(localConv.id)
                mergedConversations.push(localConv)
              }
            }
            
            // 생성일 기준으로 정렬 (최신순)
            mergedConversations.sort((a, b) => 
              b.createdAt.getTime() - a.createdAt.getTime()
            )
            
            // DB 동기화 결과로 업데이트 (이미 localStorage 데이터는 표시됨)
            setConversations(mergedConversations)
            
            // localStorage 업데이트 (DB 데이터 포함, DB 삭제 반영)
            localStorage.setItem('legal_assist_conversations', JSON.stringify(mergedConversations))
            
            // 최근 대화가 있으면 자동으로 선택 (아직 선택되지 않은 경우만)
            if (mergedConversations.length > 0 && !selectedConversationId) {
              const latestConversation = mergedConversations[0]
              setSelectedConversationId(latestConversation.id)
            }
          } else {
            // 사용자 ID가 없으면 localStorage만 사용 (이미 표시됨)
            // 추가 작업 없음
          }
        } catch (dbError) {
          console.warn('DB에서 대화 로드 실패, localStorage만 사용:', dbError)
          setConversations(localConversations)
        }

        // 4. 상황 분석 결과 확인 (situation 페이지에서 전달된 경우)
        const situationData = localStorage.getItem('legal_situation_for_quick')
        if (situationData) {
          try {
            const parsed = JSON.parse(situationData)
            if (parsed.analysisResult) {
              setSituationAnalysis(parsed.analysisResult)
              setSituationContext({
                summary: parsed.summary || '',
                details: parsed.details || '',
                categoryHint: parsed.categoryHint || 'unknown',
                employmentType: parsed.employmentType,
                workPeriod: parsed.workPeriod,
                socialInsurance: parsed.socialInsurance,
              })
              
              // 자동으로 대화 세션 생성
              // DB에서 이미 저장된 메시지가 있는지 확인
              let dbMessages: ChatMessage[] = []
              if (parsed.situationAnalysisId) {
                try {
                  const userId = await getUserId()
                  
                  // 새 테이블 구조에서는 이 부분이 필요 없음 (세션 기반으로 로드)
                } catch (error) {
                  console.warn('DB에서 메시지 조회 실패, 로컬 메시지 사용:', error)
                }
              }
              
              // DB 메시지가 있으면 사용, 없으면 로컬 메시지 생성
              let finalMessages: ChatMessage[] = []
              if (dbMessages.length > 0) {
                // DB 메시지 사용 (트리거가 이미 저장한 메시지)
                finalMessages = dbMessages
              } else {
                // 로컬 메시지 생성 (DB 메시지가 없는 경우에만)
                const userInput = [parsed.summary, parsed.details].filter(Boolean).join('\n\n')
                const aiResponse = parsed.analysisResult.summary || '분석이 완료되었습니다.'
                
                finalMessages = [
                  {
                    id: `msg-${Date.now()}-user`,
                    role: 'user',
                    content: userInput,
                    timestamp: new Date(),
                  },
                  {
                    id: `msg-${Date.now()}-ai`,
                    role: 'assistant',
                    content: aiResponse,
                    timestamp: new Date(),
                    reportId: parsed.situationAnalysisId,
                  }
                ]
              }
              
              // 새 테이블 구조에서는 세션을 찾거나 생성해야 함
              // 여기서는 로컬 메시지만 표시하고, 실제 세션은 메시지 전송 시 생성됨
              const newSessionId = `conv-${Date.now()}`
              const newConversation: ConversationSession = {
                id: newSessionId,
                sessionId: '', // 나중에 생성됨
                title: parsed.summary?.substring(0, 30) || '상황 분석',
                messages: finalMessages,
                createdAt: new Date(),
                updatedAt: new Date(),
              }
              
              // 대화 세션 추가 (중복 제거)
              setConversations((prev) => {
                const filtered = prev.filter(c => c.id !== newConversation.id)
                const updated = [newConversation, ...filtered]
                localStorage.setItem('legal_assist_conversations', JSON.stringify(updated))
                return updated
              })
              setSelectedConversationId(newSessionId)
              setMessages(finalMessages)
              setHasInitialGreeting(true)
              
              // 사용 후 삭제 (한 번만 사용)
              localStorage.removeItem('legal_situation_for_quick')
            }
          } catch (error) {
            console.error('상황 분석 결과 로드 실패:', error)
          }
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error)
      }
    }
    
    loadConversations()
  }, [])

  // contextType과 contextId가 있을 때 상황 분석 결과 불러오기
  useEffect(() => {
    const loadContextData = async () => {
      if (contextType === 'situation' && contextId) {
        try {
          const userId = await getUserId()

          // 상황 분석 결과 불러오기
          const analysis = await getSituationAnalysisByIdV2(contextId, userId)
          // SituationResponseV2를 SituationAnalysisResponse로 변환
          if (analysis && analysis.analysis) {
            const convertedAnalysis: SituationAnalysisResponse = {
              classifiedType: 'unknown', // SituationResponseV2에는 category가 없음
              riskScore: analysis.riskScore || 0,
              summary: analysis.analysis.summary || '',
              criteria: analysis.criteria || [],
              actionPlan: null,
              scripts: analysis.scripts || { toCompany: '', toAdvisor: '' },
              relatedCases: analysis.relatedCases || [],
              sources: analysis.sources || [],
              organizations: analysis.organizations || [],
            }
            setSituationAnalysis(convertedAnalysis)
            
            // 컨텍스트 라벨 세팅
            const title = analysis.analysis?.summary?.substring(0, 30) || '상황 분석'
            setCurrentContext({
              type: 'situation',
              id: contextId,
              label: title,
            })
          }

          // 새 세션 생성
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          }
          if (userId) {
            headers['X-User-Id'] = userId
          }

          const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'}/api/v2/legal/chat/sessions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              initial_context_type: 'situation',
              initial_context_id: contextId,
              title: analysis.analysis?.summary?.substring(0, 30) || '상황 분석',
            }),
          })

          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json()
            setSelectedConversationId(`session-${sessionData.id}`)
          }
        } catch (error) {
          console.error('컨텍스트 데이터 로드 실패:', error)
        }
      }
    }

    loadContextData()
  }, [contextType, contextId])

  // Supabase에서는 만료일이 없으므로 정리 로직 제거

  // 선택된 대화의 메시지 로드 (DB에서 최신 메시지 가져오기)
  useEffect(() => {
    if (selectedConversationId) {
      const conversation = conversations.find(c => c.id === selectedConversationId)
      if (conversation) {
        // 먼저 기존 메시지 표시 (빠른 렌더링)
        if (conversation.messages.length > 0) {
          setMessages(conversation.messages)
          setHasInitialGreeting(true)
        }
        
        let isCancelled = false
        
        const loadLatestMessages = async () => {
          try {
            const { createSupabaseBrowserClient } = await import('@/supabase/supabase-client')
            const userId = await getUserId()
            
            if (isCancelled) return
            
            if (userId && conversation.sessionId) {
              // 타임아웃 추가 (5초)
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('타임아웃')), 5000)
              })
              
              const messagesPromise = getChatMessages(conversation.sessionId, userId)
              const messages = await Promise.race([messagesPromise, timeoutPromise]) as any
                
              if (isCancelled) return
              
              const chatMessages: ChatMessage[] = messages
                .sort((a: any, b: any) => a.sequence_number - b.sequence_number)
                .map((msg: any) => ({
                  id: msg.id,
                  role: msg.sender_type,
                  content: msg.message,
                  timestamp: new Date(msg.created_at),
                  context_type: (msg.context_type as 'none' | 'situation' | 'contract') || 'none',
                  context_id: msg.context_id || null,
                }))
              
              if (isCancelled) return
              
              setConversations((prev) => 
                prev.map((c) => 
                  c.id === selectedConversationId
                    ? { ...c, messages: chatMessages, updatedAt: new Date() }
                    : c
                )
              )
              
              setMessages(chatMessages)
              setHasInitialGreeting(true)
            } else {
              // 세션이 없거나 사용자 ID가 없으면 기존 메시지 사용 (이미 표시됨)
              // 추가 작업 없음
            }
          } catch (error) {
            if (!isCancelled) {
              console.warn('DB에서 최신 메시지 로드 실패, 기존 메시지 사용:', error)
              // 기존 메시지는 이미 표시됨
            }
          }
        }
        
        // 백그라운드에서 최신 메시지 동기화
        loadLatestMessages()
        
        // cleanup 함수: 컴포넌트 언마운트 시 요청 취소
        return () => {
          isCancelled = true
        }
      }
    } else {
      setMessages([])
      setHasInitialGreeting(false)
    }
  }, [selectedConversationId, conversations])

  // 초기 인사말 추가 (상황 분석 결과가 있으면 리포트 표시)
  useEffect(() => {
    // 일반 챗 모드에서는 초기 메시지를 자동으로 추가하지 않음
    // 환영 화면이 계속 표시되도록 함
    // 상황 분석 결과가 있을 때만 초기 메시지 추가
    if (!selectedConversationId && messages.length === 0 && !hasInitialGreeting) {
      if (situationAnalysis && situationContext) {
        // 상황 분석 결과가 있으면 summary 필드의 내용을 그대로 표시
        // summary 필드는 /legal/situation의 프롬프트(build_situation_analysis_prompt)에서 생성된
        // 4개 섹션(📊 상황 분석의 결과, ⚖️ 법적 관점, 🎯 지금 당장 할 수 있는 행동, 💬 이렇게 말해보세요)을 포함
        const reportContent = situationAnalysis.summary || '리포트 내용을 불러올 수 없습니다.'
        
        const initialMessage: ChatMessage = {
          id: `report-${Date.now()}`,
          role: 'assistant',
          content: reportContent,
          timestamp: new Date(),
          context_type: 'situation',
          context_id: situationContext ? null : null, // TODO: 상황 분석 ID 연결
        }
      
      setMessages([initialMessage])
      setHasInitialGreeting(true)
      }
      // 일반 챗 모드에서는 초기 메시지를 추가하지 않고 환영 화면 유지
    }
  }, [selectedConversationId, messages.length, hasInitialGreeting, situationAnalysis, situationContext])

  // 사용자 스크롤 감지
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    const handleScroll = () => {
      if (!container) return
      
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100 // 하단 100px 이내
      
      // 사용자가 맨 아래 근처에 있으면 자동 스크롤 허용
      shouldAutoScrollRef.current = isNearBottom
      isUserScrollingRef.current = !isNearBottom
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // 메시지 스크롤 (사용자가 맨 아래에 있을 때만)
  useEffect(() => {
    if (shouldAutoScrollRef.current && messagesEndRef.current) {
      // 약간의 지연을 두어 DOM 업데이트 후 스크롤
      setTimeout(() => {
        if (shouldAutoScrollRef.current && messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }, [messages])

  // 입력창 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const maxHeight = window.innerHeight * 0.33 // 화면 높이의 1/3
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, maxHeight)
      textarea.style.height = `${Math.max(60, newHeight)}px`
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
    }
  }, [inputMessage])

  // 외부 클릭 시 리포트 메뉴 닫기
  useEffect(() => {
    if (!openReportMenu) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // 메뉴 버튼이나 메뉴 내부 클릭은 무시
      if (target.closest('[data-report-menu]') || target.closest('[data-report-menu-button]')) {
        return
      }
      setOpenReportMenu(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openReportMenu])

  // 대화 저장
  const saveConversations = (updatedConversations: ConversationSession[]) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('legal_assist_conversations', JSON.stringify(updatedConversations))
    } catch (error) {
      console.error('대화 저장 실패:', error)
    }
  }

  // 리포트 저장 (Supabase에 저장되므로 로컬 저장 불필요)
  const saveReports = (updatedReports: Report[]) => {
    // Supabase에 저장되므로 로컬 저장 불필요
    // 리포트는 /legal/situation에서 자동으로 저장됨
  }

  // 질문 요약 생성 (타임라인용)
  const generateQuestionSummary = useCallback((text: string): string => {
    if (text.length <= 30) return text
    return text.substring(0, 30) + '...'
  }, [])

  // 대화 삭제
  const handleDeleteConversation = useCallback(async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation() // 버튼 클릭 시 대화 선택 방지
    
    const conversation = conversations.find(c => c.id === conversationId)
    if (!conversation) return
    
    try {
      // 새 테이블 구조에서 DB에서도 삭제
      if (conversation.sessionId) {
        const userId = await getUserId()
        
        if (userId) {
          await deleteChatSession(conversation.sessionId, userId)
        }
      }
      
      // 로컬 상태에서 제거
    const updatedConversations = conversations.filter(c => c.id !== conversationId)
    setConversations(updatedConversations)
    saveConversations(updatedConversations)
    
    // 삭제된 대화가 현재 선택된 대화인 경우 선택 해제
    if (selectedConversationId === conversationId) {
      setSelectedConversationId(null)
      setMessages([])
    }
    
    toast({
      title: "대화 삭제 완료",
      description: "대화 내역이 삭제되었습니다.",
    })
    } catch (error: any) {
      console.error('대화 삭제 실패:', error)
      toast({
        title: "대화 삭제 실패",
        description: error.message || "대화 삭제 중 오류가 발생했습니다.",
        variant: 'destructive',
      })
    }
  }, [conversations, selectedConversationId, toast])

  // 상황 분석 아카이브 로드 (DB에서 가져오기 - 상황 분석 데이터만)
  const loadReports = async () => {
    setIsLoadingReports(true)
    try {
      const userId = await getUserId()

      if (!userId) {
        setReports([])
        return
      }

      // DB에서 상황 분석 히스토리 가져오기 (situation_analyses 테이블에서만)
      const situationHistory = await getSituationHistoryV2(20, 0, userId)
      
      // Report 형식으로 변환
      const reportsData: Report[] = situationHistory.map((situation) => {
        // analysis 필드에서 summary 추출
        const analysisData = typeof situation.summary === 'string' ? { summary: situation.summary } : {}
        const summary = analysisData.summary || situation.summary || ''
        
        return {
          id: situation.id,
          question: situation.situation || '',
          answer: summary,
          legalBasis: [], // 필요시 추가 파싱
          recommendations: [], // 필요시 추가 파싱
          riskScore: situation.risk_score,
          tags: [situation.category || 'unknown'],
          createdAt: new Date(situation.created_at),
        }
      })
      
      setReports(reportsData)
    } catch (error: any) {
      console.error('상황 분석 로드 실패:', error)
      toast({
        title: '상황 분석 로드 실패',
        description: error.message || '상황 분석을 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
      setReports([])
    } finally {
      setIsLoadingReports(false)
    }
  }

  // 상황 분석 아카이브 모달 열기
  const handleOpenArchiveModal = () => {
    setShowArchiveModal(true)
    loadReports()
  }

  // 상황 분석 삭제
  const handleDeleteReport = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation() // 버튼 클릭 시 분석 선택 방지
    
    try {
      // 상황 분석 삭제는 situation_analyses 테이블을 사용하도록 변경됨
      // 필요시 백엔드 API 추가 필요
      // 현재는 로컬에서만 제거
      const updatedReports = reports.filter(r => r.id !== reportId)
      setReports(updatedReports)
      
      toast({
        title: "상황 분석 삭제 완료",
        description: "상황 분석이 삭제되었습니다.",
      })
    } catch (error: any) {
      console.error('상황 분석 삭제 실패:', error)
      toast({
        title: "상황 분석 삭제 실패",
        description: error.message || "상황 분석 삭제 중 오류가 발생했습니다.",
        variant: 'destructive',
      })
    }
  }

  // 메시지 전송
  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = inputMessage.trim()
    
    // 입력 검증
    if (!trimmedMessage) {
      toast({
        title: '입력 필요',
        description: '메시지를 입력해주세요.',
        variant: 'destructive',
      })
      return
    }
    
    if (trimmedMessage.length < 5) {
      toast({
        title: '입력이 너무 짧습니다',
        description: '최소 5자 이상 입력해주세요.',
        variant: 'destructive',
      })
      return
    }
    
    if (trimmedMessage.length > 2000) {
      toast({
        title: '입력이 너무 깁니다',
        description: '최대 2000자까지 입력 가능합니다.',
        variant: 'destructive',
      })
      return
    }
    
    if (isAnalyzing) {
      toast({
        title: '처리 중',
        description: '이전 요청이 처리 중입니다. 잠시만 기다려주세요.',
      })
      return
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date(),
    }

    // 메시지 전송 시 자동 스크롤 활성화
    shouldAutoScrollRef.current = true

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputMessage('')
    setIsAnalyzing(true)
    
    // 사용자 ID 가져오기 (세션 생성 및 메시지 저장에 필요)
    const userId = await getUserId()

    // 현재 대화 세션 업데이트 또는 생성
    let currentSession: ConversationSession
    let chatSessionId: string | null = null  // legal_chat_sessions의 ID
    
    if (selectedConversationId) {
      const existing = conversations.find(c => c.id === selectedConversationId)
      if (existing) {
        currentSession = {
          ...existing,
          messages: [...existing.messages, userMessage],
          updatedAt: new Date(),
        }
        
        // 기존 세션인데 sessionId가 비어 있으면 새 세션 생성
        if (userId && !existing.sessionId) {
          const sessionTitle = generateQuestionSummary(trimmedMessage)
          const sessionResult = await createChatSession(
            {
              initial_context_type: currentContext.type,
              initial_context_id: currentContext.id,
              title: sessionTitle,
            },
            userId
          )
          chatSessionId = sessionResult.id
          currentSession.sessionId = sessionResult.id
        } else {
          chatSessionId = existing.sessionId || null
        }
      } else {
        currentSession = {
          id: selectedConversationId,
          sessionId: '',
          title: generateQuestionSummary(trimmedMessage),
          messages: [userMessage],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
    } else {
      // 새 세션 생성 - DB에 저장
      try {
        if (userId) {
          // 새 챗 세션 생성
          const sessionTitle = generateQuestionSummary(trimmedMessage)
          const initialContextType = currentContext.type
          const initialContextId = currentContext.id
          
          const sessionResult = await createChatSession(
            {
              initial_context_type: initialContextType,
              initial_context_id: initialContextId,
              title: sessionTitle,
            },
            userId
          )
          
          chatSessionId = sessionResult.id
          const newSessionId = `session-${chatSessionId}`
          
          currentSession = {
            id: newSessionId,
            sessionId: chatSessionId || '',
            title: sessionTitle,
            messages: [userMessage],
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          setSelectedConversationId(newSessionId)
        } else {
          // 사용자 ID가 없으면 로컬 세션만 생성
      const newSessionId = `conv-${Date.now()}`
      currentSession = {
        id: newSessionId,
            sessionId: '',
        title: generateQuestionSummary(trimmedMessage),
        messages: [userMessage],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setSelectedConversationId(newSessionId)
        }
      } catch (error) {
        console.warn('챗 세션 생성 실패, 로컬 세션 사용:', error)
        // 실패 시 로컬 세션만 생성
        const newSessionId = `conv-${Date.now()}`
        currentSession = {
          id: newSessionId,
          sessionId: '',
          title: generateQuestionSummary(trimmedMessage),
          messages: [userMessage],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        setSelectedConversationId(newSessionId)
      }
    }

    try {
      let assistantMessage: ChatMessage
      
      // 상황 분석 결과가 있으면 chatWithContractV2 사용 (컨텍스트 포함)
      if (situationAnalysis && situationContext) {
        // 법적 관점 내용을 컨텍스트로 변환
        const legalContext = situationAnalysis.criteria
          .map((criterion, index) => {
            const reason = criterion.reason || `${criterion.name}: ${criterion.status}`
            return `${index + 1}. ${reason}`
          })
          .join('\n')
        
        const analysisSummary = `상황 요약: ${situationContext.summary}\n\n법적 관점:\n${legalContext}\n\n위험도: ${situationAnalysis.riskScore}점`
        
        // chatWithContractV2 API 호출 (상황 분석 결과 기반)
        const chatResult = await chatWithContractV2({
          query: trimmedMessage,
          docIds: [], // 상황 분석은 docId 없음
          analysisSummary: analysisSummary,
          riskScore: situationAnalysis.riskScore,
          totalIssues: situationAnalysis.criteria?.length || 0,
          topK: 8,
          contextType: currentContext.type,
          contextId: currentContext.id,
        })
        
        assistantMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: chatResult.answer || '답변을 생성할 수 없습니다.',
          timestamp: new Date(),
          context_type: currentContext.type,
          context_id: currentContext.id,
        }
        
        // DB에 메시지 저장
        try {
          if (userId && chatSessionId) {
            // 새 테이블 구조 사용 (legal_chat_messages)
              try {
              const dbMessages = await getChatMessages(chatSessionId, userId)
                const maxSequenceNumber = dbMessages.length > 0 
                  ? Math.max(...dbMessages.map(m => m.sequence_number))
                  : -1
                
              const nextSequenceNumber = maxSequenceNumber + 1
                
                // 사용자 메시지 저장
              await saveChatMessage(
                chatSessionId,
                {
                  sender_type: 'user',
                  message: userMessage.content,
                  sequence_number: nextSequenceNumber,
                  context_type: currentContext.type,
                  context_id: currentContext.id,
                },
                  userId
                )
                
                // AI 메시지 저장
              await saveChatMessage(
                chatSessionId,
                {
                  sender_type: 'assistant',
                  message: assistantMessage.content,
                  sequence_number: nextSequenceNumber + 1,
                  context_type: currentContext.type,
                  context_id: currentContext.id,
                },
                  userId
                )
              } catch (dbError) {
              console.warn('새 테이블 메시지 저장 실패:', dbError)
            }
          }
        } catch (saveError) {
          console.warn('대화 메시지 DB 저장 실패 (계속 진행):', saveError)
        }
      } else {
        // 컨텍스트에 따라 분기
        if (currentContext.type === 'situation' && currentContext.id) {
          // 상황 분석 리포트를 컨텍스트로 사용하는 경우
          const chatResult = await chatWithContractV2({
            query: trimmedMessage,
            docIds: [],
            topK: 8,
            contextType: 'situation',
            contextId: currentContext.id,
          })
          
          console.log('챗 응답:', chatResult)
          
          assistantMessage = {
            id: `msg-${Date.now()}-assistant`,
            role: 'assistant',
            content: chatResult?.answer || chatResult?.markdown || '답변을 생성할 수 없습니다.',
            timestamp: new Date(),
            context_type: 'situation',
            context_id: currentContext.id,
          }
          
          // 상황 컨텍스트인 경우 DB에 저장
          if (userId && chatSessionId) {
            try {
              const dbMessages = await getChatMessages(chatSessionId, userId)
              const maxSequenceNumber = dbMessages.length > 0 
                ? Math.max(...dbMessages.map(m => m.sequence_number))
                : -1
              
              const nextSequenceNumber = maxSequenceNumber + 1
              
              await saveChatMessage(
                chatSessionId,
                {
                  sender_type: 'user',
                  message: userMessage.content,
                  sequence_number: nextSequenceNumber,
                  context_type: 'situation',
                  context_id: currentContext.id,
                },
                  userId
                )
                
              await saveChatMessage(
                chatSessionId,
                {
                  sender_type: 'assistant',
                  message: assistantMessage.content,
                  sequence_number: nextSequenceNumber + 1,
                  context_type: 'situation',
                  context_id: currentContext.id,
                },
                  userId
                )
            } catch (dbError) {
              console.warn('새 테이블 메시지 저장 실패:', dbError)
            }
          }
        } else if (currentContext.type === 'contract' && currentContext.id) {
          // 계약서 분석 리포트를 컨텍스트로 사용하는 경우
          const chatResult = await chatWithContractV2({
            query: trimmedMessage,
            docIds: [currentContext.id], // 계약서 ID를 docIds에 포함
            topK: 8,
            contextType: 'contract',
            contextId: currentContext.id,
          })
          
          console.log('계약서 컨텍스트 챗 응답:', chatResult)
          
          assistantMessage = {
            id: `msg-${Date.now()}-assistant`,
            role: 'assistant',
            content: chatResult?.answer || chatResult?.markdown || '답변을 생성할 수 없습니다.',
            timestamp: new Date(),
            context_type: 'contract',
            context_id: currentContext.id,
          }
          
          // 계약서 컨텍스트인 경우도 새 테이블에 저장
          if (userId && chatSessionId) {
            try {
              const dbMessages = await getChatMessages(chatSessionId, userId)
              const maxSequenceNumber = dbMessages.length > 0 
                ? Math.max(...dbMessages.map(m => m.sequence_number))
                : -1
              
              const nextSequenceNumber = maxSequenceNumber + 1
              
              await saveChatMessage(
                chatSessionId,
                {
                  sender_type: 'user',
                  message: userMessage.content,
                  sequence_number: nextSequenceNumber,
                  context_type: 'contract',
                  context_id: currentContext.id,
                },
                userId
              )
              
              await saveChatMessage(
                chatSessionId,
                {
                  sender_type: 'assistant',
                  message: assistantMessage.content,
                  sequence_number: nextSequenceNumber + 1,
                  context_type: 'contract',
                  context_id: currentContext.id,
                },
                userId
              )
            } catch (dbError) {
              console.warn('계약서 컨텍스트 메시지 저장 실패:', dbError)
            }
          }
        } else if (currentContext.type === 'none') {
          // 일반 챗 모드 - chatWithContractV2 사용
            // 일반 챗 모드 - chatWithContractV2 사용
            const chatResult = await chatWithContractV2({
              query: trimmedMessage,
              docIds: [],
              topK: 8,
              contextType: 'none',
              contextId: null,
            })
            
            assistantMessage = {
              id: `msg-${Date.now()}-assistant`,
              role: 'assistant',
              content: chatResult.answer || '답변을 생성할 수 없습니다.',
              timestamp: new Date(),
              context_type: 'none',
              context_id: null,
            }
            
            // 일반 챗도 새 테이블에 저장
            if (userId && chatSessionId) {
              try {
                const dbMessages = await getChatMessages(chatSessionId, userId)
                const maxSequenceNumber = dbMessages.length > 0 
                  ? Math.max(...dbMessages.map(m => m.sequence_number))
                  : -1
                
                const nextSequenceNumber = maxSequenceNumber + 1
                
                await saveChatMessage(
                  chatSessionId,
                  {
                    sender_type: 'user',
                    message: userMessage.content,
                    sequence_number: nextSequenceNumber,
                    context_type: 'none',
                    context_id: null,
                  },
                  userId
                )
                
                await saveChatMessage(
                  chatSessionId,
                  {
                    sender_type: 'assistant',
                    message: assistantMessage.content,
                    sequence_number: nextSequenceNumber + 1,
                    context_type: 'none',
                    context_id: null,
                  },
                  userId
                )
              } catch (dbError) {
                console.warn('일반 챗 메시지 저장 실패:', dbError)
              }
            }
        } else {
          // 상황 분석 API 호출 (새로운 분석 생성)
          const request: SituationRequestV2 = {
            situation: inputMessage.trim(),
            category: 'unknown',
          }

          const result = await analyzeSituationV2(request)

          // AI 응답 메시지 생성
          assistantMessage = {
            id: `msg-${Date.now()}-assistant`,
            role: 'assistant',
            content: result.analysis.summary,
            timestamp: new Date(),
            context_type: result.id ? 'situation' : 'none',
            context_id: result.id || null,
          }
          
          // 새로운 상황 분석인 경우 컨텍스트 업데이트
          if (result.id) {
            // 상황 분석 결과를 컨텍스트로 설정
            setCurrentContext({
              type: 'situation',
              id: result.id,
              label: result.analysis?.summary?.substring(0, 30) || '상황 분석',
            })
          }

          // 리포트 생성 여부 판단 (위험도가 높거나 특정 키워드가 있는 경우)
          const shouldGenerateReport = result.riskScore > 50 || 
            ['해고', '임금', '체불', '위반', '불법'].some(keyword => inputMessage.includes(keyword))

          if (shouldGenerateReport && result.id) {
            // 리포트는 백엔드에서 자동으로 situation_analyses 테이블에 저장됨
            assistantMessage.reportId = result.id

            // 로컬 상태 업데이트
            const report: Report = {
              id: result.id,
              question: inputMessage.trim(),
              answer: result.analysis.summary,
              legalBasis: result.analysis.legalBasis?.map((b: any) => b.snippet) || [],
              recommendations: result.analysis.recommendations || [],
              riskScore: result.riskScore,
              tags: result.tags || [],
              createdAt: new Date(),
            }

            const updatedReports = [report, ...reports].slice(0, 50) // 최근 50개만 유지
            setReports(updatedReports)
          }
        }
      }

      const finalMessages = [...newMessages, assistantMessage]
      // AI 응답 시에도 자동 스크롤 활성화
      shouldAutoScrollRef.current = true
      setMessages(finalMessages)

      // 대화 세션 업데이트
      const updatedSession = {
        ...currentSession,
        messages: finalMessages,
        updatedAt: new Date(),
      }

      const updatedConversations = selectedConversationId
        ? conversations.map(c => c.id === selectedConversationId ? updatedSession : c)
        : [updatedSession, ...conversations]

      setConversations(updatedConversations)
      saveConversations(updatedConversations)

    } catch (error: any) {
      console.error('분석 오류:', error)
      toast({
        title: '분석 실패',
        description: error.message || '분석 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsAnalyzing(false)
    }
  }, [inputMessage, isAnalyzing, messages, selectedConversationId, conversations, currentContext, situationAnalysis, situationContext, generateQuestionSummary, router, toast])

  // 메시지 수정
  const handleEditMessage = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (message && message.role === 'user') {
      setEditText(message.content)
      setEditingMessageId(messageId)
    }
  }, [messages])

  // 메시지 수정 저장
  const handleSaveEdit = useCallback(() => {
    if (!editingMessageId || !editText.trim()) return

    const updatedMessages = messages.map(m =>
      m.id === editingMessageId ? { ...m, content: editText.trim() } : m
    )
    setMessages(updatedMessages)

    // 대화 세션도 업데이트
    if (selectedConversationId) {
      const updatedConversations = conversations.map(c =>
        c.id === selectedConversationId
          ? { ...c, messages: updatedMessages, updatedAt: new Date() }
          : c
      )
      setConversations(updatedConversations)
      saveConversations(updatedConversations)
    }

    setEditingMessageId(null)
    setEditText('')
  }, [editingMessageId, editText, messages, selectedConversationId, conversations])

  // 메시지 복사
  const handleCopyMessage = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: '복사 완료',
      description: '메시지가 클립보드에 복사되었습니다.',
    })
  }, [toast])

  // 리포트 보기 (SIMULATION 상세 페이지로 이동)
  const handleViewReport = useCallback((reportId: string) => {
    router.push(`/legal/situation?analysisId=${reportId}`)
  }, [router])

  // 새 대화 시작
  const handleNewConversation = useCallback(() => {
    setSelectedConversationId(null)
    setMessages([])
    setHasInitialGreeting(false)
    setCurrentContext({ type: 'none', id: null })
    setInputMessage('')
    // 새 대화를 시작할 때는 상황 분석 결과도 초기화
    // (URL 파라미터에서 온 경우는 페이지 로드 시 다시 설정됨)
    setSituationAnalysis(null)
    setSituationContext(null)
  }, [])

  // 대화 선택
  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId)
  }, [])

  // 상황 템플릿 선택 - 카드 클릭 시 입력창에 예시 문장 자동 채우기
  const handleSituationSelect = useCallback((situation: typeof COMMON_SITUATIONS[0]) => {
    // 카드 클릭 시 입력창에 예시 문장 자동 채우기
    // 예: "인턴인데 수습 기간 중에 회사가 일방적으로 계약 해지를 통보했습니다."
    const exampleText = situation.text
    setInputMessage(exampleText)
    // 입력창으로 포커스 이동
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(exampleText.length, exampleText.length)
      }
    }, 100)
  }, [])

  // 날짜 포맷팅
  const formatDate = useCallback((date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateObj.toDateString() === today.toDateString()) {
      return '오늘'
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
      return '어제'
    } else {
      return `${dateObj.getMonth() + 1}/${dateObj.getDate()}`
    }
  }, [])


  // 전체 화면 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // 정렬된 대화 목록 메모이제이션 (최신순)
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    )
  }, [conversations])

  // 현재 선택된 대화 세션 메모이제이션
  const currentSession = useMemo(() => {
    if (!selectedConversationId) return null
    return conversations.find(c => c.id === selectedConversationId) || null
  }, [selectedConversationId, conversations])

  return (
    <div className="h-[calc(100vh-64px)] w-full overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col">
      <div className="flex flex-1 min-h-0 w-full">
        {/* 사이드바 (왼쪽 고정 너비) */}
        <div className="w-[280px] border-r border-slate-200/80 flex flex-col bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden min-h-0 flex-shrink-0">
          <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span>대화 내역</span>
              </h2>
              <Button
                onClick={handleNewConversation}
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0 shadow-md hover:shadow-lg transition-all h-7 w-7 p-0"
                title="새 대화 시작"
              >
                <Zap className="w-3.5 h-3.5" />
              </Button>
            </div>
            {sortedConversations.length > 0 && (
              <div className="text-xs text-white/80 font-medium">
                총 {sortedConversations.length}개
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent min-h-0">
            {sortedConversations.length === 0 ? (
              <div className="p-5 text-center">
                <div className="p-3 bg-slate-100 rounded-full w-14 h-14 mx-auto mb-3 flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 font-medium mb-1">대화 내역이 없습니다</p>
                <p className="text-xs text-slate-400">새로운 대화를 시작해보세요</p>
              </div>
            ) : (
              <div className="p-2.5 space-y-1.5">
                {sortedConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-lg transition-all group relative",
                      "hover:shadow-md active:scale-[0.98]",
                      selectedConversationId === conv.id
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-sm"
                        : "bg-slate-50/50 hover:bg-slate-100/70 border border-transparent"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            selectedConversationId === conv.id ? "bg-blue-500" : "bg-slate-300"
                          )} />
                          <div className="text-xs text-slate-500 font-medium">
                            {formatDate(conv.updatedAt)}
                          </div>
                        </div>
                        <div className={cn(
                          "text-sm font-semibold truncate leading-snug",
                          selectedConversationId === conv.id ? "text-blue-900" : "text-slate-800"
                        )}>
                          {conv.messages.length > 0 
                            ? (conv.messages.find(m => m.role === 'user')?.content || conv.messages[0]?.content || conv.title)
                            : conv.title}
                        </div>
                        {conv.messages.length > 0 && (
                          <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {conv.messages.length}개의 메시지
                          </div>
                        )}
                      </div>
                      <div
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleDeleteConversation(conv.id, e as any)
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className={cn(
                          "opacity-0 group-hover:opacity-100 rounded-lg p-1.5 transition-all cursor-pointer",
                          "hover:bg-red-100 hover:text-red-600",
                          selectedConversationId === conv.id && "opacity-100"
                        )}
                        title="대화 삭제"
                      >
                        <X className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 메인 채팅 영역 (오른쪽 80%) */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-white via-slate-50/50 to-white overflow-hidden min-h-0">
          {/* 채팅 메시지 영역 */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-white via-slate-50/30 to-white px-5 sm:px-6 lg:px-8 pt-4 pb-6 space-y-5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent min-h-0">
            {messages.length === 0 && !hasInitialGreeting && (
              <div className="flex flex-col items-center justify-center h-full pb-8">
                <div className="p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl mb-6 shadow-lg animate-pulse">
                  <Bot className="w-16 h-16 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">안녕하세요! 👋</h2>
                <p className="text-slate-600 text-center max-w-md">
                  법률 상담이 필요하신가요? 아래에서 상황을 한 줄로 설명해주시면<br />
                  AI가 도와드릴게요.
                </p>
              </div>
            )}
            {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-3 duration-500",
                      message.role === 'user' ? 'justify-end' : 'justify-start',
                      index === 0 && "mt-2"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-2 ring-white/50">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    
                    <div className={cn(
                      "flex flex-col gap-2 max-w-[85%] sm:max-w-[75%]",
                      message.role === 'user' ? 'items-end' : 'items-start'
                    )}>
                      <div
                        className={cn(
                          "relative rounded-2xl px-5 py-3.5 shadow-md transition-all duration-200",
                          "hover:shadow-lg",
                          message.role === 'user'
                            ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm"
                            : "bg-white border border-slate-200/80 text-slate-900 rounded-bl-sm"
                        )}
                      >
                        {message.role === 'assistant' ? (
                          // 메시지의 context_type에 따라 다른 컴포넌트 사용
                          // 최종 구분 구조:
                          // 1. 상황 분석 (context_type === 'situation') -> SituationChatMessage (구조화된 카드 UI)
                          // 2. 계약서 (context_type === 'contract') -> LegalChatMessage (Contract 페이지와 동일한 구조화된 탭 UI)
                          // 3. 일반 (context_type === 'none' 또는 없음) -> QuickChatMessage (마크다운 렌더링)
                          (() => {
                            const contextType = message.context_type || 'none'
                            if (contextType === 'situation') {
                              return (
                                <SituationChatMessage 
                                  content={message.content} 
                                  contextId={message.context_id || null}
                                />
                              )
                            } else if (contextType === 'contract') {
                              return (
                                <LegalChatMessage content={message.content} />
                              )
                            } else {
                              // 'none' 또는 undefined
                              return (
                                <QuickChatMessage content={message.content} />
                              )
                            }
                          })()
                        ) : (
                          <UserMessageWithContext 
                            message={message}
                            reportCache={reportCache}
                            setReportCache={setReportCache}
                          />
                        )}
                      </div>
                      
                      {/* 컨텍스트 링크 버튼 (assistant 메시지에만 표시) */}
                      {message.role === 'assistant' && (() => {
                        const contextLink = getContextLink(message)
                        return contextLink ? (
                          <div className="flex items-center gap-2 px-1">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                              {contextLink.badge}
                            </span>
                            <Link
                              href={contextLink.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-sky-600 hover:border-sky-300 hover:bg-sky-50 transition-colors"
                            >
                              <span>리포트 자세히 보기</span>
                              <span className="text-[10px]">↗</span>
                            </Link>
                          </div>
                        ) : null
                      })()}
                      
                      <div className="flex items-center gap-2 px-1">
                        <span className={cn(
                          "text-xs font-medium",
                          message.role === 'user' ? 'text-slate-500' : 'text-slate-400'
                        )}>
                          {message.timestamp.toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {message.role === 'user' && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditMessage(message.id)}
                              className="h-6 px-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                              title="수정"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyMessage(message.content)}
                              className="h-6 px-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                              title="복사"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                        {/* 기존 reportId 기반 리포트 보기 버튼 (컨텍스트 링크가 없을 때만 표시) */}
                        {message.role === 'assistant' && message.reportId && !getContextLink(message) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReport(message.reportId!)}
                            className="h-7 px-3 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1.5" />
                            리포트 보기
                          </Button>
                        )}
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center shadow-lg ring-2 ring-white/50">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isAnalyzing && (
                  <div className="flex gap-3 sm:gap-4 justify-start animate-in fade-in slide-in-from-bottom-3" role="status" aria-live="polite">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-2 ring-white/50 animate-pulse">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-sm px-5 py-3.5 shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5" aria-hidden="true">
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-sm text-slate-700 font-medium">답변 생성 중...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 - 화면 하단 고정 */}
          <div className="flex-shrink-0 border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-5 py-4 shadow-lg">
            {/* 라벨 */}
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              한 줄로 상황을 요약해 주세요
            </label>

            {/* GPT 스타일 입력 바 */}
            <div className="relative">
              <div className="flex items-end rounded-3xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                {/* + 버튼 */}
                <button
                  type="button"
                  data-report-menu-button
                  onClick={() => setOpenReportMenu((v) => !v)}
                  className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex-shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </button>

                {/* textarea (채팅 입력창 느낌) */}
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value)
                    // 자동 높이 조절
                    e.target.style.height = "0px"
                    e.target.style.height = e.target.scrollHeight + "px"
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="예: 단톡방/회의에서 모욕적인 말을 들었어요"
                  className="max-h-32 flex-1 resize-none border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                  style={{
                    minHeight: '32px',
                    maxHeight: '128px',
                  }}
                />

                {/* 오른쪽 영역: 글자수 + 전송 버튼 */}
                <div className="ml-2 flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[11px] text-slate-400">
                    {inputMessage.length}자
                  </span>

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isAnalyzing}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 -translate-y-[1px] rotate-45" />
                    )}
                  </button>
                </div>
              </div>

              {/* + 버튼 눌렀을 때 뜨는 메뉴 (GPT의 … 메뉴 느낌) */}
              {openReportMenu && (
                <div data-report-menu className="absolute left-2 bottom-full z-10 mb-2 w-64 rounded-2xl border border-slate-100 bg-white p-1 shadow-lg">
                  <div className="px-3 py-1.5 text-xs text-slate-500 font-medium border-b border-slate-100">
                    참고할 리포트
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setContextSelectorType('situation')
                      setShowContextSelector(true)
                      setOpenReportMenu(false)
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-slate-50 transition-colors text-slate-700"
                  >
                    <FileText className="w-4 h-4" />
                    <span>상황 분석 리포트 불러오기</span>
                    {currentContext.type === 'situation' && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 ml-auto" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContextSelectorType('contract')
                      setShowContextSelector(true)
                      setOpenReportMenu(false)
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-slate-50 transition-colors text-slate-700"
                  >
                    <FileText className="w-4 h-4" />
                    <span>계약서 분석 리포트 불러오기</span>
                    {currentContext.type === 'contract' && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 ml-auto" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* 현재 컨텍스트 표시 (선택된 경우) */}
            {currentContext.type !== 'none' && currentContext.label && (
              <div className="mt-3 px-3 py-1.5 rounded-lg bg-blue-50/50 border border-blue-200/50">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">상담 기준:</span>
                  <span className="font-medium text-blue-700">
                    {currentContext.type === 'situation' && '📋 '}
                    {currentContext.type === 'contract' && '📄 '}
                    {currentContext.label}
                  </span>
                  <button
                    onClick={() => setCurrentContext({ type: 'none', id: null })}
                    className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 메시지 수정 모달 */}
      <Dialog open={editingMessageId !== null} onOpenChange={(open) => !open && setEditingMessageId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>메시지 수정</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="min-h-[120px]"
            style={{ fontFamily: 'Noto Sans KR, sans-serif' }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingMessageId(null)}>
              취소
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              className={cn("bg-gradient-to-r text-white", PRIMARY_GRADIENT, PRIMARY_GRADIENT_HOVER)}
            >
              저장
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 컨텍스트 선택 모달 */}
      <Dialog 
        open={showContextSelector} 
        onOpenChange={(open) => {
          setShowContextSelector(open)
          if (!open) {
            setContextSelectorType(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                {contextSelectorType === 'situation' ? (
                  <MessageSquare className="w-5 h-5 text-white" />
                ) : contextSelectorType === 'contract' ? (
                  <FileText className="w-5 h-5 text-white" />
                ) : (
                  <Sparkles className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {contextSelectorType === 'situation' 
                    ? '상황 분석 리포트 선택'
                    : contextSelectorType === 'contract'
                    ? '계약서 분석 리포트 선택'
                    : '컨텍스트 선택'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {contextSelectorType === 'situation'
                    ? '대화에 참조할 상황 분석 리포트를 선택하세요'
                    : contextSelectorType === 'contract'
                    ? '대화에 참조할 계약서 분석 리포트를 선택하세요'
                    : '대화에 참조할 리포트를 선택하세요'}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            <div className="space-y-4">
              {/* 상황 분석 선택 - 상황 분석 버튼 클릭 시에만 표시 */}
              {contextSelectorType === 'situation' && (
                <div>
                  <div className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    상황 분석 리포트
                  </div>
                  <ContextSituationList
                    onSelect={(situation) => {
                      setCurrentContext({
                        type: 'situation',
                        id: situation.id,
                        label: situation.situation?.substring(0, 30) || '상황 분석',
                      })
                      setShowContextSelector(false)
                      setContextSelectorType(null)
                    }}
                    currentContextId={currentContext.type === 'situation' ? currentContext.id : null}
                  />
                </div>
              )}

              {/* 계약서 분석 선택 - 계약서 분석 버튼 클릭 시에만 표시 */}
              {contextSelectorType === 'contract' && (
                <div>
                  <div className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    계약서 분석 리포트
                  </div>
                  <ContextContractList
                    onSelect={(contract) => {
                      setCurrentContext({
                        type: 'contract',
                        id: contract.doc_id || contract.id,
                        label: contract.title || '계약서 분석',
                      })
                      setShowContextSelector(false)
                      setContextSelectorType(null)
                    }}
                    currentContextId={currentContext.type === 'contract' ? currentContext.id : null}
                  />
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 상황 분석 아카이브 모달 */}
      <Dialog open={showArchiveModal} onOpenChange={setShowArchiveModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                <FolderArchive className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  상황 분석 아카이브
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">저장된 상황 분석 결과를 확인하세요</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            {isLoadingReports ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="text-sm text-slate-600 mt-4 font-medium">상황 분석을 불러오는 중...</p>
                <p className="text-xs text-slate-400 mt-1">잠시만 기다려주세요</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-5 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl w-20 h-20 mx-auto mb-5 flex items-center justify-center shadow-inner">
                  <FolderArchive className="w-10 h-10 text-slate-400" />
                </div>
                <h4 className="text-lg font-semibold text-slate-800 mb-2">저장된 상황 분석이 없습니다</h4>
                <p className="text-sm text-slate-500 mb-1">상황 분석을 진행하면 결과가 자동으로 저장됩니다</p>
                <p className="text-xs text-slate-400">분석 결과를 나중에 다시 확인할 수 있어요</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report, index) => (
                  <div
                    key={report.id}
                    className={cn(
                      "group relative bg-white border-2 rounded-xl transition-all duration-200",
                      "hover:border-blue-300 hover:shadow-lg hover:scale-[1.01]",
                      "cursor-pointer active:scale-[0.99]",
                      "border-slate-200"
                    )}
                    onClick={() => {
                      setShowArchiveModal(false)
                      handleViewReport(report.id)
                    }}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* 제목 및 날짜 */}
                          <div className="flex items-start gap-3 mb-3">
                            <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex-shrink-0 mt-0.5">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-base text-slate-900 mb-1.5 line-clamp-2 group-hover:text-blue-700 transition-colors">
                                {report.question || '상황 분석'}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Clock className="w-3.5 h-3.5" />
                                <span>
                                  {report.createdAt.toLocaleString('ko-KR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 위험도 표시 */}
                          {report.riskScore !== undefined && (
                            <div className="mb-3">
                              <div className="flex items-center gap-3">
                                {/* 위험도 레벨 배지 */}
                                <div className={cn(
                                  "flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm",
                                  "border-2 shadow-sm",
                                  report.riskScore > 70 
                                    ? "bg-red-50 border-red-300 text-red-700" 
                                    : report.riskScore > 40 
                                    ? "bg-amber-50 border-amber-300 text-amber-700" 
                                    : "bg-green-50 border-green-300 text-green-700"
                                )}>
                                  {report.riskScore > 70 ? (
                                    <>
                                      <AlertTriangle className="w-4 h-4" />
                                      <span>높음</span>
                                    </>
                                  ) : report.riskScore > 40 ? (
                                    <>
                                      <AlertTriangle className="w-4 h-4" />
                                      <span>보통</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>낮음</span>
                                    </>
                                  )}
                                </div>
                                
                                {/* 점수 표시 */}
                                <div className="flex items-baseline gap-1">
                                  <span className={cn(
                                    "text-2xl font-bold",
                                    report.riskScore > 70 ? "text-red-600" : 
                                    report.riskScore > 40 ? "text-amber-600" : "text-green-600"
                                  )}>
                                    {report.riskScore}
                                  </span>
                                  <span className="text-xs text-slate-500 font-medium">/ 100</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 태그 */}
                          {report.tags && report.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {report.tags.slice(0, 3).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full border border-blue-200/50"
                                >
                                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                  {tag}
                                </span>
                              ))}
                              {report.tags.length > 3 && (
                                <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                                  +{report.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex flex-col items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteReport(report.id, e)
                            }}
                            className={cn(
                              "opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all",
                              "hover:bg-red-50 hover:text-red-600 text-slate-400",
                              "border border-transparent hover:border-red-200"
                            )}
                            title="상황 분석 삭제"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* 호버 효과 - 하단 그라데이션 */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 하단 정보 */}
          {reports.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium">총 {reports.length}개의 상황 분석</span>
                <span className="text-slate-400">분석 결과를 클릭하면 상세 내용을 확인할 수 있습니다</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
