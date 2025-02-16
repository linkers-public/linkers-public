'use client'

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation'; 
import { fetchChatsAndMessagesByTeamId, fetchMessagesByChatId } from '@/apis/chat.service';
import Sidebar from '../../../../../components/DashboardSidebar' 
import EnterpriseSidebar from '../../../../../components/EnterpriseSidebar';
import {getClientTeamAndMilestones} from '@/apis/estimate.service'
import { Users, MousePointer2, Paperclip } from 'lucide-react';

enum MilestoneStatus {
  pending = '대기중',
  in_progress = '진행중',
  completed_payment = '정산완료',
  task_completed = '작업완료'
}

const statusColors = {
  pending: '#ffcc00', // Yellow
  in_progress: '#007bff', // Blue
  completed_payment: '#28a745', // Green
  task_completed: '#dc3545' // Red
};
const Home: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('마일스톤');
  const [messages, setMessages] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [milestones, setMilestones] = useState<any[]>([]); // Milestones data
  const [team, setTeam] = useState<any>(null); 
  const params = useParams(); 
  const counselId = params?.counselId; 
  const clientId = 'baa0fd5e-4add-44f2-b1df-1ec59a838b7e' // 실제 client_id를 동적으로 처리해야 함
  const [progressCount, setProgressCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [nextDueDate, setNextDueDate] = useState<string | null>(null);

  const formatDate = (date: string) => {
    if (!date) return '없음';
    const d = new Date(date);
    return `${String(d.getFullYear()).slice(-2)}년 ${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일`;
  };

  useEffect(() => {
    const fetchMessageData = async () => {
      try {
        const data = await getClientTeamAndMilestones(clientId, Number(counselId), ["in_progress"]);
        
        if (data?.team) {
          setTeam(data.team);
        }
  
        if (selectedTab === '메시지') {
          const { data: messageData } = await fetchChatsAndMessagesByTeamId(Number(counselId), 'message');
          setMessages(messageData);
        } else if (selectedTab === '첨부파일') {
          const { data: attachmentData } = await fetchChatsAndMessagesByTeamId(Number(counselId), 'attachment');
          setAttachments(attachmentData);
        } else if (selectedTab === '마일스톤' && data?.milestones) {
          const milestonesData = data.milestones
            .map(milestone => ({
              ...milestone,
              formattedDeadline: `${formatDate(milestone.milestone_start_date ?? '')} ~ ${formatDate(milestone.milestone_due_date ?? '')}`,
              status: MilestoneStatus[milestone.milestone_status as keyof typeof MilestoneStatus] || '알 수 없음',
              milestone_start_date: milestone.milestone_start_date || '9999-12-31', // 기본값 설정
              milestone_due_date: milestone.milestone_due_date || '9999-12-31', // 기본값 설정
              payment_amount: milestone.payment_amount ?? 0 // null 방지
            }))
            .sort((a, b) => new Date(a.milestone_start_date).getTime() - new Date(b.milestone_start_date).getTime());
  
          setMilestones(milestonesData);
  
          // 진행도 계산 (task_completed 개수 / 전체 개수)
          const completedCount = milestonesData.filter(m => m.milestone_status === 'task_completed').length;
          setProgressCount(completedCount);
  
          // 총 금액 계산 (모든 milestone의 payment_amount 합)
          const total = milestonesData.reduce((sum, m) => sum + m.payment_amount, 0);
          setTotalAmount(total);
  
          // 지급 금액 계산 (completed_payment인 milestone의 payment_amount 합)
          const paid = milestonesData
            .filter(m => m.milestone_status === 'completed_payment')
            .reduce((sum, m) => sum + m.payment_amount, 0);
          setPaidAmount(paid);
  
          // 다음 접수 기한 설정 (in_progress 중 가장 빠른 due_date)
          const inProgressMilestones = milestonesData
            .filter(m => m.milestone_status === 'in_progress')
            .map(m => m.milestone_due_date)
            .filter(date => date && date !== '9999-12-31') // 기본값 제거
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
          if (inProgressMilestones.length > 0) {
            const nextDate = new Date(inProgressMilestones[0]);
            setNextDueDate(`${nextDate.getFullYear() % 100}년 ${String(nextDate.getMonth() + 1).padStart(2, '0')}월 ${String(nextDate.getDate()).padStart(2, '0')}일`);
          } else {
            setNextDueDate('없음');
          }
        }
      } catch (error) {
        console.error('데이터를 가져오는 중 오류 발생:', error);
      }
    };
  
    fetchMessageData();
  }, [selectedTab, clientId, counselId]);
  

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
      style={{
        display: 'flex',
        backgroundColor: '#f9f9f9',
        height: '100%',
        width: '100%'
      }}
    >
      <EnterpriseSidebar/>
      <Sidebar />

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: '20px',
          backgroundColor: '#fff',
          overflowY: 'auto', 
        }}
      >

