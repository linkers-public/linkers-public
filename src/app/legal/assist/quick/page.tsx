'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { analyzeSituationV2, type SituationRequestV2 } from '@/apis/legal.service'

// 색상 상수 (다른 페이지와 통일)
const PRIMARY_GRADIENT = 'from-blue-600 to-indigo-600'
const PRIMARY_GRADIENT_HOVER = 'hover:from-blue-700 hover:to-indigo-700'

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
  isUrgent?: boolean // 긴급 상황 여부
}

// 리포트 타입 정의
interface Report {
  id: string
  question: string
  answer: string
  legalBasis: string[]
  recommendations: string[]
  riskScore?: number
  createdAt: Date
  expiresAt: Date // 24시간 후
}

// 대화 세션 타입
interface ConversationSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

export default function QuickAssistPage() {
  const router = useRouter()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [inputMessage, setInputMessage] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hasInitialGreeting, setHasInitialGreeting] = useState(false)
  const [conversations, setConversations] = useState<ConversationSession[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [showReportModal, setShowReportModal] = useState(false)
  const [currentReport, setCurrentReport] = useState<Report | null>(null)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [reports, setReports] = useState<Report[]>([])

  // localStorage에서 대화 내역 로드
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem('legal_assist_conversations')
      if (stored) {
        const parsed = JSON.parse(stored)
        const sessions = parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }))
        setConversations(sessions)
      }

      // 리포트 로드
      const storedReports = localStorage.getItem('legal_assist_reports')
      if (storedReports) {
        const parsedReports = JSON.parse(storedReports)
        const reportsWithDates = parsedReports.map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          expiresAt: new Date(r.expiresAt),
        }))
        // 만료된 리포트 제거
        const validReports = reportsWithDates.filter((r: Report) => r.expiresAt > new Date())
        setReports(validReports)
        localStorage.setItem('legal_assist_reports', JSON.stringify(validReports))
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    }
  }, [])

  // 만료된 리포트 정리 (24시간 후 자동 삭제)
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = new Date()
      const validReports = reports.filter(r => r.expiresAt > now)
      if (validReports.length !== reports.length) {
        setReports(validReports)
        localStorage.setItem('legal_assist_reports', JSON.stringify(validReports))
      }
    }, 60000) // 1분마다 체크

    return () => clearInterval(cleanup)
  }, [reports])

  // 선택된 대화의 메시지 로드
  useEffect(() => {
    if (selectedConversationId) {
      const conversation = conversations.find(c => c.id === selectedConversationId)
      if (conversation) {
        setMessages(conversation.messages)
        setHasInitialGreeting(true)
      }
    } else {
      setMessages([])
      setHasInitialGreeting(false)
    }
  }, [selectedConversationId, conversations])

  // 초기 인사말 추가
  useEffect(() => {
    if (!selectedConversationId && messages.length === 0 && !hasInitialGreeting) {
      const greetingMessage: ChatMessage = {
        id: `greeting-${Date.now()}`,
        role: 'assistant',
        content: `안녕하세요 법률 리스크를 탐지하는 Linkus legal이에요!

사용자님의 상황과 함께

• 언제부터 이런 일이 발생했는지
• 상대방(회사, 팀장, 클라이언트 등)이 누구인지
• 지금까지 어떤 대화를 나눴는지
• 가지고 있는 증거(카톡, 메일, 녹취 등)가 있는지

등을 알려주시면 더 자세한 대화가 가능해요!`,
        timestamp: new Date(),
      }
      setMessages([greetingMessage])
      setHasInitialGreeting(true)
    }
  }, [selectedConversationId, messages.length, hasInitialGreeting])

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  // 대화 저장
  const saveConversations = (updatedConversations: ConversationSession[]) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('legal_assist_conversations', JSON.stringify(updatedConversations))
    } catch (error) {
      console.error('대화 저장 실패:', error)
    }
  }

  // 리포트 저장
  const saveReports = (updatedReports: Report[]) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('legal_assist_reports', JSON.stringify(updatedReports))
    } catch (error) {
      console.error('리포트 저장 실패:', error)
    }
  }

  // 질문 요약 생성 (타임라인용)
  const generateQuestionSummary = (text: string): string => {
    if (text.length <= 30) return text
    return text.substring(0, 30) + '...'
  }

  // 긴급 상황 감지
  const detectUrgency = (text: string): boolean => {
    const urgentKeywords = ['긴급', '즉시', '당장', '지금', '바로', '해고', '불법', '위험', '중요']
    return urgentKeywords.some(keyword => text.includes(keyword))
  }

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAnalyzing) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      isUrgent: detectUrgency(inputMessage),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputMessage('')
    setIsAnalyzing(true)

    // 현재 대화 세션 업데이트 또는 생성
    let currentSession: ConversationSession
    if (selectedConversationId) {
      const existing = conversations.find(c => c.id === selectedConversationId)
      if (existing) {
        currentSession = {
          ...existing,
          messages: [...existing.messages, userMessage],
          updatedAt: new Date(),
        }
      } else {
        currentSession = {
          id: selectedConversationId,
          title: generateQuestionSummary(inputMessage),
          messages: [userMessage],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
    } else {
      const newSessionId = `conv-${Date.now()}`
      currentSession = {
        id: newSessionId,
        title: generateQuestionSummary(inputMessage),
        messages: [userMessage],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setSelectedConversationId(newSessionId)
    }

    try {
      // API 호출
      const request: SituationRequestV2 = {
        situation: inputMessage.trim(),
        category: 'unknown',
      }

      const result = await analyzeSituationV2(request)

      // AI 응답 메시지 생성
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: result.analysis.summary,
        timestamp: new Date(),
      }

      // 리포트 생성 여부 판단 (위험도가 높거나 특정 키워드가 있는 경우)
      const shouldGenerateReport = result.riskScore > 50 || 
        ['해고', '임금', '체불', '위반', '불법'].some(keyword => inputMessage.includes(keyword))

      if (shouldGenerateReport) {
        const reportId = `report-${Date.now()}`
        assistantMessage.reportId = reportId

        // 리포트 생성
        const report: Report = {
          id: reportId,
          question: inputMessage.trim(),
          answer: result.analysis.summary,
          legalBasis: result.analysis.legalBasis.map(b => b.snippet),
          recommendations: result.analysis.recommendations,
          riskScore: result.riskScore,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
        }

        const updatedReports = [report, ...reports].slice(0, 5) // 최근 5개만 유지
        setReports(updatedReports)
        saveReports(updatedReports)
      }

      const finalMessages = [...newMessages, assistantMessage]
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
  }

  // 메시지 수정
  const handleEditMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (message && message.role === 'user') {
      setEditText(message.content)
      setEditingMessageId(messageId)
    }
  }

  // 메시지 수정 저장
  const handleSaveEdit = () => {
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
  }

  // 메시지 복사
  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: '복사 완료',
      description: '메시지가 클립보드에 복사되었습니다.',
    })
  }

  // 리포트 보기
  const handleViewReport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId)
    if (report) {
      setCurrentReport(report)
      setShowReportModal(true)
    }
  }

  // 새 대화 시작
  const handleNewConversation = () => {
    setSelectedConversationId(null)
    setMessages([])
    setHasInitialGreeting(false)
  }

  // 대화 선택
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
  }

  // 상황 템플릿 선택
  const handleSituationSelect = (situation: typeof COMMON_SITUATIONS[0]) => {
    // 한 줄 요약 + 폼 형식 예시 텍스트 조합
    const fullText = `${situation.text}\n\n사용자님의 상황과 함께\n\n${situation.exampleForm}`
    setInputMessage(fullText)
    // 입력창으로 포커스 이동
    setTimeout(() => {
      const textarea = document.querySelector('textarea')
      if (textarea) {
        textarea.focus()
        textarea.setSelectionRange(textarea.value.length, textarea.value.length)
      }
    }, 100)
  }

  // 날짜 포맷팅
  const formatDate = (date: Date): string => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return '오늘'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '어제'
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      <div className="flex h-screen">
        {/* 사이드바 (왼쪽 20%) */}
        <div className="w-1/5 border-r border-slate-200 flex flex-col bg-gradient-to-br from-blue-600 to-indigo-600">
          <div className="p-4 border-b border-slate-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                대화 내역
              </h2>
              <Button
                onClick={handleNewConversation}
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Zap className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-white/70 text-sm">
                대화 내역이 없습니다
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-all",
                      selectedConversationId === conv.id
                        ? "bg-white/20 text-white"
                        : "hover:bg-white/10 text-white/80"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white/60 mb-1">
                          {formatDate(conv.updatedAt)}
                        </div>
                        <div className="text-sm font-medium truncate">
                          {conv.title}
                        </div>
                      </div>
                      {conv.messages.some(m => m.isUrgent) && (
                        <span className="text-lg">🚨</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 메인 채팅 영역 (오른쪽 80%) */}
        <div className="flex-1 flex flex-col bg-white relative">
          {/* 헤더 */}
          <div className="p-4 border-b border-slate-200 bg-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/legal/assist')}
                  className="text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  상담 허브로 돌아가기
                </Button>
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-blue-600" />
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    즉시 상담
                  </h1>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowArchiveModal(true)}
                className="text-slate-600 hover:text-slate-900"
              >
                <FolderArchive className="w-5 h-5 mr-2" />
                리포트 아카이브
              </Button>
            </div>
          </div>

          {/* 채팅 메시지 영역 */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4" style={{ paddingBottom: '200px' }}>
            {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-slate-600" />
                      </div>
                    )}
                    
                    <div className={cn(
                      "flex flex-col gap-1 max-w-[70%]",
                      message.role === 'user' ? 'items-end' : 'items-start'
                    )}>
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 shadow-sm",
                          message.role === 'user'
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-md"
                            : "bg-white border border-slate-200 text-slate-900 rounded-bl-md",
                          message.isUrgent && message.role === 'user' && "border-2 border-red-400"
                        )}
                      >
                        {message.isUrgent && message.role === 'user' && (
                          <div className="flex items-center gap-1 mb-2">
                            <span className="text-lg">🚨</span>
                            <span className="text-xs font-semibold">긴급 상황</span>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
                          {message.content}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          {message.timestamp.toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {message.role === 'user' && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditMessage(message.id)}
                              className="h-6 px-2 text-slate-500 hover:text-slate-900"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyMessage(message.content)}
                              className="h-6 px-2 text-slate-500 hover:text-slate-900"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        {message.role === 'assistant' && message.reportId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReport(message.reportId!)}
                            className="h-6 px-2 text-xs border-slate-300"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            리포트 보기
                          </Button>
                        )}
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isAnalyzing && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 - 화면 하단 고정 */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 backdrop-blur-sm shadow-lg z-10">
            {/* 자주 있는 상황 태그 버튼 */}
            <div className="px-4 pt-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-slate-600">자주 있는 상황:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {COMMON_SITUATIONS.map((situation, index) => {
                  const Icon = situation.icon
                  return (
                    <button
                      key={index}
                      onClick={() => handleSituationSelect(situation)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        "bg-white border border-slate-300 text-slate-700",
                        "hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm",
                        "active:scale-95"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{situation.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* 입력창 */}
            <div className="p-4 space-y-4">
              {/* 한 줄 요약 */}
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  <span className="text-red-500">*</span> 한 줄로 상황을 요약해 주세요
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Textarea
                      ref={textareaRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder="예: 단톡방/회의에서 모욕적인 말을 들어요"
                      style={{
                        minHeight: '60px',
                        maxHeight: '33vh',
                        overflowY: 'auto',
                        resize: 'none',
                      }}
                      className="border-2 border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 pr-12"
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-slate-400 pointer-events-none">
                      {inputMessage.length}자
                    </div>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isAnalyzing}
                    className={cn(
                      "px-6 bg-gradient-to-r text-white shadow-md h-[60px]",
                      PRIMARY_GRADIENT,
                      PRIMARY_GRADIENT_HOVER,
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {inputMessage.trim() && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>입력 완료</span>
                  </div>
                )}
              </div>
            </div>
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

      {/* 리포트 모달 */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              <Scroll className="w-5 h-5 text-blue-600" />
              법적 조언 리포트
            </DialogTitle>
          </DialogHeader>
          {currentReport && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold mb-2 text-blue-600">질문</h3>
                <p className="text-slate-700">{currentReport.question}</p>
              </div>
              <div>
                <h3 className="font-bold mb-2 text-blue-600">법적 조언</h3>
                <p className="text-slate-700 whitespace-pre-wrap">{currentReport.answer}</p>
              </div>
              {currentReport.riskScore !== undefined && (
                <div>
                  <h3 className="font-bold mb-2 text-blue-600">위험도</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          currentReport.riskScore > 70 ? "bg-red-500" : 
                          currentReport.riskScore > 40 ? "bg-amber-500" : "bg-green-500"
                        )}
                        style={{ width: `${currentReport.riskScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{currentReport.riskScore}%</span>
                  </div>
                </div>
              )}
              {currentReport.legalBasis.length > 0 && (
                <div>
                  <h3 className="font-bold mb-2 text-blue-600">참조 법조문</h3>
                  <ul className="space-y-2">
                    {currentReport.legalBasis.map((basis, index) => (
                      <li key={index} className="text-sm text-slate-700 pl-4 border-l-2 border-slate-200">
                        {basis}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {currentReport.recommendations.length > 0 && (
                <div>
                  <h3 className="font-bold mb-2 text-blue-600">권장 실행 단계</h3>
                  <ol className="space-y-2">
                    {currentReport.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-slate-700 pl-4">
                        <span className="font-semibold">{index + 1}.</span> {rec}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              <div className="text-xs text-slate-500 pt-4 border-t">
                생성일: {currentReport.createdAt.toLocaleString('ko-KR')} | 
                만료일: {currentReport.expiresAt.toLocaleString('ko-KR')} (24시간 후 자동 삭제)
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 리포트 아카이브 모달 */}
      <Dialog open={showArchiveModal} onOpenChange={setShowArchiveModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              <FolderArchive className="w-5 h-5 text-blue-600" />
              리포트 아카이브 (최근 5개)
            </DialogTitle>
          </DialogHeader>
          {reports.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              저장된 리포트가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <Card
                  key={report.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setCurrentReport(report)
                    setShowArchiveModal(false)
                    setShowReportModal(true)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1 text-sm text-blue-600">
                          {generateQuestionSummary(report.question)}
                        </h4>
                        <p className="text-xs text-slate-500 mb-2">
                          {report.createdAt.toLocaleString('ko-KR')}
                        </p>
                        {report.riskScore !== undefined && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  report.riskScore > 70 ? "bg-red-500" : 
                                  report.riskScore > 40 ? "bg-amber-500" : "bg-green-500"
                                )}
                                style={{ width: `${report.riskScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold">{report.riskScore}%</span>
                          </div>
                        )}
                      </div>
                      <FileText className="w-5 h-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
