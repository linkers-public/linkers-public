import { createSupabaseBrowserClient } from '@/supabase/supabase-client'

export const fetchBookmarkList = async () => {
  const supabase = createSupabaseBrowserClient()

  const { data, error } = await supabase.from('manager_bookmarks').select(`
   *,
   maker:maker_id (*)
 `)
  if (error) {
    console.error('Fetch error:', error)
  }
  console.log('data:', data)
  return { data, error }
}
export const bookmark = async () => {}
export const unbookmark = async () => {}
export const propose = async () => {}
