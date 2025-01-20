'use client'

import React, { useEffect, useState } from 'react';
import { fetchChatsAndMessagesByTeamId, fetchMessagesByChatId } from '@/apis/chat.service';
import Sidebar from '../../../components/Sidebar' // Sidebar 컴포넌트 임포트
import { Users, MousePointer2, Paperclip } from 'lucide-react';

const Home: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('메시지');
  const [chatId, setChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [openProjects, setOpenProjects] = useState(false) // 드롭다운 상태 관리
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [milestones, setMilestones] = useState<any[]>([]); // Milestones data

  const teamId = 8
  // 팀 ID로 message와 attachment 데이터를 가져오기
  useEffect(() => {
    const fetchMessageData = async () => {
      try {
        if (selectedTab === '메시지') {
          const { data: messageData } = await fetchChatsAndMessagesByTeamId(teamId, 'message');
          setMessages(messageData);
        } else if (selectedTab === '첨부파일') {
          const { data: attachmentData } = await fetchChatsAndMessagesByTeamId(teamId, 'attachment');
          setAttachments(attachmentData);
        } else if (selectedTab === '마일스톤') {
          // Simulate milestone fetching
          const milestoneData = [
            {
              title: '마일스톤 제목 1 최대 한줄',
              details: '마일스톤 세부 사항 최대 2줄 말줄임...',
              deadline: '기한 24/09/11 ~ 25/03/22',
              status: '정산 완료',
            },
            {
              title: '마일스톤 제목 2 최대 한줄',
              details: '마일스톤 세부 사항 최대 2줄 말줄임...',
              deadline: '기한 24/09/11 ~ 25/03/22',
              status: '대기 중',
            },
          ];
          setMilestones(milestoneData);
        }
      } catch (error) {
        console.error('데이터를 가져오는 중 오류 발생:', error);
      }
    };

    fetchMessageData();
  }, [teamId, selectedTab]);

  const handleTabClick = (tab: string) => {
    setSelectedTab(tab);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) {
      alert('메시지나 파일을 입력하세요.');
      return;
    }
    console.log('메시지 전송:', newMessage, '파일:', selectedFile);

    try {
      // 메시지 전송 API 호출
      // 메시지 로직 예시 (API 호출 코드 필요)
      /*
      await insertChatMessage({
        chat_id: chatId,
        message: newMessage,
        message_type: selectedFile ? 'attachment' : 'message',
        attachment: selectedFile ? await uploadFile(selectedFile) : null,
        sender_type: 'client',
      });
      */

      // UI 갱신
      setMessages((prev) => [
        ...prev,
        {
          message: newMessage,
          message_type: selectedFile ? 'attachment' : 'message',
          attachment: selectedFile ? URL.createObjectURL(selectedFile) : null,
        },
      ]);
      setNewMessage('');
      setSelectedFile(null);
    } catch (error) {
      console.error('메시지 전송 중 오류 발생:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  return (
    <div
      style={{ display: 'flex', height: '100vh', backgroundColor: '#f9f9f9' }}
    >      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main style={{ flex: 5, padding: '20px' }}>
        {/* 우측 상단 네 개의 주요 박스 */}
        <header style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '10px',
              backgroundColor: '#f1f1f1',
              borderRadius: '8px',
            }}
          >
            <div>진행도</div>
            <div>03 / 04</div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '10px',
              backgroundColor: '#f1f1f1',
              borderRadius: '8px',
            }}
          >
            <div>총 금액</div>
            <div>2,240,000 원</div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '10px',
              backgroundColor: '#f1f1f1',
              borderRadius: '8px',
            }}
          >
            <div>지급 금액</div>
            <div>1,240,000 원</div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '10px',
              backgroundColor: '#f1f1f1',
              borderRadius: '8px',
            }}
          >
            <div>다음 접수 기한</div>
            <div>24년 02월 31일</div>
          </div>
        </header>

        {/* 팀명 및 결제 버튼 UI */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            marginBottom: '20px',
          }}
        >
          {/* 팀 정보 */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#e0e0e0',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: '10px',
              }}
            >
              <Users/>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                팀 명 (마지막 접속일 / 평균 진행도)
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                팀 소개 한줄 팀 소개 한줄 팀 소개 한줄
              </p>
            </div>
          </div>

          {/* 결제 및 진행 취소 버튼 */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: '#f1f1f1',
                border: '1px solid #ddd',
                borderRadius: '8px',
                color: '#333',
                cursor: 'pointer',
              }}
              onClick={() => console.log('진행취소')}
            >
              진행취소
            </button>
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              onClick={() => console.log('결제하기')}
            >
              결제하기
            </button>
          </div>
        </div>


        {/* 탭 섹션 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #e0e0e0',
          marginBottom: '20px',
        }}
      >
        <button
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '10px 0',
              fontSize: '16px',
              fontWeight: 'bold',
              color: selectedTab === '마일스톤' ? '#007bff' : '#000',
              border: 'none',
              borderBottom: selectedTab === '마일스톤' ? '2px solid #007bff' : 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
            }}
            onClick={() => handleTabClick('마일스톤')}
          >
            마일스톤
          </button>
        <button
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '10px 0',
            fontSize: '16px',
            fontWeight: 'bold',
            color: selectedTab === '메시지' ? '#007bff' : '#000',
            border: 'none',
            borderBottom: selectedTab === '메시지' ? '2px solid #007bff' : 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
          onClick={() => handleTabClick('메시지')}
        >
          메시지
        </button>
        <button
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '10px 0',
            fontSize: '16px',
            fontWeight: 'bold',
            color: selectedTab === '첨부파일' ? '#007bff' : '#000',
            border: 'none',
            borderBottom: selectedTab === '첨부파일' ? '2px solid #007bff' : 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
          onClick={() => handleTabClick('첨부파일')}
        >
          첨부파일
        </button>
      </div>

      {/* 동적 콘텐츠 */}
      {selectedTab === '마일스톤' && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>프로젝트명</h2>
            {milestones.map((milestone, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: '#fff',
                }}
              >
                <div style={{ flex: 3 }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{milestone.title}</p>
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#666',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {milestone.details}
                  </p>
                </div>
                <div
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#666',
                  }}
                >
                  {milestone.deadline}
                </div>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      padding: '5px 15px',
                      borderRadius: '20px',
                      backgroundColor:
                        milestone.status === '정산 완료'
                          ? '#ddd'
                          : milestone.status === '대기 중'
                          ? '#f9c74f'
                          : '#ccc',
                      color: '#333',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}
                  >
                    {milestone.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {selectedTab === '메시지' && (
        <div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              marginBottom: '20px',
              height: '300px',
              overflowY: 'scroll',
              padding: '10px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: msg.sender_type === 'client' ? 'flex-end' : 'flex-start',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    backgroundColor: msg.sender_type === 'client' ? '#d1ecf1' : '#f1f1f1',
                    padding: '10px',
                    borderRadius: '8px',
                    maxWidth: '70%',
                  }}
                >
                  {msg.message_type === 'attachment' ? (
                    <a
                      href={msg.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none', color: '#007bff' }}
                    >
                      {msg.attachment.split('/').pop()}
                    </a>
                  ) : (
                    <p style={{ margin: '0', fontSize: '14px' }}>{msg.message}</p>
                  )}
                  <span style={{ fontSize: '12px', color: '#888' }}>
                    {new Date(msg.message_sent_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 메시지 입력 영역 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px',
              backgroundColor: '#fff',
              borderTop: '1px solid #ddd',
            }}
          >
            {/* 파일 첨부 버튼 */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                backgroundColor: '#f1f1f1',
                borderRadius: '50%',
                cursor: 'pointer',
              }}
            >
              <Paperclip />
              <input
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </label>

            {/* 메시지 입력창 */}
            <input
              type="text"
              placeholder="메시지를 입력하세요"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '14px',
              }}
            />

            {/* 전송 버튼 */}
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                backgroundColor: '#007bff',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={handleSendMessage}
            >
              <MousePointer2 />
            </button>
          </div>
        </div>
      )}

      {selectedTab === '첨부파일' && (
        <div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
            }}
          >
            {attachments.map((file, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#f9f9f9',
                  padding: '10px',
                  borderRadius: '8px',
                }}
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
                  }}
                >
                  <Paperclip/>
                </div>
                <div>
                  <p>{file.attachment.split('/').pop()}</p>
                  <span>{new Date(file.message_sent_at).toLocaleDateString()}</span>
                </div>
                <a
                  href={file.attachment}
                  download
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    borderRadius: '4px',
                    textDecoration: 'none',
                  }}
                >
                  다운로드
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      </main>
    </div>
  )
}

export default Home
