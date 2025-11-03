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

  const { data, error } = await supabase
    .from('accounts')
    .select(
      `
      *,
      account_work_experiences (*),
      account_educations (*),
      account_license (*)
    `,
    )
    .eq('role', 'MAKER')
    .is('deleted_at', null)

  if (error) {
    console.error('searchMakers 쿼리 에러:', error)
    throw error
  }

  console.log('searchMakers 조회 결과:', { data, error, count: data?.length })

  // if (job && job.length > 0) {
  //   query = query.contains('main_job', job)
  // }

  // if (specialization && specialization.length > 0) {
  //   query = query.contains('expertise', specialization)
  // }
  
  return { data, error }
}
