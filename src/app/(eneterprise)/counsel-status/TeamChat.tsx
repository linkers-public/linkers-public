'use client'

import React, { useState, useEffect } from 'react'
import { fetchTeamAndRecentChats, fetchMessagesByChatId, insertChatMessage } from '@/apis/chat.service' // 작성한 API 임포트
import { useRouter } from 'next/navigation'
import Card from './_components/card' // Card 컴포넌트 임포트
import Sidebar from '../../../components/Sidebar' // Sidebar 컴포넌트 임포트

// 팀 정보와 최근 메시지의 타입 정의
interface CounselItem {
  team: string
  content: string
  chatId: number // 채팅 ID 추가
  estimateId: number // estimateId 추가
}

const CounselStatus: React.FC = () => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [counselList, setCounselList] = useState<CounselItem[]>([]) // 동적으로 채울 팀과 채팅 데이터
  const [messages, setMessages] = useState<any[]>([]) // 메시지 데이터
  const [newMessage, setNewMessage] = useState('') // 새 메시지 입력 상태
  const [selectedChat, setSelectedChat] = useState<{ chatId: number, estimateId: number } | null>(null); // 선택된 상담의 chatId와 estimateId

  // 메시지 전송 함수
  const handleSendMessage = async (msg: string) => {
    if (!msg.trim()) return // 공백 메시지 방지

    console.log(selectedChat)
    if (!selectedChat) {
      console.error('선택된 상담이 없습니다.');
      return;
    }

    const { chatId, estimateId } = selectedChat; // selectedChat에서 chatId와 estimateId 가져오기

    console.log("Sending message with chatId:", chatId, "estimateId:", estimateId);

    if (!chatId) {
      console.error('Chat ID가 없습니다.')
      return;
    }

    try {
      // 메시지 전송 API 호출
      const response = await insertChatMessage({
        chat_id: chatId,
        sender_id: null, // sender_id 값은 실제로 동적으로 처리해야 함
        estimate_id: estimateId,
        message_type: 'message',
        message: msg,
        message_sent_at: new Date().toISOString(),
        sender_type: 'client',
        attachment: null, // 첨부파일이 있다면 여기에 추가
      })

      if (response.error) {
        console.error('메시지 전송 실패:', response.error)
        return
      }

      // 성공적으로 메시지를 전송한 후 UI에 메시지 추가
      setMessages([...messages, { type: 'message', content: msg, sender: 'client' }])
      setNewMessage('') // 입력창 초기화

    } catch (error) {
      console.error('메시지 전송 에러:', error)
    }
  }

  // 검색어 변경 처리
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // 데이터 가져오기
  const fetchData = async () => {
    const clientId = 1 // 실제 client_id를 동적으로 처리해야 함
    try {
      const data = await fetchTeamAndRecentChats(clientId)
      // 팀명과 가장 최근 메시지, estimateId와 chatId를 counselList에 저장
      const updatedCounselList = data.map((item) => ({
        team: item.team.name, // 팀명
        content: item.recentChat?.message || '최근 메시지가 없습니다.', // 최근 메시지
        chatId: item.recentChat?.chat_id || 0, // chat_id를 가져오도록 수정
        estimateId: item.recentChat?.estimate_id || 0, // estimateId 추가
      }))
      setCounselList(updatedCounselList) // 상태 업데이트
    } catch (error) {
      setError(error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  // 채팅 클릭 시 메시지 가져오기
  const handleMessageClick = async (chatId: number, estimateId: number) => {
    setSelectedChat({ chatId, estimateId }); // 선택된 채팅 정보 저장
    setMessages([]) // 메시지 초기화
    try {
      const messageData = await fetchMessagesByChatId(chatId)
      const formattedMessages = messageData.map((msg) => ({
        type: msg.message.message_type,
        content: msg.message.message,
        sender: msg.message.sender_type,
        title: msg.message.message_type === 'card' ? '견적서' : '',
        subtitle: msg.message.message_type === 'card' ? msg.estimateVersion?.detail : ''
      }))
      setMessages(formattedMessages) // 메시지 상태 업데이트
      console.log('Estimate ID:', estimateId) // 클릭된 estimateId 출력
      console.log('chatId:', chatId)
    } catch (error) {
      setError(error as Error)
    }
  }

  // 컴포넌트 로드 시 데이터 가져오기
  useEffect(() => {
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-palette-coolNeutral-60">로딩중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-palette-coolNeutral-60">
          에러가 발생했습니다: {error.message}
        </p>
      </div>
    )
  }

  return (
    <div
      style={{ display: 'flex', height: '100vh', backgroundColor: '#f9f9f9' }}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main style={{ flex: 2, padding: '20px', backgroundColor: '#f9f9f9' }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="팀명으로 검색해보세요"
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '16px',
              marginRight: '10px',
            }}
          />
          <button
            style={{
              padding: '10px 15px',
              backgroundColor: '#007bff',
              color: '#fff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            검색
          </button>
        </div>

        {/* 상담 목록 */}
        <div>
          {counselList
            .filter((item) => item.team.includes(searchTerm)) // 검색어로 팀명 필터링
            .map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  marginBottom: '12px',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer', // 클릭할 수 있도록 커서 변경
                }}
                onClick={() => handleMessageClick(item.chatId, item.estimateId)} // 상담 클릭 시 메시지 로드
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#808080',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: '15px',
                  }}
                >
                  <img
                    src="/images/image.png"
                    alt="file icon"
                    style={{ width: '16px', height: '16px' }}
                  />
                </div>

                <div>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '16px' }}>{item.team}</p>
                  <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>{item.content}</p>
                </div>
              </div>
            ))}
        </div>
      </main>

      {/* 메시지 영역 */}
      <main style={{ flex: 3, padding: '20px', backgroundColor: '#fff' }}>
        <div
          style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
            height: 'calc(100vh - 200px)',
            overflowY: 'scroll',
            border: '1px solid #ddd',
          }}
        >
          {/* 메시지 표시 */}
          {messages.map((msg, index) => (
            <div key={index} style={{ marginBottom: '15px', display: 'flex', justifyContent: msg.sender === 'client' ? 'flex-end' : 'flex-start' }}>
              {msg.type === 'message' ? (
                <div
                  style={{
                    backgroundColor: '#f1f1f1',
                    borderRadius: '8px',
                    padding: '10px 15px',
                    maxWidth: '70%',
                    marginBottom: '10px',
                    textAlign: 'left',
                  }}
                >
                  {msg.content}
                </div>
              ) : (
                <Card
                  title={msg.title}
                  subtitle={msg.subtitle}
                  content='dd'
                  buttonText1='버튼1'
                  buttonText2='버튼2'
                  sender={msg.sender_type}
                  onButtonClick1={() => router.push(`/estimate/${selectedChat?.estimateId}`)} // 카드 클릭 시 이동
                  onButtonClick2={() => router.push(`/estimate/${selectedChat?.estimateId}`)} // 카드 클릭 시 이동
                />
              )}
            </div>
          ))}
        </div>

        {/* 메시지 전송 영역 */}
        <div style={{ display: 'flex', marginTop: '15px' }}>
          <input
            type="text"
            placeholder="메시지를 입력하세요"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{
              width: '80%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '16px',
              marginRight: '10px',
            }}
          />
          <button
            onClick={() => handleSendMessage(newMessage)}
            style={{
              padding: '10px 15px',
              backgroundColor: '#28a745',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '16px',
            }}
          >
            전송
          </button>
        </div>
      </main>
    </div>
  )
}

export default CounselStatus
