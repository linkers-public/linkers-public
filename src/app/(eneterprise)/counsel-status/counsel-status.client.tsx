'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from './_components/card' // Card 컴포넌트 임포트
import CounselStatus from './_components/CounselStatus' // CounselStatus 임포트
import Sidebar from '../../../components/Sidebar' // Sidebar 컴포넌트 임포트

const CounselStatusPage: React.FC = () => {
  const router = useRouter()
  const [messages, setMessages] = useState<any[]>([
    { type: 'message', content: '안녕하세요, 상담을 시작하겠습니다.' },
    {
      type: 'card',
      title: '상담서 대한 핵심',
      subtitle: '제안서 제목',
      content:
        '제안서 내용이 요약되어 있을 것 같은데 맥락 절을 많이 없어져서 이렇게 합니다. 뭐 또 적을 말이 없을까요? 정말 어려운...',
      buttonText1: '확인',
      buttonText2: '파일 첨부',
      onButtonClick1: () => alert('확인 버튼 클릭됨'),
      onButtonClick2: () => alert('파일 첨부 버튼 클릭됨'),
    },
    { type: 'message', content: '이해하셨나요?' },
    { type: 'message', content: '상담을 이어가겠습니다.' },
  ])

  const handleSendMessage = (msg: string) => {
    setMessages([...messages, { type: 'message', content: msg }])
  }

  return (
    <div
      style={{ display: 'flex', height: '100vh', backgroundColor: '#f9f9f9' }}
    >
      {/* Sidebar */}
      <Sidebar />
      <main style={{ flex: 2, padding: '20px', backgroundColor: '#f9f9f9' }}>
        <CounselStatus /> {/* CounselStatus 컴포넌트 렌더링 */}
      </main>
      {/* Main Content */}
      <main style={{ flex: 3, padding: '20px', backgroundColor: '#fff' }}>
        {/* 팀 프로필 박스 */}
        <div
          style={{
            backgroundColor: '#fff',
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid #ddd',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* 회색 원 배경에 아이콘 이미지 추가 */}
            <div
              style={{
                width: '40px', // 원의 크기
                height: '40px',
                backgroundColor: '#808080', // 회색 배경
                borderRadius: '50%', // 원 모양
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <img
                src="/images/image.png" // 이미지 파일 경로
                alt="file icon"
                style={{ width: '16px', height: '16px' }} // 이미지 크기
              />
            </div>
            <strong>상담팀</strong>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              style={{
                padding: '5px 10px',
                backgroundColor: '#007bff',
                color: '#fff',
                borderRadius: '4px',
              }}
            >
              팀 정보
            </button>
            <button
              style={{
                padding: '5px 10px',
                backgroundColor: '#007bff',
                color: '#fff',
                borderRadius: '4px',
              }}
            >
              상담 시작
            </button>
          </div>
        </div>

        {/* 대화창 */}
        <div
          style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
            height: 'calc(100vh - 200px)', // 대화창 높이 증가
            overflowY: 'scroll',
            border: '1px solid #ddd', // 회색 배경선 추가
          }}
        >
          {/* 메시지 영역 */}
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{ marginBottom: '20px' }}
            >
              {msg.type === 'message' ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: msg.content.includes('나')
                      ? 'flex-end'
                      : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      backgroundColor: msg.content.includes('나')
                        ? '#cce5ff'
                        : '#d1ecf1',
                      padding: '10px',
                      borderRadius: '8px',
                      maxWidth: '70%',
                      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)', // 메시지에 그림자 추가
                    }}
                  >
                    <p>{msg.content}</p>
                  </div>
                </div>
              ) : (
                <Card
                  title={msg.title}
                  subtitle={msg.subtitle}
                  content={msg.content}
                  buttonText1={msg.buttonText1}
                  buttonText2={msg.buttonText2}
                  onButtonClick1={msg.onButtonClick1}
                  onButtonClick2={msg.onButtonClick2}
                />
              )}
            </div>
          ))}

          {/* 메시지 입력창 */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="메시지를 입력하세요"
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ccc',
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage(e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: '#fff',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
              onClick={() => handleSendMessage('메시지를 입력합니다.')}
            >
              전송
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CounselStatusPage
