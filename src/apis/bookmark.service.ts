import { createSupabaseBrowserClient } from '@/supabase/supabase-client'

export const fetchBookmarkList = async ({
  isProposed,
  experience,
  job,
  specialization,
}: {
  isProposed: boolean
  experience?: [number, number]
  job?: string[]
  specialization?: string[]
}) => {
  const supabase = createSupabaseBrowserClient()

  let query = supabase
    .from('manager_bookmarks')
    .select(
      `
     *,
     maker:maker_id (
       *,
       account_work_experiences(*),
       account_license(*)
     )
   `,
    )
    .eq('proposal_status', isProposed)

  // if (job.length > 0) {
  //   query = query.contains('maker.main_job', job)
  // }

  // if (specialization.length > 0) {
  //   query = query.contains('maker.expertise', specialization)
  // }
  return await query
}
export const unbookmark = async (makerId: string) => {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('manager_bookmarks')
    .delete()
    .eq('maker_id', makerId)

  if (error) console.error('Delete error:', error)
  return { data, error }
}
export const propose = async () => {}
