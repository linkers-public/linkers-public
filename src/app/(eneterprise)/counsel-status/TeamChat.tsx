'use client'

import React, { useState, useEffect, useRef } from 'react'
import { fetchTeamAndRecentChats, fetchMessagesByChatId, insertChatMessage } from '@/apis/chat.service' // 작성한 API 임포트
import { useRouter } from 'next/navigation'
import Card from './_components/card' // Card 컴포넌트 임포트
import Sidebar from '../../../components/Sidebar' // Sidebar 컴포넌트 임포트
import { uploadFile } from '@/apis/storage'

// 팀 정보와 최근 메시지의 타입 정의
interface CounselItem {
  team: string
  teamBio: string
  content: string
  chatId: number 
  estimateId: number 
  recentChatTimeStamp: string
}

const CounselStatus: React.FC = () => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [counselList, setCounselList] = useState<CounselItem[]>([]) // 동적으로 채울 팀과 채팅 데이터
  const [messages, setMessages] = useState<any[]>([]) // 메시지 데이터
  const [newMessage, setNewMessage] = useState('') // 새 메시지 입력 상태
  const [selectedChat, setSelectedChat] = useState<{ chatId: number, estimateId: number, teamName: string, teamBio: string } | null>(null); // 선택된 상담의 chatId와 estimateId
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  // 메시지 영역 참조
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 메시지 업데이트 시 스크롤을 하단으로 이동
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // 시간 포맷팅 함수
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const messageTime = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - messageTime.getTime()) / 1000)

    if (diffInSeconds < 60) return '방금 전'
    const year = messageTime.getFullYear().toString().slice(-2)
    const month = (messageTime.getMonth() + 1).toString().padStart(2, '0')
    const day = messageTime.getDate().toString().padStart(2, '0')
    const hours = messageTime.getHours().toString().padStart(2, '0')
    const minutes = messageTime.getMinutes().toString().padStart(2, '0')

    return `${hours}:${minutes}`
  }

  // 파일 전송 함수 
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) {
      alert('파일을 선택해주세요.');
      return;
    }
  
    const selectedFile = event.target.files[0];
    setAttachedFile(selectedFile);
  
    if (!selectedChat) {
      alert('먼저 상담을 선택해주세요.');
      return;
    }
  
    const { chatId, estimateId } = selectedChat;
  
    try {
      // 파일 업로드
      const formData = new FormData();
      formData.append('file', selectedFile);
  
      const publicUrl = await uploadFile(formData);
  
      // API 호출로 attachment 메시지 추가
      const response = await insertChatMessage({
        chat_id: chatId,
        sender_id: null, // sender_id 값을 동적으로 설정해야 할 경우 수정
        estimate_id: estimateId,
        message_type: 'attachment',
        message: '', // 첨부파일 메시지는 텍스트가 필요하지 않음
        message_sent_at: new Date().toISOString(),
        sender_type: 'client',
        attachment: publicUrl, // 업로드된 파일 URL
      });
  
      if (response?.error) {
        console.error('Attachment 메시지 전송 실패:', response.error);
        alert('파일 업로드는 성공했지만, 메시지 삽입에 실패했습니다.');
        return;
      }
  
      // UI에 attachment 메시지 추가
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          type: 'attachment',
          content: publicUrl,
          sender: 'client',
          timestamp: new Date().toISOString(),
        },
      ]);
  
      setAttachedFile(null); // 선택된 파일 초기화
      alert('파일이 성공적으로 전송되었습니다.');
    } catch (error) {
      console.error('파일 업로드 또는 메시지 삽입 실패:', error);
      alert('파일 업로드에 실패했습니다.');
    }
  };
  




  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachedFile) {
      alert('메시지나 파일을 입력해주세요.');
      return;
    }
  
    if (!selectedChat) {
      console.error('선택된 상담이 없습니다.');
      return;
    }
  
    const { chatId, estimateId } = selectedChat;
  
    try {
      let newMessageData;
  
      // 파일이 첨부된 경우 처리
      if (attachedFile) {
        const formData = new FormData();
        formData.append('file', attachedFile);
  
        const publicUrl = await uploadFile(formData);
  
        // API 호출로 attachment 메시지 추가
        newMessageData = await insertChatMessage({
          chat_id: chatId,
          sender_id: null, // 실제 값 필요
          estimate_id: estimateId,
          message_type: 'attachment',
          message: '', // 파일 메시지의 경우 빈 값
          message_sent_at: new Date().toISOString(),
          sender_type: 'client',
          attachment: publicUrl,
        });
  
        // UI에 추가
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            type: 'attachment',
            content: publicUrl,
            sender: 'client',
            timestamp: new Date().toISOString(),
          },
        ]);
  
        setAttachedFile(null); // 파일 상태 초기화
      }
  
      // 텍스트 메시지인 경우 처리
      if (newMessage.trim()) {
        newMessageData = await insertChatMessage({
          chat_id: chatId,
          sender_id: null, // 실제 값 필요
          estimate_id: estimateId,
          message_type: 'message',
          message: newMessage,
          message_sent_at: new Date().toISOString(),
          sender_type: 'client',
        });
  
        // UI에 추가
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            type: 'message',
            content: newMessage,
            sender: 'client',
            timestamp: new Date().toISOString(),
          },
        ]);
  
        setNewMessage(''); // 메시지 입력 초기화
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다.');
    }
  };
  


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
        teamBio: item.team.bio,
        content: item.recentChat?.message || '최근 메시지가 없습니다.', // 최근 메시지
        chatId: item.recentChat?.chat_id || 0, // chat_id를 가져오도록 수정
        estimateId: item.recentChat?.estimate_id || 0, // estimateId 추가
        recentChatTimeStamp: item.recentChat?.message_sent_at || '',
      }))
      setCounselList(updatedCounselList) // 상태 업데이트
    } catch (error) {
      setError(error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  // 채팅 클릭 시 메시지 가져오기
  const handleMessageClick = async (chatId: number, estimateId: number, teamName: string, teamBio: string) => {
    setSelectedChat({ chatId, estimateId, teamName, teamBio }); // 선택된 채팅 정보 저장
    setMessages([]) // 메시지 초기화
    try {
      const messageData = await fetchMessagesByChatId(chatId)
      const formattedMessages = messageData.map((msg) => ({
        type: msg.message.message_type,
        content: msg.message.message,
        timestamp: msg.message.message_sent_at,
        sender: msg.message.sender_type,
        title: msg.message.message_type === 'card' ? '견적서' : '',
        subtitle: msg.message.message_type === 'card' ? msg.estimateVersion?.detail : '',
        attachment: msg.message.attachment
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
                  justifyContent: 'space-between', // 오른쪽에 시간 표시
                  padding: '12px',
                  marginBottom: '12px',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer', // 클릭 가능
                }}
                onClick={() =>
                  handleMessageClick(item.chatId, item.estimateId, item.team, item.teamBio)
                } // 상담 클릭 시 메시지 로드
              >
                {/* 왼쪽: 팀 정보 */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
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
                    <p
                      style={{
                        margin: '0 0 5px 0',
                        fontWeight: 'bold',
                        fontSize: '16px',
                      }}
                    >
                      {item.team}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        color: '#888',
                        fontSize: '14px',
                        maxHeight: '38px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '19px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2, // 최대 2줄로 제한
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.content}
                    </p>
                  </div>
                </div>

                {/* 오른쪽: 시간 표시 */}
                <div
                  style={{
                    color: '#888',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.recentChatTimeStamp
                    ? formatRelativeTime(item.recentChatTimeStamp)
                    : ''}
                </div>
              </div>
            ))}
        </div>

      </main>

      <main style={{ flex: 2, padding: '20px', backgroundColor: '#f9f9f9' }}>
        {/* 팀 정보 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '15px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                backgroundColor: selectedChat ? '#808080' : '#f1f1f1',
                borderRadius: '50%',
                marginRight: '15px',
              }}
            ></div>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px', color: selectedChat ? '#000' : '#aaa' }}>
                {selectedChat ? selectedChat.teamName : '팀 정보 없음'}
              </p>
              <p style={{ margin: 0, color: selectedChat ? '#888' : '#ccc', fontSize: '14px' }}>
                {selectedChat ? selectedChat.teamBio : '팀 설명 없음'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: '#f1f1f1',
                color: '#888',
                borderRadius: '8px',
                border: '1px solid #ddd',
                cursor: selectedChat ? 'pointer' : 'not-allowed',
              }}
              disabled={!selectedChat}
            >
              견적서 모음
            </button>
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: selectedChat ? '#007bff' : '#ccc',
                color: '#fff',
                borderRadius: '8px',
                border: 'none',
                cursor: selectedChat ? 'pointer' : 'not-allowed',
              }}
              disabled={!selectedChat}
            >
              결제하기
            </button>
          </div>
        </div>
        {/* 메시지 영역 */}
        <div
          style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
            height: 'calc(100vh - 300px)',
            overflowY: 'scroll',
          }}
        >

          {/* 메시지 표시 */}
          {messages.map((msg, index) => (
            <div key={index} style={{ marginBottom: '20px' }}>
              {msg && msg.type === 'message' ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'client' ? 'flex-end' : 'flex-start',
                    marginBottom: '15px',
                  }}
                >
                  {/* Manager 메시지일 경우 */}
                  {msg.sender === 'manager' && (
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    
                      <p
                        style={{
                          margin: 0,
                          fontSize: '14px',
                          color: '#888',
                          fontWeight: 'bold',
                        }}
                      >
                        {selectedChat?.teamName || '팀 이름 없음'}
                      </p>
                    </div>
                  )}

                  {/* 일반 메시지 박스 */}
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '10px 15px',
                      borderRadius: '12px',
                      backgroundColor: msg.sender === 'client' ? '#d4f1f4' : '#f1f1f1',
                      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                      wordWrap: 'break-word',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>{msg.content}</p>
                  </div>

                  {/* 타임스탬프 */}
                  <p
                    style={{
                      marginTop: '5px',
                      fontSize: '12px',
                      color: '#888',
                    }}
                  >
                    {formatRelativeTime(msg.timestamp)}
                  </p>
                </div>
              ) : msg && msg.type === 'attachment' ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'client' ? 'flex-end' : 'flex-start',
                    marginBottom: '15px',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '10px',
                      borderRadius: '12px',
                      backgroundColor: msg.sender === 'client' ? '#eaf7ea' : '#f1f1f1',
                      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                      wordWrap: 'break-word',
                    }}
                  >
                    {/* 이미지 첨부파일 */}
                    {msg.attachment && typeof msg.attachment === 'string' && msg.attachment.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                      <img
                        src={msg.attachment}
                        alt="첨부 이미지"
                        style={{
                          maxWidth: '100%',
                          borderRadius: '8px',
                          marginBottom: '5px',
                        }}
                      />
                    ) : (
                      /* 일반 파일 첨부 */
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          backgroundColor: '#f9f9f9',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        <p
                          style={{
                            fontSize: '14px',
                            color: '#333',
                            marginBottom: '5px',
                            wordBreak: 'break-word',
                          }}
                        >
                          {msg.attachment && typeof msg.attachment === 'string' ? msg.attachment.split('/').pop() : '파일 없음'}
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <a
                            href={msg.attachment || '#'}
                            download={msg.attachment && typeof msg.attachment === 'string' ? msg.attachment.split('/').pop() : ''}
                            style={{
                              color: '#007bff',
                              textDecoration: 'none',
                              fontSize: '14px',
                            }}
                          >
                            다운로드
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 타임스탬프 */}
                  <p
                    style={{
                      marginTop: '5px',
                      fontSize: '12px',
                      color: '#888',
                    }}
                  >
                    {msg.timestamp ? formatRelativeTime(msg.timestamp) : ''}
                  </p>
                </div>
              ) : (
                <Card
                  title={msg.title}
                  subtitle={msg.subtitle}
                  content={msg.content}
                  sender={msg.sender}
                  buttonText1="확인"
                  buttonText2="파일 첨부"
                  onButtonClick1={() => alert('확인 버튼 클릭됨')}
                  onButtonClick2={() => alert('파일 첨부 버튼 클릭됨')}
                />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>



        {/* 메시지 전송 영역 */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px', borderTop: '1px solid #ddd' }}>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              backgroundColor: '#f1f1f1',
              borderRadius: '50%',
              marginRight: '10px',
              cursor: 'pointer',
            }}
          >
            <input
              type="file"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            📎 {/* Replace with an appropriate icon */}
          </label>
          <div style={{ display: 'flex', marginTop: '15px' }}>
            <input
              type="text"
              placeholder="메시지를 입력하세요"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={messages.length === 0}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: messages.length === 0 ? '#f1f1f1' : '#fff',
              }}
            />
            <button
              onClick={() => handleSendMessage(newMessage)}
              disabled={messages.length === 0}
              style={{
                padding: '10px 15px',
                backgroundColor: messages.length === 0 ? '#ccc' : '#007bff',
                color: '#fff',
                borderRadius: '8px',
                marginLeft: '10px',
                cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              전송
            </button>
          </div>
        </div>
      </main>

    </div>
  )
}

export default CounselStatus
