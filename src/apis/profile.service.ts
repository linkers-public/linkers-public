import { createSupabaseBrowserClient } from '@/supabase/supabase-client'

export const updateCareer = async (id: number, data: any) => {
  const supabase = createSupabaseBrowserClient()

  console.log('Update data:', data)

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession()
  if (!sessionData.session) {
    throw new Error('인증되지 않은 사용자입니다.')
  }

  const { data: career, error } = await supabase
    .from('account_work_experiences')
    .update(data)
    .eq('id', id)
    .select('*')
  if (error) {
    console.error('Update error:', error)
  }

  return { career, error }
}
export const createCareer = async (data: any) => {
  const supabase = createSupabaseBrowserClient()

  console.log('Create data:', data)

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession()
  if (!sessionData.session) {
    throw new Error('인증되지 않은 사용자입니다.')
  }

  const { data: career, error } = await supabase
    .from('account_work_experiences')
    .insert(data)
    .select('*')
    .single()

  if (error) {
    console.error('Create error:', error)
  }

  return { data: career, error }
}
export const deleteCareer = async (id: string) => {}

export const updateEducation = async (id: number, data: any) => {
  const supabase = createSupabaseBrowserClient()

  console.log('Update education data:', data)

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession()
  if (!sessionData.session) {
    throw new Error('인증되지 않은 사용자입니다.')
  }

  const { data: education, error } = await supabase
    .from('account_educations')
    .update(data)
    .eq('id', id)
    .select('*')
  if (error) {
    console.error('Update error:', error)
  }

  return { education, error }
}
export const createEducation = async (data: any) => {
  const supabase = createSupabaseBrowserClient()

  console.log('Create education data:', data)

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession()
  if (!sessionData.session) {
    throw new Error('인증되지 않은 사용자입니다.')
  }

  const { data: education, error } = await supabase
    .from('account_educations')
    .insert(data)
    .select('*')
    .single()

  if (error) {
    console.error('Create error:', error)
  }

  return { data: education, error }
}
export const deleteEducation = async (id: string) => {}

export const updateLicense = async (data: any) => {}
export const createLicense = async (data: any) => {}
export const deleteLicense = async (id: string) => {}

export const updateProfile = async (data: any) => {}
export const updateProfileImage = async (data: any) => {}

export const fetchMyProfile = async () => {
  const supabase = createSupabaseBrowserClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Not authenticated')

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
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return data
}

export const fetchUserProfile = async (username: string) => {
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
    .eq('username', username)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    throw error
  }

  return data
}
