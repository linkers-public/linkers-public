'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send, MessageSquare, Sparkles, Bot, User } from 'lucide-react'
import { MarkdownRenderer } from '@/components/rag/MarkdownRenderer'
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
}

export function ContractChat({
  docId,
  analysisResult,
  selectedIssueId,
}: ContractChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // 분석 결과 기반 추천 질문 생성
  const generateSuggestedQuestions = (): string[] => {
    const questions: string[] = []
    const { issues, riskScore, summary } = analysisResult

    // 위험도가 높은 조항 관련 질문
    const highRiskIssues = issues.filter(i => i.severity === 'high')
    if (highRiskIssues.length > 0) {
      const top3 = highRiskIssues.slice(0, 3)
      const categories = [...new Set(top3.map(i => {
        const labels: Record<string, string> = {
          working_hours: '근로시간·연장근로',
          wage: '보수·수당',
          probation: '수습·해지',
          stock_option: '스톡옵션',
          ip: 'IP/저작권',
          harassment: '직장내괴롭힘',
          other: '기타',
        }
        return labels[i.category] || '기타'
      }))]
      
      if (top3.length > 0) {
        questions.push(`이 계약서에서 위험도가 가장 높은 조항 ${Math.min(3, top3.length)}개만 알려주세요.`)
      }
    }

    // 카테고리별 질문
    const categoryLabels: Record<string, string> = {
      working_hours: '근로시간·연장근로',
      wage: '보수·수당',
      probation: '수습·해지',
      stock_option: '스톡옵션',
      ip: 'IP/저작권',
      harassment: '직장내괴롭힘',
    }

    const probationIssues = issues.filter(i => i.category === 'probation')
    if (probationIssues.length > 0) {
      questions.push(`이 ${categoryLabels.probation} 조항을 회사에 어떻게 수정 요청하면 좋을까요?`)
    }

    const stockOptionIssues = issues.filter(i => i.category === 'stock_option')
    if (stockOptionIssues.length > 0) {
      questions.push(`스톡옵션 조항을 청년 입장에서 유리하게 바꾸려면 어떤 포인트를 넣어야 하나요?`)
    }

    const workingHoursIssues = issues.filter(i => i.category === 'working_hours')
    if (workingHoursIssues.length > 0) {
      questions.push(`근로기준법 기준으로, 이 근로시간·연장근로 조건이 괜찮은지 요약해 주세요.`)
    }

    // 협상 필수 항목 질문
    if (issues.length > 0) {
      questions.push(`이 계약서에 반드시 협상하거나 확인하고 넘어가야 할 항목만 콕 집어서 알려주세요.`)
    }

    // 기본 질문 (질문이 부족할 경우)
    if (questions.length < 3) {
      questions.push('이 계약서의 주요 위험 요소는 무엇인가요?')
      questions.push('임금 지급 조건은 적절한가요?')
    }

    return questions.slice(0, 5) // 최대 5개
  }

  const suggestedQuestions = generateSuggestedQuestions()

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

  // 선택된 이슈가 변경되면 자동으로 질문 생성
  useEffect(() => {
    if (selectedIssueId && messages.length === 0) {
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
  }, [selectedIssueId, analysisResult.issues, messages.length])

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
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">AI 법률 상담</h2>
            <p className="text-xs text-slate-600">
              위에서 표시된 위험 조항이나 계약 조건에 대해 구체적으로 질문하면, 
              이해하기 쉽게 설명과 행동 가이드를 드립니다.
            </p>
          </div>
        </div>
      </div>

      {/* 추천 질문 */}
      {messages.length === 0 && (
        <div className="p-4 border-b border-slate-200 bg-white flex-shrink-0">
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
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
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
        className="flex-1 flex flex-col overflow-hidden bg-white"
      >
        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white">
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
        <div className="border-t border-slate-200 p-3 bg-white flex-shrink-0">
          <div className="flex gap-2">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="질문을 입력하세요... (Ctrl+Enter 또는 Cmd+Enter로 전송)"
              disabled={chatLoading}
              className="flex-1 min-h-[60px] max-h-[120px] resize-none text-sm"
              rows={2}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={chatLoading || !inputMessage.trim()}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 h-auto self-end"
            >
              {chatLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-1 ml-1">
            Shift+Enter로 줄바꿈, Ctrl+Enter(또는 Cmd+Enter)로 전송
          </p>
        </div>
      </div>
    </div>
  )
}

