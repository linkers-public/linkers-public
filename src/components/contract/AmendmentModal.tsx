'use client'

import { Copy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import type { LegalIssue } from '@/types/legal'

interface AmendmentModalProps {
  issue: LegalIssue
  isOpen: boolean
  onClose: () => void
}

export function AmendmentModal({ issue, isOpen, onClose }: AmendmentModalProps) {
  const { toast } = useToast()
  
  if (!isOpen) return null

  const handleCopy = async (text: string, description?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: '복사 완료',
        description: description || '클립보드에 복사되었습니다.',
      })
    } catch (error) {
      toast({
        title: '복사 실패',
        description: '클립보드에 복사할 수 없습니다.',
        variant: 'destructive',
      })
    }
  }

  const handleCopyConsultationText = () => {
    const text = '이 조항이 법적으로 적절한지 검토 부탁드립니다.'
    handleCopy(text, '전문가 상담 문구가 클립보드에 복사되었습니다.')
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              이 조항, 이렇게 바꾸는 것을 권장합니다
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              이 문장은 예시입니다. 실제 계약서 반영 전 전문가 상담을 권장합니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-6">
          {/* 원문 블록 */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">현재 계약서 문구</h4>
            <div className="bg-slate-100 border border-slate-300 rounded-lg p-4">
              <p className="text-sm text-slate-900 whitespace-pre-wrap">{issue.originalText}</p>
            </div>
          </div>

          {/* 수정안 블록 */}
          {issue.suggestedText && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">권장 수정 예시</h4>
              <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                <p className="text-sm text-slate-900 whitespace-pre-wrap">{issue.suggestedText}</p>
              </div>
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(issue.suggestedText!, '수정안 문구가 클립보드에 복사되었습니다.')}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  문구 복사하기
                </Button>
              </div>
            </div>
          )}

          {/* 이유/근거 섹션 */}
          {issue.rationale && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">왜 이렇게 고치는 게 좋은가?</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{issue.rationale}</p>
              </div>
            </div>
          )}

          {/* 법적 근거 */}
          {issue.legalBasis && issue.legalBasis.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">법적 근거</h4>
              <div className="space-y-2">
                {issue.legalBasis.map((basis, idx) => (
                  <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-slate-700">{basis}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={handleCopyConsultationText}
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-1" />
              전문가 상담 문구 복사
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              닫기
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

