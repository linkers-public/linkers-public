'use client'

import { useState } from 'react'
import Link from 'next/link' // Link 컴포넌트 임포트
import Sidebar from '../../../components/Sidebar' // Sidebar 컴포넌트 임포트
import { Users, MousePointer2, Paperclip } from 'lucide-react';

const Home: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('마일스톤')
  const [openProjects, setOpenProjects] = useState(false) // 드롭다운 상태 관리

  const handleTabClick = (tab: string) => {
    setSelectedTab(tab)
  }

  const handleClickProjects = () => {
    setOpenProjects(!openProjects)
  }

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar */}
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
          <section>
            <h2 style={{ marginBottom: '20px' }}>프로젝트명</h2>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              {['정산 완료', '결제 완료', '진행중', '...'].map(
                (status, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          backgroundColor: '#007bff',
                          borderRadius: '50%',
                          marginRight: '10px',
                        }}
                      ></div>
                      <div>
                        <strong>
                          메일스톤에 해당되는 제목이 들어가겠습니다.
                        </strong>
                        <p>메일스톤에 해당되는 내용이 들어가겠습니다.</p>
                      </div>
                    </div>
                    <div>기한 10 / 14</div>
                    <div
                      style={{
                        padding: '5px 10px',
                        backgroundColor:
                          status === '정산 완료'
                            ? '#28a745'
                            : status === '결제 완료'
                              ? '#ffc107'
                              : status === '진행중'
                                ? '#007bff'
                                : '#6c757d',
                        color: '#fff',
                        borderRadius: '5px',
                      }}
                    >
                      {status}
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        )}

        {selectedTab === '메시지' && (
          <div>
            {/* 상대방 정보 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <Users />
              <strong>상대방 이름</strong>
            </div>

            {/* 메시지 영역 */}
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
              {/* 상대방 메시지 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <Users />
                <div
                  style={{
                    backgroundColor: '#f1f1f1',
                    padding: '10px',
                    borderRadius: '8px',
                    maxWidth: '70%',
                  }}
                >
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    채팅 내용입니다.채팅 내용입니다.채팅 내용입니다.채팅 내용입니다.채팅
                    내용입니다.
                  </p>
                  <span style={{ fontSize: '12px', color: '#888' }}>오전 10:14</span>
                </div>
              </div>

              {/* 내 메시지 */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#d1ecf1',
                    padding: '10px',
                    borderRadius: '8px',
                    maxWidth: '70%',
                  }}
                >
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    채팅 내용입니다.채팅 내용입니다.채팅 내용입니다.채팅 내용입니다.채팅
                    내용입니다.
                  </p>
                  <span style={{ fontSize: '12px', color: '#888' }}>오전 10:15</span>
                </div>
              </div>
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
                  onChange={(e) => console.log(e.target.files)} // 파일 선택 핸들러
                />
              </label>

              {/* 메시지 입력창 */}
              <input
                type="text"
                placeholder="메시지를 입력하세요"
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
                onClick={() => console.log('메시지 전송')} // 전송 버튼 핸들러
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
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <strong>첨부파일 목록</strong>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
            >
              {[...Array(5)].map((_, index) => (
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
                  <div>
                    <p>파일 이름 {index + 1}.pdf</p>
                    <span>2024-12-15</span>
                  </div>
                  <button
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#007bff',
                      color: '#fff',
                      borderRadius: '4px',
                    }}
                  >
                    다운로드
                  </button>
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