<header
          style={{
            display: 'flex',
            gap: '20px',
            marginBottom: '20px',
            justifyContent: 'space-between',
            padding: '10px',
            backgroundColor: '#f9f9f9',
            borderRadius: '12px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            flexWrap: 'wrap',
          }}
        >
          <SummaryCard title="진행도" value={`${String(progressCount).padStart(2, '0')} / ${String(milestones.length).padStart(2, '0')}`} />
          <SummaryCard title="총 금액" value={`${totalAmount.toLocaleString()} 원`} />
          <SummaryCard title="지급 금액" value={`${paidAmount.toLocaleString()} 원`} />
          <SummaryCard title="다음 접수 기한" value={nextDueDate || '없음'} />
        </header>


        {/* 팀명 및 결제 버튼 UI */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            marginBottom: '20px',
            flexWrap: 'wrap',  // 화면 크기에 따라 자동으로 랩핑
          }}
        >
          {/* 팀 정보 */}
          <div style={{ display: 'flex', alignItems: 'center', flex: '1 1 48%', marginBottom: '10px' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                backgroundColor: '#e0e0e0',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: '15px',
              }}
            >
              <Users />
            </div>
            <div>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                {team ? team.name : '팀 정보 없음'}
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                {team ? `팀 설명: ${team.bio || '없음'}` : '팀 설명 없음'}
              </p>
            </div>
          </div>

          {/* 결제 및 진행 취소 버튼 */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', flex: '1 1 48%', marginBottom: '10px' }}>
            <button
              style={{
                padding: '12px 25px',
                backgroundColor: '#007bff',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
              }}
              onClick={() => console.log('진행취소')}
            >
              진행취소
            </button>
          </div>
        </div>



        {/* 탭 섹션 */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap', // 화면 크기에 따라 자동으로 줄 바꿈
            marginBottom: '20px',
            borderBottom: '2px solid #e0e0e0',
          }}
        >
          {/* 탭 버튼 */}
          {['마일스톤', '메시지', '첨부파일'].map((tab) => (
            <button
              key={tab}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '12px 0',
                fontSize: '16px',
                fontWeight: 'bold',
                color: selectedTab === tab ? '#007bff' : '#000',
                border: 'none',
                borderBottom: selectedTab === tab ? '2px solid #007bff' : 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 동적 콘텐츠 */}
        {selectedTab === '마일스톤' && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>LLM 신뢰성 평가 프로젝트</h2>
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
                  <p style={{ fontSize: '14px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {milestone.detail}
                  </p>
                </div>
                <div style={{ flex: 1, textAlign: 'center', fontSize: '14px', color: '#666' }}>{milestone.formattedDeadline}</div>
                <div style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  padding: '5px 12px',
                  borderRadius: '15px',
                  backgroundColor: statusColors[milestone.milestone_status as keyof typeof statusColors],
                  color: '#fff',
                  minWidth: '90px'
                }}>{milestone.status}</div>
                <button
                  style={{
                    padding: '10px 20px',
                    backgroundColor: milestone.milestone_status === 'task_completed' ? '#007bff' : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: milestone.milestone_status === 'task_completed' ? 'pointer' : 'not-allowed',
                  }}
                  onClick={() => {
                    if (milestone.milestone_status === 'task_completed') {
                      console.log('결제하기');
                    }
                  }}
                  disabled={milestone.milestone_status !== 'task_completed'}
                >
                  결제하기
                </button>
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
                height: '100%',
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
                    <Paperclip />
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

const SummaryCard = ({ title, value }: { title: string; value: string }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '15px 20px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
      textAlign: 'center',
      flex: '1 1 22%',
      minWidth: '200px',
    }}
  >
    <div style={{ fontSize: '14px', fontWeight: '600', color: '#999', marginBottom: '5px' }}>{title}</div>
    <div style={{ fontSize: '20px', fontWeight: '700', color: '#333' }}>{value}</div>
  </div>
);

export default Home
