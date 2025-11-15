'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Clock, DollarSign, Briefcase, Code, AlertTriangle, Send, MessageSquare, Sparkles, Bot, User } from 'lucide-react'
import { RiskGauge } from '@/components/contract/RiskGauge'
import { ContractCategoryCard, ContractCategoryData } from '@/components/contract/ContractCategoryCard'
import { MarkdownRenderer } from '@/components/rag/MarkdownRenderer'
import type { QueryResponse } from '@/types/rag'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const docId = params.docId as string

  const [loading, setLoading] = useState(true)
  const [riskScore, setRiskScore] = useState(65) // 전체 위험도 (0-100)
  
  // 채팅 관련 상태
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // 미리 생성된 질문 프롬프트
  const suggestedQuestions = [
    '이 계약서의 주요 위험 요소는 무엇인가요?',
    '근로시간 조항에 문제가 있나요?',
    '임금 지급 조건은 적절한가요?',
    '해고 관련 조항은 법적으로 유효한가요?',
    '이 계약서에서 수정이 필요한 부분은?',
  ]
  const [categories, setCategories] = useState<ContractCategoryData[]>([
    {
      category: '근로시간/휴게',
      riskScore: 70,
      icon: Clock,
      issues: [
        {
          clause: '근로시간은 주 52시간을 초과할 수 있으며, 초과근무에 대한 별도 수당은 지급하지 않습니다.',
          reason: '근로기준법 제50조(근로시간) - 1주간의 근로시간은 휴게시간을 제외하고 40시간을 초과할 수 없으며, 1일의 근로시간은 휴게시간을 제외하고 8시간을 초과할 수 없다.',
          standardClause: '근로시간은 주 40시간을 초과하지 않으며, 초과근무 시 별도의 가산수당을 지급합니다.',
          recommendation: '협상: 주 40시간 초과 시 가산수당 지급을 명시하도록 수정 요청',
        },
      ],
    },
    {
      category: '보수/수당',
      riskScore: 45,
      icon: DollarSign,
      issues: [
        {
          clause: '월 기본급은 협의에 따라 결정하며, 성과에 따라 변동될 수 있습니다.',
          reason: '근로기준법 제2조(정의) - 임금은 사용자가 근로자에게 근로의 대가로 지급하는 모든 금품을 말한다.',
          recommendation: '수정 요청: 기본급을 명확히 명시하고, 성과급은 별도로 구분하여 기재',
        },
      ],
    },
    {
      category: '수습/해지',
      riskScore: 80,
      icon: Briefcase,
      issues: [
        {
          clause: '수습기간은 6개월이며, 수습기간 중에는 언제든지 해고할 수 있습니다.',
          reason: '근로기준법 제27조(해고의 제한) - 사용자는 근로자에게 정당한 사유 없이 해고를 하지 못한다.',
          standardClause: '수습기간은 3개월을 초과하지 않으며, 정당한 사유 없이 해고할 수 없습니다.',
          recommendation: '상담: 수습기간 단축 및 해고 사유 명시 요청, 필요시 노동위원회 상담',
        },
      ],
    },
    {
      category: '스톡옵션/IP',
      riskScore: 30,
      icon: Code,
      issues: [],
    },
  ])

  useEffect(() => {
    // 실제로는 API에서 데이터를 가져와야 함
    // 임시로 로딩 시뮬레이션
    setTimeout(() => {
      setLoading(false)
    }, 2000)
  }, [docId])

  // 메시지 전송
  const handleSendMessage = async (question?: string) => {
    const query = question || inputMessage.trim()
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
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'custom',
          query: query,
          topK: 8,
          withTeams: false,
          docIds: docId ? [docId] : undefined,
        }),
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-slate-900">AI 분석 결과</h1>
          <p className="text-lg text-slate-600">계약서의 주요 조항을 분석하여 위험도를 평가했습니다</p>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <div className="absolute inset-0 w-12 h-12 border-4 border-blue-100 rounded-full mx-auto"></div>
              </div>
              <p className="text-gray-700 font-medium">계약 조항 분석 중...</p>
              <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
            </div>
          </div>
        )}

        {/* 분석 결과 */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* 좌측: 위험도 게이지 */}
            <div className="lg:col-span-1">
              <RiskGauge riskScore={riskScore} />
            </div>

            {/* 우측: 카테고리 카드들 */}
            <div className="lg:col-span-2 space-y-4">
              {categories.map((category, index) => (
                <ContractCategoryCard key={index} data={category} />
              ))}
            </div>
          </div>
        )}

        {/* 하단 CTA */}
        {!loading && (
          <div className="mt-10 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              분석이 완료되었습니다. 추가 도움이 필요하시면 상담 가이드를 확인하세요
            </p>
            <Button
              onClick={() => router.push('/guide')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              상황별 상담 가이드 보기
            </Button>
          </div>
        )}

        {/* AI 상담 채팅 UI */}
        {!loading && (
          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">AI 상담</h2>
                  <p className="text-sm text-slate-600">계약서에 대해 궁금한 점을 질문하세요</p>
                </div>
              </div>
            </div>

            {/* 추천 질문 */}
            {messages.length === 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-slate-700">추천 질문</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(question)}
                      disabled={chatLoading}
                      className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 채팅 영역 */}
            <div
              ref={chatContainerRef}
              className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden"
            >
              {/* 메시지 목록 */}
              <div className="h-[500px] overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-slate-50 to-white">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-base">위의 추천 질문을 선택하거나</p>
                      <p className="text-base">아래 입력창에 직접 질문을 입력해주세요.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* 아바타 */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {message.role === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>

                        {/* 메시지 내용 */}
                        <div className={`flex-1 max-w-[75%] ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm shadow-sm'
                            }`}
                          >
                            {message.role === 'assistant' ? (
                              <div className="prose prose-sm max-w-none">
                                <MarkdownRenderer content={message.content} />
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                            )}
                          </div>
                          <p className={`text-xs ${message.role === 'user' ? 'text-slate-500' : 'text-slate-400'}`}>
                            {message.timestamp.toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex gap-4 justify-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <span className="text-sm text-slate-600">답변 생성 중...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* 입력 영역 */}
              <div className="border-t border-slate-200 p-4 bg-white">
                <div className="flex gap-3">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="질문을 입력하세요... (Ctrl+Enter 또는 Cmd+Enter로 전송)"
                    disabled={chatLoading}
                    className="flex-1 min-h-[80px] max-h-[200px] resize-none"
                    rows={3}
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={chatLoading || !inputMessage.trim()}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-auto self-end"
                  >
                    {chatLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        전송
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-2 ml-1">
                  Shift+Enter로 줄바꿈, Ctrl+Enter(또는 Cmd+Enter)로 전송
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

