import { createSupabaseBrowserClient } from '@/supabase/supabase-client'

// `client_id`를 기준으로 해당하는 모든 팀 정보와 가장 최근의 채팅 메시지를 가져오는 함수
export const fetchTeamAndRecentChats = async (clientId: number) => {
  const supabase = createSupabaseBrowserClient()

  // 세션 정보 확인
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (!sessionData?.session) {
    throw new Error('인증되지 않은 사용자입니다.')
  }

  // client_id에 해당하는 estimate 테이블에서 estimate_status가 'accept'인 모든 데이터 가져오기
  const { data: estimates, error: estimateError } = await supabase
    .from('estimate')
    .select('estimate_id, team_id')  // 필요한 필드만 선택 (team_id 포함)
    .eq('client_id', clientId)  // client_id에 해당하는 estimate 필터링
    .eq('estimate_status', 'accept')  // estimate_status가 'accept'인 필터링

  if (estimateError) {
    console.error('Error fetching estimates:', estimateError.message)
    throw new Error('estimate 데이터 조회 실패')
  }

  if (!estimates || estimates.length === 0) {
    throw new Error('해당하는 ' + clientId + '의 "accept" 상태 estimate가 없습니다.')
  }

  // 세션에서 manager_id 확인
  const targetManagerId = sessionData.session.user.id
  console.log('targetManagerId ::', targetManagerId) // 확인용

  // 여러 팀에 대해 팀 정보를 가져오기 (세션에 맞는 권한으로 조회)
  const teamIds = estimates.map(estimate => estimate.team_id); // 여러 팀 ID를 추출
  console.log('teamIds ::', teamIds)
  if (teamIds.length === 0) {
    console.error('No team IDs found for clientId:', clientId)
    throw new Error('해당 client_id에 해당하는 팀이 없습니다.')
  }

  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .in('id', teamIds)  // 여러 팀 ID에 해당하는 팀 정보 조회
    // .eq('manager_id', targetManagerId) // RLS 정책에 맞는 manager_id로 필터링

  if (teamError) {
    console.error('Error fetching team data:', teamError.message)
    throw new Error('팀 정보 조회 실패')
  }

  console.log('teamData ::', teamData)  // 팀 데이터 확인

  // 각 팀에 대해 가장 최근의 채팅 메시지를 가져오기
  const teamChats = await Promise.all(
    estimates.map(async (estimate) => {
      const { data: chatMessages, error: chatError } = await supabase
        .from('chat_message')
        .select('*')
        .eq('chat_id', estimate.estimate_id)  // 해당하는 chat_id 조회
        .eq('message_type', 'message')
        .order('message_sent_at', { ascending: false })  // 최신 메시지부터 가져오기
        .limit(1)  // 가장 최근 메시지 1개만 가져오기

      if (chatError) {
        console.error(`Error fetching chat messages for team ${estimate.team_id}:`, chatError.message)
        return { teamId: estimate.team_id, recentChat: null }
      }

      // 채팅 메시지가 없는 경우 처리
      if (!chatMessages || chatMessages.length === 0) {
        console.log(`No chat messages found for team ${estimate.team_id} with estimate_id ${estimate.estimate_id}`)
        return { teamId: estimate.team_id, recentChat: null }
      }

      return {
        teamId: estimate.team_id,
        recentChat: chatMessages[0],  // 가장 최근 메시지
      }
    })
  )

  // 팀 데이터와 최근 메시지를 결합하여 반환
  const result = teamData.map(team => {
    const teamChat = teamChats.find(chat => chat.teamId === team.id)
    return {
      team: team,
      recentChat: teamChat ? teamChat.recentChat : null, // 가장 최근 채팅 메시지
    }
  })

  console.log('결과 ::', result)  // 최종 결과 확인
  return result
}


//메시지 가져오기기
export const fetchMessagesByChatId = async (chatId: number) => {
  const supabase = createSupabaseBrowserClient()

  // 세션 정보 확인
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (!sessionData?.session) {
    throw new Error('인증되지 않은 사용자입니다.')
  }

  console.log("chatId: " + chatId)
  // chat_message 테이블에서 chat_id에 해당하는 모든 메시지 가져오기
  const { data, error } = await supabase
    .from('chat_message')
    .select('*')  // 모든 필드를 선택
    .eq('chat_id', chatId)  // 해당 chat_id로 필터링

  if (error) {
    console.error('Error fetching chat messages:', error.message)
    throw new Error('채팅 메시지 조회 실패')
  }

  if (!data || data.length === 0) {
    throw new Error(`chat_id ${chatId}에 해당하는 메시지가 없습니다.`)
  }

  console.log("data:", data)
  // message_type이 'card'인 경우, estimate_id를 이용해 estimate_version 테이블에서 최신 데이터 가져오기
  const updatedMessages = await Promise.all(
    data.map(async (message) => {
      let estimateVersionData = null;

      if (message.message_type === 'card' && message.estimate_id) {
        // 'card' 메시지에 대해 estimate_version 테이블에서 최신 데이터 가져오기
        const { data: estimateVersion, error: estimateVersionError } = await supabase
          .from('estimate_version')
          .select('*')
          .eq('estimate_id', message.estimate_id)  // 해당 estimate_id로 필터링
          .order('version_date', { ascending: false })  // 최신 버전 데이터 가져오기
          .limit(1)  // 가장 최신 데이터 한 건만 가져오기

        if (estimateVersionError) {
          console.error('Error fetching estimate version:', estimateVersionError.message)
          throw new Error('견적서 버전 조회 실패')
        }

        // 최신 estimate_version 데이터를 가져옴
        estimateVersionData = estimateVersion && estimateVersion.length > 0 ? estimateVersion[0] : null;
      }
      console.log('estimate_version', estimateVersionData)
      // 메시지와 estimate_version 데이터 묶어서 반환
      return { message, estimateVersion: estimateVersionData }
    })
  )

  return updatedMessages
}


// 메시지 삽입 
export const insertChatMessage = async (data: any) => {
  const supabase = createSupabaseBrowserClient()

  console.log('Insert chat message data:', data)

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession()
  if (!sessionData.session) {
    throw new Error('인증되지 않은 사용자입니다.')
  }

  const { data: chatMessage, error } = await supabase
    .from('chat_message')
    .insert(data)  
    .select('*')   
    .single()       

  if (error) {
    console.error('Create error:', error)
    throw new Error('채팅 메시지 삽입 실패')
  }

  return { data: chatMessage, error }
}
