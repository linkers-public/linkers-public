'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'

interface ProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  makerUsername: string
  makerId: string
}

export const ProposalDialog = ({
  open,
  onOpenChange,
  makerUsername,
  makerId,
}: ProposalDialogProps) => {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const MAX_MESSAGE_LENGTH = 1000

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setMessage(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '메시지를 입력해주세요.',
      })
      return
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: `메시지는 ${MAX_MESSAGE_LENGTH}자를 넘을 수 없습니다.`,
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      // TODO: 실제 메시지 전송 API 연동
      // 현재는 임시로 성공 처리
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast({
        title: '팀 제안 전송 완료',
        description: `${makerUsername}님에게 팀 제안을 보냈습니다.`,
      })
      
      setMessage('')
      onOpenChange(false)
    } catch (error) {
      console.error('제안 전송 실패:', error)
      toast({
        variant: 'destructive',
        title: '전송 실패',
        description: '팀 제안 전송에 실패했습니다. 다시 시도해주세요.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>팀 제안하기</DialogTitle>
          <DialogDescription>
            {makerUsername}님에게 팀 제안을 보냅니다.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                메시지 내용
              </label>
              <Textarea
                value={message}
                onChange={handleMessageChange}
                placeholder="팀 제안 내용을 입력해주세요..."
                rows={6}
                className="resize-none"
                maxLength={MAX_MESSAGE_LENGTH}
              />
              <p className={`text-xs mt-2 ${
                message.length >= MAX_MESSAGE_LENGTH 
                  ? 'text-red-500' 
                  : 'text-gray-500'
              }`}>
                {message.length}/{MAX_MESSAGE_LENGTH}자
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '전송 중...' : '전송하기'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

