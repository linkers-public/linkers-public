'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send, MessageSquare, Sparkles, Bot, User, FileText, Zap } from 'lucide-react'
import { MarkdownRenderer } from '@/components/rag/MarkdownRenderer'
import { cn } from '@/lib/utils'
import type { LegalIssue, ContractAnalysisResult } from '@/types/legal'
import type { QueryResponse } from '@/types/rag'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ContractChatProps {
  docId: string
  analysisResult: ContractAnalysisResult
  selectedIssueId?: string
  prefilledQuestion?: string
  onQuestionPrefilled?: () => void
  externalMessage?: string
  onExternalMessageSent?: () => void
  onLoadingChange?: (loading: boolean) => void
  onMessageCountChange?: (count: number) => void
}

export function ContractChat({
  docId,
  analysisResult,
  selectedIssueId,
  prefilledQuestion,
  onQuestionPrefilled,
  externalMessage,
  onExternalMessageSent,
  onLoadingChange,
  onMessageCountChange,
}: ContractChatProps) {
  // localStorage에서 메시지 로드
  const loadMessages = (): Message[] => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(`contract_chat_${docId}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
      }
    } catch (error) {
      console.error('메시지 로드 실패:', error)
    }
    return []
  }

  // 메시지 저장
  const saveMessages = (msgs: Message[]) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(`contract_chat_${docId}`, JSON.stringify(msgs))
    } catch (error) {
      console.error('메시지 저장 실패:', error)
    }
  }

  const [messages, setMessages] = useState<Message[]>(loadMessages())
  const [inputMessage, setInputMessage] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // 초기 메시지 개수 알림
  useEffect(() => {
    const initialMessages = loadMessages()
    onMessageCountChange?.(initialMessages.length)
  }, [docId, onMessageCountChange])

  // 메시지가 변경될 때마다 저장
  useEffect(() => {
    saveMessages(messages)
    onMessageCountChange?.(messages.length)
  }, [messages, docId, onMessageCountChange])

  // 외부에서 메시지 전송 요청
  useEffect(() => {
    if (externalMessage && externalMessage.trim()) {
      handleSendMessage(undefined, externalMessage)
      onExternalMessageSent?.()
    }
  }, [externalMessage, onExternalMessageSent])

  // 로딩 상태 변경 알림
  useEffect(() => {
    onLoadingChange?.(chatLoading)
  }, [chatLoading, onLoadingChange])

  // 분석 결과 기반 추천 질문 생성 (해커톤용 강화)
  const generateSuggestedQuestions = (): string[] => {
    const questions: string[] = []
    const { issues, riskScore, summary } = analysisResult

    // 해커톤용 추천 질문 (법률용으로 튜닝)
    questions.push('이 계약서에서 가장 먼저 수정해야 할 조항은 무엇인가요?')
    
    const workingHoursIssues = issues.filter(i => i.category === 'working_hours')
    if (workingHoursIssues.length > 0) {
      questions.push('근로시간/수당 관련해서 법적으로 위험한 부분을 정리해 주세요.')
    }

    const probationIssues = issues.filter(i => i.category === 'probation')
    if (probationIssues.length > 0) {
      questions.push('수습 기간과 해지 조항을 어떻게 협상하면 좋을까요?')
    }

    // 프리랜서 vs 근로자 판단 질문
    const wageIssues = issues.filter(i => i.category === 'wage')
    if (wageIssues.length > 0 || issues.some(i => i.category === 'other')) {
      questions.push('이 계약서가 프리랜서인지 사실상 근로자인지 애매한데, 어떻게 봐야 하나요?')
    }

    // 기본 질문 (질문이 부족할 경우)
    if (questions.length < 3) {
      questions.push('이 계약서의 주요 위험 요소는 무엇인가요?')
      questions.push('임금 지급 조건은 적절한가요?')
    }

    return questions.slice(0, 4) // 최대 4개
  }

  const suggestedQuestions = generateSuggestedQuestions()

  // 메시지 전송 (해커톤용 강화 - 자동 프리필 지원)
  const handleSendMessage = async (question?: string, prefilledText?: string) => {
    const query = question || prefilledText || inputMessage.trim()
    if (!query) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')
    setChatLoading(true)

    try {
      // 선택된 이슈 정보 가져오기
      const selectedIssue = selectedIssueId 
        ? analysisResult.issues.find(i => i.id === selectedIssueId)
        : undefined

      // 분석 요약 생성
      const analysisSummary = `위험도: ${analysisResult.riskScore}점, 총 ${analysisResult.totalIssues}개 조항 발견. ${analysisResult.summary || ''}`

      // API 요청 본문 구성
      const requestBody: any = {
        mode: 'legal_contract_chat',
        query: query,
        docIds: [docId],
        topK: 8,
        withTeams: false,
      }

      // 선택된 이슈가 있으면 컨텍스트 추가
      if (selectedIssue) {
        requestBody.selectedIssueId = selectedIssue.id
        requestBody.selectedIssue = {
          category: selectedIssue.category,
          summary: selectedIssue.summary,
          severity: selectedIssue.severity,
          originalText: selectedIssue.originalText,
          legalBasis: selectedIssue.legalBasis,
        }
      }

      // 분석 요약 추가
      requestBody.analysisSummary = analysisSummary
      requestBody.riskScore = analysisResult.riskScore
      requestBody.totalIssues = analysisResult.totalIssues

      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const data: QueryResponse = await response.json()
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer || '답변을 생성할 수 없습니다.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        throw new Error('답변 생성 실패')
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '답변을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setChatLoading(false)
    }
  }

  // 프리필된 질문이 있으면 입력창에 설정
  useEffect(() => {
    if (prefilledQuestion && prefilledQuestion.trim()) {
      setInputMessage(prefilledQuestion)
      onQuestionPrefilled?.()
    }
  }, [prefilledQuestion, onQuestionPrefilled])

  // 선택된 이슈가 변경되면 자동으로 질문 생성 (프리필이 없을 때만)
  useEffect(() => {
    if (selectedIssueId && messages.length === 0 && !prefilledQuestion) {
      const issue = analysisResult.issues.find(i => i.id === selectedIssueId)
      if (issue) {
        const categoryLabels: Record<string, string> = {
          working_hours: '근로시간·연장근로',
          wage: '보수·수당',
          probation: '수습·해지',
          stock_option: '스톡옵션',
          ip: 'IP/저작권',
          harassment: '직장내괴롭힘',
          other: '기타',
        }
        const categoryLabel = categoryLabels[issue.category] || '이 조항'
        const autoQuestion = `이 ${categoryLabel} 조항에 대해 자세히 설명해주세요.`
        setInputMessage(autoQuestion)
      }
    }
  }, [selectedIssueId, analysisResult.issues, messages.length, prefilledQuestion])

  // 스크롤을 하단으로 이동
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">

      {/* 추천 질문 - 현대적인 카드 디자인 */}
      {messages.length === 0 && (
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-slate-700">추천 질문</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(question)}
                disabled={chatLoading}
                className={cn(
                  "group relative px-4 py-2.5 text-xs font-medium",
                  "bg-white border border-slate-200 rounded-xl",
                  "hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50",
                  "hover:shadow-md hover:scale-[1.02]",
                  "transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                  "text-left"
                )}
              >
                <span className="relative z-10 text-slate-700 group-hover:text-blue-700">
                  {question}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 선택된 조항 태그 */}
      {selectedIssueId && messages.length > 0 && (
        <div className="px-4 py-2.5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-blue-100 rounded-md">
              <FileText className="w-3 h-3 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-700">
              대상 조항: {analysisResult.issues.find(i => i.id === selectedIssueId)?.location.clauseNumber 
                ? `제 ${analysisResult.issues.find(i => i.id === selectedIssueId)?.location.clauseNumber}조`
                : analysisResult.issues.find(i => i.id === selectedIssueId)?.summary}
            </span>
          </div>
        </div>
      )}

      {/* 채팅 영역 */}
      <div
        ref={chatContainerRef}
        className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50"
      >
        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                  <div className="relative p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                    <MessageSquare className="w-12 h-12 mx-auto text-blue-500 mb-3" />
                    <p className="text-base font-medium text-slate-700 mb-1">질문을 시작해보세요</p>
                    <p className="text-sm text-slate-500">
                      위의 추천 질문을 선택하거나 직접 질문을 입력해주세요
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* 아바타 - 사용자는 오른쪽, AI는 왼쪽 */}
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-2 ring-white">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}

                  {/* 메시지 내용 */}
                  <div className={cn(
                    "flex flex-col gap-1.5 max-w-[85%] sm:max-w-[75%]",
                    message.role === 'user' ? 'items-end' : 'items-start'
                  )}>
                    <div
                      className={cn(
                        "relative rounded-2xl px-4 py-3 shadow-sm",
                        "transition-all duration-200",
                        message.role === 'user'
                          ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md"
                          : "bg-white border border-slate-200 text-slate-900 rounded-bl-md hover:shadow-md"
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-code:text-blue-600 prose-pre:bg-slate-50">
                          <MarkdownRenderer content={message.content} />
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-white">{message.content}</p>
                      )}
                    </div>
                    <p className={cn(
                      "text-xs px-1",
                      message.role === 'user' ? 'text-slate-500' : 'text-slate-400'
                    )}>
                      {message.timestamp.toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* 사용자 아바타 */}
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center shadow-lg ring-2 ring-white">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* 로딩 상태 */}
              {chatLoading && (
                <div className="flex gap-3 sm:gap-4 justify-start animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-2 ring-white">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-slate-600">답변 생성 중...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* 입력 영역 - 현대적인 디자인 */}
        <div className="border-t border-slate-200 bg-white/80 backdrop-blur-sm p-4 flex-shrink-0">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="질문을 입력하세요..."
                disabled={chatLoading}
                className={cn(
                  "min-h-[60px] max-h-[140px] resize-none text-sm",
                  "border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
                  "rounded-xl pr-12",
                  "transition-all duration-200"
                )}
                rows={2}
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1.5 text-xs text-slate-400">
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">Enter</kbd>
              </div>
            </div>
            <Button
              onClick={() => handleSendMessage()}
              disabled={chatLoading || !inputMessage.trim()}
              size="lg"
              className={cn(
                "h-[60px] px-6 rounded-xl",
                "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
                "text-white shadow-lg hover:shadow-xl",
                "transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg",
                "flex-shrink-0"
              )}
            >
              {chatLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
