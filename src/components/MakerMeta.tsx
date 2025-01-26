import React from 'react'
import { Button } from '@/components/ui/button'
import { CommonModal } from '@/components/ConfirmModal'
import { calculateTotalExperience } from '@/lib/transformExperienceDate'

interface Maker {
  username: string
  main_job: string[] | null
  expertise: string[] | null
  account_work_experiences: any[]
}

interface Bookmark {
  id: number
  maker_id: string
  maker: Maker
  proposal_status: boolean
}

interface BookmarkCardProps {
  bookmark: Bookmark
  onUnbookmark: (makerId: string) => void
  onPropose?: (makerId: string) => void
}

export const MakerCard = ({
  bookmark,
  onUnbookmark,
  onPropose,
}: BookmarkCardProps) => {
  return (
    <div className="flex shadow-normal justify-between py-4 px-6 rounded-[12px] gap-2">
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-full bg-palette-coolNeutral-90" />
        <div>
          <h3 className="text-subtitle2">{bookmark.maker.username}</h3>
          <div className="flex flex-col gap-2 text-p3 text-palette-coolNeutral-60">
            <span>
              총 경력 :
              {bookmark.maker.account_work_experiences.length > 0 ? (
                <span>
                  {
                    calculateTotalExperience(
                      bookmark.maker.account_work_experiences,
                    ).years
                  }
                  년{' '}
                  {
                    calculateTotalExperience(
                      bookmark.maker.account_work_experiences,
                    ).months
                  }
                  개월
                </span>
              ) : (
                <span>신입</span>
              )}
              <span className="text-palette-coolNeutral-40 ml">
                {'  '}(
                {bookmark.maker.account_work_experiences.length > 0 &&
                  bookmark.maker.account_work_experiences.map(
                    (exp) => exp.company_name,
                  )}
                )
              </span>
            </span>
            <span>주직무 : {bookmark.maker.main_job?.join(', ')}</span>
            <span>전문분야 : {bookmark.maker.expertise?.join(', ')}</span>
            <div className="flex gap-2">
              <span className="rounded-full px-2 py-1 border-solid border border-palette-coolNeutral-90 text-palette-coolNeutral-40 text-xs">
                주요 스킬1
              </span>
              <span className="rounded-full px-2 py-1 border-solid border border-palette-coolNeutral-90 text-palette-coolNeutral-40 text-xs">
                주요 스킬2
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-4">
        <CommonModal
          trigger={
            <Button className="bg-palette-primary-normal text-subtitle3 text-white rounded-[12px] w-[240px] h-[48px]">
              찜 취소하기
            </Button>
          }
          title="찜 취소"
          description="해당 메이커를 찜 목록에서 삭제하시겠습니까?"
          onConfirm={() => onUnbookmark(bookmark.maker_id)}
          confirmText="삭제"
        />
        {!bookmark.proposal_status && onPropose && (
          <Button
            className="bg-palette-primary-normal text-subtitle3 text-white rounded-[12px] w-[240px] h-[48px]"
            onClick={() => onPropose(bookmark.maker_id)}
          >
            제안하기
          </Button>
        )}
      </div>
    </div>
  )
}
