import { createSupabaseBrowserClient } from '@/supabase/supabase-client'

export const searchMakers = async ({
  experience,
  job,
  specialization,
}: {
  experience?: [number, number]
  job?: string[]
  specialization?: string[]
}) => {
  const supabase = createSupabaseBrowserClient()

  let query = supabase.from('accounts').select(
    `
      *,
      account_work_experiences!account_id(*),
      account_educations!account_id(*),
      account_license!account_id(*)
    `,
  )

  // if (job.length > 0) {
  //   query = query.contains('maker.main_job', job)
  // }

  // if (specialization.length > 0) {
  //   query = query.contains('maker.expertise', specialization)
  // }
  return await query
}
